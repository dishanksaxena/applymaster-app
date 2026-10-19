import { isCronRequest } from '@/lib/cron-auth'
import { getAllBoards, jobPath } from '@/lib/public-jobs'
import { SITE_URL } from '@/lib/seo/site'

/**
 * Daily: tell IndexNow search engines (Bing, and through it ChatGPT search,
 * Copilot, DuckDuckGo and Yahoo; plus Yandex, Seznam, Naver) about jobs
 * posted since yesterday, so new roles are crawled within hours.
 * ?dry=1 lists what would be sent.
 */

const KEY = 'b240f9946492ca02bfb7aba2407dfe83'

export async function GET(req: Request) {
  if (!isCronRequest(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const since = Date.now() - 26 * 3600 * 1000
  const boards = await getAllBoards()
  const urls: string[] = []
  for (const b of boards) {
    const fresh = b.jobs.filter(j => new Date(j.published ?? j.updated).getTime() > since)
    if (fresh.length) urls.push(`${SITE_URL}/companies/${b.board}`)
    for (const j of fresh) urls.push(`${SITE_URL}${jobPath(b.board, j)}`)
  }
  if (!urls.length) return Response.json({ ok: true, sent: 0 })
  if (new URL(req.url).searchParams.get('dry')) return Response.json({ ok: true, wouldSend: urls.length, sample: urls.slice(0, 10) })

  const batch = urls.slice(0, 10000) // IndexNow accepts up to 10,000 per request
  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: new URL(SITE_URL).host, key: KEY, keyLocation: `${SITE_URL}/${KEY}.txt`, urlList: [`${SITE_URL}/companies`, ...batch] }),
  })
  return Response.json({ ok: res.ok, status: res.status, sent: batch.length + 1 })
}
