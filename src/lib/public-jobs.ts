import 'server-only'
import { GREENHOUSE_BOARDS, boardName } from './job-fetch'

/**
 * Public job pages (/companies/...): live openings from the employers'
 * own Greenhouse boards, read through Greenhouse's public Job Board API and
 * cached for six hours. Nothing is stored: a job that closes disappears from
 * the board, so its page answers 404 at the next refresh.
 *
 * Descriptions arrive as escaped HTML. They are never injected as HTML:
 * they are reduced to headings, paragraphs and list items, which the page
 * renders itself.
 */

export const BOARDS = GREENHOUSE_BOARDS
const API = 'https://boards-api.greenhouse.io/v1/boards'
const REVALIDATE = 6 * 3600

export type ListedJob = {
  id: number
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
}

type GhJob = {
  id: number
  title: string
  absolute_url: string
  location?: { name?: string }
  updated_at: string
  first_published?: string | null
  application_deadline?: string | null
  company_name?: string
  content?: string
  departments?: { name: string }[]
}

const toListed = (j: GhJob): ListedJob => ({
  id: j.id,
  title: j.title.trim(),
  location: (j.location?.name || '').trim(),
  url: j.absolute_url,
  updated: j.updated_at,
  published: j.first_published ?? null,
  deadline: j.application_deadline ?? null,
})

export const isBoard = (b: string) => (BOARDS as readonly string[]).includes(b)
export const companyName = (board: string) => boardName(board)

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, ' ')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 70)

export const jobPath = (board: string, j: { id: number; title: string }) => `/companies/${board}/jobs/${j.id}-${slugify(j.title)}`
export const idFromParam = (p: string) => Number(p.split('-')[0]) || null

/** Every open role on one board, newest first. Null when the board cannot be read. */
export async function getBoardJobs(board: string): Promise<ListedJob[] | null> {
  if (!isBoard(board)) return null
  try {
    const res = await fetch(`${API}/${board}/jobs`, { next: { revalidate: REVALIDATE } })
    if (!res.ok) return null
    const data = (await res.json()) as { jobs?: GhJob[] }
    return (data.jobs ?? []).map(toListed).sort((a, b) => (b.published ?? b.updated).localeCompare(a.published ?? a.updated))
  } catch {
    return null
  }
}

export async function getAllBoards() {
  const rows = await Promise.all(BOARDS.map(async board => ({ board, company: companyName(board), jobs: (await getBoardJobs(board)) ?? [] })))
  return rows.filter(r => r.jobs.length > 0)
}

