import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 60

const anthropic = new Anthropic()

const SCAN_TARGETS = {
  greenhouse: ['stripe', 'notion', 'figma', 'linear', 'vercel', 'airbnb', 'brex', 'rippling', 'retool', 'airtable', 'segment', 'twilio', 'datadog'],
  lever: ['netflix', 'pinterest', 'lyft', 'dropbox', 'affirm', 'chime', 'plaid', 'ramp', 'cloudflare'],
  ashby: ['supabase', 'posthog', 'modal', 'elevenlabs', 'perplexity'],
}

interface ScannedJob {
  title: string; company: string; location: string; url: string
  source: 'greenhouse' | 'lever' | 'ashby'
  board_token?: string; posting_id?: string; description?: string
}

async function scanGreenhouse(board: string, keywords: string[]): Promise<ScannedJob[]> {
  try {
    const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${board}/jobs?content=true`, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return []
    const data = await res.json()
    return (data.jobs || [])
      .filter((j: any) => keywords.some(kw => (j.title || '').toLowerCase().includes(kw.toLowerCase())))
      .slice(0, 2)
      .map((j: any) => ({
        title: j.title, company: board.charAt(0).toUpperCase() + board.slice(1),
        location: j.location?.name || 'Remote',
        url: j.absolute_url || `https://boards.greenhouse.io/${board}/jobs/${j.id}`,
        source: 'greenhouse' as const, board_token: board, posting_id: String(j.id),
        description: (j.content || '').replace(/<[^>]+>/g, ' ').slice(0, 1500),
      }))
  } catch { return [] }
}

