import { NextRequest } from 'next/server'
import { authenticate, unauthorized } from '@/lib/api-auth'

/** Who the extension is connected as: shown in its popup. */
export async function GET(req: NextRequest) {
  const caller = await authenticate(req)
  if (!caller || caller.via !== 'extension') return unauthorized()
  const { data: profile } = await caller.db.from('profiles').select('full_name').eq('id', caller.user.id).maybeSingle()
  return Response.json({ email: caller.user.email, name: profile?.full_name ?? null })
}
