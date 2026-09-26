import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { isCronRequest } from '@/lib/cron-auth'
import {
  GREENHOUSE_BOARDS,
  fetchGreenhouseBoard,
  fetchRemoteOK,
  searchAdzuna,
  countryCode,
  dbKeys,
  type FetchedJob,
} from '@/lib/job-fetch'
import { scoreJob, postingKey, type MatchPrefs } from '@/lib/job-match'

export const maxDuration = 300
export const dynamic = 'force-dynamic'

/**
 * The daily run for everyone who switched on auto-apply.
 *
 * What it replaces had never run. Vercel Cron calls routes with GET and this
 * route only answered POST, so every scheduled run was rejected with 405 —
 * while 19 people had auto-apply switched on and were waiting for matches.
 * Had it run, it would have read nothing: it used the cookie-session client,
 * and a cron has no session, so row-level security hid every user's data.
 * It also never fetched jobs, only recycled ones other users had searched,
 * and in autopilot mode it marked postings "applied" with a timestamp
 * without submitting anything.
 *
 * What it does now, per opted-in person:
 *   1. pulls fresh postings from the sources we really have — every live
 *      Greenhouse board, RemoteOK, and Adzuna for their top role and country
 *   2. scores each one deterministically against their preferences
 *   3. queues the best new ones, up to their daily limit, as "queued" —
 *      never "applied". No ATS accepts a submission over a public API, so
 *      the person confirms each application; the tracker only ever says
 *      "applied" when something was actually sent
 *   4. notes which of those are at companies where they know someone, so a
 *      referral can be asked for before applying cold
 *
 *   ?dry=1          score and report, write nothing
 *   ?user=<uuid>    one person only
 */

const MAX_PER_DAY = 25
const MAX_PER_COMPANY = 3
const COPILOT_MAX_PER_DAY = 10

type JobRow = { source: string; external_id: string } & Record<string, unknown>

/**
 * Get a jobs.id for each posting, inserting only the ones not stored yet.
 *
 * Not an upsert: the unique index on (external_id, source) is partial
 * (`where external_id is not null`), and Postgres cannot use a partial index
 * as an ON CONFLICT target — every upsert against it fails. Looking up first
 * and inserting the remainder needs no schema change.
 */
async function ensureJobs(db: ReturnType<typeof createAdminClient>, rows: JobRow[]): Promise<Map<string, string>> {
  const key = (source: string, external_id: string) => `${source}|${external_id}`
  const lookup = async () => {
    const { data, error } = await db
      .from('jobs')
      .select('id, external_id, source')
      .in('external_id', rows.map(r => r.external_id))
    if (error) throw new Error(`jobs lookup: ${error.message}`)
    return new Map((data ?? []).map(j => [key(j.source, j.external_id), j.id as string]))
  }

  const have = await lookup()
  const missing = rows.filter(r => !have.has(key(r.source, r.external_id)))
  if (missing.length) {
    const { error } = await db.from('jobs').insert(missing)
    // Someone saved one of these between the lookup and the insert: fine,
    // the second lookup picks it up. Anything else is a real failure.
    if (error && error.code !== '23505') throw new Error(`jobs insert: ${error.message}`)
    if (error) for (const r of missing) await db.from('jobs').insert(r) // one duplicate must not drop the rest
  }
  const all = missing.length ? await lookup() : have

  // Keyed by external_id alone for the caller; ids are unique per source here.
  return new Map([...all.entries()].map(([k, id]) => [k.slice(k.indexOf('|') + 1), id]))
}

type Pref = MatchPrefs & {
  user_id: string
  auto_apply_mode: string
  match_threshold: number | null
  daily_apply_limit: number | null
}

