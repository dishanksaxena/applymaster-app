import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'

/**
 * Profile photos for people in someone's network.
 *
 * A LinkedIn archive has no photos — only each person's profile link. For
 * the people someone is looking at, this asks unavatar for the photo on that
 * LinkedIn profile, stores it in the contact-photos bucket, and remembers the
 * answer, so each person is looked up (and paid for) once.
 *
 * Costs money per lookup with UNAVATAR_API_KEY set; without it unavatar's
 * free allowance applies (25 a day). Either way a person gets at most
 * DAILY_CAP new lookups a day, and only for contacts they own.
 */

export const maxDuration = 60

const PER_REQUEST = 16
const DAILY_CAP = 300
const BUCKET = 'contact-photos'
const MAX_BYTES = 2 * 1024 * 1024

type Row = { id: string; linkedin_url: string | null; photo_url: string | null; photo_checked_at: string | null }

const slugOf = (url: string | null) => url?.match(/linkedin\.com\/in\/([^/?#\s]+)/i)?.[1] ?? null
const EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' }

type Outcome = { photo: string | null; checked: boolean; limited?: boolean }

async function lookup(slug: string): Promise<{ bytes: ArrayBuffer; type: string } | 'none' | 'limited' | 'error'> {
  const key = process.env.UNAVATAR_API_KEY
  try {
    const res = await fetch(`https://unavatar.io/linkedin/user:${encodeURIComponent(slug)}?fallback=false`, {
      headers: key ? { 'x-api-key': key } : {},
      signal: AbortSignal.timeout(12_000),
    })
    if (res.status === 404) return 'none'
    if (res.status === 429 || res.status === 402) return 'limited'
    if (!res.ok) return 'error'
    const type = (res.headers.get('content-type') || '').split(';')[0].trim()
    if (!EXT[type]) return 'error'
    const bytes = await res.arrayBuffer()
    if (!bytes.byteLength || bytes.byteLength > MAX_BYTES) return 'error'
    return { bytes, type }
  } catch {
    return 'error'
  }
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Not authenticated' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const ids: string[] = (Array.isArray(body.ids) ? body.ids : []).filter((x: unknown) => typeof x === 'string').slice(0, 100)
  const urls: string[] = (Array.isArray(body.linkedin_urls) ? body.linkedin_urls : [])
    .filter((x: unknown) => typeof x === 'string' && x.includes('linkedin.com/in/'))
    .slice(0, 100)
  if (!ids.length && !urls.length) return Response.json({ photos: {} })

  // The person's own rows only: RLS scopes these reads to them.
  const rows: Row[] = []
  const cols = 'id, linkedin_url, photo_url, photo_checked_at'
  if (ids.length) {
    const { data, error } = await supabase.from('network_connections').select(cols).eq('user_id', user.id).in('id', ids)
    if (error) return Response.json({ error: error.message }, { status: 500 })
    rows.push(...((data ?? []) as Row[]))
  }
  if (urls.length) {
    const { data, error } = await supabase.from('network_connections').select(cols).eq('user_id', user.id).in('linkedin_url', urls)
    if (error) return Response.json({ error: error.message }, { status: 500 })
    for (const r of (data ?? []) as Row[]) if (!rows.some(x => x.id === r.id)) rows.push(r)
  }

  const since = new Date(Date.now() - 86_400_000).toISOString()
  const { count } = await supabase
    .from('network_connections')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('photo_checked_at', since)
  const allowance = Math.max(0, DAILY_CAP - (count ?? 0))

  const todo = rows.filter(r => !r.photo_checked_at && slugOf(r.linkedin_url)).slice(0, Math.min(PER_REQUEST, allowance))
  const admin = createAdminClient()
  const results = new Map<string, Outcome>()
  let limited = false

  // Four at a time; stop starting new lookups once the service says no.
  const queue = [...todo]
  await Promise.all(
    Array.from({ length: 4 }, async () => {
      for (let r = queue.shift(); r; r = queue.shift()) {
        if (limited) break
        const got = await lookup(slugOf(r.linkedin_url)!)
        if (got === 'limited') {
          limited = true
          break
        }
        if (got === 'error') continue // not an answer: try again another time
        const now = new Date().toISOString()
        if (got === 'none') {
          await supabase.from('network_connections').update({ photo_checked_at: now }).eq('id', r.id).eq('user_id', user.id)
          results.set(r.id, { photo: null, checked: true })
          continue
        }
        const path = `${user.id}/${r.id}-${crypto.randomUUID().slice(0, 8)}.${EXT[got.type]}`
        const up = await admin.storage.from(BUCKET).upload(path, got.bytes, { contentType: got.type, upsert: true })
        if (up.error) continue
        const photo = admin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
        await supabase.from('network_connections').update({ photo_url: photo, photo_checked_at: now }).eq('id', r.id).eq('user_id', user.id)
        results.set(r.id, { photo, checked: true })
      }
    })
  )

  const photos: Record<string, string | null> = {}
  const byUrl: Record<string, string | null> = {}
  for (const r of rows) {
    const out = results.get(r.id)
    const photo = out ? out.photo : r.photo_url
    const done = out?.checked || !!r.photo_checked_at
    if (!done) continue
    photos[r.id] = photo
    if (r.linkedin_url) byUrl[r.linkedin_url] = photo
  }
  const pending = rows.filter(r => !photos.hasOwnProperty(r.id) && slugOf(r.linkedin_url)).length
  return Response.json({ photos, byUrl, pending, limited, capped: allowance === 0 })
}
