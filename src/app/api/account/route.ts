import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { recordEvent } from '@/lib/track-server'

/**
 * Delete my account and everything in it.
 *
 * The site promised "one-click data deletion" and there was no way to do it
 * at all. Deletion on request is also a legal requirement (GDPR, India's
 * DPDP Act), not a courtesy.
 *
 * Deleting the auth user cascades through every table: profiles references
 * auth.users on delete cascade, and everything else references profiles or
 * auth.users the same way. Three things do not cascade and are removed
 * explicitly first: resume files in storage, tracking events, and support
 * messages (which only set user_id to null).
 *
 * Requires the person to type their own email address, so it cannot be
 * triggered by a stray click or a forged request.
 */
export async function DELETE(req: NextRequest) {
  const {
    data: { user },
  } = await createClient().auth.getUser()
  if (!user?.email) return Response.json({ error: 'Not signed in' }, { status: 401 })

  const { confirm } = await req.json().catch(() => ({}))
  if (typeof confirm !== 'string' || confirm.trim().toLowerCase() !== user.email.toLowerCase()) {
    return Response.json({ error: 'Type your email address exactly to confirm.' }, { status: 400 })
  }

  const admin = createAdminClient()
  const email = user.email.toLowerCase()

  // 1. Files. List is paged; loop until the folder is empty.
  for (let i = 0; i < 20; i++) {
    const { data: files, error } = await admin.storage.from('resumes').list(user.id, { limit: 1000 })
    if (error || !files?.length) break
    await admin.storage.from('resumes').remove(files.map(f => `${user.id}/${f.name}`))
  }
  // Photos of the people in their network.
  for (let i = 0; i < 50; i++) {
    const { data: files, error } = await admin.storage.from('contact-photos').list(user.id, { limit: 1000 })
    if (error || !files?.length) break
    await admin.storage.from('contact-photos').remove(files.map(f => `${user.id}/${f.name}`))
  }

  // 2. Rows that do not cascade. Missing tables are fine.
  await admin.from('app_events').delete().eq('user_id', user.id)
  await admin.from('app_events').delete().eq('email', email)
  await admin.from('support_messages').delete().eq('user_id', user.id)
  await admin.from('support_messages').delete().eq('email', email)

  // 3. The account, and with it every table that references it.
  const { error } = await admin.auth.admin.deleteUser(user.id)
  if (error) {
    console.error('account delete failed:', error.message)
    return Response.json({ error: 'We could not delete your account. Please contact support.' }, { status: 500 })
  }

  // Recorded without the email or id: the point was to forget them.
  await recordEvent('account_deleted', { meta: { at: new Date().toISOString() } }, req.headers)

  return Response.json({ ok: true })
}
