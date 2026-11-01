import { isCronRequest } from '@/lib/cron-auth'
import { getAllBoards, hasJobPostingSchema, jobPath } from '@/lib/public-jobs'
import { warmDirectIndex } from '@/lib/direct-search'
import { SITE_URL } from '@/lib/seo/site'
import { DAILY_QUOTA, isConfigured as googleConfigured, notify as notifyGoogle } from '@/lib/google-indexing'

/**
 * Daily: tell IndexNow search engines (Bing, and through it ChatGPT search,
 * Copilot, DuckDuckGo and Yahoo; plus Yandex, Seznam, Naver) about jobs
 * posted since yesterday, so new roles are crawled within hours. Then tell
 * Google through the Indexing API, which accepts job pages only and allows
 * 200 a day, so it gets the newest job pages that carry JobPosting markup.
 * ?dry=1 lists what would be sent to both.
 */

const KEY = 'b240f9946492ca02bfb7aba2407dfe83'

export async function GET(req: Request) {
  if (!isCronRequest(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  // The boards come from the fetch cache, which refreshes daily and is usually filled by the
  // previous run, so the data can be ~24h old when this reads it. A 26h window over day-old data
  // found almost nothing; 50h covers the staleness plus a day. Some jobs go out on two consecutive
  // days, which both APIs accept. ?hours= overrides for a manual catch-up (max one week).
  const hours = Math.min(168, Math.max(1, Number(new URL(req.url).searchParams.get('hours')) || 50))
  const since = Date.now() - hours * 3600 * 1000
  const boards = await getAllBoards()
  // The boards are now in the fetch cache, so building the in-app search index is cheap; do it here
  // rather than making the day's first searcher wait for it.
  const indexed = await warmDirectIndex().catch(() => 0)
  const urls: string[] = []
  const googleJobs: { url: string; at: number }[] = []
  for (const b of boards) {
    const fresh = b.jobs.filter(j => new Date(j.published ?? j.updated).getTime() > since)
    if (fresh.length) urls.push(`${SITE_URL}/companies/${b.board}`)
    for (const j of fresh) {
      const url = `${SITE_URL}${jobPath(b.board, j)}`
      urls.push(url)
      if (hasJobPostingSchema(j.location)) googleJobs.push({ url, at: new Date(j.published ?? j.updated).getTime() })
    }
  }
  const googleUrls = googleJobs.sort((a, b) => b.at - a.at).slice(0, DAILY_QUOTA).map(g => g.url)

  if (new URL(req.url).searchParams.get('dry')) {
    return Response.json({
      ok: true,
      indexnow: { wouldSend: urls.length, sample: urls.slice(0, 10) },
      google: { configured: googleConfigured(), eligible: googleJobs.length, wouldSend: googleUrls.length, sample: googleUrls.slice(0, 5) },
    })
  }

  let indexnow: { ok: boolean; status?: number; sent: number } = { ok: true, sent: 0 }
  if (urls.length) {
    const batch = urls.slice(0, 10000) // IndexNow accepts up to 10,000 per request
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host: new URL(SITE_URL).host, key: KEY, keyLocation: `${SITE_URL}/${KEY}.txt`, urlList: [`${SITE_URL}/companies`, ...batch] }),
    })
    indexnow = { ok: res.ok, status: res.status, sent: batch.length + 1 }
  }

  // Google runs independently: a failure here must not hide the IndexNow result.
  let google: { configured: boolean; sent?: number; accepted?: number; firstError?: string } = { configured: googleConfigured() }
  if (google.configured && googleUrls.length) {
    try {
      const results = await notifyGoogle(googleUrls)
      const failed = results.filter(r => r.status !== 200)
      google = { configured: true, sent: results.length, accepted: results.length - failed.length, firstError: failed[0] && `${failed[0].status} ${failed[0].error}` }
      if (failed.length) console.error('[google-indexing]', failed.length, 'rejected; first:', google.firstError)
    } catch (e) {
      google = { configured: true, sent: 0, firstError: (e as Error).message }
      console.error('[google-indexing]', (e as Error).message)
    }
  }

  console.log(
    `[indexnow] window ${hours}h | indexnow ${indexnow.sent} sent (status ${indexnow.status ?? '-'}) | google ${
      google.configured ? `${google.accepted ?? 0}/${google.sent ?? 0} accepted` : 'not configured'
    }${google.firstError ? ` | first error: ${google.firstError}` : ''}`
  )
  return Response.json({ ok: indexnow.ok, indexnow, google, indexed })
}
