import Anthropic from '@anthropic-ai/sdk'
import { tryParseModelJson } from '@/lib/model-json'
import { isPersonalConsent, isVoluntaryDemographic, knownAnswer, type KnownAnswerContext } from './fields'

/**
 * Answering an employer's screening questions as the applicant.
 *
 * Shared by every path that applies: the server-side form filler, the apply
 * kit's "ask about a question", and the Chrome extension. Facts we hold are
 * answered from the profile; judgement questions go to a model that may
 * only use the profile and resume; demographic questions are never answered.
 */

const anthropic = new Anthropic()

export type AnswerContext = KnownAnswerContext & {
  jobTitle?: string
  company?: string
}

export type Answer = {
  question: string
  answer: string
  /** 'model' answers were written from the resume: the person should read them. */
  source: 'profile' | 'preferences' | 'model'
}

/**
 * Does this person need sponsorship, given how they described their status?
 *
 * Returns null rather than guessing when the answer is not clearly implied.
 * A wrong answer on this question is not a cosmetic error: saying you need
 * sponsorship when you do not can filter you out automatically, and saying
 * you do not when you do is a misrepresentation on a job application.
 */
export function sponsorshipFrom(status?: string | null): boolean | null {
  if (!status) return null
  const s = status.toLowerCase()

  /* Match the exact vocabulary the profile page offers first. Two of its
     five options — "Work Visa (Can Work)" and "No Restrictions" — fell
     through the generic patterns and returned null, so the most common
     required question on any application went unanswered for users who had
     in fact told us the answer. */
  if (/^citizen$|^permanent resident$|^no restrictions$|^work visa \(can work\)$/.test(s.trim())) return false
  if (/^need sponsorship$/.test(s.trim())) return true

  // "Needs sponsorship" is checked before the negative patterns, because
  // "requires sponsorship" contains "sponsor" either way.
  if (/require|need/.test(s) && /sponsor|visa/.test(s)) return true
  if (/citizen|permanent resident|green card|\bpr\b|indefinite leave|settled|no restrictions|no sponsorship (needed|required)/.test(s)) return false
  if (/\bh-?1b\b|tier 2|skilled worker visa|\bopt\b|\bcpt\b|student visa/.test(s)) return true
  if (/can work|authorized|authorised|eligible to work|work permit|visa holder/.test(s)) return false
  return null
}

/**
 * Answer the screening questions that are not simple facts.
 *
 * Constrained hard on purpose: this is speaking as the user to an employer,
 * so it may only use what is in their profile and resume. An invented
 * credential here is worse than a blank field — it is a lie on a job
 * application with their name on it.
 */
export async function answerScreeningQuestions(
  questions: string[],
  ctx: AnswerContext,
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

/**
 * Every question, answered the safest way available: known facts first,
 * then the model for the rest. Demographic questions come back unanswered,
 * as do questions the facts cannot support.
 */
export async function answerQuestions(questions: string[], ctx: AnswerContext, resumeSummary: string): Promise<Answer[]> {
  const out: Answer[] = []
  const open: string[] = []
  for (const q of [...new Set(questions.map(q => q.trim()).filter(Boolean))].slice(0, 40)) {
    if (isVoluntaryDemographic(q)) continue
    const known = knownAnswer(q, ctx)
    if (known) out.push({ question: q, answer: known.answer, source: known.source })
    else if (!isPersonalConsent(q)) open.push(q) // agreements are never written for anyone
  }
  if (open.length) {
    const written = await answerScreeningQuestions(open, ctx, resumeSummary).catch(() => ({}) as Record<string, string>)
    for (const q of open) if (written[q]) out.push({ question: q, answer: written[q], source: 'model' })
  }
  return out
}
