import 'server-only'
import { createAdminClient } from './supabase-admin'
import { FAILURE_EVENTS, INTERNAL, listAuthUsers, type AuthUserRow, type EventRow, type SupportRow } from './admin-data'

/**
 * The owner's view of the product: who visits, who the customers are, what
 * they use, and what goes wrong for them. Everything is computed from our own
 * tables: app_events (page views, searches, errors, auth), the product tables
 * (applications, resumes, cover letters...) and Supabase Auth.
 *
 * Internal accounts (the team, the review and demo accounts) and every
 * browser they have used are left out, so the numbers are customers only.
 */

const DAY = 86400000
const t = (iso: string | null | undefined) => (iso ? new Date(iso).getTime() : 0)
const dayKey = (iso: string) => iso.slice(0, 10)
type Db = ReturnType<typeof createAdminClient>

export const RANGES = [7, 30, 90] as const
export const rangeOf = (v: string | string[] | undefined) => {
  const n = Number(Array.isArray(v) ? v[0] : v)
  return (RANGES as readonly number[]).includes(n) ? n : 30
}

/** All rows of a query, a thousand at a time (PostgREST caps each response). */
async function all<T>(build: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>, max = 60000): Promise<T[]> {
  const out: T[] = []
  for (let from = 0; from < max; from += 1000) {
    const { data, error } = await build(from, from + 999)
    if (error || !data) break
    out.push(...data)
    if (data.length < 1000) break
  }
  return out
}

async function events(db: Db, days: number, names?: string[]): Promise<EventRow[]> {
  const since = new Date(Date.now() - days * DAY).toISOString()
  return all<EventRow>((from, to) => {
    let q = db.from('app_events').select('*').gte('created_at', since)
    if (names) q = q.in('event', names)
    return q.order('created_at', { ascending: false }).range(from, to)
  })
}

/** Accounts that are the business, and every browser they have been seen in. */
function internals(users: AuthUserRow[], evs: EventRow[]) {
  const ids = new Set(users.filter(u => INTERNAL.test(u.email || '')).map(u => u.id))
  const anons = new Set<string>()
  for (const e of evs) {
    if (!e.anon_id) continue
    if ((e.user_id && ids.has(e.user_id)) || (e.email && INTERNAL.test(e.email))) anons.add(e.anon_id)
  }
  const isInternal = (e: EventRow) =>
    (e.user_id !== null && ids.has(e.user_id)) || (e.anon_id !== null && anons.has(e.anon_id)) || (!!e.email && INTERNAL.test(e.email))
  return { ids, isInternal }
}

const visitorOf = (e: EventRow) => e.anon_id || (typeof e.meta?.session === 'string' ? e.meta.session : null) || `row-${e.id}`
const str = (v: unknown) => (typeof v === 'string' && v ? v : null)

/* ── Small classifiers ──────────────────────────────────────────────── */

const SOURCES: [RegExp, string][] = [
  [/google\./, 'Google'],
  [/bing\.com/, 'Bing'],
  [/duckduckgo/, 'DuckDuckGo'],
  [/search\.yahoo|yahoo\.com/, 'Yahoo'],
  [/yandex/, 'Yandex'],
  [/ecosia/, 'Ecosia'],
  [/brave\.com/, 'Brave Search'],
  [/chatgpt\.com|chat\.openai\.com|openai\.com/, 'ChatGPT'],
  [/perplexity/, 'Perplexity'],
  [/claude\.ai|anthropic/, 'Claude'],
  [/gemini\.google|bard\.google/, 'Gemini'],
  [/copilot\.microsoft/, 'Copilot'],
  [/linkedin|lnkd\.in/, 'LinkedIn'],
  [/twitter\.com|x\.com|t\.co$/, 'X (Twitter)'],
  [/facebook|fb\.com|fb\.me/, 'Facebook'],
  [/instagram/, 'Instagram'],
  [/reddit/, 'Reddit'],
  [/youtube|youtu\.be/, 'YouTube'],
  [/github/, 'GitHub'],
  [/producthunt/, 'Product Hunt'],
  [/chromewebstore|chrome\.google\.com/, 'Chrome Web Store'],
  [/mail\.|outlook|gmail/, 'Email'],
]

