import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase-server'

/**
 * Referral asks the user has made: list them, and move them along.
 *
 * A drafted message that is never tracked is just text. The value of the
 * table is knowing which asks went out, which came back, and which are
 * still waiting — that is what tells a job seeker where to spend the next
 * hour.
 */

const STATUSES = ['suggested', 'drafted', 'sent', 'accepted', 'declined', 'no_response']

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Not authenticated' }, { status: 401 })

  const { data, error } = await supabase
    .from('referral_requests')
    .select('*, connection:network_connections(id, name, company, title, email, linkedin_url)')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ requests: data ?? [] })
}

export async function PATCH(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Not authenticated' }, { status: 401 })

  const { id, status, message_sent } = await req.json()
  if (!id) return Response.json({ error: 'id required' }, { status: 400 })

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (status) {
    if (!STATUSES.includes(status)) return Response.json({ error: 'unknown status' }, { status: 400 })
    patch.status = status
    // Timestamps are set here rather than by the client so the record of
    // when something happened cannot drift from what happened.
    if (status === 'sent') patch.sent_at = new Date().toISOString()
    if (status === 'accepted' || status === 'declined') patch.responded_at = new Date().toISOString()
  }
  if (typeof message_sent === 'string') patch.message_sent = message_sent

  const { data, error } = await supabase
    .from('referral_requests')
    .update(patch)
    .eq('id', id)
    .eq('user_id', user.id)
    .select('*, connection:network_connections(id, name, company, title, email, linkedin_url)')
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  // Marking an ask as sent is also a contact event, which feeds the recency
  // bonus the next time this person is scored.
  if (status === 'sent' && data?.connection_id) {
    await supabase
      .from('network_connections')
      .update({ last_contacted_at: new Date().toISOString() })
      .eq('id', data.connection_id)
      .eq('user_id', user.id)
  }

  return Response.json({ request: data })
}

export async function DELETE(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Not authenticated' }, { status: 401 })

  const id = new URL(req.url).searchParams.get('id')
  if (!id) return Response.json({ error: 'id required' }, { status: 400 })

  const { error } = await supabase.from('referral_requests').delete().eq('id', id).eq('user_id', user.id)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}
