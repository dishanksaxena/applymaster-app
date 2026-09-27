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

/** Columns added by add_network_signals.sql and add_contact_photos.sql. */
const SIGNAL_COLUMNS = ['message_count', 'endorsed_you', 'would_help', 'connected_on', 'source', 'photo_url', 'photo_checked_at']

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

/**
 * The column list without the one named in a "column ... does not exist"
 * error — or without every signal column if the message names none.
 */
function withoutColumn(columns: string, message?: string) {
  const missing = message?.match(/column [\w.]*?(\w+) does not exist/)?.[1]
  if (!missing || !SIGNAL_COLUMNS.includes(missing)) return withoutSignals(columns)
  return columns
    .split(',')
    .map(c => c.trim())
    .filter(c => c && c !== missing)
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
    const page = () =>
      db
        .from('network_connections')
        .select(columns)
        .eq('user_id', userId)
        .order('id', { ascending: true })
        .range(from, from + PAGE - 1)
    let { data, error } = await page()
    // Drop just the column the database says is missing, and try again.
    for (let tries = 0; isMissingColumn(error) && tries < SIGNAL_COLUMNS.length; tries++) {
      const next = withoutColumn(columns, error?.message)
      if (next === columns) break
      columns = next
      ;({ data, error } = await page())
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