export function sourceOf(meta: Record<string, unknown>): string {
  const utm = str(meta.utm_source)
  if (utm) return utm.toLowerCase() === 'chatgpt.com' ? 'ChatGPT' : `Campaign: ${utm}`
  if (meta.gclid) return 'Google Ads'
  const ref = str(meta.referrer)
  if (!ref) return 'Direct / typed'
  let host = ref
  try {
    host = new URL(ref).hostname.replace(/^www\./, '')
  } catch {}
  for (const [re, name] of SOURCES) if (re.test(host)) return name
  return host
}

export function deviceOf(e: EventRow): string {
  const ua = e.user_agent || ''
  const w = typeof e.meta?.screen === 'number' ? e.meta.screen : null
  if (/iPad|Tablet/i.test(ua)) return 'Tablet'
  if (/Mobi|iPhone|Android.+Mobile/i.test(ua) || (w !== null && w < 640)) return 'Phone'
  if (w !== null && w < 1024) return 'Tablet'
  return 'Computer'
}

export function browserOf(ua: string | null): string {
  if (!ua) return 'Unknown'
  if (/Edg\//.test(ua)) return 'Edge'
  if (/OPR\/|Opera/.test(ua)) return 'Opera'
  if (/SamsungBrowser/.test(ua)) return 'Samsung Internet'
  if (/Firefox\//.test(ua)) return 'Firefox'
  if (/Chrome\//.test(ua)) return 'Chrome'
  if (/Safari\//.test(ua)) return 'Safari'
  return 'Other'
}

export function osOf(ua: string | null): string {
  if (!ua) return 'Unknown'
  if (/iPhone|iPad|iOS/.test(ua)) return 'iOS'
  if (/Android/.test(ua)) return 'Android'
  if (/Windows/.test(ua)) return 'Windows'
  if (/Mac OS X|Macintosh/.test(ua)) return 'macOS'
  if (/CrOS/.test(ua)) return 'ChromeOS'
  if (/Linux/.test(ua)) return 'Linux'
  return 'Other'
}

/** The area of the product a path belongs to. Public pages are grouped by section. */
export const SECTION: [RegExp, string][] = [
  [/^\/$/, 'Home page'],
  [/^\/(login|signup|forgot-password|reset-password)/, 'Sign in / sign up'],
  [/^\/dashboard/, 'Dashboard'],
  [/^\/jobs/, 'Job search'],
  [/^\/saved-jobs/, 'Saved jobs'],
  [/^\/applications/, 'Application tracker'],
  [/^\/resume/, 'Resume'],
  [/^\/cover-letters/, 'Cover letters'],
  [/^\/interview-coach/, 'Interview coach'],
  [/^\/network/, 'Referral network'],
  [/^\/auto-apply/, 'Auto-apply'],
  [/^\/extension/, 'Chrome extension'],
  [/^\/profile/, 'Profile'],
  [/^\/onboarding/, 'Onboarding'],
  [/^\/settings/, 'Settings & billing'],
  [/^\/notifications/, 'Notifications'],
  [/^\/support/, 'Support'],
  [/^\/pricing/, 'Pricing page'],
  [/^\/features/, 'Feature pages'],
  [/^\/blog/, 'Blog'],
  [/^\/(autofill|compare|alternatives|tools)/, 'Search landing pages'],
  [/^\/(privacy|terms)/, 'Legal pages'],
  [/^\/admin/, 'Admin'],
]
export const sectionOf = (path: string) => SECTION.find(([re]) => re.test(path))?.[1] ?? 'Other pages'
export const APP_SECTIONS = new Set([
  'Dashboard', 'Job search', 'Saved jobs', 'Application tracker', 'Resume', 'Cover letters', 'Interview coach',
  'Referral network', 'Auto-apply', 'Chrome extension', 'Profile', 'Onboarding', 'Settings & billing', 'Notifications',
])

function tally<K>(items: K[]): [K, number][] {
  const m = new Map<K, number>()
  for (const k of items) m.set(k, (m.get(k) ?? 0) + 1)
  return [...m.entries()].sort((a, b) => b[1] - a[1])
}

/** Distinct people per key. */
function reach(rows: { key: string; who: string }[]) {
  const m = new Map<string, Set<string>>()
  for (const r of rows) {
    const s = m.get(r.key) ?? new Set<string>()
    s.add(r.who)
    m.set(r.key, s)
  }
  return m
}

function daySeries(days: number) {
  const out: string[] = []
  for (let i = days - 1; i >= 0; i--) out.push(new Date(Date.now() - i * DAY).toISOString().slice(0, 10))
  return out
}

/* ── Visitors ───────────────────────────────────────────────────────── */

export async function loadTraffic(days: number) {
  const db = createAdminClient()
  const [users, evs] = await Promise.all([listAuthUsers(), events(db, days)])
  const { isInternal } = internals(users, evs)
  const views = evs.filter(e => e.event === 'page_view' && !isInternal(e))
  const now = Date.now()
  const today = dayKey(new Date().toISOString())

  // Per day: distinct visitors and page views.
  const series = daySeries(days).map(day => ({ day, visitors: new Set<string>(), views: 0, signedIn: new Set<string>() }))
  const at = new Map(series.map((s, i) => [s.day, i]))
  for (const e of views) {
    const i = at.get(dayKey(e.created_at))
    if (i === undefined) continue
    series[i].visitors.add(visitorOf(e))
    series[i].views += 1
    if (e.user_id) series[i].signedIn.add(e.user_id)
  }

  const visitorsIn = (ms: number) => new Set(views.filter(e => now - t(e.created_at) < ms).map(visitorOf)).size

  // Visits (sessions): first page, length, where they came from.
  const sessions = new Map<string, { first: EventRow; n: number }>()
  for (const e of [...views].reverse()) {
    const sid = str(e.meta?.session) ?? `row-${e.id}`
    const s = sessions.get(sid)
    if (s) s.n += 1
    else sessions.set(sid, { first: e, n: 1 })
  }
  const visits = [...sessions.values()]
  const bounced = visits.filter(v => v.n === 1).length

  const byVisitor = (pick: (e: EventRow) => string | null, list = views) => {
    const r = reach(list.flatMap(e => {
      const k = pick(e)
      return k ? [{ key: k, who: visitorOf(e) }] : []
    }))
    return [...r.entries()].map(([k, s]) => [k, s.size] as [string, number]).sort((a, b) => b[1] - a[1])
  }

  const firstViews = visits.map(v => v.first)
  const pages = tally(views.map(e => e.path || '/')).slice(0, 25)
  const pageVisitors = reach(views.map(e => ({ key: e.path || '/', who: visitorOf(e) })))

  // Did visitors become accounts? A browser that later appears with a user id.
  const accountsByAnon = new Map<string, string>()
  for (const e of evs) if (e.anon_id && e.user_id) accountsByAnon.set(e.anon_id, e.user_id)
  const newUserIds = new Set(users.filter(u => !INTERNAL.test(u.email || '') && t(u.created_at) > now - days * DAY).map(u => u.id))
  const anonVisitors = new Set(views.filter(e => !e.user_id && e.anon_id).map(e => e.anon_id as string))
  const converted = [...anonVisitors].filter(a => newUserIds.has(accountsByAnon.get(a) ?? '')).length

  const totalVisitors = new Set(views.map(visitorOf)).size
  // Returning: seen on more than one day in the window.
  const daysPerVisitor = reach(views.map(e => ({ key: visitorOf(e), who: dayKey(e.created_at) })))
  const returningVisitors = [...daysPerVisitor.values()].filter(s => s.size > 1).length

  return {
    days,
    tracked: views.length > 0,
    now: visitorsIn(5 * 60 * 1000),
    today: series.find(s => s.day === today)?.visitors.size ?? 0,
    last24h: visitorsIn(DAY),
    visitors: totalVisitors,
    views: views.length,
    visits: visits.length,
    pagesPerVisit: visits.length ? views.length / visits.length : 0,
    bounceRate: visits.length ? bounced / visits.length : 0,
    returningVisitors,
    signups: newUserIds.size,
    converted,
    series: series.map(s => ({ day: s.day, visitors: s.visitors.size, views: s.views, signedIn: s.signedIn.size })),
    pages: pages.map(([p, n]) => ({ path: p, views: n, visitors: pageVisitors.get(p)?.size ?? 0, section: sectionOf(p) })),
    landing: byVisitor(e => str(e.meta?.landing) ?? e.path, firstViews).slice(0, 15),
    sources: byVisitor(e => sourceOf(e.meta || {}), firstViews).slice(0, 20),
    referrers: byVisitor(e => str(e.meta?.referrer), firstViews).slice(0, 20),
    campaigns: byVisitor(e => str(e.meta?.utm_campaign), firstViews).slice(0, 10),
    countries: byVisitor(e => e.country).slice(0, 25),
    cities: byVisitor(e => (str(e.meta?.city) ? `${e.meta.city}${e.country ? `, ${e.country}` : ''}` : null)).slice(0, 25),
    devices: byVisitor(deviceOf),
    browsers: byVisitor(e => browserOf(e.user_agent)),
    systems: byVisitor(e => osOf(e.user_agent)),
    languages: byVisitor(e => str(e.meta?.lang)).slice(0, 10),
    live: views.filter(e => now - t(e.created_at) < 30 * 60 * 1000).slice(0, 25),
  }
}

/* ── People ─────────────────────────────────────────────────────────── */

type Prefs = {
  user_id: string
  desired_job_title: string | null
  target_roles: string[] | null
  target_locations: string[] | null
  country_preference: string | null
  experience_level: string | null
  auto_apply_mode: string | null
}

const countBy = (rows: { user_id: string | null }[]) => {
  const m = new Map<string, number>()
  for (const r of rows) if (r.user_id) m.set(r.user_id, (m.get(r.user_id) ?? 0) + 1)
  return m
}

export type Person = {
  id: string
  email: string | null
  name: string | null
  provider: string
  joined: string
  confirmed: boolean
  plan: string
  onboarded: boolean
  lastSeen: string | null
  country: string | null
  city: string | null
  device: string | null
  target: string | null
  locations: string | null
  experience: string | null
  autoApply: string | null
  counts: {
    applications: number
    applied: number
    resumes: number
    coverLetters: number
    interviews: number
    contacts: number
    referrals: number
    receipts: number
    searches: number
    views: number
    issues: number
  }
  extension: boolean
  paying: boolean
  topSection: string | null
}

const ISSUE_EVENTS = new Set(['ui_error', 'api_error', 'client_error', 'payment_webhook_failed', ...FAILURE_EVENTS])

export async function loadPeople() {
  const db = createAdminClient()
  const sel = (table: string, cols = 'user_id') =>
    all<Record<string, unknown>>((from, to) => db.from(table).select(cols).range(from, to) as unknown as PromiseLike<{ data: Record<string, unknown>[] | null; error: unknown }>)
  const [users, evs, profiles, prefs, apps, resumes, letters, interviews, contacts, referrals, receipts, tokens, subs] = await Promise.all([
    listAuthUsers(),
    events(db, 90),
    sel('profiles', 'id, plan, full_name, onboarding_complete'),
    sel('job_preferences', 'user_id, desired_job_title, target_roles, target_locations, country_preference, experience_level, auto_apply_mode'),
    sel('applications', 'user_id, status, applied_at'),
    sel('resumes'),
    sel('cover_letters'),
    sel('interview_sessions'),
    sel('network_connections'),
    sel('referral_requests'),
    sel('application_receipts'),
    sel('extension_tokens', 'user_id, revoked_at'),
    sel('subscriptions', 'user_id, plan, status, stripe_customer_id'),
  ])

  const profile = new Map(profiles.map(p => [p.id as string, p]))
  const pref = new Map((prefs as unknown as Prefs[]).map(p => [p.user_id, p]))
  const appsBy = countBy(apps as { user_id: string }[])
  const appliedBy = countBy((apps as { user_id: string; status: string; applied_at: string | null }[]).filter(a => a.applied_at || ['applied', 'interview', 'interviewing', 'offer', 'rejected'].includes(a.status)))
  const counts = {
    resumes: countBy(resumes as { user_id: string }[]),
    letters: countBy(letters as { user_id: string }[]),
    interviews: countBy(interviews as { user_id: string }[]),
    contacts: countBy(contacts as { user_id: string }[]),
    referrals: countBy(referrals as { user_id: string }[]),
    receipts: countBy(receipts as { user_id: string }[]),
  }
  const extension = new Set((tokens as { user_id: string; revoked_at: string | null }[]).filter(x => !x.revoked_at).map(x => x.user_id))
  const paying = new Set((subs as { user_id: string; status: string; stripe_customer_id: string | null }[]).filter(s => s.stripe_customer_id && s.status !== 'canceled').map(s => s.user_id))

  const byUser = new Map<string, EventRow[]>()
  for (const e of evs) {
    if (!e.user_id) continue
    const l = byUser.get(e.user_id) ?? []
    l.push(e)
    byUser.set(e.user_id, l)
  }

  const people: Person[] = users
    .filter(u => !INTERNAL.test(u.email || ''))
    .map(u => {
      const p = profile.get(u.id)
      const pr = pref.get(u.id)
      const mine = byUser.get(u.id) ?? [] // newest first
      const located = mine.find(e => e.country)
      const lastEvent = mine[0]?.created_at ?? null
      const lastSeen = [lastEvent, u.last_sign_in_at].filter(Boolean).sort().pop() ?? null
      const sections = tally(mine.filter(e => e.event === 'page_view').map(e => sectionOf(e.path || '/')).filter(s => APP_SECTIONS.has(s) && s !== 'Dashboard'))
      return {
        id: u.id,
        email: u.email,
        name: (p?.full_name as string) || u.name,
        provider: u.provider,
        joined: u.created_at,
        confirmed: !!u.email_confirmed_at || u.provider !== 'email',
        plan: (p?.plan as string) || 'free',
        onboarded: !!p?.onboarding_complete,
        lastSeen,
        country: located?.country ?? null,
        city: str(located?.meta?.city),
        device: mine.find(e => e.event === 'page_view') ? deviceOf(mine.find(e => e.event === 'page_view') as EventRow) : null,
        target: pr?.desired_job_title || pr?.target_roles?.filter(Boolean).slice(0, 2).join(', ') || null,
        locations: pr?.target_locations?.filter(Boolean).slice(0, 2).join(', ') || pr?.country_preference || null,
        experience: pr?.experience_level ?? null,
        autoApply: pr?.auto_apply_mode ?? null,
        counts: {
          applications: appsBy.get(u.id) ?? 0,
          applied: appliedBy.get(u.id) ?? 0,
          resumes: counts.resumes.get(u.id) ?? 0,
          coverLetters: counts.letters.get(u.id) ?? 0,
          interviews: counts.interviews.get(u.id) ?? 0,
          contacts: counts.contacts.get(u.id) ?? 0,
          referrals: counts.referrals.get(u.id) ?? 0,
          receipts: counts.receipts.get(u.id) ?? 0,
          searches: mine.filter(e => e.event === 'job_search').length,
          views: mine.filter(e => e.event === 'page_view').length,
          issues: mine.filter(e => ISSUE_EVENTS.has(e.event)).length,
        },
        extension: extension.has(u.id),
        paying: paying.has(u.id),
        topSection: sections[0]?.[0] ?? null,
      }
    })
    .sort((a, b) => t(b.lastSeen) - t(a.lastSeen))

  const plans = tally(people.map(p => p.plan))
  const now = Date.now()
  return {
    people,
    plans,
    total: people.length,
    active7: people.filter(p => now - t(p.lastSeen) < 7 * DAY).length,
    activeToday: people.filter(p => now - t(p.lastSeen) < DAY).length,
    paying: people.filter(p => p.paying).length,
    withResume: people.filter(p => p.counts.resumes > 0).length,
    onboarded: people.filter(p => p.onboarded).length,
    countries: tally(people.map(p => p.country).filter((c): c is string => !!c)),
  }
}

/** One person, in full: who they are, what they did, what went wrong. */
export async function loadPerson(id: string) {
  const db = createAdminClient()
  const [{ data: authUser }, profile, prefs, apps, support, evs, sub] = await Promise.all([
    db.auth.admin.getUserById(id),
    db.from('profiles').select('*').eq('id', id).maybeSingle(),
    db.from('job_preferences').select('*').eq('user_id', id).maybeSingle(),
    db.from('applications').select('id, status, created_at, applied_at, match_score, portal_type, jobs(title, company, location, url)').eq('user_id', id).order('created_at', { ascending: false }).limit(60),
    db.from('support_messages').select('*').eq('user_id', id).order('created_at', { ascending: false }).limit(20),
    all<EventRow>((from, to) => db.from('app_events').select('*').eq('user_id', id).order('created_at', { ascending: false }).range(from, to), 5000),
    db.from('subscriptions').select('*').eq('user_id', id).maybeSingle(),
  ])
  if (!authUser?.user) return null
  const u = authUser.user
  // Their anonymous visits before signing in, from the same browsers.
  const anons = [...new Set(evs.map(e => e.anon_id).filter((a): a is string => !!a))]
  const before = anons.length
    ? await all<EventRow>((from, to) => db.from('app_events').select('*').in('anon_id', anons.slice(0, 20)).is('user_id', null).order('created_at', { ascending: false }).range(from, to), 3000)
    : []
  const timeline = [...evs, ...before].sort((a, b) => t(b.created_at) - t(a.created_at))
  const first = [...timeline].reverse().find(e => e.event === 'page_view')
  return {
    user: {
      id: u.id,
      email: u.email ?? null,
      name: (profile.data?.full_name as string) || (u.user_metadata?.full_name as string) || null,
      provider: (u.app_metadata?.provider as string) || 'email',
      joined: u.created_at,
      lastSignIn: u.last_sign_in_at ?? null,
    },
    profile: profile.data as Record<string, unknown> | null,
    prefs: prefs.data as Record<string, unknown> | null,
    subscription: sub.data as Record<string, unknown> | null,
    applications: (apps.data ?? []) as unknown as {
      id: string
      status: string
      created_at: string
      applied_at: string | null
      match_score: number | null
      portal_type: string | null
      jobs: { title: string; company: string; location: string | null; url: string | null } | null
    }[],
    support: (support.data ?? []) as SupportRow[],
    timeline: timeline.slice(0, 400),
    issues: timeline.filter(e => ISSUE_EVENTS.has(e.event)).slice(0, 50),
    firstSource: first ? sourceOf(first.meta || {}) : null,
    firstLanding: first ? str(first.meta?.landing) ?? first.path : null,
    sections: tally(evs.filter(e => e.event === 'page_view').map(e => sectionOf(e.path || '/'))),
  }
}

/* ── Features and jobs ──────────────────────────────────────────────── */

export async function loadUsage(days: number) {
  const db = createAdminClient()
  const since = new Date(Date.now() - days * DAY).toISOString()
  const week = Date.now() - 7 * DAY
  const rows = (table: string, cols: string, col = 'created_at') =>
    all<Record<string, unknown>>((from, to) => db.from(table).select(cols).gte(col, since).range(from, to) as unknown as PromiseLike<{ data: Record<string, unknown>[] | null; error: unknown }>)

  const [users, evs, apps, applied, resumes, tailored, letters, interviews, referrals, receipts, tokens, prefs, jobsAll] = await Promise.all([
    listAuthUsers(),
    events(db, days),
    rows('applications', 'user_id, created_at, status, job_id, portal_type'),
    rows('applications', 'user_id, applied_at, job_id', 'applied_at'),
    rows('resumes', 'user_id, created_at'),
    rows('tailored_resumes', 'user_id, created_at'),
    rows('cover_letters', 'user_id, created_at'),
    rows('interview_sessions', 'user_id, created_at, interview_type, overall_score'),
    rows('referral_requests', 'user_id, created_at, status'),
    rows('application_receipts', 'user_id, created_at, submission_method, destination'),
    rows('extension_tokens', 'user_id, created_at'),
    all<Record<string, unknown>>((from, to) => db.from('job_preferences').select('user_id, auto_apply_mode').range(from, to)),
    all<Record<string, unknown>>((from, to) => db.from('applications').select('status, job_id, user_id').range(from, to)),
  ])
  const { ids: internalIds, isInternal } = internals(users, evs)
  const customer = (r: Record<string, unknown>) => typeof r.user_id === 'string' && !internalIds.has(r.user_id)
  const ev = evs.filter(e => !isInternal(e))

  type Row = Record<string, unknown>
  const feature = (name: string, what: string, list: Row[], dateCol = 'created_at') => {
    const mine = list.filter(customer)
    return {
      name,
      what,
      people: new Set(mine.map(r => r.user_id as string)).size,
      people7: new Set(mine.filter(r => t(r[dateCol] as string) > week).map(r => r.user_id as string)).size,
      times: mine.length,
    }
  }
  const evRows = (name: string, filter: (e: EventRow) => boolean = () => true) =>
    ev.filter(e => e.event === name && e.user_id && filter(e)).map(e => ({ user_id: e.user_id, created_at: e.created_at }) as Row)

  const actions = [
    feature('Searched for jobs', 'Job searches run', evRows('job_search')),
    feature('Saved or queued a job', 'Jobs added to the tracker', apps),
    feature('Marked a job applied', 'Applications marked applied', applied, 'applied_at'),
    feature('Applied with the extension', 'Receipts from the Chrome extension', receipts.filter(r => r.submission_method === 'assisted')),
    feature('Recorded an application by hand', 'Receipts from the apply kit', receipts.filter(r => r.submission_method === 'manual')),
    feature('Uploaded a resume', 'Resumes uploaded', resumes),
    feature('Tailored a resume to a job', 'Tailored resumes', tailored),
    feature('Wrote a cover letter', 'Cover letters', letters),
    feature('Practised an interview', 'Interview sessions', interviews),
    feature('Imported LinkedIn network', 'Imports', evRows('network_imported')),
    feature('Asked for a referral', 'Referral asks drafted', referrals),
    feature('Connected the extension', 'Extension keys created', tokens),
    feature('Clicked a paid plan', 'Upgrade clicks', evRows('upgrade_interest')),
  ].sort((a, b) => b.people - a.people || b.times - a.times)

  // Where signed-in people spend their time, by section of the app.
  const appViews = ev.filter(e => e.event === 'page_view' && e.user_id && !internalIds.has(e.user_id))
  const sectionReach = reach(appViews.map(e => ({ key: sectionOf(e.path || '/'), who: e.user_id as string })))
  const sectionViews = tally(appViews.map(e => sectionOf(e.path || '/')))
  const sections = sectionViews
    .filter(([s]) => APP_SECTIONS.has(s))
    .map(([s, views]) => ({ section: s, views, people: sectionReach.get(s)?.size ?? 0 }))
    .sort((a, b) => b.people - a.people || b.views - a.views)

  // Searches: what people look for, and what finds nothing.
  const searches = ev.filter(e => e.event === 'job_search' && e.user_id && !internalIds.has(e.user_id))
  const norm = (s: unknown) => (typeof s === 'string' ? s.trim().toLowerCase().replace(/\s+/g, ' ') : '')
  const queryReach = reach(searches.map(e => ({ key: norm(e.meta?.query), who: e.user_id as string })))
  const topQueries = tally(searches.map(e => norm(e.meta?.query)).filter(Boolean))
    .slice(0, 20)
    .map(([q, n]) => ({ query: q, times: n, people: queryReach.get(q)?.size ?? 0 }))
  const topLocations = tally(searches.map(e => norm(e.meta?.location) || 'anywhere')).slice(0, 15)
  const empty = tally(searches.filter(e => e.meta?.results === 0).map(e => `${norm(e.meta?.query)}${norm(e.meta?.location) ? ` · ${norm(e.meta?.location)}` : ''}`)).slice(0, 15)

  // Jobs people act on: most saved and applied, by title and company.
  const custApps = jobsAll.filter(customer)
  const jobIds = [...new Set(custApps.map(a => a.job_id as string).filter(Boolean))]
  const jobs = new Map<string, { title: string; company: string; source: string | null }>()
  for (let i = 0; i < jobIds.length; i += 300) {
    const { data } = await db.from('jobs').select('id, title, company, source').in('id', jobIds.slice(i, i + 300))
    for (const j of data ?? []) jobs.set(j.id, { title: j.title, company: j.company, source: j.source })
  }
  const recentApps = apps.filter(customer)
  const titleOf = (id: unknown) => jobs.get(id as string)?.title?.trim() || 'Unknown role'
  const companyOf = (id: unknown) => jobs.get(id as string)?.company?.trim() || 'Unknown company'
  const titleReach = reach(recentApps.map(a => ({ key: titleOf(a.job_id), who: a.user_id as string })))
  const companyReach = reach(recentApps.map(a => ({ key: companyOf(a.job_id), who: a.user_id as string })))
  const topTitles = tally(recentApps.map(a => titleOf(a.job_id))).slice(0, 15).map(([k, n]) => ({ name: k, times: n, people: titleReach.get(k)?.size ?? 0 }))
  const topCompanies = tally(recentApps.map(a => companyOf(a.job_id))).slice(0, 15).map(([k, n]) => ({ name: k, times: n, people: companyReach.get(k)?.size ?? 0 }))
  const appliedJobs = tally(applied.filter(customer).map(a => `${titleOf(a.job_id)} · ${companyOf(a.job_id)}`)).slice(0, 15)
  const statuses = tally(custApps.map(a => (a.status as string) || 'unknown'))
  const portals = tally(recentApps.map(a => (a.portal_type as string) || 'not set'))
  const jobSources = tally(recentApps.map(a => jobs.get(a.job_id as string)?.source || 'unknown'))
  const destinations = tally(receipts.filter(customer).map(r => (r.destination as string) || 'unknown'))
  const autoModes = tally(prefs.filter(customer).map(p => (p.auto_apply_mode as string) || 'off'))
  const interviewTypes = tally(interviews.filter(customer).map(i => (i.interview_type as string) || 'other'))

  return { days, actions, sections, topQueries, topLocations, empty, searches: searches.length, topTitles, topCompanies, appliedJobs, statuses, portals, jobSources, destinations, autoModes, interviewTypes }
}

/* ── Issues ─────────────────────────────────────────────────────────── */

const ISSUE_LABEL: Record<string, string> = {
  ui_error: 'Error message shown',
  api_error: 'Request failed',
  client_error: 'Page crashed or script error',
  payment_webhook_failed: 'Payment problem',
}

/** Messages that differ only by an id, a number or an email are the same problem. */
function signature(msg: string) {
  return msg
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '…')
    .replace(/\b[\w.+-]+@[\w-]+\.[\w.]+\b/g, '<email>')
    .replace(/\b\d{3,}\b/g, '#')
    .trim()
}

export async function loadIssues(days: number) {
  const db = createAdminClient()
  const since = new Date(Date.now() - days * DAY).toISOString()
  const [users, evs, support] = await Promise.all([
    listAuthUsers(),
    events(db, days),
    db.from('support_messages').select('*').gte('created_at', since).order('created_at', { ascending: false }).limit(200),
  ])
  const { isInternal } = internals(users, evs)
  const emailOf = new Map(users.map(u => [u.id, u.email]))
  const problems = evs.filter(e => ISSUE_EVENTS.has(e.event) && !isInternal(e))

  type Group = { key: string; kind: string; message: string; count: number; people: Set<string>; emails: Set<string>; first: string; last: string; pages: Map<string, number>; status: number | null }
  const groups = new Map<string, Group>()
  for (const e of problems) {
    const kind = ISSUE_LABEL[e.event] ?? e.event.replace(/_/g, ' ')
    const message = signature(e.error_message || e.error_code || 'No message')
    const key = `${e.event}|${message}`
    const g = groups.get(key) ?? { key, kind, message, count: 0, people: new Set(), emails: new Set(), first: e.created_at, last: e.created_at, pages: new Map(), status: null }
    g.count += 1
    g.people.add(e.user_id || e.anon_id || e.email || `row-${e.id}`)
    const email = e.email || (e.user_id ? emailOf.get(e.user_id) : null)
    if (email) g.emails.add(email)
    if (e.created_at < g.first) g.first = e.created_at
    if (e.created_at > g.last) g.last = e.created_at
    const page = str(e.meta?.page) || e.path
    if (page) g.pages.set(page, (g.pages.get(page) ?? 0) + 1)
    if (typeof e.meta?.status === 'number') g.status = e.meta.status
    groups.set(key, g)
  }
  const list = [...groups.values()]
    .map(g => ({
      ...g,
      people: g.people.size,
      emails: [...g.emails].slice(0, 5),
      pages: [...g.pages.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([p]) => p),
    }))
    .sort((a, b) => b.people - a.people || b.count - a.count)

  const series = daySeries(days).map(day => ({ day, n: 0 }))
  const at = new Map(series.map((s, i) => [s.day, i]))
  for (const e of problems) {
    const i = at.get(dayKey(e.created_at))
    if (i !== undefined) series[i].n += 1
  }

  const affected = new Map<string, { email: string; n: number; last: string }>()
  for (const e of problems) {
    const email = e.email || (e.user_id ? emailOf.get(e.user_id) : null)
    if (!email) continue
    const cur = affected.get(email) ?? { email, n: 0, last: e.created_at }
    cur.n += 1
    if (e.created_at > cur.last) cur.last = e.created_at
    affected.set(email, cur)
  }
  const userIdByEmail = new Map(users.map(u => [(u.email || '').toLowerCase(), u.id]))

  const searches = evs.filter(e => e.event === 'job_search' && !isInternal(e))
  const emptySearches = searches.filter(e => e.meta?.results === 0)

  return {
    days,
    total: problems.length,
    people: new Set(problems.map(e => e.user_id || e.anon_id || e.email)).size,
    groups: list,
    series,
    byKind: tally(problems.map(e => ISSUE_LABEL[e.event] ?? (FAILURE_EVENTS.has(e.event) ? 'Sign-in / sign-up failure' : e.event))),
    affected: [...affected.values()]
      .sort((a, b) => b.n - a.n)
      .slice(0, 20)
      .map(a => ({ ...a, id: userIdByEmail.get(a.email.toLowerCase()) ?? null })),
    support: ((support.data ?? []) as SupportRow[]).filter(s => !INTERNAL.test(s.email)),
    emptySearches: emptySearches.length,
    searches: searches.length,
    recent: problems.slice(0, 40).map(e => ({ ...e, email: e.email || (e.user_id ? emailOf.get(e.user_id) ?? null : null) })),
  }
}
