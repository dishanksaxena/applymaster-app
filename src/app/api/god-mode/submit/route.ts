import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 60

const anthropic = new Anthropic()

// ── Portal Detection ──────────────────────────────────────────────
function detectPortal(url: string): 'greenhouse' | 'lever' | 'ashby' | 'workable' | 'unknown' {
  if (!url) return 'unknown'
  const u = url.toLowerCase()
  if (u.includes('greenhouse.io') || u.includes('boards.greenhouse')) return 'greenhouse'
  if (u.includes('lever.co') || u.includes('jobs.lever.co')) return 'lever'
  if (u.includes('ashbyhq.com') || u.includes('ashby.com')) return 'ashby'
  if (u.includes('workable.com')) return 'workable'
  return 'unknown'
}

// ── Extract Greenhouse board token + job ID from URL ─────────────
function parseGreenhouseUrl(url: string): { boardToken: string; jobId: string } | null {
  // Patterns:
  // https://boards.greenhouse.io/company/jobs/12345
  // https://job-boards.greenhouse.io/company/jobs/12345
  const match = url.match(/greenhouse\.io\/([^/]+)\/jobs\/(\d+)/)
  if (match) return { boardToken: match[1], jobId: match[2] }
  return null
}

// ── Extract Lever posting ID from URL ───────────────────────────
function parseLeverUrl(url: string): { company: string; postingId: string } | null {
  // Patterns:
  // https://jobs.lever.co/company/posting-id
  // https://jobs.lever.co/company/posting-id/apply
  const match = url.match(/lever\.co\/([^/]+)\/([a-f0-9-]{36})/)
  if (match) return { company: match[1], postingId: match[2] }
  return null
}

// ── Extract Ashby job posting ID ───────────────────────────────
function parseAshbyUrl(url: string): { orgSlug: string; jobSlug: string } | null {
  // Patterns:
  // https://jobs.ashbyhq.com/company/job-slug
  // https://company.ashbyhq.com/jobs/job-id
  const match = url.match(/ashbyhq\.com\/([^/]+)\/([^/?]+)/)
  if (match) return { orgSlug: match[1], jobSlug: match[2] }
  return null
}

// ── Greenhouse Submit ────────────────────────────────────────────
async function submitToGreenhouse(params: {
  boardToken: string
  jobId: string
  firstName: string
  lastName: string
  email: string
  phone: string
  resumeText: string
  coverLetter: string
  linkedinUrl: string
}) {
  const url = `https://boards-api.greenhouse.io/v1/boards/${params.boardToken}/jobs/${params.jobId}/applications`

  const body = {
    first_name: params.firstName,
    last_name: params.lastName,
    email: params.email,
    phone: params.phone,
    cover_letter: params.coverLetter,
    resume_text: params.resumeText,
    // Greenhouse custom questions can go here
    question_fields: [],
    ...(params.linkedinUrl ? { social_media: [{ type: 'linkedin', url: params.linkedinUrl }] } : {}),
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Basic ' + Buffer.from(':').toString('base64'), // public endpoint, no auth needed
    },
    body: JSON.stringify(body),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    // Greenhouse returns 200 on success, anything else is an error
    throw new Error(`Greenhouse API error ${response.status}: ${JSON.stringify(data)}`)
  }

  return { success: true, applicationId: data.id, portal: 'greenhouse', data }
}

// ── Lever Submit ─────────────────────────────────────────────────
async function submitToLever(params: {
  company: string
  postingId: string
  name: string
  email: string
  phone: string
  resumeText: string
  coverLetter: string
}) {
  // Lever v0 public apply endpoint
  const url = `https://api.lever.co/v0/postings/${params.postingId}/apply`

  const body = {
    name: params.name,
    email: params.email,
    phone: params.phone,
    reason: params.coverLetter, // Lever uses "reason" for cover letter
    resume: params.resumeText,
    org: params.company,
    // Additional Lever fields
    comments: 'Application submitted via ApplyMaster.ai',
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(`Lever API error ${response.status}: ${JSON.stringify(data)}`)
  }

  return { success: true, applicationId: data.applicationId, portal: 'lever', data }
}

