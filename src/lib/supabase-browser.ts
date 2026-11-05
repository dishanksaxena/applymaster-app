import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// getUser holds the auth lock for a network round trip and the lock can be stolen after 5s,
// so on a slow connection a call can reject while the session is fine.
export async function currentUser() {
  const { auth } = createClient()
  try {
    return (await auth.getUser()).data.user
  } catch (e) {
    if (!(e as { isAcquireTimeout?: boolean }).isAcquireTimeout) throw e
    return (await auth.getUser()).data.user
  }
}
