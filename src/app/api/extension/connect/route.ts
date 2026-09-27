import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createAdminClient, isMissingTable } from '@/lib/supabase-admin'
import { hashToken, newExtensionToken } from '@/lib/api-auth'

/**
 * Connecting the Chrome extension to an account.
 *
 * POST mints a key for one browser and returns it once; the page hands it to
 * the extension and it is never shown again. GET lists connected browsers;
 * DELETE ?id= disconnects one. All three need the web session: an extension
 * key cannot mint more keys.
 */

async function sessionUser() {
  const {
    data: { user },
  } = await createClient().auth.getUser()
  return user
}

const notReady = () =>
  Response.json({ error: 'Extension connections are not set up yet (database migration pending).' }, { status: 503 })

export async function POST(req: NextRequest) {
  const user = await sessionUser()
  if (!user) return Response.json({ error: 'Sign in first' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const label = typeof body.label === 'string' && body.label.trim() ? body.label.trim().slice(0, 80) : 'Chrome'

  const admin = createAdminClient()
  // One live connection per label: reconnecting the same browser replaces its old key.
  await admin
    .from('extension_tokens')
    .update({ revoked_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .eq('label', label)
    .is('revoked_at', null)
  const token = newExtensionToken()
  const { error } = await admin.from('extension_tokens').insert({ user_id: user.id, token_hash: hashToken(token), label })
  if (error) return isMissingTable(error) ? notReady() : Response.json({ error: error.message }, { status: 500 })
  return Response.json({ token, email: user.email })
}

export async function GET() {
  const user = await sessionUser()
  if (!user) return Response.json({ error: 'Sign in first' }, { status: 401 })
  const { data, error } = await createAdminClient()
    .from('extension_tokens')
    .select('id, label, created_at, last_used_at')
    .eq('user_id', user.id)
    .is('revoked_at', null)
    .order('created_at', { ascending: false })
  if (error) return isMissingTable(error) ? Response.json({ connections: [], ready: false }) : Response.json({ error: error.message }, { status: 500 })
  return Response.json({ connections: data ?? [], ready: true })
}

export async function DELETE(req: NextRequest) {
  const user = await sessionUser()
  if (!user) return Response.json({ error: 'Sign in first' }, { status: 401 })
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return Response.json({ error: 'Which connection?' }, { status: 400 })
  await createAdminClient()
    .from('extension_tokens')
    .update({ revoked_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .eq('id', id)
  return Response.json({ ok: true })
}
