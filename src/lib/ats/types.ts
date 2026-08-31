/**
 * Applying to a job by driving the employer's own form.
 *
 * Why this exists: none of the ATS platforms accept an application over a
 * public API. Greenhouse's /applications endpoint answers 404 without an
 * employer key; Lever's v0 API is gone; Ashby's returns null. The only way
 * to genuinely submit — and to get back something that proves it — is to
 * fill the form a human would fill.
 *
 * What that can and cannot do, measured rather than assumed. Across eight
 * live Greenhouse boards: every one had a submit button and file inputs,
 * between 11 and 36 visible fields, and 2 to 10 *required* screening
 * questions. Six of the seven that loaded carried a CAPTCHA.
 *
 * So the outcome is one of three, and the product has to be honest about
 * which it got:
 *
 *   submitted        form filled and sent, confirmation captured
 *   awaiting_human   filled and ready, blocked on a CAPTCHA the user must
 *                    clear themselves — we do not solve those
 *   failed           could not fill it; the reason is recorded
 */

export type AtsVendor = 'greenhouse' | 'lever' | 'ashby' | 'workday' | 'unknown'

export type ApplicantProfile = {
  firstName: string
  lastName: string
  email: string
  phone?: string | null
  location?: string | null
  /** Country on its own; a form asking for it will not accept a city. */
  country?: string | null
  linkedin?: string | null
  website?: string | null
  /** Absolute URL to the resume file; downloaded and attached. */
  resumeUrl?: string | null
  resumeFileName?: string
  coverLetter?: string | null
}

/** One question the form asked and the answer we gave, with its source. */
export type AnsweredQuestion = {
  question: string
  answer: string
  /** Where the answer came from, so a receipt can show it. */
  source: 'profile' | 'resume' | 'preferences' | 'model' | 'default'
  required: boolean
}

export type ApplyOutcome = 'submitted' | 'awaiting_human' | 'failed'

export type ApplyResult = {
  outcome: ApplyOutcome
  vendor: AtsVendor
  /** Employer's own reference, when the confirmation page gives one. */
  confirmationRef?: string | null
  /** Text of the confirmation, as proof the submission landed. */
  confirmationText?: string | null
  /** Base64 PNG of the final state — filled form, or confirmation page. */
  screenshot?: string | null
  filled: AnsweredQuestion[]
  /** Fields we could not fill and why. */
  unfilled: { question: string; reason: string }[]
  blockedBy?: 'captcha' | 'login' | 'unsupported_form' | null
  error?: string | null
  /** The URL the user should open to finish, when we could not. */
  resumeUrl?: string | null
  durationMs: number
}

export type ApplyRequest = {
  jobUrl: string
  profile: ApplicantProfile
  /** Extra context the model can use to answer screening questions. */
  context?: {
    jobTitle?: string
    company?: string
    yearsExperience?: number | null
    workAuthorization?: string | null
    requiresSponsorship?: boolean | null
    salaryExpectation?: string | null
    noticePeriod?: string | null
    skills?: string[]
  }
  /** Fill and report without pressing submit. Used for previews and tests. */
  dryRun?: boolean
}
