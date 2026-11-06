import 'server-only'
import { unstable_cache } from 'next/cache'
import { BOARD_SOURCES, sourceBySlug, type BoardSource } from './job-boards'

/**
 * Public job pages (/companies/...): live openings from employers' own job
 * boards on Greenhouse and Lever, read through their public APIs and cached
 * for a day. Nothing is stored: a job that closes disappears from its
 * board, so its page answers 404 at the next refresh.
 *
 * Descriptions are never injected as HTML: they are reduced to headings,
 * paragraphs and list items, which the page renders itself.
 */

export const BOARDS = BOARD_SOURCES.map(b => b.slug)
const REVALIDATE = 24 * 3600 // daily; see the page files

export type ListedJob = {
  id: string
  title: string
  location: string
  url: string
  updated: string
  published: string | null
  deadline: string | null
}

export type Block = { type: 'h'; text: string } | { type: 'p'; text: string } | { type: 'ul'; items: string[] }

export type JobDetail = ListedJob & {
  company: string
  board: string
  departments: string[]
  blocks: Block[]
  /** Where the employer takes the application, for the copy on the page. */
  ats: 'Greenhouse' | 'Lever'
}

export const isBoard = (slug: string) => !!sourceBySlug(slug)
export const companyName = (slug: string) => sourceBySlug(slug)?.name ?? slug

export const slugify = (s: string) =>
  s
    .normalize('NFKD') // before lowercasing: NFKD turns "™" into "TM"
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 70)

export const jobPath = (board: string, j: { id: string; title: string }) => `/companies/${board}/jobs/${j.id}-${slugify(j.title)}`

/** The job id at the start of the address: a number (Greenhouse) or a UUID (Lever). */
export function idFromParam(p: string): string | null {
  const uuid = p.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)
  if (uuid) return uuid[0].toLowerCase()
  const n = p.match(/^\d+/)
  return n ? n[0] : null
}

const byNewest = (a: ListedJob, b: ListedJob) => (b.published ?? b.updated).localeCompare(a.published ?? a.updated)

/* ── Greenhouse ─────────────────────────────────────────────────────── */

const GH = 'https://boards-api.greenhouse.io/v1/boards'
type GhJob = {
  id: number
  title: string
  absolute_url: string
  location?: { name?: string }
  updated_at: string
  first_published?: string | null
  application_deadline?: string | null
  content?: string
  departments?: { name: string }[]
}
const ghListed = (j: GhJob): ListedJob => ({
  id: String(j.id),
  title: j.title.trim(),
  location: (j.location?.name || '').trim(),
  url: j.absolute_url,
  updated: j.updated_at,
  published: j.first_published ?? null,
  deadline: j.application_deadline ?? null,
})

async function ghBoard(src: BoardSource) {
  const res = await fetch(`${GH}/${src.token}/jobs`, { next: { revalidate: REVALIDATE } })
  if (!res.ok) return null
  return (((await res.json()) as { jobs?: GhJob[] }).jobs ?? []).map(ghListed)
}

async function ghJob(src: BoardSource, id: string): Promise<JobDetail | null> {
  if (!/^\d+$/.test(id)) return null
  const res = await fetch(`${GH}/${src.token}/jobs/${id}`, { next: { revalidate: REVALIDATE } })
  if (!res.ok) return null
  const j = (await res.json()) as GhJob
  return {
    ...ghListed(j),
    board: src.slug,
    company: src.name,
    ats: 'Greenhouse',
    // Some boards prefix department names with an internal code ("6532 Benefits").
    departments: (j.departments ?? []).map(d => d.name.replace(/^\d+\s+/, '').trim()).filter(Boolean),
    blocks: toBlocks(j.content ?? ''),
  }
}

/* ── Lever ──────────────────────────────────────────────────────────── */

