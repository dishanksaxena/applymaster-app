'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

/**
 * Global command palette (Cmd/Ctrl+K).
 *
 * The dashboard topbar has shown a "⌘K" chip for a while with nothing behind
 * it. This implements it for real: static navigation plus a live, debounced
 * search over the signed-in user's own applications (joined to jobs) and the
 * jobs table. Every result navigates to a route that exists.
 */

type Cmd = {
  id: string
  label: string
  hint?: string
  group: string
  href: string
  keywords?: string
}

const NAV: Cmd[] = [
  { id: 'nav-dashboard', label: 'Dashboard', group: 'Navigate', href: '/dashboard', keywords: 'home overview' },
  { id: 'nav-jobs', label: 'Job Search', group: 'Navigate', href: '/jobs', keywords: 'find search roles' },
  { id: 'nav-saved', label: 'Saved Jobs', group: 'Navigate', href: '/saved-jobs', keywords: 'bookmarks' },
  { id: 'nav-apps', label: 'Applications', group: 'Navigate', href: '/applications', keywords: 'pipeline kanban tracker' },
  { id: 'nav-resume', label: 'Resume', group: 'Navigate', href: '/resume', keywords: 'cv ats optimise optimize' },
  { id: 'nav-cover', label: 'Cover Letters', group: 'Navigate', href: '/cover-letters', keywords: 'letter' },
  { id: 'nav-auto', label: 'Auto-Apply Engine', group: 'Navigate', href: '/auto-apply', keywords: 'autopilot copilot engine' },
  { id: 'nav-network', label: 'Referral Network', group: 'Navigate', href: '/network', keywords: 'referral contacts intro' },
  { id: 'nav-coach', label: 'Interview Coach', group: 'Navigate', href: '/interview-coach', keywords: 'practice mock' },
  { id: 'nav-profile', label: 'Profile', group: 'Navigate', href: '/profile', keywords: 'account details' },
  { id: 'nav-settings', label: 'Settings', group: 'Navigate', href: '/settings', keywords: 'billing plan theme preferences' },
]

