import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export const maxDuration = 60

/**
 * Boards we scan, each verified reachable rather than assumed.
 *
 * Lever and Ashby are removed, not disabled. Every Lever org now answers
 * {"ok":false,"error":"Document not found"} — the v0 posting API is gone —
 * and every Ashby org returns null. Both scanners still ran on every
 * request, spent their 8s timeout and returned nothing.
 *
 * Several boards in the Greenhouse list had the same problem quietly:
 * notion, retool, segment, hashicorp, mongodb, elastic, confluent, hubspot,
 * zendesk, intercom, openai and linear have all moved off Greenhouse and
 * were contributing zero.
 *
 * What is left was checked board by board: 31 live boards carrying roughly
 * 6,300 open roles between them.
 */
const GREENHOUSE_BOARDS = [
  'databricks', 'stripe', 'anthropic', 'datadog', 'cloudflare', 'brex',
  'samsara', 'gitlab', 'scaleai', 'affirm', 'pinterest', 'coinbase',
  'airbnb', 'lyft', 'flexport', 'figma', 'reddit', 'twilio', 'robinhood',
  'instacart', 'asana', 'gusto', 'vercel', 'duolingo', 'chime', 'sofi',
  'carta', 'mercury', 'discord', 'dropbox', 'airtable',
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

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    // One source now, so cover far more of it: 3 boards was a tenth of what
    // is reachable. All 31 fetch in parallel well inside the 60s budget.
    const { keywords, limit_per_portal = 31 } = await req.json()

    // Load user preferences for scanning context
    const { data: prefs } = await supabase
      .from('job_preferences').select('*').eq('user_id', user.id).maybeSingle()

    const searchKeywords: string[] = keywords || prefs?.job_titles || ['software engineer', 'product manager', 'data scientist']

    // Scan all portals in parallel — limit to first N boards each for speed
    const ghResults = await Promise.all(
      GREENHOUSE_BOARDS.slice(0, limit_per_portal).map(b => scanGreenhouse(b, searchKeywords))
    )

    const allJobs: ScannedJob[] = [
      ...ghResults.flat(),
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
        .from('jobs').select('id').eq('external_id', externalId).maybeSingle()

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
      },
    })

  } catch (err: any) {
    console.error('Scan error:', err)
    return Response.json({ error: 'Scan failed: ' + err.message }, { status: 500 })
  }
}
