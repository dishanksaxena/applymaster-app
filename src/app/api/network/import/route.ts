import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { recordEvent } from '@/lib/track-server'

/**
 * Import LinkedIn connections the person exported themselves.
 *
 * The browser opens the LinkedIn archive, reads only Connections.csv, and
 * posts the parsed rows here in chunks (a large network is well past the
 * request-size limit in one go). Rows are written with the person's own
 * session, so row-level security scopes every write to their account.
 *
 * Re-importing is safe and useful: people are matched on their LinkedIn
 * profile URL, so a second import updates where each person works now
 * instead of duplicating them.
 */

export const maxDuration = 60

const MAX_PER_REQUEST = 1000
const clip = (v: unknown, n: number) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, n) : null)

type Incoming = {
  name?: string
  linkedin_url?: string | null
  email?: string | null
  company?: string | null
  title?: string | null
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Sign in to import your network' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const list: Incoming[] = Array.isArray(body?.connections) ? body.connections : []
  if (!list.length) return Response.json({ error: 'No connections in this file' }, { status: 400 })
  if (list.length > MAX_PER_REQUEST) {
    return Response.json({ error: `Send at most ${MAX_PER_REQUEST} connections per request` }, { status: 413 })
  }

  // Clean and de-duplicate within the chunk itself.
  const seen = new Set<string>()
  const rows = list
    .map(c => ({
      name: clip(c.name, 200),
      linkedin_url: clip(c.linkedin_url, 300),
      email: clip(c.email, 254)?.toLowerCase() ?? null,
      company: clip(c.company, 200),
      title: clip(c.title, 200),
    }))
    .filter(c => {
      if (!c.name) return false
      const k = c.linkedin_url ?? `${c.name}|${c.company ?? ''}`.toLowerCase()
      if (seen.has(k)) return false
      seen.add(k)
      return true
    })

  // Who is already in the network? Look up by profile URL, in slices small
  // enough to keep the query string short.
  const urls = rows.map(r => r.linkedin_url).filter(Boolean) as string[]
  const existing = new Map<string, { id: string; company: string | null; title: string | null }>()
  for (let i = 0; i < urls.length; i += 100) {
    const { data, error } = await supabase
      .from('network_connections')
      .select('id, linkedin_url, company, title')
      .eq('user_id', user.id)
      .in('linkedin_url', urls.slice(i, i + 100))
    if (error) return Response.json({ error: error.message }, { status: 500 })
    for (const d of data ?? []) existing.set(d.linkedin_url as string, d)
  }

  const toInsert = rows.filter(r => !r.linkedin_url || !existing.has(r.linkedin_url))
  const toUpdate = rows.filter(r => {
    const e = r.linkedin_url ? existing.get(r.linkedin_url) : undefined
    return e && (e.company !== r.company || e.title !== r.title)
  })

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
      can_refer: true,
    }))
    const { error } = await supabase.from('network_connections').insert(batch)
    if (error) return Response.json({ error: error.message, inserted }, { status: 500 })
    inserted += batch.length
  }

  // People change jobs; a re-import should know.
  let updated = 0
  for (let i = 0; i < toUpdate.length; i += 20) {
    await Promise.all(
      toUpdate.slice(i, i + 20).map(async r => {
        const e = existing.get(r.linkedin_url as string)!
        const { error } = await supabase
          .from('network_connections')
          .update({ company: r.company, title: r.title })
          .eq('id', e.id)
          .eq('user_id', user.id)
        if (!error) updated += 1
      })
    )
  }

  if (body?.final) {
    await recordEvent(
      'network_imported',
      { email: user.email ?? null, user_id: user.id, meta: { source: 'linkedin', total: body.total ?? null } },
      req.headers
    )
  }

  return Response.json({ inserted, updated, unchanged: rows.length - inserted - updated })
}
