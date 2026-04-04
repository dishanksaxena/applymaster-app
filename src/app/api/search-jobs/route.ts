import { NextRequest } from 'next/server'

const ADZUNA_APP_ID = process.env.ADZUNA_APP_ID
const ADZUNA_APP_KEY = process.env.ADZUNA_APP_KEY

interface AdzunaJob {
  id: string
  title: string
  company: { display_name: string }
  location: { display_name: string }
  description: string
  salary_min?: number
  salary_max?: number
  redirect_url: string
  created: string
  category?: { label: string }
  contract_time?: string
}

const COUNTRY_CODE_MAP: Record<string, string> = {
  US: 'us', IN: 'in', GB: 'gb', CA: 'ca', AU: 'au', DE: 'de', SG: 'sg', AE: 'ae',
}

async function searchAdzuna(query: string, location: string, country: string, page = 1, maxDaysOld = 30, remote?: string) {
  if (!ADZUNA_APP_ID || !ADZUNA_APP_KEY) return []

  const countryCode = COUNTRY_CODE_MAP[country] || 'us'
  const params = new URLSearchParams({
    app_id: ADZUNA_APP_ID,
    app_key: ADZUNA_APP_KEY,
    results_per_page: '30',
    what: query,
    sort_by: 'date',
    max_days_old: String(maxDaysOld || 30),
    'content-type': 'application/json',
  })
  const skipLocationTerms = ['remote', 'united states', 'india', 'us', 'usa', 'in', '']
  if (location && !skipLocationTerms.includes(location.toLowerCase())) params.set('where', location)

  // Add remote filter if specified
  if (remote === 'remote') {
    params.set('full_time', 'true')
    params.set('tag_id', 'tag_rmt')
  }

  try {
    const res = await fetch(
      `https://api.adzuna.com/v1/api/jobs/${countryCode}/search/${page}?${params}`,
      { next: { revalidate: 300 } }
    )
    if (!res.ok) return []
    const data = await res.json()
    return (data.results || []).map((r: AdzunaJob) => ({
      id: `adzuna-${r.id}`,
      title: r.title,
      company: r.company?.display_name || 'Unknown',
      location: r.location?.display_name || location,
      description: r.description?.slice(0, 500) || '',
      salary_min: r.salary_min || null,
      salary_max: r.salary_max || null,
      salary_currency: country === 'IN' ? 'INR' : 'USD',
      url: r.redirect_url,
      source: 'Indeed/Adzuna',
      posted_at: r.created,
      job_type: r.contract_time || 'fulltime',
      country,
      category: r.category?.label || null,
    }))
  } catch (e) {
    console.error('Adzuna error:', e)
    return []
  }
}

async function searchRemoteOK(query: string) {
  try {
    const res = await fetch('https://remoteok.com/api', {
      headers: { 'User-Agent': 'ApplyMaster/1.0' },
      next: { revalidate: 600 },
    })
    if (!res.ok) return []
    const data = await res.json()
    const q = query.toLowerCase()
    const results = Array.isArray(data) ? data.slice(1) : []

    return results
      .filter((r: { position?: string; company?: string; description?: string; tags?: string[] }) => {
        const text = `${r.position || ''} ${r.company || ''} ${r.description || ''} ${(r.tags || []).join(' ')}`.toLowerCase()
        return text.includes(q)
      })
      .slice(0, 15)
      .map((r: { id?: string; position?: string; company?: string; description?: string; salary_min?: string; salary_max?: string; url?: string; date?: string; company_logo?: string; tags?: string[] }) => ({
        id: `remoteok-${r.id}`,
        title: r.position || '',
        company: r.company || 'Unknown',
        location: 'Remote',
        description: (r.description || '').replace(/<[^>]+>/g, '').slice(0, 500),
        salary_min: r.salary_min ? parseInt(r.salary_min) : null,
        salary_max: r.salary_max ? parseInt(r.salary_max) : null,
        salary_currency: 'USD',
        url: r.url || `https://remoteok.com/remote-jobs/${r.id}`,
        source: 'RemoteOK',
        posted_at: r.date || new Date().toISOString(),
        job_type: 'fulltime',
        country: 'REMOTE',
        category: (r.tags || [])[0] || null,
      }))
  } catch (e) {
    console.error('RemoteOK error:', e)
    return []
  }
}

export async function POST(req: NextRequest) {
  try {
    const { query, location, country = 'US', remote, page = 1, maxDaysOld = 30 } = await req.json()

    if (!query) {
      return Response.json({ error: 'Search query required' }, { status: 400 })
    }

    const searches: Promise<unknown[]>[] = [
      searchAdzuna(query, location || '', country, page, maxDaysOld, remote),
    ]

    // Add RemoteOK for remote searches
    if (!location || location === 'Remote' || remote === 'remote') {
      searches.push(searchRemoteOK(query))
    }

    const results = await Promise.allSettled(searches)
    let allJobs: Record<string, unknown>[] = []

    for (const r of results) {
      if (r.status === 'fulfilled') {
        allJobs = allJobs.concat(r.value as Record<string, unknown>[])
      }
    }

    // Deduplicate
    const seen = new Set<string>()
    const deduped = allJobs.filter(j => {
      const key = `${String(j.title).toLowerCase()}-${String(j.company).toLowerCase()}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    // Sort by date
    deduped.sort((a, b) => {
      const da = new Date(a.posted_at as string).getTime() || 0
      const db = new Date(b.posted_at as string).getTime() || 0
      return db - da
    })

    return Response.json({
      jobs: deduped,
      total: deduped.length,
      page,
      sources: ['Adzuna', 'RemoteOK'],
    })
  } catch (err) {
    console.error('Job search error:', err)
    return Response.json({ error: 'Search failed' }, { status: 500 })
  }
}
