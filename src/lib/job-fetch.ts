/**
 * Fetching jobs from the sources ApplyMaster actually has.
 *
 * Shared by the search page, the Greenhouse scanner and the daily auto-apply
 * run. These functions previously lived inside two route files, so the daily
 * run had no way to fetch anything and only recycled whatever other users
 * had happened to search that week.
 */

const ADZUNA_APP_ID = process.env.ADZUNA_APP_ID
const ADZUNA_APP_KEY = process.env.ADZUNA_APP_KEY

/**
 * Greenhouse boards verified reachable board by board. Lever and Ashby are
 * absent on purpose: the Lever v0 posting API answers "Document not found"
 * for every org and Ashby returns null, and several companies once listed
 * here have moved off Greenhouse.
 */
export const GREENHOUSE_BOARDS = [
  'databricks', 'stripe', 'anthropic', 'datadog', 'cloudflare', 'brex',
  'samsara', 'gitlab', 'scaleai', 'affirm', 'pinterest', 'coinbase',
  'airbnb', 'lyft', 'flexport', 'figma', 'reddit', 'twilio', 'robinhood',
  'instacart', 'asana', 'gusto', 'vercel', 'duolingo', 'chime', 'sofi',
  'carta', 'mercury', 'discord', 'dropbox', 'airtable',
]

/** Display names where capitalising the board token gets it wrong. */
const BOARD_NAMES: Record<string, string> = {
  scaleai: 'Scale AI', gitlab: 'GitLab', sofi: 'SoFi', airbnb: 'Airbnb',
}
export const boardName = (b: string) => BOARD_NAMES[b] ?? b.charAt(0).toUpperCase() + b.slice(1)

/** One normalised posting, whatever the source. */
export type FetchedJob = {
  external_id: string
  source: 'greenhouse' | 'adzuna' | 'remoteok'
  title: string
  company: string
  location: string
  remote: boolean
  url: string
  description: string | null
  salary_min: number | null
  salary_max: number | null
  posted_at: string | null
  board_token?: string
  posting_id?: string
}

const strip = (html: string) =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

/* ── Greenhouse ───────────────────────────────────────────────────── */

type GreenhouseRaw = {
  id: number
  title: string
  absolute_url?: string
  updated_at?: string
  location?: { name?: string }
  content?: string
}

/** All open postings on one board, unfiltered. */
export async function fetchGreenhouseBoard(board: string, withContent = false): Promise<FetchedJob[]> {
  try {
    const res = await fetch(
      `https://boards-api.greenhouse.io/v1/boards/${board}/jobs${withContent ? '?content=true' : ''}`,
      { signal: AbortSignal.timeout(10_000) }
    )
    if (!res.ok) return []
    const data = (await res.json()) as { jobs?: GreenhouseRaw[] }
    return (data.jobs || []).map(j => {
      const loc = j.location?.name || 'Remote'
      return {
        external_id: `gh-${board}-${j.id}`,
        source: 'greenhouse' as const,
        title: j.title,
        company: boardName(board),
        location: loc,
        remote: /remote|anywhere/i.test(loc),
        url: j.absolute_url || `https://boards.greenhouse.io/${board}/jobs/${j.id}`,
        description: j.content ? strip(decodeEntities(j.content)).slice(0, 2000) : null,
        salary_min: null,
        salary_max: null,
        posted_at: j.updated_at ?? null,
        board_token: board,
        posting_id: String(j.id),
      }
    })
  } catch {
    return []
  }
}

/** Greenhouse double-encodes posting HTML; undo the entity layer before stripping tags. */
function decodeEntities(s: string) {
  return s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&')
}

/** Postings on one board whose title contains any keyword. */
export async function scanGreenhouse(board: string, keywords: string[]): Promise<FetchedJob[]> {
  const all = await fetchGreenhouseBoard(board)
  const kws = keywords.map(k => k.toLowerCase())
  return all.filter(j => kws.some(k => j.title.toLowerCase().includes(k)))
}

/* ── Adzuna ───────────────────────────────────────────────────────── */

const COUNTRY_CODE_MAP: Record<string, string> = {
  US: 'us', IN: 'in', GB: 'gb', CA: 'ca', AU: 'au', DE: 'de', SG: 'sg', AE: 'ae',
}

/** Country preference as users typed it -> Adzuna country code. */
export function countryCode(pref?: string | null): string {
  const p = (pref || '').trim().toLowerCase()
  if (!p) return 'US'
  if (COUNTRY_CODE_MAP[p.toUpperCase()]) return p.toUpperCase()
  if (/india/.test(p)) return 'IN'
  if (/united kingdom|\buk\b|britain|england/.test(p)) return 'GB'
  if (/canada/.test(p)) return 'CA'
  if (/australia/.test(p)) return 'AU'
  if (/germany/.test(p)) return 'DE'
  if (/singapore/.test(p)) return 'SG'
  if (/emirates|uae|dubai/.test(p)) return 'AE'
  return 'US'
}

