import type { SupabaseClient } from '@supabase/supabase-js'
import { signResumeUrl } from '@/lib/resume-files'
import { sponsorshipFrom, type AnswerContext } from '@/lib/ats/answers'

/**
 * Everything needed to apply to one job, gathered once.
 *
 * The apply kit shows it with copy buttons; the Chrome extension fills the
 * employer's form with it. Both then record the submission here, which
 * moves the application to Applied and writes the receipt the person can
 * check later.
 *
 * Every query filters on user_id explicitly. The extension authenticates
 * with its own key and reads through the service role, so row-level
 * security is not there to catch a missing filter.
 */

export type ApplyPacket = {
  application_id: string | null
  job: { id: string; title: string; company: string; url: string | null; description: string | null } | null
  applicant: {
    first_name: string
    last_name: string
    full_name: string
    email: string
    phone: string | null
    location: string | null
    country: string | null
    linkedin: string | null
    website: string | null
  }
  /** Standing answers to the questions nearly every form asks. */
  facts: {
    requires_sponsorship: boolean | null
    work_authorization: string | null
    years_experience: number | null
    salary_expectation: string | null
    notice_period: string | null
    willing_to_relocate: boolean | null
  }
  resume: { id: string; name: string; url: string | null } | null
  /** Resume text rewritten for this job, when one has been made. */
  tailored_resume: { id: string; text: string } | null
  cover_letter: { id: string; text: string } | null
  /** For answering screening questions. */
  context: AnswerContext
  resume_summary: string
  /** Work history and education as the resume states them: Workday asks for each field. */
  experience: { title: string; company: string; location: string | null; start: string | null; end: string | null; current: boolean; description: string | null }[]
  education: { school: string; degree: string | null; field: string | null; start: string | null; end: string | null }[]
}

/** Contact links written into the resume itself: the profile has no fields for them. */
export function linksFromResume(text: string | null | undefined) {
  const t = String(text ?? '')
  const linkedin = t.match(/(?:https?:\/\/)?(?:[a-z]{2,3}\.)?linkedin\.com\/in\/[\w%-]+/i)?.[0] ?? null
  const site =
    t.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[\w-]+/i)?.[0] ??
    t.match(/https?:\/\/(?!(?:[a-z]{2,3}\.)?linkedin\.com)[\w.-]+\.[a-z]{2,}(?:\/[\w./%-]*)?/i)?.[0] ??
    null
  const withScheme = (u: string | null) => (u && !/^https?:\/\//i.test(u) ? `https://${u}` : u)
  return { linkedin: withScheme(linkedin), website: withScheme(site) }
}

const YEARS_FROM_LEVEL: Record<string, number> = { entry: 1, mid: 4, senior: 8, lead: 12, executive: 16 }

/** Canonical form of a posting URL, for matching the page someone is on to a saved job. */
export function postingKey(url: string | null | undefined): string | null {
  if (!url) return null
  try {
    const u = new URL(url)
    const gh = u.searchParams.get('gh_jid')
    if (gh) return `gh:${gh}`
    const ghPath = u.pathname.match(/\/jobs\/(\d{5,})/)
    if (/greenhouse\.io$/.test(u.hostname) && ghPath) return `gh:${ghPath[1]}`
    const lever = u.pathname.match(/^\/[^/]+\/([0-9a-f-]{36})/i)
    if (/lever\.co$/.test(u.hostname) && lever) return `lever:${lever[1].toLowerCase()}`
    const ashby = u.pathname.match(/^\/[^/]+\/([0-9a-f-]{36})/i)
    if (/ashbyhq\.com$/.test(u.hostname) && ashby) return `ashby:${ashby[1].toLowerCase()}`
    return `${u.hostname.replace(/^www\./, '')}${u.pathname.replace(/\/(apply|application)\/?$/, '').replace(/\/$/, '')}`.toLowerCase()
  } catch {
    return null
  }
}

type JobRow = { id: string; title: string; company: string; url: string | null; description: string | null }

