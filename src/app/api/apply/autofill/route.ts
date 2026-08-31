import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { applyToJob } from '@/lib/ats/engine'
import { tryParseModelJson } from '@/lib/model-json'
import type { ApplyRequest } from '@/lib/ats/types'

export const maxDuration = 300

const anthropic = new Anthropic()

/**
 * Fill an employer's real application form, and submit it when we honestly
 * can.
 *
 * Two things are deliberate and worth stating plainly.
 *
 * Submission is opt-in per request. The default is to fill the form and
 * stop, because sending an application is irreversible and lands in a real
 * recruiter's queue under the user's name. `submit: true` has to be asked
 * for.
 *
 * A CAPTCHA ends the attempt. Six of seven live Greenhouse boards sampled
 * carry one; it exists to require a person, and defeating it would breach
 * the employer's terms and put the application at risk of being thrown out.
 * The outcome in that case is `awaiting_human`, with everything already
 * filled and a link to finish.
 */

/**
 * Does this person need sponsorship, given how they described their status?
 *
 * Returns null rather than guessing when the answer is not clearly implied.
 * A wrong answer on this question is not a cosmetic error: saying you need
 * sponsorship when you do not can filter you out automatically, and saying
 * you do not when you do is a misrepresentation on a job application.
 */
/**
 * A URL the browser engine can actually download the resume from.
 *
 * resumes is a private bucket, so getPublicUrl — which is what upload
 * stored on the row — produces a link that answers 400. Anything trying to
 * read the file back got nothing. A short-lived signed URL is the correct
 * handle for a private object.
 */
async function signedResumeUrl(publicUrl: string): Promise<string | null> {
  const marker = '/object/public/resumes/'
  const i = publicUrl.indexOf(marker)
  if (i === -1) return publicUrl // already signed, or stored elsewhere

  const path = decodeURIComponent(publicUrl.slice(i + marker.length))
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data } = await admin.storage.from('resumes').createSignedUrl(path, 600)
  return data?.signedUrl ?? null
}

function sponsorshipFrom(status?: string | null): boolean | null {
  if (!status) return null
  const s = status.toLowerCase()

  /* Match the exact vocabulary the profile page offers first. Two of its
     five options — "Work Visa (Can Work)" and "No Restrictions" — fell
     through the generic patterns and returned null, so the most common
     required question on any application went unanswered for users who had
     in fact told us the answer. */
  if (/^citizen$|^permanent resident$|^no restrictions$|^work visa (can work)$/.test(s.trim())) return false
  if (/^need sponsorship$/.test(s.trim())) return true

  // "Needs sponsorship" is checked before the negative patterns, because
  // "requires sponsorship" contains "sponsor" either way.
  if (/require|need/.test(s) && /sponsor|visa/.test(s)) return true
  if (/citizen|permanent resident|green card|\bpr\b|indefinite leave|settled|no restrictions|no sponsorship (needed|required)/.test(s)) return false
  if (/\bh-?1b\b|tier 2|skilled worker visa|\bopt\b|\bcpt\b|student visa/.test(s)) return true
  if (/can work|authorized|authorised|eligible to work|work permit|visa holder/.test(s)) return false
  return null
}

type AnswerCtx = ApplyRequest['context']

/**
 * Answer the screening questions that are not simple facts.
 *
 * Constrained hard on purpose: this is speaking as the user to an employer,
 * so it may only use what is in their profile and resume. An invented
 * credential here is worse than a blank field — it is a lie on a job
 * application with their name on it.
 */
