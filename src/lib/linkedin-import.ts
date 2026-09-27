/**
 * Reading a LinkedIn data export in the browser.
 *
 * LinkedIn does not let outside apps read a member's connections through its
 * API — that permission is restricted to partners by private agreement. What
 * every member can do is download their own data from LinkedIn and hand it
 * to an app of their choosing. That is what this reads.
 *
 * It runs client-side on purpose. The "larger data archive" LinkedIn sends
 * holds messages, invitations, search history and more. The ZIP is opened in
 * the browser and only four files are decompressed: connections, messages,
 * endorsements received, and skills. What reaches ApplyMaster is the
 * connection list plus, if the person chooses, a per-person message count,
 * last-message date and endorsement count. Message text, and everything else
 * in the archive, never leaves the person's computer.
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


/* ── The whole archive ──────────────────────────────────────────────── */

/** Per-person signals derived in the browser. Only these leave the device. */
export type PersonSignals = { messages: number; lastMessageAt: string | null; endorsements: number }

export type LinkedInArchive = {
  connections: LinkedInConnection[]
  /** Keyed by normalised profile URL. Null when the archive had no messages file. */
  messages: { byUrl: Map<string, { count: number; last: string | null }>; people: number } | null
  endorsements: { byUrl: Map<string, number>; people: number } | null
  skills: string[] | null
}

const WANTED = /(^|\/)(connections|messages|endorsement_received_info|skills)\.csv$/i

function unzipWanted(buf: Uint8Array): Promise<Record<string, string>> {
  return new Promise((resolve, reject) => {
    // Only these four entries are inflated. Everything else in the archive —
    // invitations, search history, ads data — is never even decompressed.
    unzip(buf, { filter: f => WANTED.test(f.name) }, (err, files) => {
      if (err) return reject(new Error('Could not open that ZIP file.'))
      const out: Record<string, string> = {}
      const dec = new TextDecoder('utf-8')
      for (const [name, data] of Object.entries(files)) {
        const base = name.split('/').pop()!.toLowerCase()
        out[base] = dec.decode(data)
      }
      resolve(out)
    })
  })
}

/**
 * Profile URLs of your connections, and a name -> URL lookup for files that
 * lack URLs. A name two connections share is left out: matching on it would
 * credit one person's messages to their namesake.
 */
function connectionIndex(connections: LinkedInConnection[]) {
  const connUrls = new Set<string>()
  const urlByName = new Map<string, string | null>()
  for (const c of connections) {
    if (!c.linkedin_url) continue
    connUrls.add(c.linkedin_url)
    const k = c.name.toLowerCase()
    urlByName.set(k, urlByName.has(k) && urlByName.get(k) !== c.linkedin_url ? null : c.linkedin_url)
  }
  return { connUrls, byName: (name: string) => urlByName.get(name.trim().toLowerCase()) ?? null }
}

const headerIndex = (rows: string[][], must: string) =>
  rows.findIndex(r => r.some(c => c.trim().toLowerCase() === must))

function toIso(raw: string): string | null {
  const s = (raw || '').trim()
  if (!s) return null
  const d = new Date(s.replace(' UTC', 'Z').replace(/^(\d{4}-\d{2}-\d{2}) /, '$1T'))
  return isNaN(d.getTime()) ? null : d.toISOString()
}

/**
 * messages.csv -> how many messages you exchanged with each person, and when
 * the last one was. The text column is parsed along with the rest of the
 * row (CSV has to be read whole) but nothing from it is kept.
 */
