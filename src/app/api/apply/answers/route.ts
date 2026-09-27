import { NextRequest } from 'next/server'
import { authenticate, unauthorized } from '@/lib/api-auth'
import { buildPacket } from '@/lib/apply-packet'
import { answerQuestions } from '@/lib/ats/answers'

export const maxDuration = 60

/**
 * Answers to an employer's screening questions, as the applicant.
 *
 * Facts come from the profile (sponsorship, years of experience, notice);
 * anything else is written from the resume and marked 'model' so the
 * person reads it before it goes out. Demographic questions, and questions
 * the facts cannot support, come back unanswered.
 */
export async function POST(req: NextRequest) {
  const caller = await authenticate(req)
  if (!caller) return unauthorized()

  const body = await req.json().catch(() => ({}))
  const questions: string[] = (Array.isArray(body.questions) ? body.questions : [])
    .filter((q: unknown): q is string => typeof q === 'string' && q.trim().length > 1)
    .map((q: string) => q.trim().slice(0, 500))
    .slice(0, 40)
  if (!questions.length) return Response.json({ answers: [] })

  try {
    const packet = await buildPacket(caller.db, caller.user, {
      applicationId: typeof body.application_id === 'string' ? body.application_id : null,
      url: typeof body.url === 'string' ? body.url : null,
    })
    // The page may know the role even when the tracker does not.
    const ctx = {
      ...packet.context,
      jobTitle: packet.context.jobTitle ?? (typeof body.job_title === 'string' ? body.job_title.slice(0, 200) : undefined),
      company: packet.context.company ?? (typeof body.company === 'string' ? body.company.slice(0, 200) : undefined),
    }
    return Response.json({ answers: await answerQuestions(questions, ctx, packet.resume_summary) })
  } catch (e) {
    console.error('apply/answers:', e)
    return Response.json({ error: 'Could not answer those questions' }, { status: 500 })
  }
}
