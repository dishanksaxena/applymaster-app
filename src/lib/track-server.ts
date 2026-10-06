import { createAdminClient, isMissingTable } from './supabase-admin'
import { outcomeOf, type TrackEvent, type TrackProps } from './track-events'

/**
 * Server-side event write. Shared by /api/track (events reported from the
 * browser) and the OAuth callback, which runs on the server and is the only
 * place a failed Google sign-in can be seen at all.
 */

const clip = (v: unknown, n: number) =>
  typeof v === 'string' && v.trim() ? v.trim().slice(0, n) : null

let warnedMissing = false

export async function recordEvent(
  event: TrackEvent,
  props: TrackProps & {
    user_id?: string | null
    path?: string | null
    referrer?: string | null
    anon_id?: string | null
  },
  headers?: Headers
): Promise<void> {
  try {
    const supabase = createAdminClient()

    // Keep meta small and flat: it is diagnostic context, not a data store.
    let meta: Record<string, unknown> = {}
    if (props.meta && typeof props.meta === 'object') {
      const s = JSON.stringify(props.meta)
      meta = s.length <= 2000 ? props.meta : { truncated: true }
    }
    // City and region as the edge resolved them from the IP; the IP itself is never stored.
    const city = headers?.get('x-vercel-ip-city')
    const region = headers?.get('x-vercel-ip-country-region')
    if (city) {
      try {
        meta.city = decodeURIComponent(city).slice(0, 80)
      } catch {
        meta.city = city.slice(0, 80)
      }
    }
    if (region) meta.region = region.slice(0, 20)

    const { error } = await supabase.from('app_events').insert({
      event,
      outcome: props.outcome ?? outcomeOf(event),
      method: clip(props.method, 20),
      email: clip(props.email, 254)?.toLowerCase() ?? null,
      user_id: props.user_id ?? null,
      error_code: clip(props.error_code, 80),
      error_message: clip(props.error_message, 500),
      path: clip(props.path, 300),
      referrer: clip(props.referrer, 500),
      anon_id: clip(props.anon_id, 64),
      country: clip(headers?.get('x-vercel-ip-country'), 8),
      user_agent: clip(headers?.get('user-agent'), 300),
      meta,
    })

    if (error) {
      if (isMissingTable(error)) {
        if (!warnedMissing) {
          console.warn('[track] app_events table missing — run supabase/migrations/add_ops_tracking.sql')
          warnedMissing = true
        }
        return
      }
      console.error('[track] insert failed:', error.message)
    }
  } catch (err) {
    console.error('[track] error:', err instanceof Error ? err.message : err)
  }
}