function messageSignals(text: string, connections: LinkedInConnection[]) {
  const rows = parseCsv(text)
  const h = headerIndex(rows, 'date')
  if (h === -1) return null
  const head = rows[h].map(c => c.trim().toLowerCase())
  const iSenderUrl = head.findIndex(c => c === 'sender profile url')
  const iRecipUrls = head.findIndex(c => c === 'recipient profile urls')
  const iFrom = head.indexOf('from')
  const iTo = head.indexOf('to')
  const iDate = head.indexOf('date')

  const { connUrls, byName } = connectionIndex(connections)

  const perMessage: { urls: string[]; at: string | null }[] = []
  for (const r of rows.slice(h + 1)) {
    const urls = new Set<string>()
    for (const u of [iSenderUrl >= 0 ? r[iSenderUrl] || '' : '', ...(iRecipUrls >= 0 ? r[iRecipUrls] || '' : '').split(/[\s,]+/)]) {
      const n = normalizeLinkedInUrl(u)
      if (n) urls.add(n)
    }
    // Names back up URLs, for older exports without URL columns or a profile
    // URL that differs from the one in Connections.csv — only when the URLs
    // matched none of your connections.
    if (![...urls].some(u => connUrls.has(u))) {
      for (const name of [iFrom >= 0 ? r[iFrom] || '' : '', ...(iTo >= 0 ? r[iTo] || '' : '').split(',')]) {
        const u = byName(name)
        if (u) urls.add(u)
      }
    }
    if (!urls.size) continue
    perMessage.push({ urls: [...urls], at: toIso(r[iDate] || '') })
  }

  // Only connections are counted. That leaves out you — you are in every
  // conversation, but never your own connection — and InMail from strangers,
  // which says nothing about who would help.
  const byUrl = new Map<string, { count: number; last: string | null }>()
  for (const m of perMessage) {
    for (const u of m.urls) {
      if (!connUrls.has(u)) continue
      const cur = byUrl.get(u) ?? { count: 0, last: null }
      cur.count += 1
      if (m.at && (!cur.last || m.at > cur.last)) cur.last = m.at
      byUrl.set(u, cur)
    }
  }
  return { byUrl, people: byUrl.size }
}

/** Endorsement_Received_Info.csv -> who endorsed you, and how often. */
function endorsementSignals(text: string, connections: LinkedInConnection[]) {
  const rows = parseCsv(text)
  const h = headerIndex(rows, 'skill name')
  if (h === -1) return null
  const head = rows[h].map(c => c.trim().toLowerCase())
  const iUrl = head.findIndex(c => c.includes('public url'))
  const iFirst = head.findIndex(c => c.includes('first name'))
  const iLast = head.findIndex(c => c.includes('last name'))
  const { connUrls, byName } = connectionIndex(connections)

  const byUrl = new Map<string, number>()
  for (const r of rows.slice(h + 1)) {
    const fromUrl = normalizeLinkedInUrl(iUrl >= 0 ? r[iUrl] : '')
    const url =
      fromUrl && connUrls.has(fromUrl)
        ? fromUrl
        : byName(`${(r[iFirst] || '').trim()} ${(r[iLast] || '').trim()}`)
    if (url) byUrl.set(url, (byUrl.get(url) ?? 0) + 1)
  }
  return { byUrl, people: byUrl.size }
}

function skillList(text: string): string[] {
  const rows = parseCsv(text)
  const h = headerIndex(rows, 'name')
  if (h === -1) return []
  const i = rows[h].map(c => c.trim().toLowerCase()).indexOf('name')
  return [...new Set(rows.slice(h + 1).map(r => (r[i] || '').trim()).filter(Boolean))]
}

/**
 * Read a LinkedIn export: the ZIP LinkedIn emails you, or Connections.csv on
 * its own. Everything here runs in the browser.
 */
export async function readLinkedInArchive(file: File): Promise<LinkedInArchive> {
  const buf = new Uint8Array(await file.arrayBuffer())
  const isZip = buf[0] === 0x50 && buf[1] === 0x4b // "PK"

  if (!isZip) {
    const connections = parseConnectionsCsv(new TextDecoder('utf-8').decode(buf))
    return { connections, messages: null, endorsements: null, skills: null }
  }

  const files = await unzipWanted(buf)
  if (!files['connections.csv']) {
    throw new Error(
      'That archive has no Connections.csv. On LinkedIn, choose "Download larger data archive" — the smaller export leaves connections out.'
    )
  }
  const connections = parseConnectionsCsv(files['connections.csv'])
  return {
    connections,
    messages: files['messages.csv'] ? messageSignals(files['messages.csv'], connections) : null,
    endorsements: files['endorsement_received_info.csv']
      ? endorsementSignals(files['endorsement_received_info.csv'], connections)
      : null,
    skills: files['skills.csv'] ? skillList(files['skills.csv']) : null,
  }
}

/** One person's signals, for ranking and for what gets sent. */
export function signalsFor(archive: LinkedInArchive, url: string | null): PersonSignals {
  const m = url ? archive.messages?.byUrl.get(url) : undefined
  return {
    messages: m?.count ?? 0,
    lastMessageAt: m?.last ?? null,
    endorsements: (url && archive.endorsements?.byUrl.get(url)) || 0,
  }
}
