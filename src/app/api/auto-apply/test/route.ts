import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export const maxDuration = 300

// This endpoint handles the test call from the UI
// It calls the cron endpoint with the secret
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Call the cron endpoint with the server-side secret
    const cronSecret = process.env.CRON_SECRET || 'test-secret-change-in-production'
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const response = await fetch(`${baseUrl}/api/cron/auto-apply`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cronSecret}`
      }
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (err) {
    console.error('Test auto-apply error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to test auto-apply' },
      { status: 500 }
    )
  }
}
