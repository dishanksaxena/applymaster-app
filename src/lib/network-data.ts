import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Read a person's whole network.
 *
 * Supabase returns at most 1,000 rows per request. That was invisible while
 * networks were a handful of hand-typed contacts; a LinkedIn import is often
 * several thousand, and every reader that did a plain select would have
 * silently searched only the first thousand.
 */
const PAGE = 1000
const MAX_ROWS = 50_000 // LinkedIn caps connections at 30,000

export async function fetchAllConnections<T = Record<string, unknown>>(
  db: SupabaseClient,
  userId: string,
  columns: string
): Promise<T[]> {
  const out: T[] = []
  for (let from = 0; from < MAX_ROWS; from += PAGE) {
    const { data, error } = await db
      .from('network_connections')
      .select(columns)
      .eq('user_id', userId)
      .order('id', { ascending: true })
      .range(from, from + PAGE - 1)
    if (error) throw new Error(error.message)
    out.push(...((data ?? []) as T[]))
    if (!data || data.length < PAGE) break
  }
  return out
}

/** Relationship labels shown to people, shared by every surface that shows one. */
export const RELATIONSHIP_LABEL: Record<string, string> = {
  direct: 'Know them directly',
  linkedin: 'LinkedIn connection',
  second_degree: 'Second-degree',
  alumni: 'Alumni',
  imported: 'Imported',
}
