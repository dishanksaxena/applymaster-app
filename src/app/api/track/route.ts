import { NextRequest } from 'next/server'
import { isTrackEvent, SERVER_ONLY_EVENTS } from '@/lib/track-events'
import { recordEvent } from '@/lib/track-server'
import { createClient } from '@/lib/supabase-server'

/**
 * Receives auth and support events from the browser.
 *
 * Unauthenticated by necessity — the people this exists to see are the ones
 * who could not sign in. So it accepts only known event names, caps the body,
 * clips every field, and applies a per-address rate limit. It always answers
 * 204: the browser never waits on it and never learns anything from it.
 */

const MAX_BODY = 4000
const WINDOW_MS = 60_000
const MAX_PER_WINDOW = 40

// Best effort on serverless — each instance keeps its own window — but it
// stops a single client from hammering one warm instance.
const hits = new Map<string, { n: number; reset: number }>()

function limited(key: string): boolean {
  const now = Date.now()
  const h = hits.get(key)
  if (!h || h.reset < now) {
    hits.set(key, { n: 1, reset: now + WINDOW_MS })
    if (hits.size > 5000) hits.clear()
    return false
  }
  h.n += 1
  return h.n > MAX_PER_WINDOW
}

const noContent = () => new Response(null, { status: 204 })

export async function POST(req: NextRequest) {
  try {
    const raw = await req.text()
    if (!raw || raw.length > MAX_BODY) return noContent()

    const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown'
    if (limited(ip)) return noContent()

    const body = JSON.parse(raw)
    if (!isTrackEvent(body.event) || SERVER_ONLY_EVENTS.has(body.event)) return noContent()

    // Attach the user when there is a session, so a failure after sign-in
    // (a password change, say) is tied to the account.
    let userId: string | null = null
    try {
      const {
        data: { user },
      } = await createClient().auth.getUser()
      userId = user?.id ?? null
    } catch {}

    await recordEvent(
      body.event,
      {
        outcome: body.outcome,
        method: body.method,
        email: body.email,
        error_code: body.error_code,
        error_message: body.error_message,
        meta: body.meta,
        user_id: userId,
        path: body.path,
        referrer: body.referrer,
        anon_id: body.anon_id,
      },
      req.headers
    )
  } catch {
    /* malformed input is simply dropped */
  }
  return noContent()
}