type AdzunaRaw = {
  id: string
  title: string
  company?: { display_name?: string }
  location?: { display_name?: string }
  description?: string
  salary_min?: number
  salary_max?: number
  redirect_url: string
  created: string
}

export async function searchAdzuna(
  query: string,
  opts: { location?: string; country?: string; page?: number; maxDaysOld?: number; remote?: boolean } = {}
): Promise<FetchedJob[]> {
  if (!ADZUNA_APP_ID || !ADZUNA_APP_KEY) return []
  const country = opts.country || 'US'
  const params = new URLSearchParams({
    app_id: ADZUNA_APP_ID,
    app_key: ADZUNA_APP_KEY,
    results_per_page: '30',
    what: query,
    sort_by: 'date',
    max_days_old: String(opts.maxDaysOld || 30),
    'content-type': 'application/json',
  })
  const loc = (opts.location || '').trim()
  if (loc && !['remote', 'united states', 'india', 'us', 'usa', 'in'].includes(loc.toLowerCase())) params.set('where', loc)
  if (opts.remote) params.set('what_or', 'remote')

  try {
    const res = await fetch(
      `https://api.adzuna.com/v1/api/jobs/${COUNTRY_CODE_MAP[country] || 'us'}/search/${opts.page || 1}?${params}`,
      { signal: AbortSignal.timeout(10_000) }
    )
    if (!res.ok) return []
    const data = (await res.json()) as { results?: AdzunaRaw[] }
    return (data.results || []).map(r => {
      const location = r.location?.display_name || loc || ''
      return {
        external_id: `adzuna-${r.id}`,
        source: 'adzuna' as const,
        title: r.title,
        company: r.company?.display_name || 'Unknown',
        location,
        remote: /remote/i.test(`${r.title} ${location} ${r.description || ''}`),
        url: r.redirect_url,
        description: r.description ? strip(r.description).slice(0, 2000) : null,
        salary_min: r.salary_min ?? null,
        salary_max: r.salary_max ?? null,
        posted_at: r.created,
      }
    })
  } catch {
    return []
  }
}

/* ── RemoteOK ─────────────────────────────────────────────────────── */

type RemoteOkRaw = {
  id?: string
  position?: string
  company?: string
  description?: string
  salary_min?: string | number
  salary_max?: string | number
  url?: string
  date?: string
  tags?: string[]
}

/** The whole RemoteOK feed. It is one request for everything, so fetch once and filter. */
export async function fetchRemoteOK(): Promise<FetchedJob[]> {
  try {
    const res = await fetch('https://remoteok.com/api', {
      headers: { 'User-Agent': 'ApplyMaster/1.0 (+https://applymaster.ai)' },
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) return []
    const data = (await res.json()) as unknown[]
    return (Array.isArray(data) ? data.slice(1) : []).map(x => {
      const r = x as RemoteOkRaw
      return {
        external_id: `remoteok-${r.id}`,
        source: 'remoteok' as const,
        title: r.position || '',
        company: r.company || 'Unknown',
        location: 'Remote',
        remote: true,
        url: r.url || `https://remoteok.com/remote-jobs/${r.id}`,
        description: r.description ? strip(r.description).slice(0, 2000) : null,
        salary_min: r.salary_min ? Number(r.salary_min) || null : null,
        salary_max: r.salary_max ? Number(r.salary_max) || null : null,
        posted_at: r.date || null,
      }
    })
  } catch {
    return []
  }
}

export async function searchRemoteOK(query: string): Promise<FetchedJob[]> {
  const q = query.toLowerCase()
  return (await fetchRemoteOK()).filter(j => `${j.title} ${j.company} ${j.description || ''}`.toLowerCase().includes(q)).slice(0, 15)
}

/**
 * The (source, external_id) pair a posting is stored under. Matches the
 * conventions already in the jobs table — the search page writes Adzuna as
 * "Indeed/Adzuna" with a prefixed id, the scanner writes "greenhouse-<id>" —
 * so a job someone already saved is recognised rather than duplicated.
 */
export function dbKeys(j: FetchedJob): { source: string; external_id: string } {
  if (j.source === 'greenhouse') return { source: 'greenhouse', external_id: `greenhouse-${j.posting_id ?? j.external_id}` }
  if (j.source === 'adzuna') return { source: 'Indeed/Adzuna', external_id: `Indeed/Adzuna-${j.external_id}` }
  return { source: 'RemoteOK', external_id: `RemoteOK-${j.external_id}` }
}