async function run(req: NextRequest) {
  if (!isCronRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const dry = url.searchParams.get('dry') === '1'
  const onlyUser = url.searchParams.get('user')
  const started = Date.now()
  const db = createAdminClient()

  let q = db
    .from('job_preferences')
    .select(
      'user_id, auto_apply_mode, match_threshold, daily_apply_limit, target_roles, desired_job_title, target_locations, remote_preference, min_salary, experience_level, excluded_companies, key_skills, country_preference, willing_to_relocate'
    )
    .in('auto_apply_mode', ['copilot', 'autopilot'])
  if (onlyUser) q = q.eq('user_id', onlyUser)
  const { data: prefRows, error: prefErr } = await q
  if (prefErr) return NextResponse.json({ error: prefErr.message }, { status: 500 })

  const people = ((prefRows ?? []) as Pref[]).filter(
    p => (p.target_roles?.length ?? 0) > 0 || (p.desired_job_title || '').trim()
  )
  if (!people.length) return NextResponse.json({ ok: true, people: 0, queued: 0 })

  // ── Shared pools: fetched once for everybody ──
  const [boards, remoteok] = await Promise.all([
    Promise.all(GREENHOUSE_BOARDS.map(b => fetchGreenhouseBoard(b))),
    fetchRemoteOK(),
  ])
  const shared: FetchedJob[] = [...boards.flat(), ...remoteok]

  // Adzuna per person, a few at a time to stay polite to the API.
  const adzunaFor = new Map<string, FetchedJob[]>()
  for (let i = 0; i < people.length; i += 4) {
    await Promise.all(
      people.slice(i, i + 4).map(async p => {
        const role = (p.desired_job_title || p.target_roles?.[0] || '').trim()
        const loc = (p.target_locations || []).find(l => l && l.toLowerCase() !== 'remote') || ''
        adzunaFor.set(
          p.user_id,
          role ? await searchAdzuna(role, { country: countryCode(p.country_preference), location: loc, maxDaysOld: 14 }) : []
        )
      })
    )
  }

  const dayStart = new Date()
  dayStart.setUTCHours(0, 0, 0, 0)

  const summary: Record<string, unknown>[] = []
  let queuedTotal = 0

  for (const p of people) {
    try {
      // Copilot is for reviewing each match closely, so it queues fewer;
      // Autopilot uses the person's full daily limit. (The two modes used to
      // behave identically.)
      const cap = p.auto_apply_mode === 'copilot' ? COPILOT_MAX_PER_DAY : MAX_PER_DAY
      const limit = Math.min(cap, Math.max(1, p.daily_apply_limit || 10))
      const threshold = Math.min(90, Math.max(50, p.match_threshold || 70))

      // What they already have — never queue a posting twice.
      const { data: existing } = await db
        .from('applications')
        .select('created_at, jobs(company, title, external_id)')
        .eq('user_id', p.user_id)
      type Existing = { created_at: string; jobs: { company: string | null; title: string | null; external_id: string | null } | null }
      const rows = (existing ?? []) as unknown as Existing[]
      const have = new Set(rows.map(r => postingKey(r.jobs?.company || '', r.jobs?.title || '')))
      const haveIds = new Set(rows.map(r => r.jobs?.external_id).filter(Boolean) as string[])
      const addedToday = rows.filter(r => new Date(r.created_at) >= dayStart).length
      const room = Math.max(0, limit - addedToday)
      if (!room) {
        summary.push({ user: p.user_id.slice(0, 8), skipped: 'daily limit reached' })
        continue
      }

      const pool = [...shared, ...(adzunaFor.get(p.user_id) || [])]
      const seen = new Set<string>()
      const perCompany = new Map<string, number>()
      const picks = pool
        .map(job => ({ job, m: scoreJob(job, p) }))
        .filter((x): x is { job: FetchedJob; m: { score: number; reasons: string[] } } => !!x.m && x.m.score >= threshold)
        .sort((a, b) => b.m.score - a.m.score)
        .filter(({ job }) => {
          const k = postingKey(job.company, job.title)
          if (have.has(k) || haveIds.has(dbKeys(job).external_id) || seen.has(k)) return false
          // Five variants of one Databricks role is one opportunity, not five.
          const c = job.company.toLowerCase()
          if ((perCompany.get(c) ?? 0) >= MAX_PER_COMPANY) return false
          perCompany.set(c, (perCompany.get(c) ?? 0) + 1)
          seen.add(k)
          return true
        })
        .slice(0, room)

      // Referral-first: which of these are at companies where they know someone?
      const { data: contacts } = await db.from('network_connections').select('company').eq('user_id', p.user_id)
      const known = new Set((contacts ?? []).map(c => (c.company || '').toLowerCase().replace(/[^a-z0-9]/g, '')).filter(Boolean))
      const warm = picks.filter(({ job }) => known.has(job.company.toLowerCase().replace(/[^a-z0-9]/g, '')))

      if (!dry && picks.length) {
        const idFor = await ensureJobs(
          db,
          picks.map(({ job }) => ({
            ...dbKeys(job),
            title: job.title,
            company: job.company,
            location: job.location,
            remote_type: job.remote ? 'remote' : null,
            salary_min: job.salary_min,
            salary_max: job.salary_max,
            description: job.description,
            url: job.url,
            posted_at: job.posted_at,
          }))
        )
        const apps = picks
          .map(({ job, m }) => ({ job_id: idFor.get(dbKeys(job).external_id), score: m.score }))
          .filter(a => a.job_id)
          .map(a => ({ user_id: p.user_id, job_id: a.job_id, status: 'queued', match_score: a.score }))

        const { error: appErr } = await db.from('applications').insert(apps)
        if (appErr) throw new Error(`applications insert: ${appErr.message}`)

        const top = picks.slice(0, 3).map(({ job }) => `${job.company} — ${job.title}`).join('; ')
        await db.from('apply_log').insert({
          user_id: p.user_id,
          action: `${apps.length} new match${apps.length === 1 ? '' : 'es'} queued for you`,
          details:
            (warm.length
              ? `${warm.length} at ${warm.length === 1 ? 'a company' : 'companies'} where you know someone — ask for a referral first. `
              : '') + `Top: ${top}`,
        })
        queuedTotal += apps.length
      }

      summary.push({
        user: p.user_id.slice(0, 8),
        mode: p.auto_apply_mode,
        threshold,
        room,
        matched: picks.length,
        warm: warm.length,
        best: picks[0] ? `${picks[0].m.score} ${picks[0].job.company} — ${picks[0].job.title}` : null,
      })
    } catch (err) {
      summary.push({ user: p.user_id.slice(0, 8), error: err instanceof Error ? err.message : String(err) })
    }
  }

  return NextResponse.json({
    ok: true,
    dry,
    people: people.length,
    pool: { greenhouse: boards.flat().length, remoteok: remoteok.length },
    queued: queuedTotal,
    seconds: Math.round((Date.now() - started) / 1000),
    summary,
  })
}

// Vercel Cron issues GET; POST kept for manual runs.
export const GET = run
export const POST = run
