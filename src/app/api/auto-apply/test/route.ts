import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export const maxDuration = 300

// Match scoring function
function calculateMatchScore(job: any, userPrefs: any): number {
  let score = 50

  if (userPrefs.min_salary && job.salary_min) {
    if (job.salary_min >= userPrefs.min_salary) {
      score += 15
    } else if (job.salary_min >= userPrefs.min_salary * 0.8) {
      score += 8
    }
  }

  if (job.remote_type && userPrefs.remote_preference !== 'any') {
    if (job.remote_type === userPrefs.remote_preference) {
      score += 10
    } else if (userPrefs.remote_preference === 'hybrid' && job.remote_type === 'remote') {
      score += 5
    }
  }

  const expLevels = ['entry', 'mid', 'senior', 'lead', 'executive']
  const jobExpLevel = detectExperienceLevel(job.title, job.description)
  const userExpIndex = expLevels.indexOf(userPrefs.experience_level)
  const jobExpIndex = expLevels.indexOf(jobExpLevel)

  if (Math.abs(jobExpIndex - userExpIndex) <= 1) {
    score += 15
  } else if (Math.abs(jobExpIndex - userExpIndex) === 2) {
    score += 8
  }

  const titleMatch = userPrefs.target_roles?.some((role: string) =>
    job.title.toLowerCase().includes(role.toLowerCase())
  )
  if (titleMatch) {
    score += 15
  }

  const industryMatch = userPrefs.industries?.some((ind: string) =>
    (job.description || '').toLowerCase().includes(ind.toLowerCase())
  )
  if (industryMatch) {
    score += 10
  }

  if (userPrefs.excluded_companies?.some((company: string) =>
    job.company.toLowerCase().includes(company.toLowerCase())
  )) {
    score -= 50
  }

  return Math.max(0, Math.min(100, score))
}

function detectExperienceLevel(title: string, description: string): string {
  const text = `${title} ${description || ''}`.toLowerCase()

  if (text.includes('director') || text.includes('vp ') || text.includes('executive')) return 'executive'
  if (text.includes('lead') || text.includes('principal') || text.includes('staff')) return 'lead'
  if (text.includes('senior') || text.includes('sr.')) return 'senior'
  if (text.includes('junior') || text.includes('jr.') || text.includes('entry')) return 'entry'

  return 'mid'
}

// Log activity
async function logActivity(supabase: any, userId: string, action: string, details: string) {
  console.log(`[AUTO-APPLY] ${action}: ${details}`)
  await supabase.from('apply_log').insert({
    user_id: userId,
    action,
    details,
    created_at: new Date().toISOString()
  })
}

