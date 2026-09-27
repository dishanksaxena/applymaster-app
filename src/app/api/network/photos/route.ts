import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'

/**
 * Profile photos for people in someone's network.
 *
 * A LinkedIn archive has no photos — only each person's profile link. For
 * the people someone is looking at, this reads the photo from that public
 * LinkedIn profile page (its og:image), stores it in the contact-photos
 * bucket, and remembers the answer, so each person is looked up once.
 *
 * When LinkedIn declines the request (status 999, or a sign-in wall), it
 * falls back to unavatar, which costs money per lookup with UNAVATAR_API_KEY
 * set and allows 25 a day without. Either way a person gets at most
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

type Outcome = { photo: string | null; checked: boolean }
type Found = { bytes: ArrayBuffer; type: string }
type Source = 'linkedin' | 'service'

// Says who is asking; no disguise.
const AGENT = 'ApplyMaster/1.0 (+https://applymaster.ai)'

async function image(url: string, headers: Record<string, string> = {}): Promise<Found | 'error'> {
  try {
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(10_000) })
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

const OG_IMAGE = /property="og:image"\s+content="([^"]+)"/

/** The start of a page, up to its <head> closing — profile pages run to 800 KB. */
async function readHead(res: Response, limit = 400_000) {
  const reader = res.body?.getReader()
  if (!reader) return ''
  const dec = new TextDecoder()
  let text = ''
  while (text.length < limit) {
    const { done, value } = await reader.read()
    if (done) break
    text += dec.decode(value, { stream: true })
    if (text.includes('</head>') || OG_IMAGE.test(text)) break
  }
  reader.cancel().catch(() => {})
  return text
}

/**
 * The photo on a public LinkedIn profile. 'unavailable' when LinkedIn will
 * not show the page to us; 'none' when the page is there with no photo.
 */
async function fromLinkedIn(slug: string): Promise<Found | 'none' | 'unavailable'> {
  try {
    const page = () =>
      fetch(`https://www.linkedin.com/in/${encodeURIComponent(slug)}`, {
        headers: { 'User-Agent': AGENT, 'Accept-Language': 'en' },
        signal: AbortSignal.timeout(10_000),
      })
    let res = await page()
    // 999 means private — or "not so fast". A second try after a pause tells them apart.
    if (res.status === 999) {
      res.body?.cancel().catch(() => {})
      await new Promise(r => setTimeout(r, 1500))
      res = await page()
    }
    if (!res.ok || /authwall|\/login|checkpoint/.test(res.url)) {
      res.body?.cancel().catch(() => {})
      return 'unavailable'
    }
    const og = (await readHead(res)).match(OG_IMAGE)?.[1]?.replace(/&amp;/g, '&')
    if (!og) return 'unavailable'
    // Anything but an uploaded profile photo is LinkedIn's default silhouette.
    if (!og.startsWith('https://media.licdn.com/dms/image/') || !og.includes('profile-displayphoto')) return 'none'
    const img = await image(og)
    return img === 'error' ? 'unavailable' : img
  } catch {
    return 'unavailable'
  }
}

/** unavatar: the fallback when LinkedIn declines. Paid with a key. */
async function fromService(slug: string): Promise<Found | 'none' | 'limited' | 'error'> {
  const key = process.env.UNAVATAR_API_KEY
  try {
    const res = await fetch(`https://unavatar.io/linkedin/user:${encodeURIComponent(slug)}?fallback=false`, {
      headers: key ? { 'x-api-key': key } : {},
      signal: AbortSignal.timeout(12_000),
    })
    if (res.status === 404) return 'none'
    // Out of lookups, or a missing/expired key: the service is off for this batch.
    if ([401, 402, 403, 429].includes(res.status)) return 'limited'
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

/**
 * LinkedIn first, the service when LinkedIn will not show the profile.
 * 'hidden' means neither could see a photo: the profile or its photo is
 * visible to connections only. 'error' is a hiccup worth retrying soon.
 */
async function lookup(
  slug: string,
  service: { off: boolean }
): Promise<{ answer: Found | 'none' | 'hidden' | 'error'; source: Source }> {
  const direct = await fromLinkedIn(slug)
  if (direct !== 'unavailable') return { answer: direct, source: 'linkedin' }
  if (service.off) return { answer: 'hidden', source: 'service' }
  const got = await fromService(slug)
  if (got === 'limited') {
    // Out of lookups for today. Keep going with LinkedIn for everyone else.
    service.off = true
    return { answer: 'hidden', source: 'service' }
  }
  return { answer: got, source: 'service' }
}

/**
 * Someone with no photo is looked at again after a week: they may make it
 * public, or a paid key may have been added since.
 */
const RECHECK_MS = 7 * 86_400_000
const due = (r: Row) =>
  !r.photo_url && (!r.photo_checked_at || Date.parse(r.photo_checked_at) < Date.now() - RECHECK_MS)

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

  const todo = rows.filter(r => due(r) && slugOf(r.linkedin_url)).slice(0, Math.min(PER_REQUEST, allowance))
  const admin = createAdminClient()
  const results = new Map<string, Outcome>()
  const service = { off: false }
  const sources: Record<Source, number> = { linkedin: 0, service: 0 }
  let hidden = 0

  // Two at a time: LinkedIn turns bursts away with the same 999 it uses for private profiles.
  const queue = [...todo]
  await Promise.all(
    Array.from({ length: 2 }, async () => {
      for (let r = queue.shift(); r; r = queue.shift()) {
        const { answer: got, source } = await lookup(slugOf(r.linkedin_url)!, service)
        if (got === 'error') continue // not an answer: try again another time
        const now = new Date().toISOString()
        if (got === 'none' || got === 'hidden') {
          if (got === 'hidden') hidden += 1
          // A silhouette on a public page is a real answer: look again in a week. A 999
          // may have been LinkedIn slowing us down, so date it for a look tomorrow.
          const checked = got === 'none' ? now : new Date(Date.now() - RECHECK_MS + 86_400_000).toISOString()
          await supabase.from('network_connections').update({ photo_checked_at: checked }).eq('id', r.id).eq('user_id', user.id)
          results.set(r.id, { photo: null, checked: true })
          continue
        }
        const path = `${user.id}/${r.id}-${crypto.randomUUID().slice(0, 8)}.${EXT[got.type]}`
        const up = await admin.storage.from(BUCKET).upload(path, got.bytes, { contentType: got.type, upsert: true })
        if (up.error) continue
        const photo = admin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
        await supabase.from('network_connections').update({ photo_url: photo, photo_checked_at: now }).eq('id', r.id).eq('user_id', user.id)
        results.set(r.id, { photo, checked: true })
        sources[source] += 1
      }
    })
  )

  const photos: Record<string, string | null> = {}
  const byUrl: Record<string, string | null> = {}
  for (const r of rows) {
    const out = results.get(r.id)
    if (!out && due(r)) continue // still unanswered
    const photo = out ? out.photo : r.photo_url
    photos[r.id] = photo
    if (r.linkedin_url) byUrl[r.linkedin_url] = photo
  }
  const pending = rows.filter(r => !photos.hasOwnProperty(r.id) && slugOf(r.linkedin_url)).length
  return Response.json({ photos, byUrl, pending, capped: allowance === 0, serviceOff: service.off, hidden, sources })
}
