/**
 * Builds src/lib/constants/world-cities.json from GeoNames, for the city
 * suggestions on the job search.
 *
 *   node scripts/build-cities.mjs <cities15000.zip> <admin1CodesASCII.txt>
 *
 * Source: https://download.geonames.org/export/dump/ (cities15000.zip,
 * admin1CodesASCII.txt), licensed CC BY 4.0 — credit GeoNames. Kept to the
 * countries the job search offers; add a code to COUNTRIES and rerun to
 * widen it. Each city: [name, state or region, population, aliases].
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { unzipSync, strFromU8 } from 'fflate'

const COUNTRIES = ['US', 'IN', 'GB', 'CA', 'AU', 'DE', 'SG', 'AE']
const [zipPath, admin1Path] = process.argv.slice(2)
if (!zipPath || !admin1Path) throw new Error('usage: node scripts/build-cities.mjs cities15000.zip admin1CodesASCII.txt')

const admin1 = new Map(
  fs
    .readFileSync(admin1Path, 'utf8')
    .split('\n')
    .map(l => l.split('\t'))
    .filter(r => r.length > 2)
    .map(r => [r[0], r[1]])
)
const tsv = strFromU8(Object.values(unzipSync(new Uint8Array(fs.readFileSync(zipPath))))[0])

// US and Indian states read better as their usual short or common names.
const US_STATES = { Alabama: 'AL', Alaska: 'AK', Arizona: 'AZ', Arkansas: 'AR', California: 'CA', Colorado: 'CO', Connecticut: 'CT', Delaware: 'DE', 'District of Columbia': 'DC', 'Washington, D.C.': 'DC', Florida: 'FL', Georgia: 'GA', Hawaii: 'HI', Idaho: 'ID', Illinois: 'IL', Indiana: 'IN', Iowa: 'IA', Kansas: 'KS', Kentucky: 'KY', Louisiana: 'LA', Maine: 'ME', Maryland: 'MD', Massachusetts: 'MA', Michigan: 'MI', Minnesota: 'MN', Mississippi: 'MS', Missouri: 'MO', Montana: 'MT', Nebraska: 'NE', Nevada: 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', Ohio: 'OH', Oklahoma: 'OK', Oregon: 'OR', Pennsylvania: 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC', 'South Dakota': 'SD', Tennessee: 'TN', Texas: 'TX', Utah: 'UT', Vermont: 'VT', Virginia: 'VA', Washington: 'WA', 'West Virginia': 'WV', Wisconsin: 'WI', Wyoming: 'WY' }

const out = Object.fromEntries(COUNTRIES.map(c => [c, []]))
for (const line of tsv.split('\n')) {
  const f = line.split('\t')
  if (f.length < 15 || !COUNTRIES.includes(f[8])) continue
  // Populated places only: skip sections of cities (PPLX) and historical ones.
  if (/^PPL(X|H|Q|W)$/.test(f[7])) continue
  const name = f[1]
  const region = admin1.get(`${f[8]}.${f[10]}`) || ''
  const pop = Number(f[14]) || 0
  // Other names people type ("Bangalore", "Gurgaon", "Bombay"). Only matched, never shown,
  // so big cities keep more of them.
  const aliases = [...new Set((f[3] || '').split(',').map(s => s.trim()))].filter(
    a => a && a !== name && a !== f[2] && /^[A-Za-z][A-Za-z .'-]{3,}$/.test(a)
  )
  if (f[2] !== name && /^[A-Za-z]/.test(f[2])) aliases.unshift(f[2])
  out[f[8]].push([name, f[8] === 'US' ? US_STATES[region] || region : region, pop, aliases.slice(0, pop >= 300_000 ? 14 : 3)])
}
for (const c of COUNTRIES) out[c].sort((a, b) => b[2] - a[2])

const dest = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'lib', 'constants', 'world-cities.json')
fs.writeFileSync(dest, JSON.stringify(out))
console.log(COUNTRIES.map(c => `${c} ${out[c].length}`).join(' · '), `→ ${(fs.statSync(dest).size / 1024).toFixed(0)} KB`)
