import { NextRequest } from 'next/server'
import { getAdmin } from '@/lib/admin-data'
import { createAdminClient } from '@/lib/supabase-admin'

/** Change a support message's status. Admin only — checked here, not trusted from the page. */
export async function PATCH(req: NextRequest) {
  const admin = await getAdmin()
  if (!admin) return Response.json({ error: 'Not found' }, { status: 404 })

  const { id, status, admin_note } = await req.json().catch(() => ({}))
  if (!id || !['open', 'replied', 'resolved'].includes(status)) {
    return Response.json({ error: 'id and a valid status are required' }, { status: 400 })
  }

  const { error } = await createAdminClient()
    .from('support_messages')
    .update({
      status,
      resolved_at: status === 'resolved' ? new Date().toISOString() : null,
      ...(typeof admin_note === 'string' ? { admin_note: admin_note.slice(0, 2000) } : {}),
    })
    .eq('id', id)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}
