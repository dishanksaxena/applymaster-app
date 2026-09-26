import { NextRequest } from 'next/server'
import { getAdmin } from '@/lib/admin-data'
import { createAdminClient } from '@/lib/supabase-admin'
import { recordEvent } from '@/lib/track-server'

/**
 * Re-send the sign-up confirmation email for someone stuck at "check your
 * inbox". Admin only.
 */
export async function POST(req: NextRequest) {
  const admin = await getAdmin()
  if (!admin) return Response.json({ error: 'Not found' }, { status: 404 })

  const { email } = await req.json().catch(() => ({}))
  if (typeof email !== 'string' || !email.includes('@')) {
    return Response.json({ error: 'email required' }, { status: 400 })
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin
  const { error } = await createAdminClient().auth.resend({
    type: 'signup',
    email,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  })

  await recordEvent(
    error ? 'confirm_resend_failed' : 'confirm_resend',
    { email, error_message: error?.message ?? null, meta: { by: 'admin' } },
    req.headers
  )

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}
