import { NextRequest } from 'next/server'
import { authenticate, unauthorized } from '@/lib/api-auth'
import { recordSubmission } from '@/lib/apply-packet'

/**
 * "I submitted it": the application moves to Applied and the receipt is kept.
 *
 * The extension records what it filled and what the employer's confirmation
 * page said; the apply kit records the person's own word, plus anything
 * they paste from the employer's confirmation email.
 */
export async function POST(req: NextRequest) {
  const caller = await authenticate(req)
  if (!caller) return unauthorized()

  const b = await req.json().catch(() => ({}))
  const str = (v: unknown, n: number) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, n) : null)
  const method = caller.via === 'extension' ? 'assisted' : b.method === 'assisted' ? 'assisted' : 'manual'
  const answers = Array.isArray(b.answers)
    ? (b.answers as unknown[])
        .filter((a): a is { question: string; answer: string; source?: string } => {
          const x = a as Record<string, unknown>
          return !!x && typeof x.question === 'string' && typeof x.answer === 'string'
        })
        .slice(0, 80)
    : []

  try {
    const out = await recordSubmission(caller.db, caller.user.id, {
      applicationId: str(b.application_id, 64),
      url: str(b.url, 2000),
      title: str(b.job_title, 200),
      company: str(b.company, 200),
      method,
      answers,
      resumeId: str(b.resume_id, 64),
      resumeLabel: str(b.resume_label, 200),
      coverLetterId: str(b.cover_letter_id, 64),
      coverLetterText: str(b.cover_letter_text, 8000),
      destination: str(b.destination, 40),
      destinationUrl: str(b.destination_url, 2000),
      confirmationText: str(b.confirmation_text, 2000),
      confirmationRef: str(b.confirmation_ref, 200),
    })
    return Response.json({ application_id: out.applicationId, receipt_id: out.receiptId })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Could not record it'
    return Response.json({ error: msg }, { status: /not yours|which job/.test(msg) ? 400 : 500 })
  }
}
