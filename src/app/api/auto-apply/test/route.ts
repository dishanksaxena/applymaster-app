import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 60

const anthropic = new Anthropic()

// Companies pre-configured on Greenhouse/Lever/Ashby (direct API access)
const SCAN_TARGETS = {
  greenhouse: ['anthropic', 'stripe', 'notion', 'figma', 'linear', 'vercel', 'airbnb', 'coinbase', 'brex', 'rippling', 'retool', 'airtable', 'segment', 'twilio', 'datadog', 'hashicorp'],
  lever: ['netflix', 'pinterest', 'lyft', 'dropbox', 'instacart', 'affirm', 'chime', 'plaid', 'ramp', 'cloudflare'],
  ashby: ['anthropic', 'openai', 'mistral', 'elevenlabs', 'perplexity', 'supabase', 'posthog', 'linear', 'modal'],
}

interface ScannedJob {
  title: string
  company: string
  location: string
  url: string
  source: 'greenhouse' | 'lever' | 'ashby'
  board_token?: string
  posting_id?: string
  description?: string
}

async function scanGreenhouse(board: string, keywords: string[]): Promise<ScannedJob[]> {
  try {
    const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${board}/jobs?content=true`, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return []
    const data = await res.json()
    return (data.jobs || [])
      .filter((j: any) => keywords.some(kw => (j.title || '').toLowerCase().includes(kw.toLowerCase())))
      .slice(0, 3)
      .map((j: any) => ({
        title: j.title,
        company: board.charAt(0).toUpperCase() + board.slice(1),
        location: j.location?.name || 'Remote',
        url: j.absolute_url || `https://boards.greenhouse.io/${board}/jobs/${j.id}`,
        source: 'greenhouse' as const,
        board_token: board,
        posting_id: String(j.id),
        description: j.content?.slice(0, 1000) || '',
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
      .slice(0, 3)
      .map((p: any) => ({
        title: p.text,
        company: company.charAt(0).toUpperCase() + company.slice(1),
        location: p.categories?.location || 'Remote',
        url: p.hostedUrl || `https://jobs.lever.co/${company}/${p.id}`,
        source: 'lever' as const,
        posting_id: p.id,
        description: p.descriptionPlain?.slice(0, 1000) || '',
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
      .slice(0, 3)
      .map((j: any) => ({
        title: j.title,
        company: org.charAt(0).toUpperCase() + org.slice(1),
        location: j.location || 'Remote',
        url: j.jobUrl || `https://jobs.ashbyhq.com/${org}/${j.id}`,
        source: 'ashby' as const,
        posting_id: j.id,
        description: j.descriptionPlain?.slice(0, 1000) || '',
      }))
  } catch { return [] }
}

function detectPortal(url: string): 'greenhouse' | 'lever' | 'ashby' | 'unknown' {
  const u = url.toLowerCase()
  if (u.includes('greenhouse.io')) return 'greenhouse'
  if (u.includes('lever.co')) return 'lever'
  if (u.includes('ashbyhq.com')) return 'ashby'
  return 'unknown'
}

function parseGreenhouseUrl(url: string) {
  const match = url.match(/greenhouse\.io\/([^/]+)\/jobs\/(\d+)/)
  return match ? { boardToken: match[1], jobId: match[2] } : null
}

function parseLeverUrl(url: string) {
  const match = url.match(/lever\.co\/([^/]+)\/([a-f0-9-]{36})/)
  return match ? { company: match[1], postingId: match[2] } : null
}

function parseAshbyUrl(url: string) {
  const match = url.match(/ashbyhq\.com\/([^/]+)\/([^/?]+)/)
  return match ? { orgSlug: match[1], jobSlug: match[2] } : null
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
    // Load preferences
    let { data: prefs } = await supabase.from('job_preferences').select('*').eq('user_id', user.id).single()
    if (!prefs) {
      const { data } = await supabase.from('job_preferences').insert([{
        user_id: user.id, match_threshold: 75, daily_apply_limit: 10,
        auto_apply_mode: 'copilot', target_roles: ['Software Engineer'],
        remote_preference: 'any', experience_level: 'mid',
      }]).select().single()
      prefs = data
    }

    const godMode = prefs.god_mode_enabled || false

    // Check plan limits
    const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).single()
    const isUnlimited = profile?.plan === 'lifetime' || profile?.plan === 'elite'
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const { data: todayApps } = await supabase.from('applications').select('id').eq('user_id', user.id).gte('created_at', today.toISOString())
    const appsToday = todayApps?.length || 0
    const effectiveLimit = isUnlimited ? 999 : (prefs.daily_apply_limit || 10)
    if (!isUnlimited && appsToday >= effectiveLimit) {
      return NextResponse.json({ message: 'Daily limit reached', processed: 0 })
    }

    const keywords: string[] = prefs.target_roles?.length ? prefs.target_roles : ['Software Engineer']
    const scoreThresholdMap = { A: 80, B: 65, C: 50 }
    const minScore = scoreThresholdMap[prefs.god_mode_score_threshold as 'A' | 'B' | 'C'] || 65

    await log(supabase, user.id, 'scanning', `Scanning Greenhouse, Lever & Ashby for "${keywords[0]}" roles...`)

    // Scan job boards in parallel (3 companies from each for speed)
    const [ghResults, leverResults, ashbyResults] = await Promise.all([
      Promise.all(SCAN_TARGETS.greenhouse.slice(0, 3).map(b => scanGreenhouse(b, keywords))),
      Promise.all(SCAN_TARGETS.lever.slice(0, 3).map(c => scanLever(c, keywords))),
      Promise.all(SCAN_TARGETS.ashby.slice(0, 3).map(o => scanAshby(o, keywords))),
    ])

    const allJobs: ScannedJob[] = [...ghResults.flat(), ...leverResults.flat(), ...ashbyResults.flat()]
    const seen = new Set<string>()
    const uniqueJobs = allJobs.filter(j => { if (seen.has(j.url)) return false; seen.add(j.url); return true })

    await log(supabase, user.id, 'scanning', `Found ${uniqueJobs.length} live jobs from job boards...`)

    if (!uniqueJobs.length) {
      await log(supabase, user.id, 'scanning', 'No matching jobs found. Try broadening your target roles.')
      return NextResponse.json({ message: 'No matching jobs found', processed: 0 })
    }

    // Get user's resume + profile for applications
    const [{ data: parsedResume }, { data: primaryResume }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('resumes').select('id').eq('user_id', user.id).eq('is_primary', true).single(),
    ])

    let resumeData: any = null
    if (primaryResume) {
      const { data } = await supabase.from('parsed_resumes').select('*').eq('resume_id', primaryResume.id).single()
      resumeData = data
    }

    const fullName = resumeData?.full_name || parsedResume?.full_name || ''
    const nameParts = fullName.trim().split(' ')
    const firstName = nameParts[0] || ''
    const lastName = nameParts.slice(1).join(' ') || ''
    const email = resumeData?.email || user.email || ''
    const phone = resumeData?.phone || ''
    const resumeText = resumeData?.raw_text || ''

    // Get already-applied URLs
    const { data: existingApps } = await supabase.from('applications').select('jobs(url)').eq('user_id', user.id)
    const appliedUrls = new Set((existingApps || []).map((a: any) => a.jobs?.url).filter(Boolean))
    const newJobs = uniqueJobs.filter(j => !appliedUrls.has(j.url))

    await log(supabase, user.id, 'scanning', `${newJobs.length} new unapplied jobs to analyze...`)

    let applied = 0
    const limit = Math.min(newJobs.length, effectiveLimit - appsToday, 5) // max 5 per run

    for (const job of newJobs.slice(0, limit)) {
      // Score job with Claude if God Mode on, else use simple heuristic
      let score = 65
      let grade = 'B'

      if (godMode) {
        try {
          const scoreRes = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.applymaster.ai'}/api/god-mode/score`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Cookie: req.headers.get('cookie') || '' },
            body: JSON.stringify({ job_title: job.title, company: job.company, job_description: job.description, location: job.location }),
          })
          if (scoreRes.ok) {
            const scoreData = await scoreRes.json()
            score = scoreData.score || 65
            grade = scoreData.grade || 'B'
          }
        } catch { /* continue with default score */ }

        if (score < minScore) {
          await log(supabase, user.id, 'analyzing', `Skipped ${job.title} at ${job.company} — score ${grade} (${score}) below threshold`)
          continue
        }
      }

      await log(supabase, user.id, 'analyzing', `${job.title} at ${job.company} — Score: ${grade} (${score}%)`)

      // Generate cover letter if God Mode on
      let coverLetter = ''
      if (godMode && prefs.god_mode_cover_letter) {
        try {
          const msg = await anthropic.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 600,
            messages: [{
              role: 'user',
              content: `Write a concise cover letter (200 words) for ${fullName} applying to ${job.title} at ${job.company}. Skills: ${(resumeData?.skills || []).slice(0, 10).join(', ')}. Most recent role: ${resumeData?.experience?.[0]?.title || 'N/A'} at ${resumeData?.experience?.[0]?.company || 'N/A'}. Return only the letter text.`
            }]
          })
          coverLetter = msg.content[0].type === 'text' ? msg.content[0].text : ''
        } catch { /* continue without cover letter */ }
      }

      // Upsert job record
      const externalId = `${job.source}-${job.posting_id || encodeURIComponent(job.url)}`
      const { data: existingJob } = await supabase.from('jobs').select('id').eq('external_id', externalId).maybeSingle()
      let jobDbId = existingJob?.id
      if (!jobDbId) {
        const { data: inserted } = await supabase.from('jobs').insert([{
          external_id: externalId, source: job.source, title: job.title,
          company: job.company, location: job.location, url: job.url,
        }]).select('id').single()
        jobDbId = inserted?.id
      }
      if (!jobDbId) continue

      // Actually submit to ATS portal if God Mode on + autopilot
      let portalSubmitted = false
      let portalSubmissionId: string | null = null
      const portal = detectPortal(job.url)

      if (godMode && prefs.auto_apply_mode === 'autopilot' && portal !== 'unknown' && resumeText) {
        try {
          if (portal === 'greenhouse') {
            const parsed = parseGreenhouseUrl(job.url)
            if (parsed) {
              const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${parsed.boardToken}/jobs/${parsed.jobId}/applications`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ first_name: firstName, last_name: lastName, email, phone, resume_text: resumeText, cover_letter: coverLetter }),
              })
              if (res.ok) { portalSubmitted = true; const d = await res.json(); portalSubmissionId = d.id || null }
            }
          } else if (portal === 'lever') {
            const parsed = parseLeverUrl(job.url)
            if (parsed) {
              const res = await fetch(`https://api.lever.co/v0/postings/${parsed.postingId}/apply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: fullName, email, phone, reason: coverLetter, resume: resumeText }),
              })
              if (res.ok) { portalSubmitted = true; const d = await res.json(); portalSubmissionId = d.applicationId || null }
            }
          } else if (portal === 'ashby') {
            const parsed = parseAshbyUrl(job.url)
            if (parsed) {
              const res = await fetch(`https://api.ashbyhq.com/posting-api/application/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jobPostingId: parsed.jobSlug, firstName, lastName, email, phoneNumber: phone, resumeAsPlainText: resumeText, coverLetter }),
              })
              if (res.ok) { portalSubmitted = true; const d = await res.json(); portalSubmissionId = d.applicationId || null }
            }
          }
        } catch (e) {
          console.error('Portal submit error:', e)
        }
      }

      // Save application record
      const status = prefs.auto_apply_mode === 'autopilot' ? 'applied' : 'queued'
      const { error: appError } = await supabase.from('applications').insert([{
        user_id: user.id,
        job_id: jobDbId,
        status,
        match_score: score,
        applied_at: status === 'applied' ? new Date().toISOString() : null,
        god_mode_used: godMode,
        god_mode_score: score,
        god_mode_grade: grade,
        cover_letter: coverLetter || null,
        portal_type: portal !== 'unknown' ? portal : null,
        portal_submitted: portalSubmitted,
        portal_submission_id: portalSubmissionId,
      }])

      if (!appError) {
        applied++
        const submitNote = portalSubmitted
          ? `✅ Submitted to ${job.company} via ${portal} API${godMode ? ' (God Mode)' : ''}`
          : godMode
            ? `📋 ${job.title} at ${job.company} queued${prefs.auto_apply_mode === 'autopilot' ? ' — portal not Greenhouse/Lever/Ashby' : ' for review'}`
            : `📋 ${job.title} at ${job.company} ${status}`
        await log(supabase, user.id, portalSubmitted ? 'auto_applied' : 'queued_applications', submitNote)
      }
    }

    const msg = prefs.auto_apply_mode === 'autopilot'
      ? `${applied} applications processed${godMode ? ' via God Mode' : ''}`
      : `${applied} applications queued for your review`

    return NextResponse.json({ message: 'Done', processed: applied, mode: prefs.auto_apply_mode, god_mode: godMode })
  } catch (err) {
    console.error('[AUTO-APPLY] Fatal error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
