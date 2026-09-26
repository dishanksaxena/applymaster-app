'use client'

import type { TrackEvent, TrackProps } from './track-events'

/**
 * Record an auth or support event.
 *
 * Uses sendBeacon, because the moments worth recording are exactly the ones
 * where the page is about to go away: a successful login navigates
 * immediately, and Google sign-in leaves the site entirely. An ordinary fetch
 * started at that point is usually cancelled before it is sent.
 *
 * Never throws and never blocks the caller. Tracking must not be the reason
 * a sign-in fails.
 */

const ANON_KEY = 'am_anon_id'

function anonId(): string | null {
  try {
    let id = localStorage.getItem(ANON_KEY)
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem(ANON_KEY, id)
    }
    /* Mirrored into a cookie so server-side events — the OAuth callback is
       the only place a failed Google sign-in is visible — can be tied to the
       same visitor's earlier attempts. Not sensitive: a random id. */
    if (!document.cookie.includes(`am_anon=${id}`)) {
      document.cookie = `am_anon=${id}; path=/; max-age=31536000; SameSite=Lax`
    }
    return id
  } catch {
    // Private windows and blocked storage: still record the event, just
    // without the ability to stitch it to earlier ones.
    return null
  }
}

export function track(event: TrackEvent, props: TrackProps = {}): void {
  try {
    const body = JSON.stringify({
      event,
      ...props,
      email: props.email ? props.email.trim().toLowerCase() : null,
      path: window.location.pathname,
      referrer: document.referrer || null,
      anon_id: anonId(),
    })

    if (navigator.sendBeacon) {
      const ok = navigator.sendBeacon('/api/track', new Blob([body], { type: 'application/json' }))
      if (ok) return
    }
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {})
  } catch {
    /* never let tracking break the page */
  }
}

/** The per-browser id, so a support message can be tied to the attempts before it. */
export const getAnonId = anonId
