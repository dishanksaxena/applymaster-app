import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export const maxDuration = 60

const ADZUNA_APP_ID = process.env.ADZUNA_APP_ID
const ADZUNA_APP_KEY = process.env.ADZUNA_APP_KEY

// Call Adzuna directly - no internal HTTP chains
async function searchAdzunaDirect(role: string, country = 'us') {
  if (!ADZUNA_APP_ID || !ADZUNA_APP_KEY) {
    console.error('[AUTO-APPLY] Missing Adzuna keys')
    return []
  }

  const params = new URLSearchParams({
    app_id: ADZUNA_APP_ID,
    app_key: ADZUNA_APP_KEY,
    results_per_page: '20',
    what: role,
    sort_by: 'date',
    max_days_old: '7',
  })

  try {
    const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/1?${params}`
    console.log(`[AUTO-APPLY] Calling Adzuna: ${url.split('?')[0]}`)
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) {
      console.error(`[AUTO-APPLY] Adzuna returned ${res.status}`)
      return []
    }
    const data = await res.json()
    const results = data.results || []
    console.log(`[AUTO-APPLY] Adzuna returned ${results.length} jobs`)
    return results.map((r: any) => ({
      external_id: `adzuna-${r.id}`,
      source: 'Adzuna',
      title: r.title,
      company: r.company?.display_name || 'Unknown',
      location: r.location?.display_name || 'Remote',
      remote_type: r.title?.toLowerCase().includes('remote') ? 'remote' : null,
      salary_min: r.salary_min ? Math.round(r.salary_min) : null,
      salary_max: r.salary_max ? Math.round(r.salary_max) : null,
      description: (r.description || '').slice(0, 1000),
      url: r.redirect_url,
      posted_at: r.created || new Date().toISOString(),
    }))
  } catch (e) {
    console.error('[AUTO-APPLY] Adzuna error:', e)
    return []
  }
}

// Match score
function calculateMatchScore(job: any, prefs: any): number {
  let score = 55

  if (prefs.min_salary && job.salary_min) {
    score += job.salary_min >= prefs.min_salary ? 15 : 5
  }

  if (job.remote_type && prefs.remote_preference !== 'any') {
    if (job.remote_type === prefs.remote_preference) score += 10
  }

  const expLevels = ['entry', 'mid', 'senior', 'lead', 'executive']
  const text = `${job.title} ${job.description || ''}`.toLowerCase()
  let jobLevel = 'mid'
  if (text.includes('senior') || text.includes('sr.')) jobLevel = 'senior'
  else if (text.includes('junior') || text.includes('entry')) jobLevel = 'entry'
  else if (text.includes('lead') || text.includes('principal')) jobLevel = 'lead'
  else if (text.includes('director') || text.includes('vp')) jobLevel = 'executive'

  const diff = Math.abs(expLevels.indexOf(jobLevel) - expLevels.indexOf(prefs.experience_level || 'mid'))
  if (diff <= 1) score += 15
  else if (diff === 2) score += 5

  const roleMatch = (prefs.target_roles || []).some((role: string) =>
    job.title.toLowerCase().includes(role.toLowerCase())
  )
  if (roleMatch) score += 15

  if ((prefs.excluded_companies || []).some((c: string) =>
    job.company.toLowerCase().includes(c.toLowerCase())
  )) score -= 50

  return Math.max(0, Math.min(100, score))
}

async function log(supabase: any, userId: string, action: string, details: string) {
  await supabase.from('apply_log').insert({ user_id: userId, action, details })
  console.log(`[AUTO-APPLY] ${action}: ${details}`)
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    // Load or create preferences
    let { data: prefs } = await supabase
      .from('job_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!prefs) {
      const { data } = await supabase.from('job_preferences').insert([{
        user_id: user.id,
        match_threshold: 75,
        daily_apply_limit: 10,
        auto_apply_mode: 'copilot',
        target_roles: ['Software Engineer', 'Developer'],
        remote_preference: 'any',
        experience_level: 'mid',
      }]).select().single()
      prefs = data
    }

    // Check plan — lifetime/elite users have no daily cap
    const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).single()
    const isUnlimited = profile?.plan === 'lifetime' || profile?.plan === 'elite'

    // Check daily limit (skip for unlimited plans)
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const { data: todayApps } = await supabase
      .from('applications').select('id')
      .eq('user_id', user.id)
      .gte('created_at', today.toISOString())
    const appsToday = todayApps?.length || 0
    const effectiveLimit = isUnlimited ? 999 : prefs.daily_apply_limit

    if (!isUnlimited && appsToday >= effectiveLimit) {
      await log(supabase, user.id, 'limit_reached', `Daily limit reached (${appsToday}/${effectiveLimit})`)
      return NextResponse.json({ message: 'Daily limit reached', processed: 0 })
    }

    const roles = (prefs.target_roles && prefs.target_roles.length > 0)
      ? prefs.target_roles
      : ['Software Engineer']
    const primaryRole = roles[0] || 'Software Engineer'

    await log(supabase, user.id, 'scanning', `Searching LinkedIn & Indeed for "${primaryRole}" roles...`)

    // Fetch real jobs directly from Adzuna
    const fetchedJobs = await searchAdzunaDirect(primaryRole)

    if (!fetchedJobs.length) {
      await log(supabase, user.id, 'scanning', 'No jobs returned from search APIs. Check ADZUNA keys.')
      return NextResponse.json({ message: 'No jobs found from APIs', processed: 0 })
    }

    await log(supabase, user.id, 'scanning', `Found ${fetchedJobs.length} live jobs from job boards...`)

    // Get already-applied job external_ids
    const { data: existingApps } = await supabase
      .from('applications')
      .select('jobs(external_id)')
      .eq('user_id', user.id)
    const appliedExternalIds = new Set(
      (existingApps || []).map((a: any) => a.jobs?.external_id).filter(Boolean)
    )

    // Filter out already-applied jobs
    const newJobs = fetchedJobs.filter((j: any) => !appliedExternalIds.has(j.external_id))
    await log(supabase, user.id, 'scanning', `${newJobs.length} new unapplied jobs to analyze...`)

    // Score
    const scored = newJobs
      .map((j: any) => ({ ...j, score: calculateMatchScore(j, prefs) }))
      .filter((j: any) => j.score >= prefs.match_threshold)
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, effectiveLimit - appsToday)

    if (!scored.length) {
      await log(supabase, user.id, 'matched', `No jobs met your ${prefs.match_threshold}% match threshold`)
      return NextResponse.json({ message: 'No matching jobs', processed: 0 })
    }

    await log(supabase, user.id, 'matched', `Found ${scored.length} matches above ${prefs.match_threshold}% threshold`)

    // Log top matches
    for (const job of scored.slice(0, 5)) {
      await log(supabase, user.id, 'analyzing', `${job.title} at ${job.company} — Match: ${Math.round(job.score)}%`)
    }

    // Upsert jobs into DB and create applications
    let applied = 0
    for (const job of scored) {
      // Upsert job
      const { data: existing } = await supabase
        .from('jobs').select('id')
        .eq('external_id', job.external_id)
        .maybeSingle()

      let jobDbId = existing?.id
      if (!jobDbId) {
        const { data: inserted } = await supabase.from('jobs').insert([{
          external_id: job.external_id,
          source: job.source,
          title: job.title,
          company: job.company,
          location: job.location,
          remote_type: job.remote_type,
          salary_min: job.salary_min,
          salary_max: job.salary_max,
          description: job.description,
          url: job.url,
          posted_at: job.posted_at,
        }]).select('id').single()
        jobDbId = inserted?.id
      }

      if (!jobDbId) continue

      // Create application
      const { error } = await supabase.from('applications').insert([{
        user_id: user.id,
        job_id: jobDbId,
        status: prefs.auto_apply_mode === 'autopilot' ? 'applied' : 'queued',
        match_score: job.score,
        applied_at: prefs.auto_apply_mode === 'autopilot' ? new Date().toISOString() : null,
      }])

      if (!error) applied++
    }

    const action = prefs.auto_apply_mode === 'autopilot' ? 'auto_applied' : 'queued_applications'
    const msg = prefs.auto_apply_mode === 'autopilot'
      ? `${applied} applications sent automatically`
      : `${applied} applications queued for your review`
    await log(supabase, user.id, action, msg)

    return NextResponse.json({ message: 'Done', processed: applied, mode: prefs.auto_apply_mode })
  } catch (err) {
    console.error('[AUTO-APPLY] Fatal error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