async function answerScreeningQuestions(
  questions: string[],
  ctx: AnswerCtx,
  resumeSummary: string
): Promise<Record<string, string>> {
  if (!questions.length) return {}

  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: `Answer these job-application screening questions AS THE CANDIDATE, using only the facts given. This goes to a real employer under the candidate's name.

CANDIDATE
${resumeSummary}
Years of experience: ${ctx?.yearsExperience ?? 'unknown'}
Requires visa sponsorship: ${ctx?.requiresSponsorship == null ? 'unknown' : ctx.requiresSponsorship ? 'yes' : 'no'}
Work authorization: ${ctx?.workAuthorization ?? 'unknown'}
Notice period: ${ctx?.noticePeriod ?? 'unknown'}
Salary expectation: ${ctx?.salaryExpectation ?? 'unknown'}

ROLE: ${ctx?.jobTitle ?? 'unknown'} at ${ctx?.company ?? 'unknown'}

QUESTIONS
${questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

RULES
- Use ONLY the facts above. Never invent experience, employers, qualifications, clearances or dates.
- If the facts do not answer a question, omit that question entirely from your output. A blank the user fills in themselves is far better than a plausible fabrication.
- Yes/no questions get exactly "Yes" or "No".
- Free-text answers: at most two sentences, first person, plain language.
- Never answer anything about gender, race, ethnicity, veteran status, disability or sexual orientation — omit those.

Return ONLY minified JSON mapping the exact question text to your answer:
{"<question text verbatim>":"<answer>"}`,
      },
    ],
  })

  const text = msg.content[0]?.type === 'text' ? msg.content[0].text : '{}'
  const parsed = tryParseModelJson<Record<string, string>>(text, {}, msg.stop_reason)

  // Keep only answers to questions we actually asked about.
  const allowed = new Set(questions)
  return Object.fromEntries(
    Object.entries(parsed).filter(([q, a]) => allowed.has(q) && typeof a === 'string' && a.trim())
  )
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Not authenticated' }, { status: 401 })

    const { job_url, job_id, job_title, company, submit = false, cover_letter } = await req.json()
    if (!job_url) return Response.json({ error: 'job_url required' }, { status: 400 })

    // ── Assemble who is applying, from what we already hold ──
    const [{ data: profile }, { data: prefs }, { data: resume }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      supabase.from('job_preferences').select('*').eq('user_id', user.id).maybeSingle(),
      supabase
        .from('resumes')
        .select('id, file_url, name')
        .eq('user_id', user.id)
        .eq('is_primary', true)
        .maybeSingle(),
    ])

    if (!profile?.full_name || !resume?.file_url) {
      return Response.json(
        {
          error: !resume?.file_url
            ? 'Upload a resume before applying — the form needs a file to attach.'
            : 'Add your name to your profile before applying.',
        },
        { status: 400 }
      )
    }

    const { data: parsed } = await supabase
      .from('parsed_resumes')
      .select('skills, experience, summary, phone, location, linkedin_url')
      .eq('resume_id', resume.id)
      .maybeSingle()

    const [firstName, ...rest] = String(profile.full_name).trim().split(/\s+/)
    const lastName = rest.join(' ') || firstName

    const resumeSummary = [
      parsed?.summary ? `Summary: ${String(parsed.summary).slice(0, 400)}` : '',
      parsed?.skills?.length ? `Skills: ${(parsed.skills as string[]).slice(0, 25).join(', ')}` : '',
      Array.isArray(parsed?.experience) && parsed.experience.length
        ? `Recent roles: ${(parsed.experience as any[])
            .slice(0, 3)
            .map(e => `${e.title} at ${e.company}`)
            .join('; ')}`
        : '',
    ]
      .filter(Boolean)
      .join('\n')

    const request: ApplyRequest = {
      jobUrl: job_url,
      dryRun: !submit,
      profile: {
        firstName,
        lastName,
        email: profile.email || user.email || '',
        phone: profile.phone || parsed?.phone || null,
        location: profile.location || parsed?.location || null,
        country: prefs?.country_preference || null,
        linkedin: profile.linkedin_url || parsed?.linkedin_url || null,
        website: profile.portfolio_url || null,
        resumeUrl: await signedResumeUrl(resume.file_url),
        resumeFileName: resume.name || 'resume.pdf',
        coverLetter: cover_letter || null,
      },
      context: {
        jobTitle: job_title,
        company,
        /* Years is asked far more often than experience_level is useful, so
           prefer the number the resume parser actually derived and fall
           back to the midpoint of the band the user picked. */
        yearsExperience:
          (parsed as any)?.total_years_experience ??
          ({ entry: 1, mid: 4, senior: 8, lead: 12, executive: 16 } as Record<string, number>)[
            prefs?.experience_level ?? ''
          ] ??
          null,
        requiresSponsorship: sponsorshipFrom(prefs?.work_authorization),
        workAuthorization: prefs?.work_authorization ?? null,
        salaryExpectation: prefs?.min_salary ? `${prefs.min_salary}` : null,
        noticePeriod: prefs?.available_start_date ?? null,
        skills: (parsed?.skills as string[]) ?? [],
      },
    }

    const result = await applyToJob(request, (questions, ctx) =>
      answerScreeningQuestions(questions, ctx, resumeSummary)
    )

    /* Record what happened, including the screenshot, so the user can see
       the state of the form we left behind rather than taking our word. */
    if (job_id) {
      await supabase
        .from('application_receipts')
        .insert({
          user_id: user.id,
          application_id: job_id,
          resume_id: resume.id,
          resume_version_label: resume.name,
          resume_file_url: resume.file_url,
          cover_letter_text: cover_letter || null,
          screening_answers: result.filled.map(f => ({
            question: f.question,
            answer: f.answer,
            source: f.source,
          })),
          destination: result.vendor,
          destination_url: job_url,
          submission_method: result.outcome === 'submitted' ? 'auto' : 'assisted',
          status:
            result.outcome === 'submitted'
              ? 'submitted'
              : result.outcome === 'awaiting_human'
                ? 'needs_review'
                : 'failed',
          failure_reason:
            result.outcome === 'submitted'
              ? null
              : result.blockedBy === 'captcha'
                ? 'The employer requires a CAPTCHA. Everything is filled — open the form and press submit.'
                : result.error,
        })
        .then(() => {})
    }

    return Response.json({
      outcome: result.outcome,
      vendor: result.vendor,
      blockedBy: result.blockedBy ?? null,
      filled: result.filled,
      unfilled: result.unfilled,
      confirmationText: result.confirmationText ?? null,
      confirmationRef: result.confirmationRef ?? null,
      resumeUrl: result.resumeUrl ?? null,
      screenshot: result.screenshot ? `data:image/png;base64,${result.screenshot}` : null,
      durationMs: result.durationMs,
      error: result.error ?? null,
    })
  } catch (err) {
    console.error('apply/autofill error:', err)
    return Response.json(
      { error: err instanceof Error ? err.message.slice(0, 200) : 'Autofill failed' },
      { status: 500 }
    )
  }
}
