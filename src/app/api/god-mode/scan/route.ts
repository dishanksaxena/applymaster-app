import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export const maxDuration = 60

// Pre-configured portals to scan — all have open job board APIs
const GREENHOUSE_BOARDS = [
  'anthropic', 'openai', 'stripe', 'notion', 'figma', 'linear', 'vercel',
  'airbnb', 'coinbase', 'brex', 'rippling', 'retool', 'airtable', 'segment',
  'twilio', 'datadog', 'hashicorp', 'mongodb', 'elastic', 'confluent',
  'gitlab', 'hubspot', 'zendesk', 'intercom', 'asana', 'carta',
]

const LEVER_COMPANIES = [
  'netflix', 'pinterest', 'lyft', 'dropbox', 'eventbrite', 'lever',
  'instacart', 'affirm', 'chime', 'plaid', 'robinhood', 'ramp',
  'gitlab', 'cloudflare', 'fastly', 'sendbird',
]

const ASHBY_ORGS = [
  'anthropic', 'openai', 'mistral', 'cohere', 'elevenlabs', 'perplexity',
  'supabase', 'posthog', 'dbt-labs', 'modal', 'arc', 'linear',
]

interface ScannedJob {
  title: string
  company: string
  location: string
  url: string
  source: 'greenhouse' | 'lever' | 'ashby'
  board_token?: string
  posting_id?: string
  remote: boolean
  posted_at?: string
}

async function scanGreenhouse(board: string, keywords: string[]): Promise<ScannedJob[]> {
  try {
    const res = await fetch(
      `https://boards-api.greenhouse.io/v1/boards/${board}/jobs?content=true`,
      { signal: AbortSignal.timeout(8000) }
    )
    if (!res.ok) return []
    const data = await res.json()
    const jobs: ScannedJob[] = []

    for (const job of data.jobs || []) {
      const titleLower = (job.title || '').toLowerCase()
      const matches = keywords.some(kw => titleLower.includes(kw.toLowerCase()))
      if (!matches) continue

      jobs.push({
        title: job.title,
        company: board.charAt(0).toUpperCase() + board.slice(1),
        location: job.location?.name || 'Remote',
        url: job.absolute_url || `https://boards.greenhouse.io/${board}/jobs/${job.id}`,
        source: 'greenhouse',
        board_token: board,
        posting_id: String(job.id),
        remote: (job.location?.name || '').toLowerCase().includes('remote'),
        posted_at: job.updated_at,
      })
    }

    return jobs
  } catch {
    return []
  }
}

async function scanLever(company: string, keywords: string[]): Promise<ScannedJob[]> {
  try {
    const res = await fetch(
      `https://api.lever.co/v0/postings/${company}?mode=json`,
      { signal: AbortSignal.timeout(8000) }
    )
    if (!res.ok) return []
    const postings = await res.json()
    const jobs: ScannedJob[] = []

    for (const p of Array.isArray(postings) ? postings : []) {
      const titleLower = (p.text || '').toLowerCase()
      const matches = keywords.some(kw => titleLower.includes(kw.toLowerCase()))
      if (!matches) continue

      jobs.push({
        title: p.text,
        company: company.charAt(0).toUpperCase() + company.slice(1),
        location: p.categories?.location || 'Remote',
        url: p.hostedUrl || `https://jobs.lever.co/${company}/${p.id}`,
        source: 'lever',
        posting_id: p.id,
        remote: (p.categories?.location || '').toLowerCase().includes('remote') || p.categories?.commitment?.toLowerCase().includes('remote'),
        posted_at: p.createdAt ? new Date(p.createdAt).toISOString() : undefined,
      })
    }

    return jobs
  } catch {
    return []
  }
}

async function scanAshby(org: string, keywords: string[]): Promise<ScannedJob[]> {
  try {
    const res = await fetch(
      `https://api.ashbyhq.com/posting-api/job-board?organizationHostedJobsPageName=${org}`,
      { signal: AbortSignal.timeout(8000) }
    )
    if (!res.ok) return []
    const data = await res.json()
    const jobs: ScannedJob[] = []

    for (const job of data.jobs || []) {
      const titleLower = (job.title || '').toLowerCase()
      const matches = keywords.some(kw => titleLower.includes(kw.toLowerCase()))
      if (!matches) continue

      jobs.push({
        title: job.title,
        company: org.charAt(0).toUpperCase() + org.slice(1),
        location: job.location || 'Remote',
        url: job.jobUrl || `https://jobs.ashbyhq.com/${org}/${job.id}`,
        source: 'ashby',
        posting_id: job.id,
        remote: job.isRemote || (job.location || '').toLowerCase().includes('remote'),
        posted_at: job.publishedDate,
      })
    }

    return jobs
  } catch {
    return []
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { keywords, limit_per_portal = 3 } = await req.json()

    // Load user preferences for scanning context
    const { data: prefs } = await supabase
      .from('job_preferences').select('*').eq('user_id', user.id).single()

    const searchKeywords: string[] = keywords || prefs?.job_titles || ['software engineer', 'product manager', 'data scientist']

    // Scan all portals in parallel — limit to first N boards each for speed
    const [ghResults, leverResults, ashbyResults] = await Promise.all([
      Promise.all(GREENHOUSE_BOARDS.slice(0, limit_per_portal).map(b => scanGreenhouse(b, searchKeywords))),
      Promise.all(LEVER_COMPANIES.slice(0, limit_per_portal).map(c => scanLever(c, searchKeywords))),
      Promise.all(ASHBY_ORGS.slice(0, limit_per_portal).map(o => scanAshby(o, searchKeywords))),
    ])

    const allJobs: ScannedJob[] = [
      ...ghResults.flat(),
      ...leverResults.flat(),
      ...ashbyResults.flat(),
    ]

    // Deduplicate by URL
    const seen = new Set<string>()
    const uniqueJobs = allJobs.filter(j => {
      if (seen.has(j.url)) return false
      seen.add(j.url)
      return true
    })

    // Save new jobs to DB
    let saved = 0
    for (const job of uniqueJobs.slice(0, 50)) {
      const externalId = `${job.source}-${job.posting_id || encodeURIComponent(job.url)}`
      const { data: existing } = await supabase
        .from('jobs').select('id').eq('external_id', externalId).single()

      if (!existing) {
        await supabase.from('jobs').insert({
          external_id: externalId,
          source: job.source,
          title: job.title,
          company: job.company,
          location: job.location,
          remote_type: job.remote ? 'remote' : null,
          url: job.url,
        })
        saved++
      }
    }

    return Response.json({
      found: uniqueJobs.length,
      saved,
      jobs: uniqueJobs.slice(0, 20), // Return preview of first 20
      portals_scanned: {
        greenhouse: GREENHOUSE_BOARDS.slice(0, limit_per_portal).length,
        lever: LEVER_COMPANIES.slice(0, limit_per_portal).length,
        ashby: ASHBY_ORGS.slice(0, limit_per_portal).length,
      },
    })

  } catch (err: any) {
    console.error('Scan error:', err)
    return Response.json({ error: 'Scan failed: ' + err.message }, { status: 500 })
  }
}
