import { NextRequest } from 'next/server'
import { authenticate, unauthorized } from '@/lib/api-auth'
import { buildPacket } from '@/lib/apply-packet'

/**
 * Everything needed to apply to one job: who is applying, their standing
 * answers, resume, tailored resume and cover letter for this job.
 *
 * The apply kit asks by application id; the extension asks by the URL of
 * the page it is on, which is matched to a job in the person's tracker.
 */
export async function POST(req: NextRequest) {
  const caller = await authenticate(req)
  if (!caller) return unauthorized()

  const body = await req.json().catch(() => ({}))
  const applicationId = typeof body.application_id === 'string' ? body.application_id : null
  const url = typeof body.url === 'string' ? body.url.slice(0, 2000) : null

  try {
    const { context: _c, resume_summary: _s, ...packet } = await buildPacket(caller.db, caller.user, { applicationId, url })
    return Response.json(packet)
  } catch (e) {
    console.error('apply/packet:', e)
    return Response.json({ error: 'Could not load your details' }, { status: 500 })
  }
}
