import { blocksToText, getJob } from '@/lib/public-jobs'

/**
 * The text of one public job posting, for the resume checker on its page.
 * Asked for only when a visitor opens the checker; cached at the edge for a day.
 */
export async function GET(req: Request) {
  const u = new URL(req.url)
  const board = u.searchParams.get('board') ?? ''
  const id = u.searchParams.get('id') ?? ''
  const job = board && id ? await getJob(board, id) : null
  if (!job) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(
    { text: `${job.title}\n${blocksToText(job.blocks)}` },
    { headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=86400' } }
  )
}
