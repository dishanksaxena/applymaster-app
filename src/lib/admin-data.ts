import 'server-only'
import { notFound, redirect } from 'next/navigation'
import { createAdminClient, isMissingTable } from './supabase-admin'
import { createClient } from './supabase-server'
import { isAdminEmail } from './supabase-admin'

/**
 * Everything the owner's dashboard shows, gathered server-side.
 *
 * Two sources, deliberately combined:
 *   - auth.users, through the admin API: who has an account, how they signed
 *     up, whether they ever confirmed, when they last came back
 *   - app_events: everything that happened before an account existed or
 *     instead of a sign-in — the attempts that never became a row anywhere
 */

export type AdminUser = { id: string; email: string } | null

/** The signed-in user if, and only if, they are an admin. */
export async function getAdmin(): Promise<AdminUser> {
  const {
    data: { user },
  } = await createClient().auth.getUser()
  if (!user?.email || !isAdminEmail(user.email)) return null
  return { id: user.id, email: user.email }
}

/** For every /admin page: sign in first, and anyone who is not an admin gets a plain 404. */
export async function requireAdmin(next = '/admin'): Promise<{ id: string; email: string }> {
  const {
    data: { user },
  } = await createClient().auth.getUser()
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`)
  const admin = await getAdmin()
  if (!admin) notFound()
  return admin
}

export type AuthUserRow = {
  id: string
  email: string | null
  created_at: string
  last_sign_in_at: string | null
  email_confirmed_at: string | null
  confirmation_sent_at: string | null
  provider: string
  name: string | null
}

export type EventRow = {
  id: number
  created_at: string
  event: string
  outcome: string | null
  method: string | null
  email: string | null
  user_id: string | null
  error_code: string | null
  error_message: string | null
  path: string | null
  anon_id: string | null
  country: string | null
  user_agent: string | null
  meta: Record<string, unknown>
}

export type SupportRow = {
  id: string
  created_at: string
  user_id: string | null
  name: string | null
  email: string
  category: string
  message: string
  context: Record<string, unknown>
  status: string
  emailed: boolean
}

const DAY = 86400000
const since = (days: number) => Date.now() - days * DAY
const t = (iso: string | null | undefined) => (iso ? new Date(iso).getTime() : 0)

/* Accounts that belong to the business rather than to customers. Counting
   them would inflate every number on the page. */
export const INTERNAL = new RegExp(
  [
    '@applymaster\\.ai$',
    '^dishanksaxena',
    '^dishank110@gmail\\.com$',
    // More team or test accounts, comma-separated, without a code change.
    ...(process.env.INTERNAL_EMAILS || '')
      .split(',')
      .map(e => e.trim())
      .filter(Boolean)
      .map(e => `^${e.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`),
  ].join('|'),
  'i'
)

export async function listAuthUsers(): Promise<AuthUserRow[]> {
  const admin = createAdminClient()
  const out: AuthUserRow[] = []
  for (let page = 1; page < 50; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw error
    for (const u of data.users) {
      out.push({
        id: u.id,
        email: u.email ?? null,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at ?? null,
        email_confirmed_at: u.email_confirmed_at ?? null,
        confirmation_sent_at: (u as { confirmation_sent_at?: string }).confirmation_sent_at ?? null,
        provider: (u.app_metadata?.provider as string) || 'email',
        name: (u.user_metadata?.full_name as string) || (u.user_metadata?.name as string) || null,
      })
    }
    if (data.users.length < 1000) break
  }
  return out
}

export const FAILURE_EVENTS = new Set([
  'login_failed',
  'signup_failed',
  'signup_existing_account',
  'oauth_failed',
  'oauth_callback_failed',
  'password_reset_failed',
  'password_update_failed',
  'confirm_resend_failed',
  'support_failed',
])
const SUCCESS_EVENTS = new Set(['login_success', 'oauth_callback_success', 'password_updated'])

export type StuckPerson = {
  key: string
  email: string | null
  attempts: number
  lastError: string
  lastEvent: string
  lastAt: string
  country: string | null
  hasAccount: boolean
}

export async function loadAdminData() {
  const admin = createAdminClient()

  const [usersResult, eventsResult, supportResult] = await Promise.all([
    listAuthUsers().then(
      users => ({ users, error: null as string | null }),
      err => ({ users: [] as AuthUserRow[], error: err instanceof Error ? err.message : String(err) })
    ),
    // Page views and searches have their own tabs; leaving them out keeps this window to auth and support.
    admin
      .from('app_events')
      .select('*')
      .gte('created_at', new Date(since(30)).toISOString())
      .not('event', 'in', '(page_view,job_search)')
      .order('created_at', { ascending: false })
      .limit(10000),
    admin.from('support_messages').select('*').order('created_at', { ascending: false }).limit(200),
  ])

  // All-time, not the 30-day window: people who tried to pay are the list
  // to email the day payments open, however long ago they clicked.
  const { data: payRows } = await admin
    .from('app_events')
    .select('created_at, event, email, user_id, error_message, meta')
    .in('event', ['upgrade_interest', 'plan_changed', 'payment_webhook_failed'])
    .order('created_at', { ascending: false })
    .limit(1000)

  // Today at a glance: visitors (from page views), customers active, paying, problems.
  const [{ data: viewRows }, { data: subRows }] = await Promise.all([
    admin
      .from('app_events')
      .select('anon_id, user_id, email, created_at')
      .eq('event', 'page_view')
      .gte('created_at', new Date(since(7)).toISOString())
      .limit(50000),
    admin.from('subscriptions').select('user_id, plan, status, stripe_customer_id'),
  ])

  const trackingReady = !isMissingTable(eventsResult.error)
  const supportReady = !isMissingTable(supportResult.error)
  const events = (eventsResult.data ?? []) as EventRow[]
  const support = (supportResult.data ?? []) as SupportRow[]

  const allUsers = usersResult.users
  const users = allUsers.filter(u => !INTERNAL.test(u.email || ''))
  const accountEmails = new Set(users.map(u => (u.email || '').toLowerCase()))

  // ── Accounts ────────────────────────────────────────────────────────
  const accounts = {
    total: users.length,
    new7: users.filter(u => t(u.created_at) > since(7)).length,
    new30: users.filter(u => t(u.created_at) > since(30)).length,
    active7: users.filter(u => t(u.last_sign_in_at) > since(7)).length,
    active30: users.filter(u => t(u.last_sign_in_at) > since(30)).length,
    google: users.filter(u => u.provider === 'google').length,
    email: users.filter(u => u.provider === 'email').length,
  }

  const unconfirmed = users
    .filter(u => u.provider === 'email' && !u.email_confirmed_at)
    .sort((a, b) => t(b.created_at) - t(a.created_at))

  const recentSignups = [...users].sort((a, b) => t(b.created_at) - t(a.created_at)).slice(0, 25)

  // Daily signups for the last 30 days, oldest first.
  const signupsByDay: { day: string; n: number }[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * DAY)
    const key = d.toISOString().slice(0, 10)
    signupsByDay.push({ day: key, n: 0 })
  }
  const dayIndex = new Map(signupsByDay.map((d, i) => [d.day, i]))
  for (const u of users) {
    const i = dayIndex.get(u.created_at.slice(0, 10))
    if (i !== undefined) signupsByDay[i].n += 1
  }

  // ── Events ──────────────────────────────────────────────────────────
  const ev7 = events.filter(e => t(e.created_at) > since(7))
  const count = (list: EventRow[], name: string) => list.filter(e => e.event === name).length
  const visitors = (list: EventRow[], page: string) =>
    new Set(
      list
        .filter(e => e.event === 'auth_page_view' && e.meta?.page === page)
        .map(e => e.anon_id || `row-${e.id}`)
    ).size

  const funnel = {
    loginVisitors: visitors(events, 'login'),
    loginAttempts: count(events, 'login_attempt'),
    loginSuccess: count(events, 'login_success'),
    loginFailed: count(events, 'login_failed'),
    signupVisitors: visitors(events, 'signup'),
    signupAttempts: count(events, 'signup_attempt'),
    signupSuccess: count(events, 'signup_success'),
    signupFailed: count(events, 'signup_failed') + count(events, 'signup_existing_account'),
    googleStarts: count(events, 'oauth_start'),
    googleSuccess: count(events, 'oauth_callback_success'),
    googleFailed: count(events, 'oauth_callback_failed') + count(events, 'oauth_failed'),
  }

  const failures7 = ev7.filter(e => FAILURE_EVENTS.has(e.event)).length

  /* Who actually came back. Distinct accounts that opened the app, and of
     those, how many had joined before the window — returning, not new. */
  const createdAt = new Map(users.map(u => [u.id, t(u.created_at)]))
  const openers = (list: EventRow[]) =>
    new Set(list.filter(e => e.event === 'app_open' && e.user_id && createdAt.has(e.user_id)).map(e => e.user_id as string))
  const opened7 = openers(ev7)
  const usage = {
    opened7: opened7.size,
    opened30: openers(events).size,
    returning7: [...opened7].filter(id => (createdAt.get(id) ?? 0) < since(7)).length,
  }

  // Failure reasons, grouped by the message a person actually saw.
  const reasons = new Map<string, number>()
  for (const e of events) {
    if (!FAILURE_EVENTS.has(e.event)) continue
    const key = `${e.event.replace(/_/g, ' ')} — ${e.error_message || e.error_code || 'no message'}`
    reasons.set(key, (reasons.get(key) ?? 0) + 1)
  }
  const failureReasons = [...reasons.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12)

  /* People who tried and did not get in: group each person's events (by
     email where we have one, else by browser id), and keep those whose most
     recent failure came after their most recent success. These are the
     people worth emailing. */
  const people = new Map<string, EventRow[]>()
  for (const e of events) {
    const key = e.email || (e.anon_id ? `anon:${e.anon_id}` : null)
    if (!key) continue
    const list = people.get(key) ?? []
    list.push(e)
    people.set(key, list)
  }
  // Attach anonymous events to an email when the same browser later typed one.
  const emailByAnon = new Map<string, string>()
  for (const e of events) if (e.anon_id && e.email) emailByAnon.set(e.anon_id, e.email)

  const stuck: StuckPerson[] = []
  for (const [key, list] of people) {
    if (key.startsWith('anon:') && emailByAnon.has(key.slice(5))) continue
    const merged = key.includes('@')
      ? [
          ...list,
          ...events.filter(e => !e.email && e.anon_id && emailByAnon.get(e.anon_id) === key),
        ]
      : list
    const lastFail = merged.filter(e => FAILURE_EVENTS.has(e.event)).sort((a, b) => t(b.created_at) - t(a.created_at))[0]
    if (!lastFail) continue
    const lastOk = merged.filter(e => SUCCESS_EVENTS.has(e.event)).sort((a, b) => t(b.created_at) - t(a.created_at))[0]
    if (lastOk && t(lastOk.created_at) > t(lastFail.created_at)) continue
    const email = key.includes('@') ? key : null
    stuck.push({
      key,
      email,
      attempts: merged.filter(e => FAILURE_EVENTS.has(e.event)).length,
      lastError: lastFail.error_message || lastFail.error_code || '—',
      lastEvent: lastFail.event,
      lastAt: lastFail.created_at,
      country: lastFail.country,
      hasAccount: email ? accountEmails.has(email) : false,
    })
  }
  stuck.sort((a, b) => t(b.lastAt) - t(a.lastAt))

  // ── Payments ────────────────────────────────────────────────────────
  type PayRow = Pick<EventRow, 'created_at' | 'event' | 'email' | 'user_id' | 'error_message' | 'meta'>
  const pay = (payRows ?? []) as PayRow[]
  const interest = new Map<string, { email: string; plans: Set<string>; clicks: number; last: string }>()
  for (const e of pay.filter(e => e.event === 'upgrade_interest')) {
    const key = e.email || e.user_id || 'unknown'
    const cur = interest.get(key) ?? { email: e.email || 'unknown', plans: new Set<string>(), clicks: 0, last: e.created_at }
    if (typeof e.meta?.plan === 'string') cur.plans.add(e.meta.plan)
    cur.clicks += 1
    if (e.created_at > cur.last) cur.last = e.created_at
    interest.set(key, cur)
  }
  const upgradeInterest = [...interest.values()]
    .map(i => ({ ...i, plans: [...i.plans] }))
    .sort((a, b) => t(b.last) - t(a.last))
  const planChanges = pay.filter(e => e.event === 'plan_changed' || e.event === 'payment_webhook_failed').slice(0, 30)

  // ── Today ───────────────────────────────────────────────────────────
  const internalIds = new Set(allUsers.filter(u => INTERNAL.test(u.email || '')).map(u => u.id))
  type ViewRow = { anon_id: string | null; user_id: string | null; email: string | null; created_at: string }
  const viewList = (viewRows ?? []) as ViewRow[]
  const internalAnons = new Set(viewList.filter(v => v.anon_id && v.user_id && internalIds.has(v.user_id)).map(v => v.anon_id as string))
  for (const e of events) if (e.anon_id && ((e.user_id && internalIds.has(e.user_id)) || (e.email && INTERNAL.test(e.email)))) internalAnons.add(e.anon_id)
  const views = viewList.filter(v => !(v.user_id && internalIds.has(v.user_id)) && !(v.anon_id && internalAnons.has(v.anon_id)))
  const startOfDay = new Date(new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }) + 'T00:00:00+05:30').getTime()
  const distinct = (list: ViewRow[]) => new Set(list.map(v => v.anon_id || v.user_id || v.created_at)).size
  const activeIn = (from: number) =>
    new Set([
      ...views.filter(v => v.user_id && t(v.created_at) >= from).map(v => v.user_id as string),
      ...events.filter(e => e.event === 'app_open' && e.user_id && !internalIds.has(e.user_id) && t(e.created_at) >= from).map(e => e.user_id as string),
    ]).size
  const problems7 = ev7.filter(
    e => ['ui_error', 'api_error', 'client_error'].includes(e.event) && !(e.user_id && internalIds.has(e.user_id)) && !(e.anon_id && internalAnons.has(e.anon_id))
  )
  const paidSubs = ((subRows ?? []) as { user_id: string; plan: string; status: string; stripe_customer_id: string | null }[]).filter(
    s => s.stripe_customer_id && s.status !== 'canceled' && !internalIds.has(s.user_id)
  )
  const planCounts = new Map<string, number>()
  for (const s of paidSubs) planCounts.set(s.plan, (planCounts.get(s.plan) ?? 0) + 1)
  const today = {
    visitors: distinct(views.filter(v => t(v.created_at) >= startOfDay)),
    visitors7: distinct(views),
    now: distinct(views.filter(v => t(v.created_at) > Date.now() - 5 * 60000)),
    activeUsers: activeIn(startOfDay),
    activeUsers7: activeIn(since(7)),
    paying: paidSubs.length,
    plans: [...planCounts.entries()].map(([p, n]) => `${n} ${p}`).join(' · '),
    issues7: problems7.length,
    issuePeople7: new Set(problems7.map(e => e.user_id || e.anon_id || e.id)).size,
  }

  return {
    today,
    upgradeInterest,
    planChanges,
    trackingReady,
    supportReady,
    usersError: usersResult.error,
    accounts,
    unconfirmed,
    recentSignups,
    signupsByDay,
    funnel,
    failures7,
    usage,
    failureReasons,
    stuck: stuck.slice(0, 50),
    recentEvents: events.filter(e => !['ui_error', 'api_error', 'client_error'].includes(e.event)).slice(0, 60),
    support,
    openSupport: support.filter(s => s.status === 'open').length,
  }
}