/** The saved job this page belongs to, if the person has saved it. */
async function findJobForUrl(db: SupabaseClient, userId: string, url: string) {
  const key = postingKey(url)
  if (!key) return null
  const { data } = await db
    .from('applications')
    .select('id, job:jobs(id, title, company, url, description)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1000)
  for (const a of (data ?? []) as unknown as { id: string; job: JobRow | null }[]) {
    if (a.job && postingKey(a.job.url) === key) return { applicationId: a.id, job: a.job }
  }
  return null
}

export async function buildPacket(
  db: SupabaseClient,
  user: { id: string; email: string | null },
  opts: { applicationId?: string | null; url?: string | null }
): Promise<ApplyPacket> {
  let applicationId: string | null = null
  let job: JobRow | null = null
  if (opts.applicationId) {
    const { data } = await db
      .from('applications')
      .select('id, job:jobs(id, title, company, url, description)')
      .eq('user_id', user.id)
      .eq('id', opts.applicationId)
      .maybeSingle()
    if (data) {
      applicationId = data.id
      job = (data as unknown as { job: JobRow | null }).job
    }
  } else if (opts.url) {
    const found = await findJobForUrl(db, user.id, opts.url)
    if (found) {
      applicationId = found.applicationId
      job = found.job
    }
  }

  const [{ data: profile }, { data: prefs }, { data: resume }] = await Promise.all([
    db.from('profiles').select('full_name, email').eq('id', user.id).maybeSingle(),
    db.from('job_preferences').select('*').eq('user_id', user.id).maybeSingle(),
    db.from('resumes').select('id, name, file_url').eq('user_id', user.id).eq('is_primary', true).maybeSingle(),
  ])
  const { data: parsed } = resume
    ? await db
        .from('parsed_resumes')
        .select('full_name, email, phone, location, summary, skills, experience, education, raw_text, total_years_experience')
        .eq('resume_id', resume.id)
        .maybeSingle()
    : { data: null }

  const fullName = String(profile?.full_name || parsed?.full_name || '').trim()
  const [first = '', ...rest] = fullName.split(/\s+/)
  const links = linksFromResume(parsed?.raw_text)

  const [tailored, letter] = job
    ? await Promise.all([
        db
          .from('optimized_resumes')
          .select('id, optimized_text')
          .eq('user_id', user.id)
          .eq('job_id', job.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        db
          .from('cover_letters')
          .select('id, content')
          .eq('user_id', user.id)
          .eq('job_id', job.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ])
    : [{ data: null }, { data: null }]

  const years =
    (parsed?.total_years_experience as number | null) ?? YEARS_FROM_LEVEL[String(prefs?.experience_level ?? '')] ?? null
  const facts = {
    requires_sponsorship: sponsorshipFrom(prefs?.work_authorization),
    work_authorization: prefs?.work_authorization ?? null,
    years_experience: years,
    salary_expectation: prefs?.min_salary ? String(prefs.min_salary) : null,
    notice_period: prefs?.available_start_date ?? null,
    willing_to_relocate: typeof prefs?.willing_to_relocate === 'boolean' ? prefs.willing_to_relocate : null,
  }
  const location = parsed?.location || (Array.isArray(prefs?.city_preferences) ? prefs.city_preferences[0] : null) || null

  const resumeSummary = [
    parsed?.summary ? `Summary: ${String(parsed.summary).slice(0, 400)}` : '',
    Array.isArray(parsed?.skills) && parsed.skills.length ? `Skills: ${(parsed.skills as string[]).slice(0, 25).join(', ')}` : '',
    Array.isArray(parsed?.experience) && parsed.experience.length
      ? `Recent roles: ${(parsed.experience as { title?: string; company?: string }[])
          .slice(0, 3)
          .map(e => `${e.title} at ${e.company}`)
          .join('; ')}`
      : '',
    // Universities are asked about often; answering needs the resume's own words.
    Array.isArray(parsed?.education) && parsed.education.length
      ? `Education: ${(parsed.education as Record<string, unknown>[])
          .slice(0, 3)
          .map(e => [e.degree, e.field ?? e.field_of_study, e.institution ?? e.school, e.year ?? e.graduation_year].filter(Boolean).join(', '))
          .join('; ')}`
      : '',
  ]
    .filter(Boolean)
    .join('\n')

  return {
    application_id: applicationId,
    job,
    applicant: {
      first_name: first,
      last_name: rest.join(' '),
      full_name: fullName,
      email: String(profile?.email || user.email || parsed?.email || ''),
      phone: parsed?.phone || null,
      location,
      country: prefs?.country_preference || null,
      linkedin: links.linkedin,
      website: links.website,
    },
    facts,
    resume: resume ? { id: resume.id, name: resume.name || 'resume.pdf', url: resume.file_url ? await signResumeUrl(resume.file_url, 1800) : null } : null,
    tailored_resume: tailored.data?.optimized_text ? { id: tailored.data.id, text: tailored.data.optimized_text } : null,
    cover_letter: letter.data?.content ? { id: letter.data.id, text: letter.data.content } : null,
    context: {
      jobTitle: job?.title,
      company: job?.company,
      country: prefs?.country_preference ?? null,
      location,
      requiresSponsorship: facts.requires_sponsorship,
      workAuthorization: facts.work_authorization,
      yearsExperience: years,
      salaryExpectation: facts.salary_expectation,
      noticePeriod: facts.notice_period,
    },
    resume_summary: resumeSummary,
    experience: (Array.isArray(parsed?.experience) ? (parsed.experience as Record<string, unknown>[]) : [])
      .filter(e => e && (e.title || e.company))
      .slice(0, 6)
      .map(e => ({
        title: String(e.title ?? ''),
        company: String(e.company ?? ''),
        location: (e.location as string) || null,
        start: e.start_date != null ? String(e.start_date) : null,
        end: e.end_date != null ? String(e.end_date) : null,
        current: !!e.is_current,
        description: (e.description as string) || null,
      })),
    education: (Array.isArray(parsed?.education) ? (parsed.education as Record<string, unknown>[]) : [])
      .filter(e => e && (e.institution || e.school))
      .slice(0, 3)
      .map(e => ({
        school: String(e.institution ?? e.school ?? ''),
        degree: (e.degree as string) || null,
        field: ((e.field ?? e.field_of_study) as string) || null,
        start: e.start_date != null ? String(e.start_date) : null,
        end: e.end_date != null ? String(e.end_date) : null,
      })),
  }
}

export type SubmissionRecord = {
  applicationId?: string | null
  /** When the job is not in the tracker yet: the page it was applied on. */
  url?: string | null
  title?: string | null
  company?: string | null
  method: 'assisted' | 'manual'
  answers?: { question: string; answer: string; source?: string }[]
  resumeId?: string | null
  resumeLabel?: string | null
  coverLetterId?: string | null
  coverLetterText?: string | null
  destination?: string | null
  destinationUrl?: string | null
  confirmationText?: string | null
  confirmationRef?: string | null
}

const missingColumn = (e: { code?: string } | null) => e?.code === '42703' || e?.code === 'PGRST204'

/**
 * Mark an application as applied and keep the receipt.
 *
 * When the job is not in the tracker (someone applied straight from the
 * employer's site with the extension), it is added first, so every real
 * application ends up trackable.
 */
export async function recordSubmission(db: SupabaseClient, userId: string, r: SubmissionRecord) {
  let applicationId = r.applicationId ?? null
  if (applicationId) {
    const { data } = await db.from('applications').select('id').eq('user_id', userId).eq('id', applicationId).maybeSingle()
    if (!data) throw new Error('That application is not yours')
  } else {
    if (!r.url) throw new Error('Say which job this was')
    const found = await findJobForUrl(db, userId, r.url)
    if (found) applicationId = found.applicationId
    else {
      const title = (r.title || '').trim().slice(0, 200) || 'Application'
      const company = (r.company || '').trim().slice(0, 200) || new URL(r.url).hostname.replace(/^www\./, '')
      const externalId = `ext:${postingKey(r.url)}`.slice(0, 250)
      // Jobs are shared: someone else may have applied to this posting already.
      let { data: job } = await db.from('jobs').select('id').eq('source', 'extension').eq('external_id', externalId).limit(1).maybeSingle()
      if (!job) {
        const made = await db
          .from('jobs')
          .insert({ title, company, url: r.url, location: '', source: 'extension', external_id: externalId })
          .select('id')
          .single()
        if (made.error || !made.data) throw new Error(made.error?.message || 'Could not save the job')
        job = made.data
      }
      const { data: had } = await db.from('applications').select('id').eq('user_id', userId).eq('job_id', job.id).maybeSingle()
      if (had) applicationId = had.id
      else {
        const { data: app, error: appErr } = await db
          .from('applications')
          .insert({ user_id: userId, job_id: job.id, status: 'saved' })
          .select('id')
          .single()
        if (appErr || !app) throw new Error(appErr?.message || 'Could not add it to your tracker')
        applicationId = app.id
      }
    }
  }

  const now = new Date().toISOString()
  await db.from('applications').update({ status: 'applied', applied_at: now, updated_at: now }).eq('id', applicationId).eq('user_id', userId)

  const receipt = {
    user_id: userId,
    application_id: applicationId,
    resume_id: r.resumeId ?? null,
    resume_version_label: r.resumeLabel ?? null,
    cover_letter_id: r.coverLetterId ?? null,
    cover_letter_text: r.coverLetterText ?? null,
    screening_answers: (r.answers ?? []).slice(0, 80).map(a => ({
      question: String(a.question).slice(0, 500),
      answer: String(a.answer).slice(0, 2000),
      source: a.source ?? 'you',
    })),
    destination: r.destination ?? null,
    destination_url: r.destinationUrl ?? r.url ?? null,
    submission_method: r.method,
    status: 'submitted',
    submitted_at: now,
    confirmation_text: r.confirmationText?.slice(0, 2000) ?? null,
    confirmation_ref: r.confirmationRef?.slice(0, 200) ?? null,
  }
  let { data: saved, error } = await db.from('application_receipts').insert(receipt).select('id').single()
  if (missingColumn(error)) {
    // Before add_apply_kit_extension.sql: keep the receipt, without the employer's confirmation.
    const { confirmation_text: _t, confirmation_ref: _r, ...older } = receipt
    ;({ data: saved, error } = await db.from('application_receipts').insert(older).select('id').single())
  }
  if (error) throw new Error(error.message)

  await db
    .from('apply_log')
    .insert({
      user_id: userId,
      application_id: applicationId,
      action: 'applied',
      portal: r.destination ?? null,
      details: r.method === 'assisted' ? 'Filled by the ApplyMaster extension, submitted by you' : 'Applied with the apply kit',
    })
    .then(() => {}, () => {})

  return { applicationId: applicationId!, receiptId: saved!.id as string }
}
