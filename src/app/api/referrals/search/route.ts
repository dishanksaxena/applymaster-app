import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

/**
 * Natural-language search over the user's own network.
 *
 * The page this serves used to run against a hardcoded list of eight invented
 * people — "Priya Sharma, Senior Engineering Manager at Google" and so on —
 * filtered by keyword. It looked like AI search and produced confident
 * results for accounts with an empty network. That is the worst possible
 * failure for this feature: a job seeker acts on a referral path that does
 * not exist.
 *
 * This searches `network_connections` and nothing else. If the user knows
 * nobody at Stripe, the honest answer is that they know nobody at Stripe.
 *
 * The model is used only to read the query — turning "who can refer me at
 * Google for a senior backend role" into companies, title keywords and a
 * seniority hint. Matching and ranking are deterministic, so the same query
 * against the same network always gives the same answer.
 */

type Conn = {
  id: string
  name: string
  company: string | null
  title: string | null
  relationship: string
  email: string | null
  linkedin_url: string | null
  seniority: string | null
  can_refer: boolean | null
  last_contacted_at: string | null
  notes: string | null
}

type Intent = {
  companies: string[]
  titleKeywords: string[]
  seniority: string | null
}

const norm = (s: string | null | undefined) =>
  (s || '')
    .toLowerCase()
    .replace(/\b(inc|llc|ltd|corp|corporation|technologies|labs|group|the)\b/g, '')
    .replace(/[^a-z0-9]/g, '')

/** Cheap fallback so search still works if the model call fails. */
function parseLocally(query: string): Intent {
  const q = query.toLowerCase()
  const stop = new Set([
    'who', 'can', 'refer', 'me', 'at', 'for', 'a', 'an', 'the', 'in', 'my',
    'network', 'knows', 'people', 'someone', 'find', 'connect', 'with', 'to',
    'and', 'or', 'of', 'role', 'job', 'position', 'is', 'there', 'anyone',
  ])
  const words = q.split(/[^a-z0-9+#.]+/).filter(w => w.length > 1 && !stop.has(w))
  return { companies: words, titleKeywords: words, seniority: null }
}

async function readIntent(query: string): Promise<Intent> {
  try {
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: `Extract search intent from a job seeker's query about their professional network.

Query: ${JSON.stringify(query)}

Return ONLY minified JSON, no prose, shaped exactly:
{"companies":["..."],"titleKeywords":["..."],"seniority":null}

- companies: employer names named or clearly implied. [] if none.
- titleKeywords: single words that would appear in a job title (engineer, designer, recruiter, product). [] if none.
- seniority: one of "senior","lead","manager","director","executive", or null.

Do not invent companies that are not in the query.`,
        },
      ],
    })
    const text = msg.content[0]?.type === 'text' ? msg.content[0].text : ''
    const json = text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1)
    const parsed = JSON.parse(json)
    return {
      companies: Array.isArray(parsed.companies) ? parsed.companies.filter((c: unknown) => typeof c === 'string') : [],
      titleKeywords: Array.isArray(parsed.titleKeywords)
        ? parsed.titleKeywords.filter((c: unknown) => typeof c === 'string')
        : [],
      seniority: typeof parsed.seniority === 'string' ? parsed.seniority : null,
    }
  } catch {
    return parseLocally(query)
  }
}

const SENIOR = /(director|vp|vice president|head|chief|principal|staff|lead|manager|founder|partner)/i

/** Deterministic relevance, with the reason the user is shown. */
function rank(c: Conn, intent: Intent, rawQuery: string) {
  const reasons: string[] = []
  let score = 0

  const company = norm(c.company)
  const companyHit = intent.companies.some(t => company && (company === norm(t) || company.includes(norm(t))))
  if (companyHit) {
    score += 60
    reasons.push(`works at ${c.company}`)
  }

  const title = (c.title || '').toLowerCase()
  const titleHit = intent.titleKeywords.filter(k => k.length > 2 && title.includes(k.toLowerCase()))
  if (titleHit.length) {
    score += Math.min(20, titleHit.length * 10)
    reasons.push(`${c.title}`)
  }

  if (c.relationship === 'direct') {
    score += 18
    reasons.push('you know them directly')
  } else if (c.relationship === 'second_degree') {
    score += 9
    reasons.push('second-degree connection')
  } else if (c.relationship === 'alumni') {
    score += 8
    reasons.push('alumni connection')
  }

  if (SENIOR.test(c.seniority || c.title || '')) {
    score += 8
    reasons.push('senior enough to be heard internally')
  }

  if (c.last_contacted_at) {
    const days = (Date.now() - new Date(c.last_contacted_at).getTime()) / 86400000
    if (days < 90) {
      score += 5
      reasons.push('you were in touch recently')
    }
  }

  // Bare name search: "does anyone know Sarah".
  if (rawQuery && c.name.toLowerCase().includes(rawQuery.toLowerCase().trim()) && rawQuery.trim().length > 2) {
    score += 40
    reasons.push('name matches your search')
  }

  if (c.can_refer === false) {
    score = Math.min(score, 25)
    reasons.push('marked as unable to refer')
  }

  return { score: Math.max(0, Math.min(100, score)), reason: reasons.join(' · ') || 'in your network' }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Not authenticated' }, { status: 401 })

    const { query } = await req.json()
    if (typeof query !== 'string' || !query.trim()) {
      return Response.json({ error: 'query required' }, { status: 400 })
    }

    const { data: connections, error } = await supabase
      .from('network_connections')
      .select(
        'id, name, company, title, relationship, email, linkedin_url, seniority, can_refer, last_contacted_at, notes'
      )
      .eq('user_id', user.id)

    if (error) return Response.json({ error: error.message }, { status: 500 })

    const all = (connections ?? []) as Conn[]
    if (all.length === 0) {
      return Response.json({ results: [], intent: null, networkSize: 0, reason: 'empty_network' })
    }

    const intent = await readIntent(query)

    const ranked = all
      .map(c => ({ connection: c, ...rank(c, intent, query) }))
      .filter(r => {
        if (r.score <= 0) return false
        // When the query names a company, someone at a different company is
        // not a weak answer — it is not an answer. Listing them anyway buries
        // the real paths and implies a connection that is not there.
        if (intent.companies.length > 0) return r.reason.startsWith('works at') || r.reason.includes('name matches')
        return true
      })
      .sort((a, b) => b.score - a.score)

    // A named company with nobody at it is a real, useful answer. Say so
    // rather than falling back to unrelated contacts as though they matched.
    const matchedCompanies = new Set(ranked.filter(r => r.score >= 60).map(r => norm(r.connection.company)))
    const gaps = intent.companies.filter(t => !matchedCompanies.has(norm(t)))

    return Response.json({
      results: ranked.slice(0, 12),
      intent,
      networkSize: all.length,
      companiesWithNoPath: intent.companies.length ? gaps : [],
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Search failed'
    console.error('referrals/search error:', err)
    return Response.json({ error: message }, { status: 500 })
  }
}