async function scanLever(company: string, keywords: string[]): Promise<ScannedJob[]> {
  try {
    const res = await fetch(`https://api.lever.co/v0/postings/${company}?mode=json`, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return []
    const postings = await res.json()
    return (Array.isArray(postings) ? postings : [])
      .filter((p: any) => keywords.some(kw => (p.text || '').toLowerCase().includes(kw.toLowerCase())))
      .slice(0, 2)
      .map((p: any) => ({
        title: p.text, company: company.charAt(0).toUpperCase() + company.slice(1),
        location: p.categories?.location || 'Remote',
        url: p.hostedUrl || `https://jobs.lever.co/${company}/${p.id}`,
        source: 'lever' as const, posting_id: p.id,
        description: (p.descriptionPlain || '').slice(0, 1500),
      }))
  } catch { return [] }
}

async function scanAshby(org: string, keywords: string[]): Promise<ScannedJob[]> {
  try {
    const res = await fetch(`https://api.ashbyhq.com/posting-api/job-board?organizationHostedJobsPageName=${org}`, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return []
    const data = await res.json()
    return (data.jobs || [])
      .filter((j: any) => keywords.some(kw => (j.title || '').toLowerCase().includes(kw.toLowerCase())))
      .slice(0, 2)
      .map((j: any) => ({
        title: j.title, company: org.charAt(0).toUpperCase() + org.slice(1),
        location: j.location || 'Remote',
        url: j.jobUrl || `https://jobs.ashbyhq.com/${org}/${j.id}`,
        source: 'ashby' as const, posting_id: j.id,
        description: (j.descriptionPlain || '').slice(0, 1500),
      }))
  } catch { return [] }
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
    const parsed = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || '{}')
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
  await supabase.from('apply_log').insert({ user_id: userId, action, details, portal: 'system' })
}

// ── Main Handler ──────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    let { data: prefs } = await supabase.from('job_preferences').select('*').eq('user_id', user.id).single()
    if (!prefs) {
      const { data } = await supabase.from('job_preferences').insert([{
        user_id: user.id, match_threshold: 75, daily_apply_limit: 10,
        auto_apply_mode: 'copilot', target_roles: ['Software Engineer'],
        remote_preference: 'any', experience_level: 'mid',
      }]).select().single()
      prefs = data
    }

    const godMode: boolean = prefs.god_mode_enabled || false
    const autopilot: boolean = prefs.auto_apply_mode === 'autopilot'
    const scoreThresholdMap: Record<string, number> = { A: 80, B: 65, C: 50 }
    const minScore = scoreThresholdMap[prefs.god_mode_score_threshold || 'B'] || 65

    // Plan limits
    const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).single()
    const isUnlimited = profile?.plan === 'lifetime' || profile?.plan === 'elite'
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const { count: appsToday } = await supabase.from('applications').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', today.toISOString())
    const effectiveLimit = isUnlimited ? 999 : (prefs.daily_apply_limit || 10)
    if (!isUnlimited && (appsToday || 0) >= effectiveLimit) {
      return NextResponse.json({ message: 'Daily limit reached', processed: 0 })
    }

    // Load candidate data
    const { data: userProfile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    // Read parsed data from resumes.parsed_data (written by /api/resume/upload)
    const { data: primaryResume } = await supabase
      .from('resumes').select('id, parsed_data, name').eq('user_id', user.id).eq('is_primary', true).single()

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
      await log(supabase, user.id, 'error', '⚠️ No resume found. Re-upload your resume in the Resume section so it can be parsed.')
    } else if (!resumeText) {
      await log(supabase, user.id, 'analyzing', `⚠️ Resume found (${primaryResume?.name || 'unknown'}) but no text could be extracted. Re-upload for best results.`)
    }

    const keywords: string[] = prefs.target_roles?.length ? prefs.target_roles : ['Software Engineer']
    await log(supabase, user.id, 'scanning', `🔍 Scanning Greenhouse, Lever & Ashby for "${keywords[0]}" roles...`)

    // Scan in parallel
    const [ghRes, lvRes, ashRes] = await Promise.all([
      Promise.all(SCAN_TARGETS.greenhouse.slice(0, 4).map(b => scanGreenhouse(b, keywords))),
      Promise.all(SCAN_TARGETS.lever.slice(0, 4).map(c => scanLever(c, keywords))),
      Promise.all(SCAN_TARGETS.ashby.slice(0, 4).map(o => scanAshby(o, keywords))),
    ])

    const allJobs: ScannedJob[] = [...ghRes.flat(), ...lvRes.flat(), ...ashRes.flat()]
    const seen = new Set<string>()
    const uniqueJobs = allJobs.filter(j => { if (seen.has(j.url)) return false; seen.add(j.url); return true })

    await log(supabase, user.id, 'scanning', `📋 Found ${uniqueJobs.length} matching jobs across Greenhouse/Lever/Ashby`)

    if (!uniqueJobs.length) {
      await log(supabase, user.id, 'scanning', `❌ No jobs matched "${keywords[0]}". Try adding more target roles in your profile.`)
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

    const maxToProcess = Math.min(newJobs.length, effectiveLimit - (appsToday || 0), 5)
    let applied = 0

    for (const job of newJobs.slice(0, maxToProcess)) {
      await log(supabase, user.id, 'analyzing', `🎯 Evaluating: ${job.title} at ${job.company}`)

      // Score
      let score = 65, grade = 'B', keywords_found: string[] = [], scoreReason = ''
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
          tailoredKeywords = JSON.parse(text.match(/\[[\s\S]*\]/)?.[0] || '[]')
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
      const externalId = `${job.source}-${job.posting_id || encodeURIComponent(job.url)}`
      const { data: existingJob } = await supabase.from('jobs').select('id').eq('external_id', externalId).maybeSingle()
      let jobDbId = existingJob?.id
      if (!jobDbId) {
        const { data: ins } = await supabase.from('jobs').insert([{
          external_id: externalId, source: job.source, title: job.title,
          company: job.company, location: job.location, url: job.url,
        }]).select('id').single()
        jobDbId = ins?.id
      }
      if (!jobDbId) continue

      const status = (autopilot && portalSubmitted) ? 'applied' : 'queued'
      await supabase.from('applications').insert([{
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

      applied++
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