export async function getJob(board: string, id: number): Promise<JobDetail | null> {
  if (!isBoard(board) || !Number.isFinite(id)) return null
  try {
    const res = await fetch(`${API}/${board}/jobs/${id}`, { next: { revalidate: REVALIDATE } })
    if (!res.ok) return null
    const j = (await res.json()) as GhJob
    return {
      ...toListed(j),
      board,
      company: j.company_name?.trim() || companyName(board),
      // Some boards prefix department names with an internal code ("6532 Benefits").
      departments: (j.departments ?? []).map(d => d.name.replace(/^\d+\s+/, '').trim()).filter(Boolean),
      blocks: toBlocks(j.content ?? ''),
    }
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
  // A paragraph that is only bold text reads as a heading.
  return blocks.map(b => (b.type === 'p' && b.text.length < 60 && /:$/.test(b.text) ? { type: 'h', text: b.text.replace(/:$/, '') } : b))
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
export const blocksToHtml = (blocks: Block[]) =>
  blocks.map(b => (b.type === 'ul' ? `<ul>${b.items.map(i => `<li>${esc(i)}</li>`).join('')}</ul>` : b.type === 'h' ? `<h3>${esc(b.text)}</h3>` : `<p>${esc(b.text)}</p>`)).join('')
export const blocksToText = (blocks: Block[]) => blocks.map(b => (b.type === 'ul' ? b.items.map(i => `- ${i}`).join('\n') : b.text)).join('\n')

/* ── Location: free text → places Google's job schema understands ─────── */

type Place = { city?: string; region?: string; country: string }
export type Where = { remote: boolean; places: Place[]; countries: string[] }

const US_STATES = new Set('AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY DC'.split(' '))
const ALIASES: Record<string, Place> = {
  sf: { city: 'San Francisco', region: 'CA', country: 'US' },
  sfo: { city: 'San Francisco', region: 'CA', country: 'US' },
  nyc: { city: 'New York', region: 'NY', country: 'US' },
  'new york city': { city: 'New York', region: 'NY', country: 'US' },
  chi: { city: 'Chicago', region: 'IL', country: 'US' },
  atl: { city: 'Atlanta', region: 'GA', country: 'US' },
  sea: { city: 'Seattle', region: 'WA', country: 'US' },
  la: { city: 'Los Angeles', region: 'CA', country: 'US' },
  dc: { city: 'Washington', region: 'DC', country: 'US' },
  bay: { city: 'San Francisco', region: 'CA', country: 'US' },
}
const CITIES: Record<string, [string, string?]> = {
  'san francisco': ['US', 'CA'], 'south san francisco': ['US', 'CA'], 'san jose': ['US', 'CA'], 'mountain view': ['US', 'CA'], 'palo alto': ['US', 'CA'], sunnyvale: ['US', 'CA'],
  'menlo park': ['US', 'CA'], 'redwood city': ['US', 'CA'], 'san mateo': ['US', 'CA'], oakland: ['US', 'CA'], 'los angeles': ['US', 'CA'], 'san diego': ['US', 'CA'], irvine: ['US', 'CA'],
  'new york': ['US', 'NY'], brooklyn: ['US', 'NY'], seattle: ['US', 'WA'], bellevue: ['US', 'WA'], chicago: ['US', 'IL'], atlanta: ['US', 'GA'], austin: ['US', 'TX'], dallas: ['US', 'TX'],
  houston: ['US', 'TX'], denver: ['US', 'CO'], boulder: ['US', 'CO'], boston: ['US', 'MA'], cambridge: ['US', 'MA'], washington: ['US', 'DC'], miami: ['US', 'FL'], philadelphia: ['US', 'PA'],
  pittsburgh: ['US', 'PA'], portland: ['US', 'OR'], 'salt lake city': ['US', 'UT'], phoenix: ['US', 'AZ'], minneapolis: ['US', 'MN'], detroit: ['US', 'MI'], nashville: ['US', 'TN'], raleigh: ['US', 'NC'],
  columbus: ['US', 'OH'], 'kansas city': ['US', 'MO'], 'st. louis': ['US', 'MO'], baltimore: ['US', 'MD'], 'las vegas': ['US', 'NV'],
  toronto: ['CA', 'ON'], vancouver: ['CA', 'BC'], montreal: ['CA', 'QC'], ottawa: ['CA', 'ON'], waterloo: ['CA', 'ON'], calgary: ['CA', 'AB'],
  bucharest: ['RO'], luxembourg: ['LU'], 'zürich': ['CH'], 'san josé': ['CR'], london: ['GB'], manchester: ['GB'], edinburgh: ['GB'], dublin: ['IE'], paris: ['FR'], berlin: ['DE'], munich: ['DE'], hamburg: ['DE'], amsterdam: ['NL'], madrid: ['ES'], barcelona: ['ES'],
  lisbon: ['PT'], milan: ['IT'], zurich: ['CH'], stockholm: ['SE'], copenhagen: ['DK'], oslo: ['NO'], helsinki: ['FI'], warsaw: ['PL'], krakow: ['PL'], prague: ['CZ'], vienna: ['AT'], brussels: ['BE'],
  'tel aviv': ['IL'], tokyo: ['JP'], osaka: ['JP'], seoul: ['KR'], singapore: ['SG'], 'hong kong': ['HK'], sydney: ['AU'], melbourne: ['AU'], auckland: ['NZ'],
  bengaluru: ['IN', 'KA'], bangalore: ['IN', 'KA'], hyderabad: ['IN', 'TG'], mumbai: ['IN', 'MH'], pune: ['IN', 'MH'], delhi: ['IN', 'DL'], 'new delhi': ['IN', 'DL'], gurgaon: ['IN', 'HR'], gurugram: ['IN', 'HR'],
  noida: ['IN', 'UP'], chennai: ['IN', 'TN'], 'mexico city': ['MX'], 'sao paulo': ['BR'], 'são paulo': ['BR'], 'buenos aires': ['AR'], bogota: ['CO'], 'bogotá': ['CO'], dubai: ['AE'],
}
const COUNTRIES: Record<string, string> = {
  us: 'US', usa: 'US', 'united states': 'US', 'united states of america': 'US', america: 'US', uk: 'GB', 'united kingdom': 'GB', england: 'GB', ireland: 'IE', germany: 'DE', france: 'FR',
  netherlands: 'NL', spain: 'ES', portugal: 'PT', italy: 'IT', switzerland: 'CH', sweden: 'SE', denmark: 'DK', norway: 'NO', finland: 'FI', poland: 'PL', austria: 'AT', belgium: 'BE',
  israel: 'IL', japan: 'JP', korea: 'KR', 'south korea': 'KR', singapore: 'SG', australia: 'AU', 'new zealand': 'NZ', canada: 'CA', india: 'IN', mexico: 'MX', brazil: 'BR', argentina: 'AR',
  colombia: 'CO', romania: 'RO', luxembourg: 'LU', 'costa rica': 'CR', 'czech republic': 'CZ', czechia: 'CZ', hungary: 'HU', greece: 'GR', turkey: 'TR', 'south africa': 'ZA', nigeria: 'NG', kenya: 'KE', philippines: 'PH', vietnam: 'VN', thailand: 'TH', malaysia: 'MY', indonesia: 'ID', taiwan: 'TW', china: 'CN', uae: 'AE', 'united arab emirates': 'AE', emea: '', apac: '', americas: '', europe: '', latam: '', 'north america': '',
}

const STATE_NAMES: Record<string, string> = {
  alabama: 'AL', alaska: 'AK', arizona: 'AZ', arkansas: 'AR', california: 'CA', colorado: 'CO', connecticut: 'CT', delaware: 'DE', florida: 'FL', georgia: 'GA', hawaii: 'HI', idaho: 'ID',
  illinois: 'IL', indiana: 'IN', iowa: 'IA', kansas: 'KS', kentucky: 'KY', louisiana: 'LA', maine: 'ME', maryland: 'MD', massachusetts: 'MA', michigan: 'MI', minnesota: 'MN',
  mississippi: 'MS', missouri: 'MO', montana: 'MT', nebraska: 'NE', nevada: 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC',
  'north dakota': 'ND', ohio: 'OH', oklahoma: 'OK', oregon: 'OR', pennsylvania: 'PA', 'rhode island': 'RI', 'south carolina': 'SC', 'south dakota': 'SD', tennessee: 'TN', texas: 'TX',
  utah: 'UT', vermont: 'VT', virginia: 'VA', 'washington d.c.': 'DC', 'washington dc': 'DC', 'west virginia': 'WV', wisconsin: 'WI', wyoming: 'WY',
}
// Two-letter country codes seen after a comma ("Zürich, CH"); US states take precedence.
const ISO = new Set('GB IE DE FR NL ES PT IT CH SE DK NO FI PL AT BE IL JP KR SG AU NZ IN MX BR AR CO AE RO LU CR CZ HU GR TR ZA NG KE PH VN TH MY ID HK TW CN'.split(' '))

const word = (name: string) => new RegExp(`(^|[^a-z])${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z]|$)`)
const COUNTRY_KEYS = Object.entries(COUNTRIES).filter(([, c]) => c).sort((a, b) => b[0].length - a[0].length)

/** Countries named anywhere in the text: "Remote-Friendly, United States", "Remote - California". */
function countriesIn(low: string): string[] {
  const found = new Set<string>()
  for (const [name, code] of COUNTRY_KEYS) if (word(name).test(low)) found.add(code)
  for (const name of Object.keys(STATE_NAMES)) if (word(name).test(low)) found.add('US')
  if (/u\.s\.|\bus-|\busa\b/.test(low)) found.add('US')
  return [...found]
}

function resolve(raw: string, out: Where) {
  let t = raw.replace(/[()]/g, ' ').replace(/\s+/g, ' ').trim()
  if (!t || /^n\/?a$/i.test(t)) return
  const low = t.toLowerCase()
  if (/remote|\brem\b|anywhere|distributed|work from home/.test(low)) {
    out.remote = true
    for (const c of countriesIn(low)) if (!out.countries.includes(c)) out.countries.push(c)
    return
  }
  const state = STATE_NAMES[low]
  if (state) return void out.places.push({ region: state, country: 'US' })
  const usPrefix = t.match(/^US[-\s]+(.+)$/i)
  if (usPrefix) {
    t = usPrefix[1]
    const short = ALIASES[t.toLowerCase()] // "US-SF", "US-NYC"
    if (short) return void out.places.push(short)
    const place = CITIES[t.toLowerCase()]
    out.places.push({ city: t, region: place?.[1], country: 'US' })
    return
  }
  const cityState = t.match(/^(.+?),\s*([A-Z]{2})$/)
  if (cityState && US_STATES.has(cityState[2])) {
    out.places.push({ city: cityState[1].trim(), region: cityState[2], country: 'US' })
    return
  }
  const alias = ALIASES[low]
  if (alias) return void out.places.push(alias)
  const parts = t.split(',').map(s => s.trim()).filter(Boolean)
  const cityKey = parts[0].toLowerCase()
  const tail = parts.length > 1 ? parts[parts.length - 1] : ''
  const countryFromTail = tail ? COUNTRIES[tail.toLowerCase()] || (ISO.has(tail) ? tail : undefined) : undefined
  if (CITIES[cityKey]) {
    const [country, region] = CITIES[cityKey]
    out.places.push({ city: parts[0], region, country: countryFromTail || country })
    return
  }
  if (countryFromTail) return void out.places.push({ city: parts[0], country: countryFromTail })
  const country = COUNTRIES[low]
  if (country) return void out.places.push({ country })
  // Last resort: a country or US state named inside a longer phrase ("Northeast - United States").
  for (const c of countriesIn(low)) out.places.push({ country: c })
}

export function parseLocation(name: string): Where {
  const out: Where = { remote: false, places: [], countries: [] }
  const chunks = name
    .split(/;|\||\/|\bor\b|&|\band\b/i)
    .map(s => s.trim())
    .filter(Boolean)
  for (const chunk of chunks) {
    // "San Francisco, CA" and "Toronto, Canada" are one place; "SF, NYC, CHI" is several.
    const tail = chunk.match(/,\s*([^,]+)$/)?.[1]?.trim() ?? ''
    const onePlace = chunk.split(',').length === 2 && (US_STATES.has(tail) || ISO.has(tail) || !!COUNTRIES[tail.toLowerCase()])
    if (onePlace) resolve(chunk, out)
    else for (const piece of chunk.split(',')) resolve(piece, out)
  }
  for (const p of out.places) if (p.country && !out.countries.includes(p.country)) out.countries.push(p.country)
  out.countries = out.countries.filter(Boolean)
  return out
}

/** Google JobPosting structured data, or null when the location cannot be stated honestly. */
export function jobPostingSchema(job: JobDetail, pageUrl: string) {
  const where = parseLocation(job.location)
  const physical = where.places.filter(p => p.country)
  if (!physical.length && !(where.remote && where.countries.length)) return null
  let sameAs: string | undefined
  try {
    const host = new URL(job.url).hostname
    if (!/greenhouse\.io$/.test(host)) sameAs = `https://${host.replace(/^(boards|job-boards|careers|jobs)\./, '')}`
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