const LEVER = 'https://api.lever.co/v0/postings'
type LeverJob = {
  id: string
  text: string
  hostedUrl: string
  createdAt: number
  workplaceType?: string
  country?: string
  categories?: { location?: string; allLocations?: string[]; team?: string; department?: string; commitment?: string }
  description?: string
  lists?: { text: string; content: string }[]
  additional?: string
}
function leverLocation(j: LeverJob) {
  const places = j.categories?.allLocations?.length ? j.categories.allLocations : j.categories?.location ? [j.categories.location] : []
  const where = places.join('; ')
  // Lever marks remote roles separately; keep it in the text the location parser reads.
  if (j.workplaceType === 'remote' && !/remote/i.test(where)) return `Remote${j.country ? ` - ${j.country}` : ''}${where ? `; ${where}` : ''}`
  return where
}
const leverListed = (j: LeverJob): ListedJob => {
  const when = new Date(j.createdAt).toISOString()
  return { id: j.id, title: j.text.trim(), location: leverLocation(j), url: j.hostedUrl, updated: when, published: when, deadline: null }
}

async function leverBoard(src: BoardSource) {
  // Pages of 100 keep each cached response well under the 2 MB cache limit.
  const all: LeverJob[] = []
  for (let skip = 0; skip < 3000; skip += 100) {
    const res = await fetch(`${LEVER}/${src.token}?mode=json&skip=${skip}&limit=100`, { next: { revalidate: REVALIDATE } })
    if (!res.ok) return all.length ? all.map(leverListed) : null
    const page = (await res.json()) as LeverJob[]
    all.push(...page)
    if (page.length < 100) break
  }
  return all.map(leverListed)
}

async function leverJob(src: BoardSource, id: string): Promise<JobDetail | null> {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null
  const res = await fetch(`${LEVER}/${src.token}/${id}?mode=json`, { next: { revalidate: REVALIDATE } })
  if (!res.ok) return null
  const j = (await res.json()) as LeverJob
  const html = `${j.description ?? ''}${(j.lists ?? []).map(l => `<h3>${l.text}</h3><ul>${l.content}</ul>`).join('')}${j.additional ?? ''}`
  return {
    ...leverListed(j),
    board: src.slug,
    company: src.name,
    ats: 'Lever',
    departments: [j.categories?.team, j.categories?.department].filter((d): d is string => !!d && d.trim().length > 0),
    blocks: toBlocks(html),
  }
}

/* ── Either ─────────────────────────────────────────────────────────── */

/** Every open role on one board, newest first. Null when the board cannot be read. */
export async function getBoardJobs(slug: string): Promise<ListedJob[] | null> {
  const src = sourceBySlug(slug)
  if (!src) return null
  try {
    const jobs = src.ats === 'lever' ? await leverBoard(src) : await ghBoard(src)
    return jobs ? jobs.sort(byNewest) : null
  } catch {
    return null
  }
}

/**
 * The newest dozen roles on a board, as a small cached list. Job pages show
 * "More jobs at …" from this instead of reading the whole board (up to
 * ~1.7 MB for SpaceX) on every render, which was most of the cache traffic.
 */
export const boardSummary = unstable_cache(
  async (slug: string) => ((await getBoardJobs(slug)) ?? []).slice(0, 13).map(j => ({ id: j.id, title: j.title, location: j.location })),
  ['board-summary-v1'],
  { revalidate: REVALIDATE }
)

export async function getAllBoards() {
  const rows = await Promise.all(BOARD_SOURCES.map(async b => ({ board: b.slug, company: b.name, ats: b.ats, jobs: (await getBoardJobs(b.slug)) ?? [] })))
  return rows.filter(r => r.jobs.length > 0)
}

export async function getJob(slug: string, id: string): Promise<JobDetail | null> {
  const src = sourceBySlug(slug)
  if (!src) return null
  try {
    return src.ats === 'lever' ? await leverJob(src, id) : await ghJob(src, id)
  } catch {
    return null
  }
}

/* ── Description: escaped HTML → headings, paragraphs, lists ───────────── */

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#39': "'", rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”', mdash: '—', ndash: '–', hellip: '…', bull: '•' }
const decode = (s: string) =>
  s.replace(/&(#\d+|#x[0-9a-f]+|[a-z0-9]+);/gi, (m, e: string) => {
    if (e[0] === '#') {
      const n = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)
      return Number.isFinite(n) ? String.fromCodePoint(n) : m
    }
    return ENTITIES[e.toLowerCase()] ?? m
  })

