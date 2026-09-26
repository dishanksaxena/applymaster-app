import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isCronRequest } from '@/lib/cron-auth'

// Lightweight ping to keep Supabase from pausing on the free tier (7-day inactivity limit)
export async function GET(req: Request) {
  if (!isCronRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { count, error } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })

    if (error) throw error

    return NextResponse.json({ ok: true, profiles: count, ts: new Date().toISOString() })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
