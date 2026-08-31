import type { AtsVendor } from './types'

/**
 * Which ATS a posting lives on, and where its application form is.
 *
 * The URL a job board hands you is often the employer's own careers page,
 * which redirects. Stripe's Greenhouse `absolute_url`, for instance, points
 * at stripe.com/jobs/search?gh_jid=... — the gh_jid is the real handle.
 */

const PATTERNS: { vendor: AtsVendor; test: RegExp }[] = [
  { vendor: 'greenhouse', test: /greenhouse\.io|gh_jid=/i },
  { vendor: 'lever', test: /lever\.co/i },
  { vendor: 'ashby', test: /ashbyhq\.com/i },
  { vendor: 'workday', test: /myworkdayjobs\.com|workday\.com/i },
]

export function detectVendor(url: string): AtsVendor {
  for (const p of PATTERNS) if (p.test.test(url)) return p.vendor
  return 'unknown'
}

/**
 * Rewrite to the canonical hosted form where we can.
 *
 * An employer careers page wraps the same Greenhouse form in their own
 * layout, sometimes in an iframe, sometimes behind a router. The hosted
 * job-boards.greenhouse.io version is the same form without the wrapper,
 * which is far more stable to drive.
 */
export function canonicalFormUrl(url: string, boardToken?: string | null): string {
  const ghJid = url.match(/gh_jid=(\d+)/)?.[1]
  if (ghJid && boardToken) return `https://job-boards.greenhouse.io/${boardToken}/jobs/${ghJid}`

  const hosted = url.match(/greenhouse\.io\/([^/]+)\/jobs\/(\d+)/)
  if (hosted) return `https://job-boards.greenhouse.io/${hosted[1]}/jobs/${hosted[2]}`

  return url
}
