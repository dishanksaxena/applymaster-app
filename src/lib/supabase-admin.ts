import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Service-role client. Server only — it bypasses row-level security, so it
 * must never be imported into anything that ships to the browser.
 *
 * Used for writes the visitor is not allowed to make themselves (tracking a
 * failed sign-in for someone who has no session) and for the admin views.
 */
let cached: SupabaseClient | null = null

export function createAdminClient(): SupabaseClient {
  if (typeof window !== 'undefined') {
    throw new Error('createAdminClient must only be used on the server')
  }
  if (cached) return cached
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase service role is not configured')
  cached = createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return cached
}

/** Emails that can open /admin. Comma-separated ADMIN_EMAILS overrides the default. */
export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || 'dishanksaxenapro@gmail.com')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean)
}

export const isAdminEmail = (email?: string | null) =>
  Boolean(email && adminEmails().includes(email.toLowerCase()))

/** PostgREST / Postgres codes meaning "that table does not exist yet". */
export const isMissingTable = (err: { code?: string; message?: string } | null | undefined) =>
  Boolean(
    err &&
      (err.code === 'PGRST205' ||
        err.code === '42P01' ||
        /could not find the table|does not exist/i.test(err.message || ''))
  )
