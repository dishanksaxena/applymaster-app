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

/* ── Visits ──────────────────────────────────────────────────────────── */

/** The browser asked not to be tracked (Global Privacy Control or Do Not Track). */
function optedOut(): boolean {
  try {
    const n = navigator as Navigator & { globalPrivacyControl?: boolean; msDoNotTrack?: string }
    return n.globalPrivacyControl === true || n.doNotTrack === '1' || n.msDoNotTrack === '1'
  } catch {
    return false
  }
}

const SESSION_KEY = 'am_session'
const SESSION_IDLE_MS = 30 * 60 * 1000

/**
 * A visit: a run of page views with no gap over 30 minutes. Where the visit
 * came from (search engine, link, campaign) is only known on its first page,
 * so it is kept with the visit and sent with every view.
 */
function session(): { id: string; n: number; source: Record<string, string> } | null {
  try {
    const now = Date.now()
    const raw = sessionStorage.getItem(SESSION_KEY)
    const s = raw ? JSON.parse(raw) : null
    if (s && now - s.at < SESSION_IDLE_MS) {
      s.at = now
      s.n += 1
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(s))
      return s
    }
    const params = new URLSearchParams(window.location.search)
    const source: Record<string, string> = {}
    for (const k of ['utm_source', 'utm_medium', 'utm_campaign', 'ref', 'gclid', 'fbclid']) {
      const v = params.get(k)
      if (v) source[k] = v.slice(0, 80)
    }
    const ref = document.referrer
    if (ref && !ref.startsWith(window.location.origin)) source.referrer = ref.slice(0, 300)
    source.landing = window.location.pathname
    const fresh = { id: crypto.randomUUID(), at: now, n: 1, source }
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(fresh))
    return fresh
  } catch {
    return null
  }
}

export function trackPageView(path: string): void {
  if (optedOut()) return
  const s = session()
  track('page_view', {
    meta: {
      path,
      session: s?.id,
      view_in_session: s?.n,
      ...(s?.source ?? {}),
      screen: typeof window !== 'undefined' ? window.innerWidth : undefined,
      lang: navigator.language,
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  })
}

/* ── Problems people hit ─────────────────────────────────────────────── */

// One page must not flood the log: the same message once, and at most 15 in all.
const reported = new Set<string>()
export function reportProblem(event: 'ui_error' | 'api_error' | 'client_error', message: string, meta: Record<string, unknown> = {}): void {
  const msg = String(message || '').slice(0, 400)
  const key = `${event}:${msg}`
  if (!msg || reported.has(key) || reported.size >= 15) return
  reported.add(key)
  track(event, { error_message: msg, meta: { ...meta, page: window.location.pathname } })
}
