import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { applicationAllowance, blockedMessage } from '@/lib/plan-limits'
import { GREENHOUSE_BOARDS, fetchGreenhouseBoard, fetchRemoteOK, adzunaForPerson, dbKeys, type FetchedJob } from '@/lib/job-fetch'
import { scoreJob, type MatchPrefs } from '@/lib/job-match'
import Anthropic from '@anthropic-ai/sdk'
import { tryParseModelJson } from '@/lib/model-json'

export const maxDuration = 60

const anthropic = new Anthropic()

/**
 * Boards we scan, each verified reachable rather than assumed.
 *
 * Lever and Ashby are gone, not disabled: every Lever org now answers
 * {"ok":false,"error":"Document not found"} and every Ashby org returns
 * null. Both scanners still ran on every request, spent their 8s timeout
 * and contributed nothing. Several Greenhouse boards here were quietly
 * dead too (notion, retool, segment, rippling, linear).
 *
 * What remains was checked board by board: 31 live boards, ~6,300 roles.
 */
/**
 * The on-demand run draws from the same pool as the daily cron: every
 * Greenhouse board we scan, RemoteOK, and Adzuna in the person's own
 * country — then scoreJob decides, exactly as the cron does. It used to
 * scan 31 US tech boards and nothing else, so a nurse in Bengaluru got
 * nothing and a sales manager in London got Tokyo.
 */
interface ScannedJob {
  title: string; company: string; location: string; url: string
  source: 'greenhouse' | 'lever' | 'ashby' | 'adzuna' | 'remoteok'
  board_token?: string; posting_id?: string; description?: string
  /** The (source, external_id) the jobs table stores it under, so a search or saved copy is the same row. */
  db_source: string; db_external_id: string
  remote: boolean; match_score: number; match_reasons: string[]
}

async function gatherPool(prefs: MatchPrefs & { desired_job_title?: string | null }): Promise<FetchedJob[]> {
  // Boards without posting bodies: 31 boards with content is tens of megabytes
  // and ran past three minutes under load, against a 60s function limit.
  // Bodies are fetched below, only for the handful we act on.
  const [boards, remoteok, adzuna] = await Promise.all([
    Promise.all(GREENHOUSE_BOARDS.map(b => fetchGreenhouseBoard(b))),
    fetchRemoteOK(),
    adzunaForPerson(prefs),
  ])
  return [...boards.flat(), ...remoteok, ...adzuna]
}

async function fillDescriptions(jobs: ScannedJob[]) {
  await Promise.all(
    jobs
      .filter(j => j.source === 'greenhouse' && !j.description && j.board_token && j.posting_id)
      .map(async j => {
        try {
          const r = await fetch(`https://boards-api.greenhouse.io/v1/boards/${j.board_token}/jobs/${j.posting_id}`, { signal: AbortSignal.timeout(8000) })
          if (!r.ok) return
          const d = await r.json()
          j.description = String(d.content || '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 1500)
        } catch { /* a posting without its body still queues; only the Claude read and the cover letter get thinner */ }
      })
  )
}

// ── Inline Claude job scoring (no HTTP call, no auth issues) ──
async function scoreJobWithClaude(job: ScannedJob, resumeData: any, prefs: any): Promise<{ score: number; grade: string; keywords: string[]; reason: string }> {
  try {
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `Score this job for this candidate. Return JSON only.

JOB: ${job.title} at ${job.company} (${job.location})
DESCRIPTION: ${(job.description || '').slice(0, 800)}

CANDIDATE:
Skills: ${(resumeData?.skills || []).slice(0, 20).join(', ')}
Recent role: ${resumeData?.experience?.[0]?.title || 'N/A'} at ${resumeData?.experience?.[0]?.company || 'N/A'}
Experience: ${resumeData?.total_years_experience || prefs?.experience_level || 'mid'} years
Target roles: ${(prefs?.target_roles || []).join(', ')}

Return: {"score": 0-100, "grade": "A+/A/B+/B/C/D/F", "top_keywords": ["k1","k2","k3"], "reason": "one line why or why not"}`
      }]
    })
    const text = msg.content[0].type === 'text' ? msg.content[0].text : '{}'
    const parsed = tryParseModelJson<any>(text, {}, msg.stop_reason)
    return {
      score: parsed.score || 60,
      grade: parsed.grade || 'C',
      keywords: parsed.top_keywords || [],
      reason: parsed.reason || '',
    }
  } catch {
    return { score: 60, grade: 'C', keywords: [], reason: 'Scoring unavailable' }
  }
}

