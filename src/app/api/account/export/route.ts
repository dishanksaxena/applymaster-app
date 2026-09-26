import { createClient } from '@/lib/supabase-server'

/**
 * Download everything ApplyMaster holds about me, as JSON.
 *
 * Promised on the site ("your data exports are always available") and never
 * built. Every table is read with the signed-in user's own client, so
 * row-level security guarantees the file contains their rows and nobody
 * else's. Resume files are listed by name; the parsed content of each is in
 * the export itself.
 */

const TABLES: { name: string; key: 'user_id' | 'id' }[] = [
  { name: 'profiles', key: 'id' },
  { name: 'job_preferences', key: 'user_id' },
  { name: 'resumes', key: 'user_id' },
  { name: 'parsed_resumes', key: 'user_id' },
  { name: 'optimized_resumes', key: 'user_id' },
  { name: 'applications', key: 'user_id' },
  { name: 'application_receipts', key: 'user_id' },
  { name: 'cover_letters', key: 'user_id' },
  { name: 'network_connections', key: 'user_id' },
  { name: 'referral_requests', key: 'user_id' },
  { name: 'interview_sessions', key: 'user_id' },
  { name: 'job_matches', key: 'user_id' },
  { name: 'apply_log', key: 'user_id' },
  { name: 'support_messages', key: 'user_id' },
]

export async function GET() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Not signed in' }, { status: 401 })

  const out: Record<string, unknown> = {
    exported_at: new Date().toISOString(),
    account: {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
      sign_in_method: user.app_metadata?.provider ?? null,
    },
  }

  for (const t of TABLES) {
    const select = t.name === 'applications' ? '*, job:jobs(*)' : '*'
    const { data, error } = await supabase.from(t.name).select(select).eq(t.key, user.id)
    // A table that does not exist yet is simply absent from the export.
    if (!error) out[t.name] = data ?? []
  }

  const stamp = new Date().toISOString().slice(0, 10)
  return new Response(JSON.stringify(out, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="applymaster-data-${stamp}.json"`,
      'Cache-Control': 'no-store',
    },
  })
}