const ICONS: Record<string, React.ReactNode> = {
  Navigate: <path d="M5 12h14M12 5l7 7-7 7" />,
  Applications: (
    <>
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
    </>
  ),
  Jobs: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.35-4.35" />
    </>
  ),
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const [remote, setRemote] = useState<Cmd[]>([])
  const [searching, setSearching] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  /* ---- open / close ---- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(o => !o)
      } else if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    // The topbar chip dispatches this, so the visible affordance works too.
    const onOpen = () => setOpen(true)
    window.addEventListener('keydown', onKey)
    window.addEventListener('applymaster:open-command-palette', onOpen)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('applymaster:open-command-palette', onOpen)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    setQuery('')
    setActive(0)
    setRemote([])
    requestAnimationFrame(() => inputRef.current?.focus())
  }, [open])

  /* ---- live search over the user's real data ---- */
  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setRemote([])
      setSearching(false)
      return
    }
    setSearching(true)
    const timer = setTimeout(async () => {
      try {
        const supabase = createClient()
        const { data: auth } = await supabase.auth.getUser()
        const out: Cmd[] = []
        const needle = q.toLowerCase()

        if (auth?.user) {
          const { data: apps } = await supabase
            .from('applications')
            .select('id, status, job:jobs(title, company)')
            .eq('user_id', auth.user.id)
            .limit(25)

          for (const row of (apps ?? []) as Array<Record<string, any>>) {
            const job = Array.isArray(row.job) ? row.job[0] : row.job
            const title: string | undefined = job?.title
            if (!title) continue
            const company: string = job?.company ?? ''
            if (!(title + ' ' + company).toLowerCase().includes(needle)) continue
            out.push({
              id: 'app-' + row.id,
              label: title,
              hint: [company, row.status].filter(Boolean).join(' · '),
              group: 'Applications',
              href: '/applications',
            })
            if (out.length >= 5) break
          }
        }

        const { data: jobs } = await supabase
          .from('jobs')
          .select('id, title, company, location')
          .or('title.ilike.%' + q + '%,company.ilike.%' + q + '%')
          .limit(5)

        for (const j of (jobs ?? []) as Array<Record<string, any>>) {
          out.push({
            id: 'job-' + j.id,
            label: j.title,
            hint: [j.company, j.location].filter(Boolean).join(' · '),
            group: 'Jobs',
            href: '/jobs',
          })
        }

        setRemote(out)
      } catch {
        setRemote([])
      } finally {
        setSearching(false)
      }
    }, 220)
    return () => clearTimeout(timer)
  }, [query])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    const nav = q
      ? NAV.filter(c => (c.label + ' ' + (c.keywords ?? '')).toLowerCase().includes(q))
      : NAV
    return [...nav, ...remote]
  }, [query, remote])

  useEffect(() => {
    setActive(0)
  }, [results.length])

  const run = useCallback(
    (cmd?: Cmd) => {
      const target = cmd ?? results[active]
      if (!target) return
      setOpen(false)
      router.push(target.href)
    },
    [results, active, router]
  )

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive(i => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      run()
    }
  }

  useEffect(() => {
    const el = listRef.current?.querySelector('[data-active="true"]')
    if (el) el.scrollIntoView({ block: 'nearest' })
  }, [active])

  if (!open) return null

  let lastGroup = ''

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center pt-[12vh] px-4"
      style={{ background: 'var(--bg-scrim)' }}
      onClick={() => setOpen(false)}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="w-full max-w-[560px] rounded-2xl overflow-hidden"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-xl)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: '1px solid var(--border)' }}>
          <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            style={{ color: 'var(--text-muted)' }} aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search pages, applications and jobs..."
            aria-label="Search"
            className="flex-1 bg-transparent outline-none text-[14px]"
            style={{ color: 'var(--text)' }}
          />
          {searching && (
            <span className="text-[11px]" style={{ color: 'var(--text-faint)' }}>
              searching
            </span>
          )}
          <kbd
            className="text-[10px] px-1.5 py-0.5 rounded"
            style={{ background: 'var(--bg-overlay)', color: 'var(--text-faint)', border: '1px solid var(--border)' }}
          >
            esc
          </kbd>
        </div>

        <div ref={listRef} className="max-h-[52vh] overflow-y-auto py-2" role="listbox" aria-label="Results">
          {results.length === 0 && (
            <p className="px-4 py-8 text-center text-[13px]" style={{ color: 'var(--text-muted)' }}>
              No matches
            </p>
          )}
          {results.map((c, i) => {
            const header = c.group !== lastGroup ? c.group : null
            lastGroup = c.group
            const isActive = i === active
            return (
              <div key={c.id}>
                {header && (
                  <div
                    className="px-4 pt-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--text-faint)' }}
                  >
                    {header}
                  </div>
                )}
                <button
                  role="option"
                  aria-selected={isActive}
                  data-active={isActive}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => run(c)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left"
                  style={{ background: isActive ? 'var(--accent-dim)' : 'transparent' }}
                >
                  <svg
                    width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                    style={{ color: isActive ? 'var(--accent)' : 'var(--text-muted)' }} aria-hidden="true"
                  >
                    {ICONS[c.group] ?? ICONS.Navigate}
                  </svg>
                  <span className="min-w-0 flex-1">
                    <span
                      className="block text-[13.5px] font-medium truncate"
                      style={{ color: isActive ? 'var(--accent)' : 'var(--text)' }}
                    >
                      {c.label}
                    </span>
                    {c.hint && (
                      <span className="block text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>
                        {c.hint}
                      </span>
                    )}
                  </span>
                </button>
              </div>
            )
          })}
        </div>

        <div
          className="flex items-center gap-4 px-4 py-2.5 text-[10.5px]"
          style={{ borderTop: '1px solid var(--border)', color: 'var(--text-faint)' }}
        >
          <span>&uarr;&darr; navigate</span>
          <span>&crarr; open</span>
          <span>esc close</span>
        </div>
      </div>
    </div>
  )
}