// ── Ashby Submit ─────────────────────────────────────────────────
async function submitToAshby(params: {
  orgSlug: string
  jobSlug: string
  firstName: string
  lastName: string
  email: string
  phone: string
  resumeText: string
  coverLetter: string
  linkedinUrl: string
}) {
  // First get the job posting ID from Ashby's public API
  const jobBoardUrl = `https://api.ashbyhq.com/posting-api/job-board?organizationHostedJobsPageName=${params.orgSlug}`
  const jobBoardRes = await fetch(jobBoardUrl)
  const jobBoard = await jobBoardRes.json().catch(() => ({ jobs: [] }))

  // Find matching job by slug
  const job = (jobBoard.jobs || []).find((j: any) =>
    j.externalLink?.includes(params.jobSlug) || j.id === params.jobSlug
  )

  const jobPostingId = job?.id || params.jobSlug

  // Submit application
  const applyUrl = `https://api.ashbyhq.com/posting-api/application/create`
  const body = {
    jobPostingId,
    firstName: params.firstName,
    lastName: params.lastName,
    email: params.email,
    phoneNumber: params.phone,
    resumeAsPlainText: params.resumeText,
    coverLetter: params.coverLetter,
    ...(params.linkedinUrl ? { linkedInUrl: params.linkedinUrl } : {}),
  }

  const response = await fetch(applyUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(`Ashby API error ${response.status}: ${JSON.stringify(data)}`)
  }

  return { success: true, applicationId: data.applicationId, portal: 'ashby', data }
}

// ── Main Handler ─────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const {
      job_id,
      job_title,
      company,
      job_description,
      apply_url,
      god_mode = false,
      tailored_resume_id,
    } = await req.json()

    if (!job_title || !company) {
      return Response.json({ error: 'job_title and company required' }, { status: 400 })
    }

    // Get user data
    const [{ data: profile }, { data: prefs }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('job_preferences').select('*').eq('user_id', user.id).single(),
    ])

    let parsedResume: any = null
    const { data: primaryResume } = await supabase
      .from('resumes').select('id').eq('user_id', user.id).eq('is_primary', true).single()
    if (primaryResume) {
      const { data } = await supabase
        .from('parsed_resumes').select('*').eq('resume_id', primaryResume.id).single()
      parsedResume = data
    }

    // Build candidate details
    const fullName = parsedResume?.full_name || profile?.full_name || user.email?.split('@')[0] || ''
    const nameParts = fullName.trim().split(' ')
    const firstName = nameParts[0] || ''
    const lastName = nameParts.slice(1).join(' ') || ''
    const email = parsedResume?.email || user.email || ''
    const phone = parsedResume?.phone || ''
    const linkedinUrl = parsedResume?.linkedin_url || ''

    // Get resume text — use tailored version if God Mode + tailored resume exists
    let resumeText = parsedResume?.raw_text || ''
    let coverLetterText = ''

    if (god_mode) {
      // If tailored resume exists, use it
      if (tailored_resume_id) {
        const { data: tailored } = await supabase
          .from('tailored_resumes').select('*').eq('id', tailored_resume_id).single()
        if (tailored) {
          // Reconstruct tailored resume text by applying tailored bullets
          resumeText = buildTailoredResumeText(parsedResume, tailored)
        }
      }

      // Generate cover letter for this specific job
      if (job_description) {
        const coverMsg = await anthropic.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 800,
          messages: [{
            role: 'user',
            content: `Write a concise, compelling cover letter (250-300 words) for this application.

Candidate: ${fullName}
Job: ${job_title} at ${company}
Job Description: ${job_description.slice(0, 1500)}
Candidate Skills: ${(parsedResume?.skills || []).slice(0, 15).join(', ')}
Most Recent Role: ${parsedResume?.experience?.[0]?.title || 'N/A'} at ${parsedResume?.experience?.[0]?.company || 'N/A'}

Write a professional cover letter. Return only the letter text, no subject line.`
          }]
        })
        coverLetterText = coverMsg.content[0].type === 'text' ? coverMsg.content[0].text : ''
      }
    }

    // Detect portal and submit
    const portal = apply_url ? detectPortal(apply_url) : 'unknown'
    let submitResult: any = null
    let submitted = false
    let submissionError: string | null = null

    if (apply_url && portal !== 'unknown') {
      try {
        if (portal === 'greenhouse') {
          const parsed = parseGreenhouseUrl(apply_url)
          if (parsed) {
            submitResult = await submitToGreenhouse({
              ...parsed,
              firstName, lastName, email, phone,
              resumeText, coverLetter: coverLetterText, linkedinUrl,
            })
            submitted = true
          }
        } else if (portal === 'lever') {
          const parsed = parseLeverUrl(apply_url)
          if (parsed) {
            submitResult = await submitToLever({
              ...parsed,
              name: fullName, email, phone,
              resumeText, coverLetter: coverLetterText,
            })
            submitted = true
          }
        } else if (portal === 'ashby') {
          const parsed = parseAshbyUrl(apply_url)
          if (parsed) {
            submitResult = await submitToAshby({
              ...parsed,
              firstName, lastName, email, phone,
              resumeText, coverLetter: coverLetterText, linkedinUrl,
            })
            submitted = true
          }
        }
      } catch (err: any) {
        submissionError = err.message
        console.error('Portal submission error:', err)
        // Don't throw — fall through to mark as applied in DB anyway
        // so user knows what happened
      }
    }

    // Save/update application record in DB
    const { data: existingApp } = await supabase
      .from('applications')
      .select('id')
      .eq('user_id', user.id)
      .eq('job_id', job_id)
      .single()

    const appData = {
      user_id: user.id,
      job_id: job_id || null,
      status: 'applied',
      applied_at: new Date().toISOString(),
      cover_letter: coverLetterText || null,
      god_mode_used: god_mode,
      portal_type: portal,
      portal_submission_id: submitResult?.applicationId || null,
      portal_submitted: submitted,
    }

    if (existingApp) {
      await supabase.from('applications').update(appData).eq('id', existingApp.id)
    } else {
      await supabase.from('applications').insert(appData)
    }

    // Log the activity
    await supabase.from('apply_log').insert({
      user_id: user.id,
      job_id: job_id || null,
      action: submitted ? 'submitted' : 'marked_applied',
      portal: portal,
      status: 'success',
      note: submitted
        ? `Applied via ${portal} API${god_mode ? ' with God Mode (tailored resume + cover letter)' : ''}`
        : submissionError
          ? `Portal submission failed: ${submissionError}. Marked as applied.`
          : `No portal API detected. Marked as applied.`,
    })

    return Response.json({
      success: true,
      submitted,
      portal,
      god_mode_used: god_mode,
      cover_letter_generated: !!coverLetterText,
      resume_tailored: !!tailored_resume_id,
      application_id: submitResult?.applicationId || null,
      error: submissionError,
      message: submitted
        ? `Application submitted to ${company} via ${portal}!`
        : `Marked as applied${submissionError ? ` (note: portal submission failed — ${submissionError})` : ''}`,
    })

  } catch (err) {
    console.error('God Mode submit error:', err)
    return Response.json({ error: 'Failed to submit application' }, { status: 500 })
  }
}