const clean = (s: string) => decode(s.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()

export function toBlocks(escaped: string): Block[] {
  // The API escapes the HTML once; decoding once gives the real markup.
  const html = decode(escaped).replace(/<(script|style|iframe|noscript)[\s\S]*?<\/\1>/gi, '')
  const blocks: Block[] = []
  const re = /<(h[1-6]|p|li|ul|ol|div|br)\b[^>]*>([\s\S]*?)(?=<\/?(?:h[1-6]|p|li|ul|ol|div)\b|$)/gi
  let list: string[] | null = null
  const flushList = () => {
    if (list && list.length) blocks.push({ type: 'ul', items: list })
    list = null
  }
  let m: RegExpExecArray | null
  while ((m = re.exec(html))) {
    const tag = m[1].toLowerCase()
    const text = clean(m[2])
    if (tag === 'li') {
      if (text) (list ??= []).push(text)
      continue
    }
    if (tag === 'ul' || tag === 'ol') continue
    flushList()
    if (!text) continue
    if (tag.startsWith('h')) blocks.push({ type: 'h', text })
    else blocks.push({ type: 'p', text })
  }
  flushList()
  // Descriptions with no block markup at all: keep the text as one paragraph.
  if (!blocks.length) {
    const t = clean(html)
    if (t) blocks.push({ type: 'p', text: t })
  }
  // A paragraph that is only bold text reads as a heading; one that is only an internal code ("SLSQ427R938") goes.
  return blocks
    .filter(b => !(b.type === 'p' && /^[A-Z0-9][A-Z0-9_-]{5,}$/.test(b.text) && /\d/.test(b.text)))
    .map(b => (b.type === 'p' && b.text.length < 60 && /:$/.test(b.text) ? { type: 'h', text: b.text.replace(/:$/, '') } : b))
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
export const blocksToHtml = (blocks: Block[]) =>
  blocks.map(b => (b.type === 'ul' ? `<ul>${b.items.map(i => `<li>${esc(i)}</li>`).join('')}</ul>` : b.type === 'h' ? `<h3>${esc(b.text)}</h3>` : `<p>${esc(b.text)}</p>`)).join('')
export const blocksToText = (blocks: Block[]) => blocks.map(b => (b.type === 'ul' ? b.items.map(i => `- ${i}`).join('\n') : b.text)).join('\n')


import { parseLocation, type Where } from './job-location'
export { parseLocation, type Where }
/** Whether a job page renders JobPosting markup: only when its location can be stated honestly. */
export function hasJobPostingSchema(location: string) {
  const where = parseLocation(location)
  return where.places.some(p => p.country) || (where.remote && where.countries.length > 0)
}

/** Google JobPosting structured data, or null when the location cannot be stated honestly. */
export function jobPostingSchema(job: JobDetail, pageUrl: string) {
  if (!hasJobPostingSchema(job.location)) return null
  const where = parseLocation(job.location)
  const physical = where.places.filter(p => p.country)
  let sameAs: string | undefined
  try {
    const host = new URL(job.url).hostname
    // The employer's own site, never the job board host (Greenhouse, Lever).
    if (!/(greenhouse\.io|lever\.co)$/.test(host)) sameAs =`https://${host.replace(/^(boards|job-boards|careers|jobs)\./, '')}`
  } catch {}
  const type = /\bintern(ship)?\b/i.test(job.title) ? 'INTERN' : /\bcontract(or)?\b/i.test(job.title) ? 'CONTRACTOR' : /\bpart[- ]time\b/i.test(job.title) ? 'PART_TIME' : undefined
  return {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: blocksToHtml(job.blocks),
    datePosted: job.published ?? job.updated,
    ...(job.deadline ? { validThrough: job.deadline } : {}),
    ...(type ? { employmentType: type } : {}),
    hiringOrganization: { '@type': 'Organization', name: job.company, ...(sameAs ? { sameAs } : {}) },
    identifier: { '@type': 'PropertyValue', name: job.company, value: String(job.id) },
    url: pageUrl,
    directApply: false,
    ...(physical.length
      ? {
          jobLocation: physical.map(p => ({
            '@type': 'Place',
            address: { '@type': 'PostalAddress', ...(p.city ? { addressLocality: p.city } : {}), ...(p.region ? { addressRegion: p.region } : {}), addressCountry: p.country },
          })),
        }
      : {}),
    ...(where.remote && where.countries.length
      ? { jobLocationType: 'TELECOMMUTE', applicantLocationRequirements: where.countries.map(c => ({ '@type': 'Country', name: c })) }
      : {}),
  }
}
