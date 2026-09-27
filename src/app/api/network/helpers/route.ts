import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase-server'

/**
 * "Who would refer you?" — the people someone picks as willing to help.
 *
 * A LinkedIn list cannot say who would actually open a door; the person can,
 * in a few seconds. Marks those contacts would_help, which ranks them first
 * in referral search and on the warm-paths view.
 */
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Not authenticated' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const urls: string[] = (Array.isArray(body.linkedin_urls) ? body.linkedin_urls : [])
    .filter((u: unknown): u is string => typeof u === 'string' && u.includes('linkedin.com/in/'))
    .slice(0, 500)
  const ids: string[] = (Array.isArray(body.ids) ? body.ids : []).filter((u: unknown): u is string => typeof u === 'string').slice(0, 500)
  if (!urls.length && !ids.length) return Response.json({ error: 'Pick at least one person' }, { status: 400 })

  let marked = 0
  for (let i = 0; i < urls.length; i += 100) {
    const { data } = await supabase
      .from('network_connections')
      .update({ would_help: true })
      .eq('user_id', user.id)
      .in('linkedin_url', urls.slice(i, i + 100))
      .select('id')
    marked += data?.length ?? 0
  }
  for (let i = 0; i < ids.length; i += 100) {
    const { data } = await supabase
      .from('network_connections')
      .update({ would_help: true })
      .eq('user_id', user.id)
      .in('id', ids.slice(i, i + 100))
      .select('id')
    marked += data?.length ?? 0
  }
  return Response.json({ marked })
}
