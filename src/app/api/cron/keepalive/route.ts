import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Lightweight ping to keep Supabase from pausing on the free tier (7-day inactivity limit)
export async function GET() {
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
