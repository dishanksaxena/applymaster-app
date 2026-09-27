'use client'

import { useEffect, useState } from 'react'

/**
 * Company logos for people in someone's network.
 *
 * A LinkedIn archive has a company name and nothing else — no website, no
 * logo, no profile photos. This resolves a name to the company's website
 * with Clearbit's public company autocomplete, then shows that site's icon
 * from Google's favicon service. It runs in the browser, only for the people
 * on screen, and remembers answers so each company is looked up once.
 *
 * Anything uncertain shows nothing rather than a wrong logo.
 */

const STORE = 'am_company_domains_v1'
const SUGGEST = 'https://autocomplete.clearbit.com/v1/companies/suggest?query='
const ICON = (domain: string) => `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`

// Not companies: no logo to find.
const NOT_A_COMPANY =
  /^(self[\s-]?employed|freelanc\w*|stealth\w*|confidential|independent\w*|n\/?a|none|unemployed|retired|student|various|consultant|open to work|career break)\b/i
const FILLER =
  /\b(inc|incorporated|llc|llp|ltd|limited|pvt|private|plc|gmbh|ag|sa|bv|co|corp|corporation|company|group|holdings?|technologies|technology|solutions|services|systems|labs|the|india|usa|us|uk)\b/g

export const normCompany = (s: string) =>
  s
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(FILLER, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const known = new Map<string, string | null>()
const pending = new Map<string, Promise<string | null>>()
let loaded = false

function load() {
  if (loaded) return
  loaded = true
  try {
    const saved = JSON.parse(localStorage.getItem(STORE) || '{}') as Record<string, string | null>
    for (const [k, v] of Object.entries(saved)) known.set(k, v)
  } catch {}
}

let saveTimer: ReturnType<typeof setTimeout> | null = null
function save() {
  if (saveTimer) return
  saveTimer = setTimeout(() => {
    saveTimer = null
    try {
      localStorage.setItem(STORE, JSON.stringify(Object.fromEntries(known)))
    } catch {}
  }, 500)
}

// A handful at a time, so a long list does not fire hundreds of requests at once.
let active = 0
const queue: (() => void)[] = []
const slot = () =>
  new Promise<void>(resolve => {
    if (active < 4) {
      active++
      resolve()
    } else queue.push(() => (active++, resolve()))
  })
const release = () => {
  active--
  queue.shift()?.()
}

// Words people add after a company's name that do not change which company
// it is: "Deloitte USI", "Betway Global", "Accenture in India".
const TAIL = new Set(['usi', 'global', 'in', 'bank', 'international', 'worldwide', 'emea', 'apac', 'americas', 'europe', 'digital', 'consulting', 'north', 'america'])
const onlyTail = (rest: string) => rest.split(' ').every(w => TAIL.has(w))

/**
 * How surely a suggestion is the company asked about: 3 when its website is
 * the name (wipro.com for "Wipro"), 2 for the same name, 1 for the name plus
 * a generic tail. 0 rejects it — "Wipro HealthPlan Services" is not Wipro.
 */
function matchScore(query: string, name: string, domain: string) {
  const q = normCompany(query)
  const n = normCompany(name)
  if (!q || !n) return 0
  if (q.replace(/ /g, '') === domain.split('.')[0]) return 3
  if (q === n) return 2
  if (q.startsWith(n + ' ') && onlyTail(q.slice(n.length + 1))) return 1
  return 0
}

/** "Deloitte USI" -> "Deloitte": drop generic words from the end. */
function withoutTail(company: string) {
  const words = company.trim().split(/\s+/)
  while (words.length > 1) {
    const w = normCompany(words[words.length - 1])
    if (w && !TAIL.has(w)) break
    words.pop()
  }
  return words.join(' ')
}

async function suggest(query: string, company: string) {
  const res = await fetch(SUGGEST + encodeURIComponent(query))
  if (!res.ok) throw new Error(String(res.status))
  const list = (await res.json()) as { name: string; domain: string }[]
  let best: { domain: string; score: number } | null = null
  for (const c of list) {
    const score = c.domain ? matchScore(company, c.name, c.domain) : 0
    if (score > (best?.score ?? 0)) best = { domain: c.domain, score }
  }
  return best?.domain ?? null
}

async function lookup(company: string): Promise<string | null> {
  await slot()
  try {
    // The autocomplete finds nothing for "Standard Chartered Bank" but does
    // for "Standard Chartered", so a miss retries without the generic tail.
    const found = await suggest(company, company)
    const shorter = withoutTail(company)
    return found ?? (shorter !== company ? await suggest(shorter, company) : null)
  } finally {
    release()
  }
}

export function companyDomain(company: string | null | undefined): Promise<string | null> {
  const name = (company || '').trim()
  const key = normCompany(name)
  if (!key || NOT_A_COMPANY.test(name)) return Promise.resolve(null)
  load()
  if (known.has(key)) return Promise.resolve(known.get(key) ?? null)
  let p = pending.get(key)
  if (!p) {
    p = lookup(name)
      .then(d => {
        known.set(key, d)
        save()
        return d
      })
      // Network trouble is not an answer: try again next time.
      .catch(() => null)
      .finally(() => pending.delete(key))
    pending.set(key, p)
  }
  return p
}

function cachedDomain(company: string | null | undefined) {
  if (typeof window === 'undefined') return null
  load()
  return known.get(normCompany(company || '')) ?? null
}

export function useCompanyDomain(company: string | null | undefined) {
  const [domain, setDomain] = useState<string | null>(() => cachedDomain(company))
  useEffect(() => {
    let live = true
    companyDomain(company).then(d => live && setDomain(d))
    return () => {
      live = false
    }
  }, [company])
  return domain
}

/**
 * The logo on its own (chips, headers), or as a badge on a person's avatar.
 * Renders nothing until there is a logo worth showing.
 */
export function CompanyLogo({
  company,
  size = 16,
  badge = false,
}: {
  company: string | null | undefined
  size?: number
  /** Pin to the bottom-right of the (position: relative) parent. */
  badge?: boolean
}) {
  const domain = useCompanyDomain(company)
  const [bad, setBad] = useState(false)
  useEffect(() => setBad(false), [domain])
  if (!domain || bad) return null
  return (
    <span
      aria-hidden="true"
      title={company ?? undefined}
      className={`${badge ? 'absolute' : ''} place-items-center overflow-hidden shrink-0`}
      style={{
        display: badge ? 'grid' : 'inline-grid',
        // Hang off the avatar's edge so it never covers the initials.
        ...(badge ? { right: -Math.round(size * 0.32), bottom: -Math.round(size * 0.2) } : {}),
        width: size,
        height: size,
        borderRadius: Math.max(3, size * 0.26),
        background: '#fff',
        boxShadow: badge ? '0 0 0 2px var(--bg-card), 0 1px 2px rgb(0 0 0 / 0.12)' : 'inset 0 0 0 1px rgb(0 0 0 / 0.08)',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={ICON(domain)}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        referrerPolicy="no-referrer"
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        // Google answers unknown sites with a tiny generic globe; treat it as no logo.
        onLoad={e => e.currentTarget.naturalWidth < 32 && setBad(true)}
        onError={() => setBad(true)}
      />
    </span>
  )
}
