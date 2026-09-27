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

/** Columns added by add_network_signals.sql, from a person's LinkedIn archive. */
const SIGNAL_COLUMNS = ['message_count', 'endorsed_you', 'would_help', 'connected_on', 'source']

/**
 * The same column list without the signal columns. Reads fall back to this if
 * the database has not been migrated yet, so the network still loads — just
 * without the signals — instead of coming back empty.
 */
export function withoutSignals(columns: string) {
  return columns
    .split(',')
    .map(c => c.trim())
    .filter(c => c && !SIGNAL_COLUMNS.includes(c))
    .join(', ')
}

/** Postgres "undefined column". */
export const isMissingColumn = (e: { code?: string } | null | undefined) => e?.code === '42703'

export async function fetchAllConnections<T = Record<string, unknown>>(
  db: SupabaseClient,
  userId: string,
  columns: string
): Promise<T[]> {
  const out: T[] = []
  for (let from = 0; from < MAX_ROWS; from += PAGE) {
    let { data, error } = await db
      .from('network_connections')
      .select(columns)
      .eq('user_id', userId)
      .order('id', { ascending: true })
      .range(from, from + PAGE - 1)
    if (isMissingColumn(error) && withoutSignals(columns) !== columns) {
      columns = withoutSignals(columns)
      ;({ data, error } = await db
        .from('network_connections')
        .select(columns)
        .eq('user_id', userId)
        .order('id', { ascending: true })
        .range(from, from + PAGE - 1))
    }
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
