'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { tone, toneA, toneSurface } from '@/lib/tone'
import Link from 'next/link'

/**
 * "You know someone here" — shown against a job before you apply cold.
 *
 * The referral finder worked but lived only on /network, so you had to
 * already suspect a path existed and go looking for it. That is backwards:
 * the moment the information is worth having is when you are about to
 * apply. A referral converts at roughly 30% against 0.1-2% for a cold
 * application, so a warm path you did not notice is the most expensive
 * thing this product can hide from you.
 *
 * Deliberately cheap: one indexed query on (user_id, company) against rows
 * the browser client can already read under RLS. No model call, no API
 * round-trip, so it can sit on every card in a list without cost.
 */

type Match = { id: string; name: string; title: string | null; can_refer: boolean | null }

/** Company names rarely match exactly between a job board and a contact. */
const norm = (s: string | null | undefined) =>
  (s || '')
    .toLowerCase()
    .replace(/\b(inc|llc|ltd|corp|corporation|technologies|labs|group|the)\b/g, '')
    .replace(/[^a-z0-9]/g, '')

type NetworkRow = { id: string; name: string; company: string | null; title: string | null; can_refer: boolean | null }
type NetworkCache = { at: number; rows: NetworkRow[] }

/* One fetch of the whole network per page, shared by every badge on it —
   a list of 30 jobs should not make 30 identical queries. */
let cache: NetworkCache | null = null
let inflight: Promise<NetworkCache> | null = null

async function loadNetwork() {
  if (cache && Date.now() - cache.at < 60_000) return cache
  if (inflight) return inflight
  inflight = (async () => {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return (cache = { at: Date.now(), rows: [] })
      const { data } = await supabase
        .from('network_connections')
        .select('id, name, company, title, can_refer')
        .eq('user_id', user.id)
      cache = { at: Date.now(), rows: data ?? [] }
      return cache
    } finally {
      inflight = null
    }
  })()
  return inflight
}

export default function ReferralPathBadge({
  company,
  jobTitle,
  compact = false,
}: {
  company: string | null | undefined
  jobTitle?: string | null
  compact?: boolean
}) {
  const [matches, setMatches] = useState<Match[] | null>(null)
  const alive = useRef(true)

  useEffect(() => {
    alive.current = true
    if (!company) {
      setMatches([])
      return
    }
    loadNetwork().then(c => {
      if (!alive.current || !c) return
      const target = norm(company)
      setMatches(
        c.rows
          .filter(r => {
            const n = norm(r.company)
            return n && (n === target || n.includes(target) || target.includes(n))
          })
          .map(r => ({ id: r.id, name: r.name, title: r.title, can_refer: r.can_refer }))
      )
    })
    return () => {
      alive.current = false
    }
  }, [company])

  // Nothing to say is better than an empty state on every card.
  if (!matches || matches.length === 0) return null

  const canRefer = matches.filter(m => m.can_refer !== false)
  const t = canRefer.length > 0 ? 'green' : 'blue'
  const names = matches.slice(0, 2).map(m => m.name.split(' ')[0]).join(' and ')
  const extra = matches.length > 2 ? ` +${matches.length - 2}` : ''

  const href = `/network?company=${encodeURIComponent(company || '')}${jobTitle ? `&role=${encodeURIComponent(jobTitle)}` : ''}`

  if (compact) {
    return (
      <Link
        href={href}
        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10.5px] font-semibold"
        style={{ background: toneSurface(t, 0.14), color: tone(t) }}
        title={`${matches.map(m => m.name).join(', ')} — in your network at ${company}`}
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8z" />
        </svg>
        {matches.length} warm {matches.length === 1 ? 'path' : 'paths'}
      </Link>
    )
  }

  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 p-2.5 rounded-lg transition-transform hover:-translate-y-0.5"
      style={{ background: toneSurface(t, 0.09), boxShadow: `inset 0 0 0 1px ${toneA(t, 0.2)}` }}
    >
      <span className="grid place-items-center w-7 h-7 rounded-lg shrink-0" style={{ background: toneSurface(t, 0.16), color: tone(t) }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87" />
        </svg>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[12px] font-semibold" style={{ color: 'var(--text)' }}>
          You know {names}
          {extra} at {company}
        </span>
        <span className="block text-[11px]" style={{ color: 'var(--text-muted)' }}>
          {canRefer.length > 0 ? 'Ask for a referral before applying cold' : 'Marked as unable to refer — still worth a note'}
        </span>
      </span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className="shrink-0" style={{ color: tone(t) }}>
        <path d="M5 12h14M12 5l7 7-7 7" />
      </svg>
    </Link>
  )
}
