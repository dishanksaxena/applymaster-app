import { checkAllSources } from '@/lib/job-sources'

/**
 * Live status of every job source.
 *
 * The point is that the page cannot claim a source works — it has to ask.
 * Cached for five minutes so opening the settings page does not hammer
 * three third-party APIs.
 */
export const revalidate = 300

export async function GET() {
  const sources = await checkAllSources()
  return Response.json(
    { sources, checkedAt: new Date().toISOString() },
    { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } }
  )
}
