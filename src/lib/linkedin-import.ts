/**
 * Reading a LinkedIn data export in the browser.
 *
 * LinkedIn does not let outside apps read a member's connections through its
 * API — that permission is restricted to partners by private agreement. What
 * every member can do is download their own data from LinkedIn and hand it
 * to an app of their choosing. That is what this reads.
 *
 * It runs client-side on purpose. The "larger data archive" LinkedIn sends
 * holds messages, invitations, search history and more; only Connections.csv
 * is needed. The ZIP is opened in the browser, only that one file is
 * decompressed, and only the parsed connection list is sent to ApplyMaster.
 * Everything else in the archive never leaves the person's computer.
 */
import { unzip } from 'fflate'

export type LinkedInConnection = {
  name: string
  first_name: string
  last_name: string
  linkedin_url: string | null
  email: string | null
  company: string | null
  title: string | null
  connected_on: string | null // ISO date
}

/** Minimal RFC 4180 CSV reader: quoted fields, escaped quotes, newlines in quotes. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  const t = text.replace(/^﻿/, '')

  for (let i = 0; i < t.length; i++) {
    const c = t[i]
    if (quoted) {
      if (c === '"') {
        if (t[i + 1] === '"') {
          field += '"'
          i++
        } else quoted = false
      } else field += c
      continue
    }
    if (c === '"') quoted = true
    else if (c === ',') {
      row.push(field)
      field = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && t[i + 1] === '\n') i++
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else field += c
  }
  if (field !== '' || row.length) {
    row.push(field)
    rows.push(row)
  }
  return rows
}

/** https://www.linkedin.com/in/Jane-Doe-123/?x=y -> https://www.linkedin.com/in/jane-doe-123 */
export function normalizeLinkedInUrl(raw: string | null | undefined): string | null {
  const s = (raw || '').trim()
  if (!s) return null
  const m = s.match(/linkedin\.com\/in\/([^/?#\s]+)/i)
  if (!m) return null
  return `https://www.linkedin.com/in/${decodeURIComponent(m[1]).toLowerCase()}`
}

const MONTHS: Record<string, string> = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
}

/** LinkedIn writes "26 Sep 2026". */
function parseConnectedOn(s: string): string | null {
  const m = (s || '').trim().match(/^(\d{1,2})\s+([A-Za-z]{3})[a-z]*\s+(\d{4})$/)
  if (!m) return null
  const mm = MONTHS[m[2].toLowerCase()]
  return mm ? `${m[3]}-${mm}-${m[1].padStart(2, '0')}` : null
}

/**
 * Connections.csv -> rows. The file starts with a "Notes:" preamble before
 * the real header, so the header is found rather than assumed to be line 1.
 */
export function parseConnectionsCsv(text: string): LinkedInConnection[] {
  const rows = parseCsv(text)
  const headerAt = rows.findIndex(r => r.map(c => c.trim().toLowerCase()).includes('first name'))
  if (headerAt === -1) throw new Error('This does not look like a LinkedIn connections file.')

  const header = rows[headerAt].map(c => c.trim().toLowerCase())
  const col = (name: string) => header.indexOf(name)
  const iFirst = col('first name')
  const iLast = col('last name')
  const iUrl = col('url')
  const iEmail = col('email address')
  const iCompany = col('company')
  const iTitle = col('position')
  const iOn = col('connected on')

  const out: LinkedInConnection[] = []
  // A person appears once, however many times the file lists them — the
  // count shown before importing has to be the count that gets imported.
  const seen = new Set<string>()
  for (const r of rows.slice(headerAt + 1)) {
    const get = (i: number) => (i >= 0 ? (r[i] || '').trim() : '')
    const first = get(iFirst)
    const last = get(iLast)
    const name = `${first} ${last}`.trim()
    if (!name) continue
    const key = normalizeLinkedInUrl(get(iUrl)) ?? `${name}|${get(iCompany)}`.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push({
      name,
      first_name: first,
      last_name: last,
      linkedin_url: normalizeLinkedInUrl(get(iUrl)),
      email: get(iEmail).includes('@') ? get(iEmail).toLowerCase() : null,
      company: get(iCompany) || null,
      title: get(iTitle) || null,
      connected_on: parseConnectedOn(get(iOn)),
    })
  }
  return out
}

/** Pull Connections.csv out of a LinkedIn archive, decompressing nothing else. */
function extractConnectionsFromZip(buf: Uint8Array): Promise<string> {
  return new Promise((resolve, reject) => {
    unzip(
      buf,
      {
        // Only this one entry is inflated; messages and the rest are skipped.
        filter: f => /(^|\/)connections\.csv$/i.test(f.name),
      },
      (err, files) => {
        if (err) return reject(new Error('Could not open that ZIP file.'))
        const key = Object.keys(files)[0]
        if (!key) {
          return reject(
            new Error(
              'That archive has no Connections.csv. On LinkedIn, choose "Download larger data archive" — the smaller export leaves connections out.'
            )
          )
        }
        resolve(new TextDecoder('utf-8').decode(files[key]))
      }
    )
  })
}

/** Accepts the ZIP LinkedIn emails you, or Connections.csv on its own. */
export async function readLinkedInFile(file: File): Promise<LinkedInConnection[]> {
  const buf = new Uint8Array(await file.arrayBuffer())
  const isZip = buf[0] === 0x50 && buf[1] === 0x4b // "PK"
  const text = isZip ? await extractConnectionsFromZip(buf) : new TextDecoder('utf-8').decode(buf)
  return parseConnectionsCsv(text)
}
