/**
 * Free-text job locations → places and countries. Used for Google JobPosting
 * markup (public-jobs.ts) and for matching (job-match.ts): a nurse in
 * Bengaluru must not be queued for an on-site shift in San Francisco.
 * No server-only imports here, so it also runs in plain Node scripts.
 */

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
  'hong kong': 'HK', colombia: 'CO',
  // Native names, as Adzuna's local indexes write them.
  deutschland: 'DE', 'österreich': 'AT', schweiz: 'CH', 'españa': 'ES', italia: 'IT', nederland: 'NL', brasil: 'BR', 'méxico': 'MX', polska: 'PL', belgique: 'BE', 'belgië': 'BE', romania: 'RO', luxembourg: 'LU', 'costa rica': 'CR', 'czech republic': 'CZ', czechia: 'CZ', hungary: 'HU', greece: 'GR', turkey: 'TR', 'south africa': 'ZA', nigeria: 'NG', kenya: 'KE', philippines: 'PH', vietnam: 'VN', thailand: 'TH', malaysia: 'MY', indonesia: 'ID', taiwan: 'TW', china: 'CN', uae: 'AE', 'united arab emirates': 'AE', emea: '', apac: '', americas: '', europe: '', latam: '', 'north america': '',
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
    // "Remote - AZ", "Remote - TX": a US state code that is not also a country code means US.
    const codes = t.match(/\b[A-Z]{2}\b/g) || []
    if (codes.some(c => US_STATES.has(c) && !ISO.has(c)) && !out.countries.includes('US')) out.countries.push('US')
    // "Remote - SF Bay Area", "Remote (NYC)": a named city or region pins the country too.
    for (const key of [...Object.keys(ALIASES), ...Object.keys(CITIES), 'bay area']) {
      if (new RegExp(`(^|[^a-z])${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z]|$)`).test(low)) {
        const c = key === 'bay area' ? 'US' : ALIASES[key]?.country ?? CITIES[key]?.[0]
        if (c && !out.countries.includes(c)) out.countries.push(c)
      }
    }
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

/** A country as a person typed it ("India", "united kingdom", "US") → ISO code, or null when unknown. */
export function isoCountry(name: string | null | undefined): string | null {
  const n = (name || '').trim().toLowerCase()
  if (!n) return null
  if (COUNTRIES[n]) return COUNTRIES[n]
  const up = n.toUpperCase()
  if (up === 'US' || ISO.has(up)) return up
  return null
}
