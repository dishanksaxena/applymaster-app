import { createBrowserClient } from '@supabase/ssr'

/**
 * Every caller used to get its own client, so a single dashboard load (layout
 * + page + CommandPalette, etc.) started several GoTrueClient instances all
 * racing for the same navigator.locks auth-token lock — the source of the
 * "Lock ... was released because an unexpected error happened" errors. One
 * client per browser tab, memoized, fixes that.
 */
const client = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export function createClient() {
  return client
}
