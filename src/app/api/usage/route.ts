import { createClient } from '@/lib/supabase-server'
import { applicationAllowance } from '@/lib/plan-limits'

/** The signed-in person's application allowance, for the usage meter. */
export async function GET() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Sign in first' }, { status: 401 })
  try {
    return Response.json(await applicationAllowance(supabase, user.id))
  } catch (e) {
    console.error('usage:', e)
    return Response.json({ error: 'Could not load usage' }, { status: 500 })
  }
}
