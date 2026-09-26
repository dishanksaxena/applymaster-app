import { timingSafeEqual } from 'node:crypto'

/**
 * Vercel Cron sends `Authorization: Bearer $CRON_SECRET` when the variable is
 * set on the project. Fails closed: with no secret configured, nothing is
 * authorised. (The auto-apply cron used to fall back to a hardcoded default
 * committed to the repo, so a missing env var would have made its "secret"
 * public.)
 */
export function isCronRequest(req: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const got = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '')
  const a = Buffer.from(got)
  const b = Buffer.from(secret)
  return a.length === b.length && timingSafeEqual(a, b)
}
