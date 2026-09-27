import { NextRequest } from 'next/server'
import { signResumeUrl } from '@/lib/resume-files'
import { createClient } from '@/lib/supabase-server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { applyToJob } from '@/lib/ats/engine'
import { answerScreeningQuestions, sponsorshipFrom } from '@/lib/ats/answers'
import { linksFromResume } from '@/lib/apply-packet'
import type { ApplyRequest } from '@/lib/ats/types'

export const maxDuration = 300


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
      .select('skills, experience, summary, phone, location, raw_text')
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
        linkedin: profile.linkedin_url || linksFromResume(parsed?.raw_text).linkedin,
        website: profile.portfolio_url || null,
        resumeUrl: await signResumeUrl(resume.file_url),
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
      answerScreeningQuestions(questions, ctx ?? {}, resumeSummary)
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