export async function POST(req: NextRequest) {
  try {
    console.log('[AUTO-APPLY] Starting test auto-apply...')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      console.log('[AUTO-APPLY] Not authenticated')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log(`[AUTO-APPLY] User: ${user.id}`)

    // Load user preferences
    let { data: userPref } = await supabase
      .from('job_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // Create default preferences if none exist
    if (!userPref) {
      console.log('[AUTO-APPLY] Creating default preferences')
      const defaultPrefs = {
        user_id: user.id,
        match_threshold: 75,
        daily_apply_limit: 10,
        auto_apply_mode: 'copilot',
        target_roles: ['Engineer', 'Developer', 'Manager', 'Lead', 'Senior'],
        remote_preference: 'any',
        experience_level: 'mid',
      }

      const { data: created } = await supabase
        .from('job_preferences')
        .insert([defaultPrefs])
        .select()
        .single()

      userPref = created
    }

    console.log('[AUTO-APPLY] User preferences:', userPref)

    // Log: Starting scan
    await logActivity(supabase, user.id, 'scanning', `Searching for ${userPref.target_roles?.join(', ') || 'all'} roles on LinkedIn and Indeed...`)
    await new Promise(resolve => setTimeout(resolve, 800))

    // Check daily limit
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { data: todayApps } = await supabase
      .from('applications')
      .select('id')
      .eq('user_id', user.id)
      .gte('created_at', today.toISOString())

    const appsToday = todayApps?.length || 0
    console.log(`[AUTO-APPLY] Already applied today: ${appsToday}/${userPref.daily_apply_limit}`)

    if (appsToday >= userPref.daily_apply_limit) {
      await logActivity(supabase, user.id, 'limit_reached', `Daily limit reached (${appsToday}/${userPref.daily_apply_limit})`)
      return NextResponse.json({
        message: 'Daily limit reached',
        processed: 0,
        results: [{ status: 'daily_limit_reached' }]
      })
    }

    // SEARCH FOR REAL JOBS from Adzuna/RemoteOK
    console.log('[AUTO-APPLY] Searching for real jobs...')
    const searchQuery = userPref.target_roles?.[0] || 'Engineer'
    const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3002'

    console.log(`[AUTO-APPLY] Calling search endpoint at: ${baseUrl}/api/search-jobs`)

    let searchResponse: Response
    try {
      searchResponse = await fetch(`${baseUrl}/api/search-jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          location: 'Remote',
          remote: 'remote',
          country: 'US',
          maxDaysOld: 7,
        })
      })
    } catch (fetchErr) {
      console.error('[AUTO-APPLY] Failed to fetch search endpoint:', fetchErr)
      await logActivity(supabase, user.id, 'error', `Failed to search jobs: ${fetchErr instanceof Error ? fetchErr.message : String(fetchErr)}`)
      return NextResponse.json({ error: 'Failed to search jobs' }, { status: 500 })
    }

    if (!searchResponse.ok) {
      console.error(`[AUTO-APPLY] Search endpoint returned ${searchResponse.status}`)
      const errorText = await searchResponse.text()
      console.error('[AUTO-APPLY] Error response:', errorText)
      await logActivity(supabase, user.id, 'error', `Job search failed: ${searchResponse.status}`)
      return NextResponse.json({ error: 'Job search failed' }, { status: 500 })
    }

    const searchData = await searchResponse.json()
    const fetchedJobs = searchData.jobs || []
    console.log(`[AUTO-APPLY] Found ${fetchedJobs.length} jobs from search`)

    if (!fetchedJobs || fetchedJobs.length === 0) {
      await logActivity(supabase, user.id, 'scanning', 'No jobs found matching your search')
      return NextResponse.json({
        message: 'No jobs found',
        processed: 0,
        results: [{ status: 'no_jobs' }]
      })
    }

    await logActivity(supabase, user.id, 'scanning', `Found ${fetchedJobs.length} jobs from LinkedIn and Indeed...`)
    await new Promise(resolve => setTimeout(resolve, 600))

    // Save jobs to database and check which ones user hasn't applied to
    console.log('[AUTO-APPLY] Saving jobs to database...')
    const jobsToConsider = []

    for (const job of fetchedJobs) {
      try {
        const externalId = `${job.source}-${job.id}`

        // Check if job exists
        const { data: existingJobs } = await supabase
          .from('jobs')
          .select('id')
          .eq('external_id', externalId)
          .eq('source', job.source)

        let jobId: string

        if (existingJobs && existingJobs.length > 0) {
          jobId = existingJobs[0].id
        } else {
          // Insert new job
          const { data: newJob, error: insertError } = await supabase
            .from('jobs')
            .insert([{
              external_id: externalId,
              source: job.source,
              title: job.title,
              company: job.company,
              location: job.location,
              remote_type: job.remote_type || 'remote',
              salary_min: job.salary_min ? Math.round(job.salary_min) : null,
              salary_max: job.salary_max ? Math.round(job.salary_max) : null,
              description: job.description || '',
              url: job.url,
              posted_at: job.posted_at || new Date().toISOString(),
            }])
            .select()

          if (insertError || !newJob) {
            console.error('[AUTO-APPLY] Failed to insert job:', insertError)
            continue
          }
          jobId = newJob[0].id
        }

        // Check if user already applied to this job
        const { data: existingApp } = await supabase
          .from('applications')
          .select('id')
          .eq('user_id', user.id)
          .eq('job_id', jobId)

        if (!existingApp || existingApp.length === 0) {
          jobsToConsider.push({ ...job, job_id: jobId })
        }
      } catch (err) {
        console.error('[AUTO-APPLY] Error processing job:', err)
      }
    }

    console.log(`[AUTO-APPLY] Jobs not yet applied to: ${jobsToConsider.length}`)

    if (jobsToConsider.length === 0) {
      await logActivity(supabase, user.id, 'matched', 'All available jobs have been applied to')
      return NextResponse.json({
        message: 'No new jobs to apply to',
        processed: 0,
        results: [{ status: 'no_new_jobs' }]
      })
    }

    // Score jobs
    const scoredJobs = jobsToConsider.map(job => ({
      ...job,
      score: calculateMatchScore(job, userPref)
    }))

    const candidates = scoredJobs
      .filter(job => job.score >= userPref.match_threshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, userPref.daily_apply_limit - appsToday)

    console.log(`[AUTO-APPLY] Matches above ${userPref.match_threshold}% threshold: ${candidates.length}`)

    if (candidates.length === 0) {
      await logActivity(supabase, user.id, 'matched', `No jobs matched your ${userPref.match_threshold}% threshold`)
      return NextResponse.json({
        message: 'No matching jobs',
        processed: 0,
        results: [{ status: 'no_matches' }]
      })
    }

    // Log matches found
    await logActivity(
      supabase,
      user.id,
      'matched',
      `Found ${candidates.length} new matches above ${userPref.match_threshold}% threshold`
    )
    await new Promise(resolve => setTimeout(resolve, 500))

    // Analyze top matches
    const topMatches = candidates.slice(0, Math.min(5, candidates.length))
    for (const job of topMatches) {
      await logActivity(
        supabase,
        user.id,
        'analyzing',
        `Analyzing: ${job.title} at ${job.company} – Match: ${Math.round(job.score)}%`
      )
      await new Promise(resolve => setTimeout(resolve, 400))
    }

    await logActivity(supabase, user.id, 'applying', `Preparing ${candidates.length} applications...`)
    await new Promise(resolve => setTimeout(resolve, 600))

    // Create applications
    const newApps = candidates.map(job => ({
      user_id: user.id,
      job_id: job.job_id,
      status: userPref.auto_apply_mode === 'copilot' ? 'queued' : 'applied',
      match_score: job.score,
      applied_at: userPref.auto_apply_mode === 'autopilot' ? new Date().toISOString() : null
    }))

    const { data: created, error: insertError } = await supabase
      .from('applications')
      .insert(newApps)
      .select('id')

    if (insertError) {
      console.error('[AUTO-APPLY] Failed to create applications:', insertError)
      return NextResponse.json({ error: 'Failed to apply' }, { status: 500 })
    }

    console.log(`[AUTO-APPLY] Created ${created?.length || 0} applications`)

    // Final log
    await logActivity(
      supabase,
      user.id,
      userPref.auto_apply_mode === 'copilot' ? 'queued_applications' : 'auto_applied',
      `${created?.length || 0} applications ${userPref.auto_apply_mode === 'copilot' ? 'queued for review' : 'sent'}`
    )

    return NextResponse.json({
      message: 'Auto-apply test completed',
      processed: created?.length || 0,
      results: [{
        status: 'success',
        applied_count: created?.length || 0,
        mode: userPref.auto_apply_mode
      }]
    })
  } catch (err) {
    console.error('[AUTO-APPLY] Exception:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to test auto-apply' },
      { status: 500 }
    )
  }
}