// ── Helper: rebuild tailored resume text ─────────────────────────
function buildTailoredResumeText(parsedResume: any, tailored: any): string {
  if (!parsedResume) return ''

  const bulletMap: Record<string, string> = {}
  for (const tb of tailored.tailored_bullets || []) {
    bulletMap[tb.original] = tb.tailored
  }

  let text = ''

  // Summary
  if (tailored.tailored_summary) {
    text += `PROFESSIONAL SUMMARY\n${tailored.tailored_summary}\n\n`
  } else if (parsedResume.summary) {
    text += `PROFESSIONAL SUMMARY\n${parsedResume.summary}\n\n`
  }

  // Experience
  if (parsedResume.experience?.length) {
    text += 'EXPERIENCE\n'
    for (const exp of parsedResume.experience) {
      text += `${exp.title} at ${exp.company} (${exp.date_range || ''})\n`
      if (exp.description) {
        const tailoredDesc = bulletMap[exp.description] || exp.description
        text += `${tailoredDesc}\n`
      }
      text += '\n'
    }
  }

  // Skills — add ATS keywords
  const allSkills = [
    ...(parsedResume.skills || []),
    ...(tailored.ats_keywords || []).filter((k: string) => !(parsedResume.skills || []).includes(k)),
  ]
  if (allSkills.length) {
    text += `SKILLS\n${allSkills.join(', ')}\n\n`
  }

  // Education
  if (parsedResume.education?.length) {
    text += 'EDUCATION\n'
    for (const edu of parsedResume.education) {
      text += `${edu.degree || ''} in ${edu.field || ''} — ${edu.institution || ''} (${edu.year || ''})\n`
    }
  }

  return text.trim()
}
