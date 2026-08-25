import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase-server'

/**
 * The user's network: read, add, update, remove.
 *
 * Referral search is only as good as what is in here, and until now there was
 * no way to put anything in it from the product — the network page rendered a
 * fixed cast of invented contacts. An empty network needs to be a starting
 * point, not a dead end.
 */

const ALLOWED_RELATIONSHIPS = ['direct', 'second_degree', 'alumni', 'imported']

export async function GET() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Not authenticated' }, { status: 401 })

  const { data, error } = await supabase
    .from('network_connections')
    .select(
      'id, name, company, title, relationship, email, linkedin_url, seniority, can_refer, last_contacted_at, notes, created_at'
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ connections: data ?? [] })
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Not authenticated' }, { status: 401 })

  const body = await req.json()
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  if (!name) return Response.json({ error: 'A name is required' }, { status: 400 })

  const relationship = ALLOWED_RELATIONSHIPS.includes(body.relationship) ? body.relationship : 'direct'

  const { data, error } = await supabase
    .from('network_connections')
    .insert({
      user_id: user.id,
      name,
      company: body.company?.trim() || null,
      title: body.title?.trim() || null,
      email: body.email?.trim() || null,
      linkedin_url: body.linkedin_url?.trim() || null,
      seniority: body.seniority?.trim() || null,
      relationship,
      can_refer: body.can_refer === false ? false : true,
      notes: body.notes?.trim() || null,
    })
    .select(
      'id, name, company, title, relationship, email, linkedin_url, seniority, can_refer, last_contacted_at, notes, created_at'
    )
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ connection: data })
}

export async function PATCH(req: NextRequest) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Not authenticated' }, { status: 401 })

  const { id, ...rest } = await req.json()
  if (!id) return Response.json({ error: 'id required' }, { status: 400 })

  // Only fields the UI is allowed to change; RLS still scopes it to the owner.
  const patch: Record<string, unknown> = {}
  for (const k of ['name', 'company', 'title', 'email', 'linkedin_url', 'seniority', 'notes']) {
    if (k in rest) patch[k] = rest[k]?.trim?.() || null
  }
  if ('relationship' in rest && ALLOWED_RELATIONSHIPS.includes(rest.relationship)) {
    patch.relationship = rest.relationship
  }
  if ('can_refer' in rest) patch.can_refer = Boolean(rest.can_refer)
  if ('last_contacted_at' in rest) patch.last_contacted_at = rest.last_contacted_at

  const { data, error } = await supabase
    .from('network_connections')
    .update(patch)
    .eq('id', id)
    .eq('user_id', user.id)
    .select(
      'id, name, company, title, relationship, email, linkedin_url, seniority, can_refer, last_contacted_at, notes, created_at'
    )
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ connection: data })
}

export async function DELETE(req: NextRequest) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Not authenticated' }, { status: 401 })

  const id = new URL(req.url).searchParams.get('id')
  if (!id) return Response.json({ error: 'id required' }, { status: 400 })

  const { error } = await supabase.from('network_connections').delete().eq('id', id).eq('user_id', user.id)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}
