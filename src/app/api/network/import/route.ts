import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { recordEvent } from '@/lib/track-server'

/**
 * Import LinkedIn connections the person exported themselves.
 *
 * The browser opens the LinkedIn archive, reads the files the person chose,
 * and posts parsed rows here in chunks. What arrives per person is their
 * name, company, title, profile URL and — if chosen — a message count, the
 * date of the last message, and an endorsement count. Message text never
 * arrives; it never leaves the browser.
 *
 * Rows are written with the person's own session, so row-level security
 * scopes every write to their account. People are matched on profile URL, so
 * a re-import refreshes jobs and signals instead of duplicating anyone.
 */

export const maxDuration = 60

const MAX_PER_REQUEST = 1000
const clip = (v: unknown, n: number) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, n) : null)
const int = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? Math.min(Math.floor(v), 1_000_000) : 0)
const isoOrNull = (v: unknown) => {
  if (typeof v !== 'string') return null
  const d = new Date(v)
  return isNaN(d.getTime()) ? null : d.toISOString()
}
const dateOrNull = (v: unknown) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null)

type Incoming = {
  name?: string
  linkedin_url?: string | null
  email?: string | null
  company?: string | null
  title?: string | null
  message_count?: number
  last_message_at?: string | null
  endorsed_you?: number
  connected_on?: string | null
}

type Existing = {
  id: string
  company: string | null
  title: string | null
  message_count: number | null
  endorsed_you: number | null
  last_contacted_at: string | null
  connected_on: string | null
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Sign in to import your network' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const list: Incoming[] = Array.isArray(body?.connections) ? body.connections : []
  if (!list.length && !Array.isArray(body?.skills)) {
    return Response.json({ error: 'No connections in this file' }, { status: 400 })
  }
  if (list.length > MAX_PER_REQUEST) {
    return Response.json({ error: `Send at most ${MAX_PER_REQUEST} connections per request` }, { status: 413 })
  }

  const seen = new Set<string>()
  const rows = list
    .map(c => ({
      name: clip(c.name, 200),
      linkedin_url: clip(c.linkedin_url, 300),
      email: clip(c.email, 254)?.toLowerCase() ?? null,
      company: clip(c.company, 200),
      title: clip(c.title, 200),
      message_count: int(c.message_count),
      last_contacted_at: isoOrNull(c.last_message_at),
      endorsed_you: int(c.endorsed_you),
      connected_on: dateOrNull(c.connected_on),
    }))
    .filter(c => {
      if (!c.name) return false
      const k = c.linkedin_url ?? `${c.name}|${c.company ?? ''}`.toLowerCase()
      if (seen.has(k)) return false
      seen.add(k)
      return true
    })

  const urls = rows.map(r => r.linkedin_url).filter(Boolean) as string[]
  const existing = new Map<string, Existing>()
  for (let i = 0; i < urls.length; i += 100) {
    const { data, error } = await supabase
      .from('network_connections')
      .select('id, linkedin_url, company, title, message_count, endorsed_you, last_contacted_at, connected_on')
      .eq('user_id', user.id)
      .in('linkedin_url', urls.slice(i, i + 100))
    if (error) return Response.json({ error: error.message }, { status: 500 })
    for (const d of data ?? []) existing.set(d.linkedin_url as string, d as Existing)
  }

  const toInsert = rows.filter(r => !r.linkedin_url || !existing.has(r.linkedin_url))

  // For people already here: refresh their job, and the signals from this
  // archive. The most recent contact date wins, whichever side has it.
  const updates: { id: string; patch: Record<string, unknown>; jobChanged: boolean }[] = []
  for (const r of rows) {
    const e = r.linkedin_url ? existing.get(r.linkedin_url) : undefined
    if (!e) continue
    const patch: Record<string, unknown> = {}
    if (e.company !== r.company) patch.company = r.company
    if (e.title !== r.title) patch.title = r.title
    if (r.message_count && r.message_count !== (e.message_count ?? 0)) patch.message_count = r.message_count
    if (r.endorsed_you && r.endorsed_you !== (e.endorsed_you ?? 0)) patch.endorsed_you = r.endorsed_you
    if (r.last_contacted_at && (!e.last_contacted_at || r.last_contacted_at > e.last_contacted_at)) {
      patch.last_contacted_at = r.last_contacted_at
    }
    if (r.connected_on && !e.connected_on) patch.connected_on = r.connected_on
    if (Object.keys(patch).length) updates.push({ id: e.id, patch, jobChanged: 'company' in patch || 'title' in patch })
  }

  let inserted = 0
  for (let i = 0; i < toInsert.length; i += 500) {
    const batch = toInsert.slice(i, i + 500).map(r => ({
      user_id: user.id,
      name: r.name,
      linkedin_url: r.linkedin_url,
      email: r.email,
      company: r.company,
      title: r.title,
      relationship: 'linkedin',
      source: 'linkedin',
      can_refer: true,
      message_count: r.message_count,
      last_contacted_at: r.last_contacted_at,
      endorsed_you: r.endorsed_you,
      connected_on: r.connected_on,
    }))
    const { error } = await supabase.from('network_connections').insert(batch)
    if (error) return Response.json({ error: error.message, inserted }, { status: 500 })
    inserted += batch.length
  }

  let updated = 0
  for (let i = 0; i < updates.length; i += 20) {
    await Promise.all(
      updates.slice(i, i + 20).map(async u => {
        const { error } = await supabase.from('network_connections').update(u.patch).eq('id', u.id).eq('user_id', user.id)
        if (!error && u.jobChanged) updated += 1
      })
    )
  }

  // LinkedIn skills join the ones daily matching scores against.
  let skillsAdded = 0
  if (Array.isArray(body?.skills) && body.skills.length) {
    const incoming = (body.skills as unknown[]).map(s => clip(s, 80)).filter(Boolean) as string[]
    const { data: prefs } = await supabase.from('job_preferences').select('id, key_skills').eq('user_id', user.id).maybeSingle()
    if (prefs) {
      const current: string[] = Array.isArray(prefs.key_skills) ? prefs.key_skills : []
      const have = new Set(current.map(s => s.toLowerCase()))
      const add = incoming.filter(s => !have.has(s.toLowerCase())).slice(0, 100)
      if (add.length) {
        await supabase.from('job_preferences').update({ key_skills: [...current, ...add] }).eq('id', prefs.id)
        skillsAdded = add.length
      }
    }
  }

  if (body?.final) {
    await recordEvent(
      'network_imported',
      { email: user.email ?? null, user_id: user.id, meta: { source: 'linkedin', total: body.total ?? null, signals: body.signals ?? null } },
      req.headers
    )
  }

  return Response.json({ inserted, updated, unchanged: rows.length - inserted - updated, skillsAdded })
}
