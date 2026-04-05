import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export const maxDuration = 300

// Copied from cron endpoint - Calculate match score (0-100)
function calculateMatchScore(job: any, userPrefs: any): number {
  let score = 50 // Base score

  // Salary match (±15 points)
  if (userPrefs.min_salary && job.salary_min) {
    if (job.salary_min >= userPrefs.min_salary) {
      score += 15
    } else if (job.salary_min >= userPrefs.min_salary * 0.8) {
      score += 8
    }
  }

  // Remote type match (±10 points)
  if (job.remote_type && userPrefs.remote_preference !== 'any') {
    if (job.remote_type === userPrefs.remote_preference) {
      score += 10
    } else if (userPrefs.remote_preference === 'hybrid' && job.remote_type === 'remote') {
      score += 5
    }
  }

  // Experience level match (±15 points)
  const expLevels = ['entry', 'mid', 'senior', 'lead', 'executive']
  const jobExpLevel = detectExperienceLevel(job.title, job.description)
  const userExpIndex = expLevels.indexOf(userPrefs.experience_level)
  const jobExpIndex = expLevels.indexOf(jobExpLevel)

  if (Math.abs(jobExpIndex - userExpIndex) <= 1) {
    score += 15
  } else if (Math.abs(jobExpIndex - userExpIndex) === 2) {
    score += 8
  }

  // Title/Role match (±15 points)
  const titleMatch = userPrefs.target_roles?.some((role: string) =>
    job.title.toLowerCase().includes(role.toLowerCase())
  )
  if (titleMatch) {
    score += 15
  }

  // Industry match (±10 points)
  const industryMatch = userPrefs.industries?.some((ind: string) =>
    (job.description || '').toLowerCase().includes(ind.toLowerCase())
  )
  if (industryMatch) {
    score += 10
  }

  // Company exclusion (flat -50)
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

// Helper to log activity
async function logActivity(supabase: any, userId: string, action: string, details: string) {
  console.log(`[TEST] Logging activity: ${action} - ${details}`)
  const { data, error } = await supabase.from('apply_log').insert({
    user_id: userId,
    action,
    details,
    created_at: new Date().toISOString()
  }).select()

  if (error) {
    console.error(`[TEST] Failed to log activity:`, error)
  }
  return { data, error }
}

// This endpoint handles the test call from the UI
export async function POST(req: NextRequest) {
  try {
    console.log('[TEST] Starting test auto-apply...')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      console.log('[TEST] No authenticated user')
      return NextResponse.json({ error: 'Unauthorized - Please log in first' }, { status: 401 })
    }

    console.log(`[TEST] User authenticated: ${user.id}`)

    // Load user preferences
    const { data: userPref, error: prefError } = await supabase
      .from('job_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // Use default preferences if none found (don't error out)
    const prefs = userPref || {
      user_id: user.id,
      match_threshold: 75,
      daily_apply_limit: 10,
      auto_apply_mode: 'copilot',
      target_roles: ['Engineer', 'Developer', 'Manager'],
      remote_preference: 'any',
      experience_level: 'mid',
      min_salary: null,
      industries: [],
      excluded_companies: []
    }

    console.log('[TEST] Using preferences:', prefs)

    // Log: Starting scan
    await logActivity(supabase, user.id, 'scanning', `Scanning LinkedIn for ${prefs.target_roles?.join(', ') || 'all'} roles...`)
    await new Promise(resolve => setTimeout(resolve, 500))

    // Check daily limit
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { data: todayApps } = await supabase
      .from('applications')
      .select('id')
      .eq('user_id', user.id)
      .gte('created_at', today.toISOString())

    const appsToday = todayApps?.length || 0
    console.log(`[TEST] Applications today: ${appsToday}/${prefs.daily_apply_limit}`)

    if (appsToday >= prefs.daily_apply_limit) {
      await logActivity(supabase, user.id, 'scanning', `Daily limit reached (${appsToday}/${prefs.daily_apply_limit})`)
      return NextResponse.json({
        message: 'Daily limit reached',
        processed: 0,
        users_processed: 1,
        results: [{ user_id: user.id, status: 'skipped', reason: 'daily_limit_reached' }]
      })
    }

    // Find jobs from last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { data: availableJobs } = await supabase
      .from('jobs')
      .select('*')
      .gt('created_at', sevenDaysAgo)
      .limit(200)

    console.log(`[TEST] Found ${availableJobs?.length || 0} jobs in last 7 days`)

    if (!availableJobs || availableJobs.length === 0) {
      await logActivity(supabase, user.id, 'scanning', 'No jobs found in database')
      return NextResponse.json({
        message: 'No jobs available',
        processed: 0,
        users_processed: 1,
        results: [{ user_id: user.id, status: 'no_jobs' }]
      })
    }

    // Check which jobs user hasn't applied to
    const { data: appliedJobIds } = await supabase
      .from('applications')
      .select('job_id')
      .eq('user_id', user.id)

    const appliedIds = new Set(appliedJobIds?.map(a => a.job_id) || [])
    const unappliedJobs = availableJobs.filter(job => !appliedIds.has(job.id))

    console.log(`[TEST] Found ${unappliedJobs.length} unapplied jobs`)

    await logActivity(supabase, user.id, 'scanning', `Found ${unappliedJobs.length} unapplied jobs to analyze...`)
    await new Promise(resolve => setTimeout(resolve, 600))

    // Score and filter jobs
    const scoredJobs = unappliedJobs.map(job => ({
      ...job,
      score: calculateMatchScore(job, prefs)
    }))

    const candidates = scoredJobs
      .filter(job => job.score >= prefs.match_threshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, prefs.daily_apply_limit - appsToday)

    console.log(`[TEST] Found ${candidates.length} matching jobs (threshold: ${prefs.match_threshold}%)`)

    if (candidates.length === 0) {
      await logActivity(supabase, user.id, 'scanning', `No matches above ${prefs.match_threshold}% threshold`)
      return NextResponse.json({
        message: 'No matching jobs',
        processed: 0,
        users_processed: 1,
        results: [{ user_id: user.id, status: 'no_matches' }]
      })
    }

    // Log: Found matches
    await logActivity(
      supabase,
      user.id,
      'matched',
      `Found ${candidates.length} new matches above ${prefs.match_threshold}% threshold`
    )
    await new Promise(resolve => setTimeout(resolve, 500))

    // Log: Analyzing top matches (show more details)
    const matchesToAnalyze = Math.min(8, candidates.length)
    for (let i = 0; i < matchesToAnalyze; i++) {
      const job = candidates[i]
      await logActivity(
        supabase,
        user.id,
        'analyzing',
        `Analyzing: ${job.title} at ${job.company} – Match: ${Math.round(job.score)}%`
      )
      await new Promise(resolve => setTimeout(resolve, 300))
    }

    // Log: Creating applications
    await logActivity(
      supabase,
      user.id,
      'applying',
      `Preparing ${candidates.length} applications...`
    )
    await new Promise(resolve => setTimeout(resolve, 400))

    // Create applications for each match
    const newApps = candidates.map(job => ({
      user_id: user.id,
      job_id: job.id,
      status: prefs.auto_apply_mode === 'copilot' ? 'queued' : 'applied',
      match_score: job.score,
      applied_at: prefs.auto_apply_mode === 'autopilot' ? new Date().toISOString() : null
    }))

    console.log(`[TEST] Creating ${newApps.length} applications`)

    const { data: created, error: insertError } = await supabase
      .from('applications')
      .insert(newApps)
      .select('id')

    if (insertError) {
      console.error('[TEST] Failed to create applications:', insertError)
      return NextResponse.json({ error: 'Failed to create applications: ' + insertError.message }, { status: 500 })
    }

    console.log(`[TEST] Successfully created ${created?.length || 0} applications`)

    // Log final result
    if (created && created.length > 0) {
      await logActivity(
        supabase,
        user.id,
        prefs.auto_apply_mode === 'copilot' ? 'queued_applications' : 'auto_applied',
        `${created.length} application(s) ${prefs.auto_apply_mode === 'copilot' ? 'queued for review' : 'automatically sent'}`
      )
    }

    console.log('[TEST] Test completed successfully')

    return NextResponse.json({
      message: 'Auto-apply test completed',
      processed: created?.length || 0,
      users_processed: 1,
      results: [{
        user_id: user.id,
        status: 'success',
        applied_count: created?.length || 0,
        mode: prefs.auto_apply_mode
      }]
    })
  } catch (err) {
    console.error('[TEST] Exception:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to test auto-apply' },
      { status: 500 }
    )
  }
}