// ── Inline Claude cover letter generation ──
async function generateCoverLetter(job: ScannedJob, resumeData: any, fullName: string): Promise<string> {
  try {
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `Write a 180-word cover letter for ${fullName} applying to ${job.title} at ${job.company}.

Job description: ${(job.description || '').slice(0, 600)}
Candidate skills: ${(resumeData?.skills || []).slice(0, 12).join(', ')}
Most recent role: ${resumeData?.experience?.[0]?.title || 'N/A'} at ${resumeData?.experience?.[0]?.company || 'N/A'}

Write the letter. No subject line. Start with "Dear Hiring Manager,"`
      }]
    })
    return msg.content[0].type === 'text' ? msg.content[0].text : ''
  } catch { return '' }
}

// ── Inline ATS submission ──
async function submitToPortal(job: ScannedJob, firstName: string, lastName: string, email: string, phone: string, resumeText: string, coverLetter: string): Promise<{ submitted: boolean; id: string | null; error: string | null }> {
  try {
    if (job.source === 'greenhouse' && job.board_token && job.posting_id) {
      const res = await fetch(
        `https://boards-api.greenhouse.io/v1/boards/${job.board_token}/jobs/${job.posting_id}/applications`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ first_name: firstName, last_name: lastName, email, phone, resume_text: resumeText, cover_letter: coverLetter }),
        }
      )
      const d = await res.json().catch(() => ({}))
      if (res.ok) return { submitted: true, id: d.id || null, error: null }
      return { submitted: false, id: null, error: `GH ${res.status}: ${d.message || JSON.stringify(d).slice(0, 100)}` }
    }

    if (job.source === 'lever' && job.posting_id) {
      const res = await fetch(
        `https://api.lever.co/v0/postings/${job.posting_id}/apply`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: `${firstName} ${lastName}`, email, phone, reason: coverLetter, resume: resumeText }),
        }
      )
      const d = await res.json().catch(() => ({}))
      if (res.ok) return { submitted: true, id: d.applicationId || null, error: null }
      return { submitted: false, id: null, error: `Lever ${res.status}: ${d.error || JSON.stringify(d).slice(0, 100)}` }
    }

    if (job.source === 'ashby' && job.posting_id) {
      const res = await fetch(
        `https://api.ashbyhq.com/posting-api/application/create`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobPostingId: job.posting_id, firstName, lastName, email, phoneNumber: phone, resumeAsPlainText: resumeText, coverLetter }),
        }
      )
      const d = await res.json().catch(() => ({}))
      if (res.ok) return { submitted: true, id: d.applicationId || null, error: null }
      return { submitted: false, id: null, error: `Ashby ${res.status}: ${d.errors?.[0] || JSON.stringify(d).slice(0, 100)}` }
    }

    return { submitted: false, id: null, error: 'Portal not supported' }
  } catch (e: any) {
    return { submitted: false, id: null, error: e.message }
  }
}

async function log(supabase: any, userId: string, action: string, details: string) {
  const { error } = await supabase.from('apply_log').insert({ user_id: userId, action, details, portal: 'system' })
  if (error) console.error('auto-apply/test: apply_log insert failed', error.message)
}

