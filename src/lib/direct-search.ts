import { unstable_cache } from 'next/cache'
import { BOARD_SOURCES } from '@/lib/job-boards'
import { getBoardJobs, parseLocation } from '@/lib/public-jobs'

/**
 * Searches the postings we read straight from employers' own Greenhouse and
 * Lever boards (the same ones behind /companies). These are the jobs the
 * Chrome extension can fill, so they belong at the top of an in-app search
 * next to the aggregator results.
 *
 * Cost matters here: the boards total ~17,000 postings and the raw API
 * responses are megabytes each. A search never reads them. It reads a compact
 * index (title, place, link only) held in four cached pieces, each well under
 * the 2 MB cache-entry limit, and keeps the assembled index in memory so a warm
 * server answers repeat searches without touching the data cache at all.
 */

export type DirectJob = {
  id: string
  title: string
  company: string
  location: string
  description: string
  salary_min: null
  salary_max: null
  salary_currency: 'USD'
  url: string
  source: string
  ats: 'greenhouse' | 'lever'
  direct: true
  posted_at: string
  job_type: 'fulltime'
  country: string
  remote_type: string | null
  category: null
}

// [board slug, job id, title, location, url, updated ms, published ms or 0]
type Row = [string, string, string, string, string, number, number]

const CHUNKS = 4
const REVALIDATE = 24 * 3600
const MEMORY_MS = 30 * 60 * 1000

const ATS_NAME = { greenhouse: 'Greenhouse', lever: 'Lever' } as const
const SOURCE = new Map(BOARD_SOURCES.map(b => [b.slug, b]))

const buildChunk = unstable_cache(
  async (chunk: number): Promise<Row[]> => {
    const mine = BOARD_SOURCES.filter((_, i) => i % CHUNKS === chunk)
    const rows: Row[] = []
    const boards = await Promise.all(mine.map(async b => ({ b, jobs: (await getBoardJobs(b.slug)) ?? [] })))
    for (const { b, jobs } of boards) {
      for (const j of jobs) {
        rows.push([b.slug, j.id, j.title, j.location, j.url, new Date(j.updated).getTime() || 0, j.published ? new Date(j.published).getTime() || 0 : 0])
      }
    }
    return rows
  },
  ['direct-index-v1'],
  { revalidate: REVALIDATE }
)

let memo: { at: number; rows: Row[] } | null = null
let loading: Promise<Row[]> | null = null

async function loadIndex(): Promise<Row[]> {
  if (memo && Date.now() - memo.at < MEMORY_MS) return memo.rows
  // Concurrent searches on a cold server share one load.
  loading ??= Promise.all(Array.from({ length: CHUNKS }, (_, i) => buildChunk(i)))
    .then(parts => {
      const rows = parts.flat()
      memo = { at: Date.now(), rows }
      return rows
    })
    .finally(() => {
      loading = null
    })
  return loading
}

const terms = (q: string) =>
  q
    .toLowerCase()
    .split(/[^a-z0-9+#.]+/)
    .filter(t => t.length > 1 && !['and', 'or', 'the', 'for', 'of', 'in', 'at', 'to', 'a', 'an', 'jobs', 'job'].includes(t))

export async function searchDirect(opts: {
  query: string
  country: string
  city?: string
  remote?: string
  maxDaysOld?: number
  limit?: number
}): Promise<DirectJob[]> {
  const words = terms(opts.query)
  if (!words.length) return []
  const since = opts.maxDaysOld ? Date.now() - opts.maxDaysOld * 864e5 : 0
  const city = (opts.city || '').trim().toLowerCase()
  const wantRemote = opts.remote === 'remote'
  const wantOnsite = opts.remote === 'onsite'
  const rows = await loadIndex()

  const hits: (DirectJob & { score: number })[] = []
  for (const [board, id, title, location, url, updated, published] of rows) {
    const t = title.toLowerCase()
    // Every word must appear in the title.
    if (!words.every(w => t.includes(w))) continue
    if (since && updated < since) continue
    const where = parseLocation(location)
    const inCountry = where.countries.includes(opts.country) || (where.countries.length === 0 && opts.country === 'US')
    if (!inCountry && !(where.remote && !wantOnsite)) continue
    if (wantRemote && !where.remote) continue
    if (wantOnsite && where.remote && where.places.length === 0) continue
    if (city && !location.toLowerCase().includes(city)) continue
    const src = SOURCE.get(board)
    if (!src) continue
    hits.push({
      id: `direct-${board}-${id}`,
      title,
      company: src.name,
      location: location || (where.remote ? 'Remote' : ''),
      description: '',
      salary_min: null,
      salary_max: null,
      salary_currency: 'USD',
      url,
      source: ATS_NAME[src.ats],
      ats: src.ats,
      direct: true,
      posted_at: new Date(published || updated).toISOString(),
      job_type: 'fulltime',
      country: opts.country,
      remote_type: where.remote ? 'Remote' : null,
      category: null,
      score: words.length + (t.startsWith(words[0]) ? 0.5 : 0),
    })
  }
  hits.sort((a, b) => b.score - a.score || new Date(b.posted_at).getTime() - new Date(a.posted_at).getTime())
  return hits.slice(0, opts.limit ?? 25).map(({ score: _s, ...j }) => j)
}
