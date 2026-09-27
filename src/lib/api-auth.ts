import { createHash, randomBytes } from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'

/**
 * Who is calling: a signed-in browser, or the Chrome extension.
 *
 * The extension cannot share the web session — Supabase rotates refresh
 * tokens, and two holders of one would log each other out. It gets its own
 * key instead, minted on applymaster.ai/extension and stored here only as a
 * SHA-256 hash. Calls with that key read through the service role, so every
 * query made for an extension caller must filter on user.id itself.
 */

export type Caller = {
  db: SupabaseClient
  user: { id: string; email: string | null }
  via: 'session' | 'extension'
}

const PREFIX = 'amx_'

export const newExtensionToken = () => PREFIX + randomBytes(32).toString('base64url')
export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex')

export async function authenticate(req: Request): Promise<Caller | null> {
  const bearer = (req.headers.get('authorization') || '').match(/^Bearer\s+(amx_[A-Za-z0-9_-]{20,})$/)?.[1]
  if (bearer) {
    const admin = createAdminClient()
    const { data } = await admin
      .from('extension_tokens')
      .select('id, user_id, revoked_at, last_used_at')
      .eq('token_hash', hashToken(bearer))
      .maybeSingle()
    if (!data || data.revoked_at) return null
    const { data: found } = await admin.auth.admin.getUserById(data.user_id)
    if (!found?.user) return null
    // "Last used" on the connections list; a write every ten minutes is plenty.
    if (!data.last_used_at || Date.parse(data.last_used_at) < Date.now() - 600_000) {
      await admin.from('extension_tokens').update({ last_used_at: new Date().toISOString() }).eq('id', data.id)
    }
    return { db: admin, user: { id: found.user.id, email: found.user.email ?? null }, via: 'extension' }
  }

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  return { db: supabase, user: { id: user.id, email: user.email ?? null }, via: 'session' }
}

export const unauthorized = () =>
  Response.json({ error: 'Sign in to ApplyMaster, or reconnect the extension at applymaster.ai/extension' }, { status: 401 })
