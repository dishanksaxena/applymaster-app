import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { JOB_TITLES } from '@/lib/constants/job-titles'
import { normSuggest as norm, suggestScore as score } from '@/lib/suggest-score'
import CITIES from '@/lib/constants/world-cities.json'

/**
 * Suggestions for the job search box and the city box.
 *
 *   ?type=role&q=dev        what to search for: the person's own roles and
 *                           resume first, then titles with live postings
 *                           (with how many), then common titles
 *   ?type=city&country=IN&q=ban   cities in that country, biggest first;
 *                           old and alternative names match ("Bangalore")
 *
 * With nothing typed, role suggestions are the person's own: target roles,
 * desired title, and the titles on their resume. The browser shows common
 * titles instantly while this answers (see the jobs page).
 */

type Item = { label: string; value?: string; hint?: string; group: string }
type CityRow = [string, string, number, string[]]
const cities = CITIES as unknown as Record<string, CityRow[]>

const uniq = (items: Item[]) => {
  const seen = new Set<string>()
  return items.filter(i => {
    const k = norm(i.value ?? i.label)
    if (!k || seen.has(k)) return false
    seen.add(k)
    return true
  })
}

/** The person's own roles, skills and past titles. */
async function mine(supabase: ReturnType<typeof createClient>, q: string): Promise<Item[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []
  const [{ data: prefs }, { data: resume }] = await Promise.all([
    supabase.from('job_preferences').select('target_roles, desired_job_title, key_skills').eq('user_id', user.id).maybeSingle(),
    supabase.from('resumes').select('id').eq('user_id', user.id).eq('is_primary', true).maybeSingle(),
  ])
  const { data: parsed } = resume
    ? await supabase.from('parsed_resumes').select('experience, skills').eq('resume_id', resume.id).maybeSingle()
    : { data: null }
  const out: Item[] = []
  for (const r of (Array.isArray(prefs?.target_roles) ? prefs.target_roles : []) as string[]) out.push({ label: r, hint: 'Your target role', group: 'For you' })
  if (prefs?.desired_job_title) out.push({ label: prefs.desired_job_title, hint: 'Your target role', group: 'For you' })
  for (const e of (Array.isArray(parsed?.experience) ? parsed.experience : []).slice(0, 4) as { title?: string }[]) {
    if (e?.title) out.push({ label: e.title, hint: 'From your resume', group: 'For you' })
  }
  // Skills only once something is typed: "rea" -> React.
  if (q) {
    const skills = [...(Array.isArray(parsed?.skills) ? parsed.skills : []), ...(Array.isArray(prefs?.key_skills) ? prefs.key_skills : [])] as string[]
    for (const s of skills) if (score(s, q) >= 60) out.push({ label: s, hint: 'Skill on your resume', group: 'For you' })
  }
  return uniq(out.filter(i => score(i.label, q) > 0)).slice(0, q ? 4 : 6)
}

/** Titles with live postings in ApplyMaster, and how many. */
async function hiring(supabase: ReturnType<typeof createClient>, q: string): Promise<Item[]> {
  const { data: live } = await supabase.from('jobs').select('title').ilike('title', `%${q.replace(/[%_\\]/g, '')}%`).limit(600)
  const counts = new Map<string, { label: string; n: number }>()
  for (const j of live ?? []) {
    // "Senior Engineer (Remote) - Payments" -> "Senior Engineer"
    const t = String(j.title || '').replace(/\s*[\(\[].*$/, '').replace(/(\s[-–|]\s|,\s).*$/, '').trim()
    if (!t || t.length > 60) continue
    const k = norm(t)
    const c = counts.get(k) ?? { label: t, n: 0 }
    c.n += 1
    counts.set(k, c)
  }
  return [...counts.values()]
    .map(c => ({ ...c, s: score(c.label, q) }))
    .filter(c => c.s > 0)
    .sort((a, b) => b.s - a.s || b.n - a.n)
    .slice(0, 5)
    .map(c => ({ label: c.label, hint: `${c.n} open role${c.n === 1 ? '' : 's'}`, group: 'Roles hiring now' }))
}

function commonTitles(q: string, limit = 8): Item[] {
  return JOB_TITLES.map(t => ({ t, s: score(t, q) }))
    .filter(x => x.s > 0)
    .sort((a, b) => b.s - a.s || a.t.length - b.t.length)
    .slice(0, limit)
    .map(x => ({ label: x.t, group: 'Job titles' }))
}

async function roles(q: string): Promise<Item[]> {
  const supabase = createClient()
  // In parallel: each is a round trip to the database.
  const [forYou, open] = await Promise.all([mine(supabase, q), q ? hiring(supabase, q) : Promise.resolve([])])
  if (!q) return forYou
  return uniq([...forYou, ...open, ...commonTitles(q)]).slice(0, 10)
}

function citiesFor(country: string, q: string): Item[] {
  const list = cities[country] ?? []
  const n = norm(q)
  const ranked: { row: CityRow; s: number }[] = []
  for (const row of list) {
    if (!n) {
      ranked.push({ row, s: 1 })
      if (ranked.length >= 8) break
      continue
    }
    const byName = score(row[0], n)
    const byAlias = byName ? 0 : Math.max(0, ...row[3].map(a => score(a, n))) - 5
    const s = Math.max(byName, byAlias)
    if (s > 0) ranked.push({ row, s })
  }
  // Better match first; among equals, the bigger city (the list is by population).
  return ranked
    .sort((a, b) => b.s - a.s || b.row[2] - a.row[2])
    .slice(0, 8)
    .map(({ row }) => ({
      label: row[0],
      value: row[0],
      hint: row[1] && row[1] !== row[0] ? row[1] : undefined,
      group: n ? 'Cities' : 'Largest cities',
    }))
}

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams
  const q = (p.get('q') || '').slice(0, 60).trim()
  const type = p.get('type')
  try {
    if (type === 'city') return Response.json({ items: citiesFor((p.get('country') || 'US').toUpperCase(), q) })
    if (type === 'role') return Response.json({ items: await roles(q) })
    return Response.json({ error: 'type must be role or city' }, { status: 400 })
  } catch (e) {
    console.error('suggest:', e)
    return Response.json({ items: [] })
  }
}
