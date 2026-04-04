import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export const maxDuration = 300

// Verify cron secret
function verifyCronSecret(request: NextRequest): boolean {
  const secret = request.headers.get('authorization')?.replace('Bearer ', '')
  const cronSecret = process.env.CRON_SECRET || 'test-secret-change-in-production'
  return secret === cronSecret
}

// Calculate match score (0-100)
function calculateMatchScore(job: any, userPrefs: any, userProfile: any): number {
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

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    if (!verifyCronSecret(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient()

    // Get all users with auto-apply enabled
    const { data: activeUsers } = await supabase
      .from('job_preferences')
      .select('user_id, auto_apply_mode, match_threshold, daily_apply_limit, target_roles, target_locations, remote_preference, min_salary, max_salary, experience_level, industries, excluded_companies')
      .in('auto_apply_mode', ['copilot', 'autopilot'])

    if (!activeUsers || activeUsers.length === 0) {
      return NextResponse.json({ message: 'No active users', processed: 0 })
    }

    let totalProcessed = 0
    const results: any[] = []

    // Process each user
    for (const userPref of activeUsers) {
      try {
        // Check daily limit
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const { data: todayApps } = await supabase
          .from('applications')
          .select('id')
          .eq('user_id', userPref.user_id)
          .gte('created_at', today.toISOString())

        const appsToday = todayApps?.length || 0
        if (appsToday >= userPref.daily_apply_limit) {
          results.push({
            user_id: userPref.user_id,
            status: 'skipped',
            reason: 'daily_limit_reached'
          })
          continue
        }

        // Find unapplied jobs
        const { data: availableJobs } = await supabase
          .from('jobs')
          .select('*')
          .gt('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days

        if (!availableJobs || availableJobs.length === 0) {
          results.push({
            user_id: userPref.user_id,
            status: 'no_jobs'
          })
          continue
        }

        // Check which jobs user hasn't applied to
        const { data: appliedJobIds } = await supabase
          .from('applications')
          .select('job_id')
          .eq('user_id', userPref.user_id)

        const appliedIds = new Set(appliedJobIds?.map(a => a.job_id) || [])

        // Score and filter jobs
        const candidates = availableJobs
          .filter(job => !appliedIds.has(job.id))
          .map(job => ({
            ...job,
            score: calculateMatchScore(job, userPref, null)
          }))
          .filter(job => job.score >= userPref.match_threshold)
          .sort((a, b) => b.score - a.score)
          .slice(0, userPref.daily_apply_limit - appsToday)

        if (candidates.length === 0) {
          results.push({
            user_id: userPref.user_id,
            status: 'no_matches'
          })
          continue
        }

        // Create applications for each match
        const newApps = candidates.map(job => ({
          user_id: userPref.user_id,
          job_id: job.id,
          status: userPref.auto_apply_mode === 'copilot' ? 'queued' : 'applied',
          match_score: job.score,
          applied_at: userPref.auto_apply_mode === 'autopilot' ? new Date().toISOString() : null
        }))

        const { data: created } = await supabase
          .from('applications')
          .insert(newApps)
          .select('id')

        // Log activity
        if (created && created.length > 0) {
          await supabase.from('apply_log').insert({
            user_id: userPref.user_id,
            action: userPref.auto_apply_mode === 'copilot' ? 'queued_applications' : 'auto_applied',
            details: `${created.length} job(s) ${userPref.auto_apply_mode === 'copilot' ? 'queued for review' : 'automatically applied'}`
          })
        }

        results.push({
          user_id: userPref.user_id,
          status: 'success',
          applied_count: created?.length || 0,
          mode: userPref.auto_apply_mode
        })

        totalProcessed += created?.length || 0
      } catch (err) {
        console.error(`Error processing user ${userPref.user_id}:`, err)
        results.push({
          user_id: userPref.user_id,
          status: 'error',
          error: err instanceof Error ? err.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      message: 'Auto-apply cron completed',
      processed: totalProcessed,
      users_processed: results.length,
      results
    })
  } catch (err) {
    console.error('Cron error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Cron job failed' },
      { status: 500 }
    )
  }
}