// ── Main Handler ──────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    let { data: prefs } = await supabase.from('job_preferences').select('*').eq('user_id', user.id).maybeSingle()
    if (!prefs) {
      const { data, error: prefsErr } = await supabase.from('job_preferences').insert([{
        user_id: user.id, match_threshold: 75, daily_apply_limit: 10,
        auto_apply_mode: 'copilot', target_roles: ['Software Engineer'],
        remote_preference: 'any', experience_level: 'mid',
      }]).select().maybeSingle()
      if (prefsErr || !data) {
        console.error('auto-apply/test: job_preferences insert failed', prefsErr?.message)
        return NextResponse.json({ error: 'Could not set up your job preferences. Please try again.' }, { status: 500 })
      }
      prefs = data
    }

    const godMode: boolean = prefs.god_mode_enabled || false
    const autopilot: boolean = prefs.auto_apply_mode === 'autopilot'
    const scoreThresholdMap: Record<string, number> = { A: 80, B: 65, C: 50 }
    const minScore = scoreThresholdMap[prefs.god_mode_score_threshold || 'B'] || 65

    // Plan limits: the shared monthly pools and daily pacing caps (src/lib/plan-limits),
    // plus the person's own daily_apply_limit preference.
    const allowance = await applicationAllowance(supabase, user.id)
    const prefRoom = Math.max(1, prefs.daily_apply_limit || 10) - allowance.dailyUsed
    const room = Math.max(0, Math.min(allowance.room, prefRoom))
    if (!room) {
      return NextResponse.json({
        blocked: allowance.blocked ?? 'daily',
        message: allowance.blocked ? blockedMessage(allowance) : 'Your daily application limit is reached. It resets at midnight UTC.',
        processed: 0,
      })
    }

    // Load candidate data
    const { data: userProfile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
    // Read parsed data from resumes.parsed_data (written by /api/resume/upload)
    const { data: primaryResume } = await supabase
      .from('resumes').select('id, parsed_data, name').eq('user_id', user.id).eq('is_primary', true).maybeSingle()

    let resumeData: any = null
    let rawResumeText = ''

    if (primaryResume?.id) {
      // Try parsed_resumes first (has raw_text for better portal submissions)
      const { data: pr } = await supabase
        .from('parsed_resumes').select('*').eq('resume_id', primaryResume.id).maybeSingle()
      if (pr?.raw_text) {
        rawResumeText = pr.raw_text
        resumeData = pr
      }
      // Fall back to resumes.parsed_data (structured data without raw_text)
      if (!resumeData && primaryResume.parsed_data) {
        resumeData = primaryResume.parsed_data
      }
    }

    const fullName = resumeData?.full_name || userProfile?.full_name || ''
    const nameParts = fullName.trim().split(' ')
    const firstName = nameParts[0] || 'Candidate'
    const lastName = nameParts.slice(1).join(' ') || ''
    const email = resumeData?.email || user.email || ''
    const phone = resumeData?.phone || ''

    // Use raw_text if available; otherwise reconstruct from structured fields
    const resumeText = rawResumeText || (resumeData ? [
      resumeData.full_name,
      [resumeData.email, resumeData.phone, resumeData.location].filter(Boolean).join(' | '),
      resumeData.summary,
      resumeData.skills?.length ? 'SKILLS\n' + resumeData.skills.join(', ') : '',
      ...(resumeData.experience || []).map((e: any) =>
        `${e.title || e.company} — ${e.company || ''} (${e.startDate || e.start_date || ''} – ${e.endDate || e.end_date || 'Present'})\n${e.description || ''}`),
      ...(resumeData.education || []).map((e: any) =>
        `${e.degree || ''} in ${e.field || ''}, ${e.school || e.institution || ''} (${e.endDate || e.end_date || ''})`),
      resumeData.certifications?.length ? 'CERTIFICATIONS\n' + resumeData.certifications.join(', ') : '',
    ].filter(Boolean).join('\n\n') : '')

    if (!resumeData) {
      // Nothing can be applied for without a resume: stop here rather than scan,
      // queue five jobs and report "Done" (a real person hit exactly that).
      await log(supabase, user.id, 'error', '⚠️ Upload your resume first — auto-apply needs it to apply. Nothing was searched or queued.')
      return NextResponse.json({
        blocked: 'resume',
        message: 'Upload your resume first — auto-apply needs it to apply.',
        processed: 0,
      })
    } else if (!resumeText) {
      await log(supabase, user.id, 'analyzing', `⚠️ Resume found (${primaryResume?.name || 'unknown'}) but no text could be extracted. Re-upload for best results.`)
    }

    const keywords: string[] = prefs.target_roles?.length ? prefs.target_roles : prefs.desired_job_title ? [prefs.desired_job_title] : []
    if (!keywords.length) {
      await log(supabase, user.id, 'error', '⚠️ No target roles set. Add the roles you want under "What to apply for".')
      return NextResponse.json({ message: 'Add at least one target role first', processed: 0 })
    }
    const where = [prefs.city_preferences?.[0] || prefs.target_locations?.[0], prefs.country_preference].filter(Boolean).join(', ') || 'anywhere'
    await log(supabase, user.id, 'scanning', `🔍 Searching employer boards, RemoteOK and Adzuna for ${keywords.slice(0, 3).map(k => `"${k}"`).join(', ')} in ${where}...`)

    const pool = await gatherPool(prefs)
    const threshold = Math.min(90, Math.max(50, prefs.match_threshold || 70))
    const seen = new Set<string>()
    const uniqueJobs: ScannedJob[] = []
    for (const job of pool) {
      if (seen.has(job.url)) continue
      const m = scoreJob(job, prefs)
      if (!m || m.score < threshold) continue
      seen.add(job.url)
      const keys = dbKeys(job)
      uniqueJobs.push({
        title: job.title, company: job.company, location: job.location, url: job.url,
        source: job.source, board_token: job.board_token, posting_id: job.posting_id,
        description: job.description || undefined,
        db_source: keys.source, db_external_id: keys.external_id,
        remote: job.remote, match_score: m.score, match_reasons: m.reasons,
      })
    }
    uniqueJobs.sort((a, b) => b.match_score - a.match_score)

    await log(supabase, user.id, 'scanning', `📋 ${pool.length} postings checked, ${uniqueJobs.length} match your roles, location and level at ${threshold}%+`)

    if (!uniqueJobs.length) {
      await log(supabase, user.id, 'scanning', `❌ Nothing matched ${keywords.slice(0, 2).map(k => `"${k}"`).join(' or ')} in ${where} right now. Add more roles, widen the location, or lower the match threshold under Settings.`)
      return NextResponse.json({ message: 'No matching jobs found', processed: 0 })
    }

    // Filter already applied
    const { data: existingApps } = await supabase.from('applications').select('jobs(url)').eq('user_id', user.id)
    const appliedUrls = new Set((existingApps || []).map((a: any) => a.jobs?.url).filter(Boolean))
    const newJobs = uniqueJobs.filter(j => !appliedUrls.has(j.url))

    await log(supabase, user.id, 'scanning', `✅ ${newJobs.length} new unapplied jobs to process`)

    if (!newJobs.length) {
      await log(supabase, user.id, 'scanning', '⚠️ Already applied to all found jobs. Engine will find new ones next run.')
      return NextResponse.json({ message: 'Already applied to all matching jobs', processed: 0 })
    }

    const maxToProcess = Math.min(newJobs.length, room, 5)
    await fillDescriptions(newJobs.slice(0, maxToProcess))
    let applied = 0

    for (const job of newJobs.slice(0, maxToProcess)) {
      await log(supabase, user.id, 'analyzing', `🎯 Evaluating: ${job.title} at ${job.company}`)

      // Score: the deterministic match is the floor; God Mode adds a Claude read of the fit.
      let score = job.match_score, grade = job.match_score >= 80 ? 'A' : job.match_score >= 65 ? 'B' : 'C', keywords_found: string[] = [], scoreReason = job.match_reasons.join(', ')
      await log(supabase, user.id, 'analyzing', `📍 ${job.location || 'Location not stated'} — ${scoreReason}`)
      if (godMode) {
        const result = await scoreJobWithClaude(job, resumeData, prefs)
        score = result.score; grade = result.grade; keywords_found = result.keywords; scoreReason = result.reason
        await log(supabase, user.id, 'analyzing', `📊 Score: ${grade} (${score}%) — ${scoreReason}`)
        if (score < minScore) {
          await log(supabase, user.id, 'analyzing', `⏭️ Skipped — score ${grade} below threshold ${prefs.god_mode_score_threshold || 'B'}`)
          continue
        }
      }

      // Tailor resume keywords
      let tailoredKeywords: string[] = []
      if (godMode && prefs.god_mode_tailor_resume && resumeText && job.description) {
        try {
          const msg = await anthropic.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 300,
            messages: [{
              role: 'user',
              content: `List the TOP 8 ATS keywords from this job description that are NOT already in the candidate's skills list.
Job: ${job.title} at ${job.company}
Job description: ${(job.description || '').slice(0, 600)}
Candidate skills already has: ${(resumeData?.skills || []).slice(0, 20).join(', ')}
Return JSON array only: ["keyword1", "keyword2", ...]`
            }]
          })
          const text = msg.content[0].type === 'text' ? msg.content[0].text : '[]'
          tailoredKeywords = tryParseModelJson<any>(text, [], msg.stop_reason)
          if (tailoredKeywords.length) {
            await log(supabase, user.id, 'analyzing', `✏️ Resume tailored — Added keywords: ${tailoredKeywords.slice(0, 5).join(', ')}`)
          }
        } catch { /* continue */ }
      }

      // Generate cover letter
      let coverLetter = ''
      if (godMode && prefs.god_mode_cover_letter) {
        coverLetter = await generateCoverLetter(job, resumeData, fullName)
        if (coverLetter) {
          await log(supabase, user.id, 'analyzing', `✉️ Cover letter written: "${coverLetter.slice(0, 80).replace(/\n/g, ' ')}..."`)
        }
      }

      // Submit to ATS portal
      let portalSubmitted = false, portalSubmissionId: string | null = null, submitError: string | null = null

      if (autopilot && resumeText) {
        await log(supabase, user.id, 'analyzing', `🚀 Submitting to ${job.company} via ${job.source} API...`)
        const result = await submitToPortal(job, firstName, lastName, email, phone, resumeText, coverLetter)
        portalSubmitted = result.submitted
        portalSubmissionId = result.id
        submitError = result.error

        if (portalSubmitted) {
          await log(supabase, user.id, 'auto_applied', `✅ SUBMITTED to ${job.title} at ${job.company} via ${job.source}${godMode ? ' (God Mode)' : ''} — ID: ${portalSubmissionId || 'confirmed'}`)
        } else {
          await log(supabase, user.id, 'analyzing', `⚠️ Portal submission failed: ${submitError} — saving as queued`)
        }
      } else if (!resumeText) {
        await log(supabase, user.id, 'analyzing', `⚠️ No resume text — cannot submit. Upload resume to enable submissions.`)
      }

      // Upsert job + save application
      const externalId = job.db_external_id
      const { data: existingJob } = await supabase.from('jobs').select('id').eq('external_id', externalId).maybeSingle()
      let jobDbId = existingJob?.id
      if (!jobDbId) {
        const { data: ins, error: jobErr } = await supabase.from('jobs').insert([{
          external_id: externalId, source: job.db_source, title: job.title,
          company: job.company, location: job.location, url: job.url,
          remote_type: job.remote ? 'remote' : null,
        }]).select('id').single()
        if (jobErr) console.error('auto-apply/test: jobs insert failed', jobErr.message)
        jobDbId = ins?.id
      }
      if (!jobDbId) continue

      const status = (autopilot && portalSubmitted) ? 'applied' : 'queued'
      const { error: appErr } = await supabase.from('applications').insert([{
        user_id: user.id, job_id: jobDbId, status,
        match_score: score,
        applied_at: status === 'applied' ? new Date().toISOString() : null,
        god_mode_used: godMode,
        god_mode_score: score,
        god_mode_grade: grade,
        cover_letter: coverLetter || null,
        portal_type: job.source,
        portal_submitted: portalSubmitted,
        portal_submission_id: portalSubmissionId,
      }])
      if (appErr) {
        console.error('auto-apply/test: applications insert failed', appErr.message)
        await log(supabase, user.id, 'error', `⚠️ Could not save application for ${job.title} at ${job.company}: ${appErr.message}`)
        return NextResponse.json({ error: 'Could not save your application. Please try again.', processed: applied }, { status: 500 })
      }

      applied++
      if (applied >= room) break
    }

    // The portion past the monthly pool came out of purchased credits.
    if (allowance.monthlyLimit !== null && applied > 0) {
      const over = Math.min(applied, Math.max(0, allowance.monthlyUsed + applied - allowance.monthlyLimit))
      if (over > 0) {
        const { error: creditErr } = await createAdminClient().rpc('consume_apply_credits', { p_user: user.id, p_n: over })
        if (creditErr) console.error('auto-apply/test: credit consume failed', creditErr.message)
      }
    }

    const summary = autopilot
      ? `${applied} job(s) processed${godMode ? ' with God Mode (resume tailored + cover letter)' : ''}`
      : `${applied} job(s) queued for review${godMode ? ' with God Mode analysis' : ''}`
    await log(supabase, user.id, 'auto_applied', `🏁 Done — ${summary}`)

    return NextResponse.json({ message: 'Done', processed: applied, mode: prefs.auto_apply_mode, god_mode: godMode })
  } catch (err) {
    console.error('[AUTO-APPLY] Fatal:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
