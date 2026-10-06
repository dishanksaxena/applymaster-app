'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { reportProblem, trackPageView } from '@/lib/track'

/**
 * First-party analytics for the owner's dashboard (/admin): one page view per
 * route change, and the problems people run into: pages that crash, and
 * calls to our API that fail. Nothing is sent to a third party.
 *
 * Errors from browser extensions and other sites' scripts are ignored; they
 * are not ApplyMaster's problems and would bury the real ones.
 */

let installed = false

const NOISE = /ResizeObserver loop|Script error\.?$|Non-Error promise rejection|AbortError|The user aborted|cancelled/i

function install() {
  if (installed || typeof window === 'undefined') return
  installed = true

  window.addEventListener('error', e => {
    const file = e.filename || ''
    if (file && !file.startsWith(window.location.origin)) return
    const msg = e.message || String(e.error ?? '')
    if (!msg || NOISE.test(msg)) return
    reportProblem('client_error', msg, { source: file.replace(window.location.origin, ''), line: e.lineno })
  })

  window.addEventListener('unhandledrejection', e => {
    const r = e.reason
    const msg = r instanceof Error ? r.message : typeof r === 'string' ? r : ''
    if (!msg || NOISE.test(msg)) return
    reportProblem('client_error', msg, { kind: 'unhandled promise' })
  })

  /* Requests to our own API that fail. 401 (signed out) and 404 are part of
     normal use; everything else at 400 and above is something a person hit. */
  const original = window.fetch.bind(window)
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    let path = ''
    try {
      const u = new URL(url, window.location.origin)
      if (u.origin === window.location.origin && u.pathname.startsWith('/api/') && u.pathname !== '/api/track') path = u.pathname
    } catch {}
    try {
      const res = await original(input, init)
      if (path && res.status >= 400 && res.status !== 401 && res.status !== 404) {
        res
          .clone()
          .json()
          .then(
            j => (typeof j?.error === 'string' ? j.error : `HTTP ${res.status}`),
            () => `HTTP ${res.status}`
          )
          .then(msg => reportProblem('api_error', `${path}: ${msg}`, { status: res.status, method: init?.method || 'GET' }))
      }
      return res
    } catch (err) {
      if (path && !(err instanceof DOMException && err.name === 'AbortError')) {
        reportProblem('api_error', `${path}: could not reach the server`, { status: 0, method: init?.method || 'GET' })
      }
      throw err
    }
  }
}

export default function SiteAnalytics() {
  const pathname = usePathname()
  const last = useRef<string | null>(null)

  useEffect(() => {
    install()
  }, [])

  useEffect(() => {
    if (!pathname || last.current === pathname) return
    last.current = pathname
    trackPageView(pathname)
  }, [pathname])

  return null
}
