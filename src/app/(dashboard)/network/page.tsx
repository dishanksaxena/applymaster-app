'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PremiumCard } from '@/components/premium'
import NetworkGraph from '@/components/NetworkGraph'
import { tone, toneA, toneSurface, type Tone } from '@/lib/tone'

/**
 * Referral network.
 *
 * What this page used to be: a fixed cast of eight invented people — "Priya
 * Sharma, Senior Engineering Manager at Google", "Alex Rivera at Meta" — a
 * keyword filter presented as AI search, and a header claiming 20,707
 * connections from LinkedIn, Gmail and Calendar integrations that do not
 * exist. It rendered the same confident results for an account with an empty
 * network. For a feature whose entire job is telling someone which door to
 * knock on, that is the most damaging thing it could do.
 *
 * Everything here now comes from `network_connections` and
 * `referral_requests`. If the network is empty, the page says so and gives
 * you a way to fill it.
 */

type Connection = {
  id: string
  name: string
  company: string | null
  title: string | null
  relationship: string
  email: string | null
  linkedin_url: string | null
  seniority: string | null
  can_refer: boolean | null
  last_contacted_at: string | null
  notes: string | null
  created_at?: string
}

type SearchHit = { connection: Connection; score: number; reason: string }

type ReferralRequest = {
  id: string
  job_title: string | null
  company: string | null
  match_reason: string | null
  match_strength: number | null
  message_draft: string | null
  message_sent: string | null
  channel: string | null
  status: string
  sent_at: string | null
  responded_at: string | null
  updated_at: string
  connection: { id: string; name: string; company: string | null; title: string | null; email: string | null; linkedin_url: string | null } | null
}

/* ── Tone assignment is stable per person, so the same contact keeps the
      same colour between renders and between visits. ── */
const TONES: Tone[] = ['accent', 'purple', 'blue', 'green', 'yellow']
const toneFor = (id: string) => TONES[[...id].reduce((a, c) => a + c.charCodeAt(0), 0) % TONES.length]

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('') || '?'

const RELATIONSHIP_LABEL: Record<string, string> = {
  direct: 'Know them directly',
  second_degree: 'Second-degree',
  alumni: 'Alumni',
  imported: 'Imported',
}

const STATUS_TONE: Record<string, Tone> = {
  suggested: 'blue',
  drafted: 'purple',
  sent: 'yellow',
  accepted: 'green',
  declined: 'red',
  no_response: 'red',
}

const STATUS_LABEL: Record<string, string> = {
  suggested: 'Suggested',
  drafted: 'Draft ready',
  sent: 'Sent',
  accepted: 'Accepted',
  declined: 'Declined',
  no_response: 'No response',
}

/* ============================================================
   Small pieces
   ============================================================ */

function Avatar({ name, id, size = 40 }: { name: string; id: string; size?: number }) {
  const t = toneFor(id)
  return (
    <span
      aria-hidden="true"
      className="grid place-items-center rounded-full font-semibold shrink-0"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        background: toneSurface(t, 0.16),
        color: tone(t),
        boxShadow: `inset 0 0 0 1px ${toneA(t, 0.24)}`,
      }}
    >
      {initialsOf(name)}
    </span>
  )
}

function StrengthBar({ value, t }: { value: number; t: Tone }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-overlay)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: tone(t) }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
      <span className="text-[11px] font-semibold tabular-nums" style={{ color: tone(t) }}>
        {value}
      </span>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  const id = `f-${label.replace(/\s+/g, '-').toLowerCase()}`
  return (
    <label htmlFor={id} className="block">
      <span className="block text-[11px] font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>
        {label}
      </span>
      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg text-[13px] outline-none"
        style={{
          background: 'var(--bg-input)',
          color: 'var(--text)',
          boxShadow: 'inset 0 0 0 1px var(--card-ring)',
        }}
      />
    </label>
  )
}

/* ============================================================
   Add a connection
   ============================================================ */

function AddConnection({ onAdded }: { onAdded: (c: Connection) => void }) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    company: '',
    title: '',
    email: '',
    linkedin_url: '',
    relationship: 'direct',
  })

  const set = (k: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [k]: v }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      setError('A name is required')
      return
    }
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/network/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Could not save')
      onAdded(json.connection)
      setForm({ name: '', company: '', title: '', email: '', linkedin_url: '', relationship: 'direct' })
      setOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save')
    } finally {
      setSaving(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-semibold transition-colors"
        style={{
          color: 'var(--accent)',
          background: toneSurface('accent', 0.06),
          boxShadow: `inset 0 0 0 1px ${toneA('accent', 0.2)}`,
        }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Add someone to your network
      </button>
    )
  }

  return (
    <form onSubmit={submit} className="p-4 rounded-xl" style={{ background: 'var(--bg-overlay)', boxShadow: 'inset 0 0 0 1px var(--card-ring)' }}>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Name" value={form.name} onChange={set('name')} placeholder="Sarah Kim" />
        <Field label="Company" value={form.company} onChange={set('company')} placeholder="Stripe" />
        <Field label="Title" value={form.title} onChange={set('title')} placeholder="Engineering Manager" />
        <Field label="Email" value={form.email} onChange={set('email')} placeholder="sarah@stripe.com" type="email" />
        <Field label="LinkedIn" value={form.linkedin_url} onChange={set('linkedin_url')} placeholder="linkedin.com/in/…" />
        <label htmlFor="f-relationship" className="block">
          <span className="block text-[11px] font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>
            How you know them
          </span>
          <select
            id="f-relationship"
            value={form.relationship}
            onChange={e => set('relationship')(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-[13px] outline-none"
            style={{ background: 'var(--bg-input)', color: 'var(--text)', boxShadow: 'inset 0 0 0 1px var(--card-ring)' }}
          >
            <option value="direct">I know them directly</option>
            <option value="second_degree">Second-degree connection</option>
            <option value="alumni">Alumni / same school</option>
            <option value="imported">Imported contact</option>
          </select>
        </label>
      </div>

      {error && (
        <p role="alert" className="mt-3 text-[12px]" style={{ color: 'var(--red)' }}>
          {error}
        </p>
      )}

      <div className="flex gap-2 mt-4">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 rounded-lg text-[13px] font-semibold disabled:opacity-50"
          style={{ background: 'var(--accent-solid)', color: 'var(--text-on-accent)' }}
        >
          {saving ? 'Saving…' : 'Add connection'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-4 py-2 rounded-lg text-[13px] font-semibold"
          style={{ color: 'var(--text-secondary)', boxShadow: 'inset 0 0 0 1px var(--card-ring)' }}
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

/* ============================================================
   Draft an ask
   ============================================================ */

function DraftDialog({
  connection,
  onClose,
  onSaved,
}: {
  connection: Connection
  onClose: () => void
  onSaved: () => void
}) {
  const [jobTitle, setJobTitle] = useState('')
  const [draft, setDraft] = useState('')
  const [requestId, setRequestId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') return onClose()
      if (e.key !== 'Tab' || !panelRef.current) return
      const f = panelRef.current.querySelectorAll<HTMLElement>(
        'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      if (!f.length) return
      const first = f[0]
      const last = f[f.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    },
    [onClose]
  )

  useEffect(() => {
    document.addEventListener('keydown', onKeyDown)
    closeRef.current?.focus()
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onKeyDown])

  const generate = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/referrals/find', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: connection.company,
          job_title: jobTitle.trim() || null,
          connection_id: connection.id,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Could not draft the message')
      const path = json.paths?.[0]
      if (!path) throw new Error('No referral path found for this contact')
      setDraft(path.draft || '')
      setRequestId(path.id ?? null)
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not draft the message')
    } finally {
      setLoading(false)
    }
  }

  const markSent = async () => {
    if (!requestId) return
    await fetch('/api/referrals/requests', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: requestId, status: 'sent', message_sent: draft }),
    })
    onSaved()
    onClose()
  }

  const copy = async () => {
    await navigator.clipboard.writeText(draft)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div
      className="fixed inset-0 z-[190] flex items-center justify-center p-4"
      style={{ background: 'var(--bg-scrim)' }}
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Draft a referral request to ${connection.name}`}
        className="w-full max-w-[520px] max-h-[88vh] overflow-y-auto rounded-2xl"
        style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-xl), 0 0 0 1px var(--card-ring)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-4">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar name={connection.name} id={connection.id} />
            <div className="min-w-0">
              <h2 className="font-display text-[1.3rem] leading-tight" style={{ color: 'var(--text)' }}>
                Ask {connection.name.split(' ')[0]} for a referral
              </h2>
              <p className="text-[12px] truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {[connection.title, connection.company].filter(Boolean).join(' · ') || 'No company on file'}
              </p>
            </div>
          </div>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 grid place-items-center w-8 h-8 rounded-lg"
            style={{ color: 'var(--text-secondary)', boxShadow: 'inset 0 0 0 1px var(--card-ring)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-5 pb-5">
          {!connection.company && (
            <p className="text-[12.5px] p-3 rounded-lg mb-4" style={{ background: 'var(--yellow-dim)', color: 'var(--yellow)' }}>
              This contact has no company recorded, so there is nothing to be referred into. Add their employer first.
            </p>
          )}

          <Field
            label="Role you want to be referred into"
            value={jobTitle}
            onChange={setJobTitle}
            placeholder="Senior Backend Engineer"
          />

          {error && (
            <p role="alert" className="mt-3 text-[12.5px]" style={{ color: 'var(--red)' }}>
              {error}
            </p>
          )}

          {!draft && (
            <button
              onClick={generate}
              disabled={loading || !connection.company}
              className="w-full mt-4 py-2.5 rounded-lg text-[13px] font-semibold disabled:opacity-50"
              style={{ background: 'var(--accent-solid)', color: 'var(--text-on-accent)' }}
            >
              {loading ? 'Writing…' : 'Write the message'}
            </button>
          )}

          {draft && (
            <>
              <div className="mt-4">
                <label htmlFor="draft-body" className="block text-[11px] font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  Your message — edit before sending
                </label>
                <textarea
                  id="draft-body"
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  rows={8}
                  className="w-full px-3 py-2.5 rounded-lg text-[13px] leading-relaxed outline-none resize-y"
                  style={{ background: 'var(--bg-input)', color: 'var(--text)', boxShadow: 'inset 0 0 0 1px var(--card-ring)' }}
                />
              </div>

              <div className="flex flex-wrap gap-2 mt-3">
                <button
                  onClick={copy}
                  className="px-3.5 py-2 rounded-lg text-[12.5px] font-semibold"
                  style={{ background: 'var(--bg-overlay)', color: 'var(--text)' }}
                >
                  {copied ? 'Copied' : 'Copy'}
                </button>
                {connection.email && (
                  <a
                    href={`mailto:${connection.email}?subject=${encodeURIComponent(
                      jobTitle ? `Referral for ${jobTitle}` : 'Quick ask'
                    )}&body=${encodeURIComponent(draft)}`}
                    className="px-3.5 py-2 rounded-lg text-[12.5px] font-semibold"
                    style={{ background: 'var(--bg-overlay)', color: 'var(--text)' }}
                  >
                    Open in email
                  </a>
                )}
                {connection.linkedin_url && (
                  <a
                    href={connection.linkedin_url.startsWith('http') ? connection.linkedin_url : `https://${connection.linkedin_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 rounded-lg text-[12.5px] font-semibold"
                    style={{ background: 'var(--bg-overlay)', color: 'var(--text)' }}
                  >
                    Open LinkedIn
                  </a>
                )}
                <button
                  onClick={markSent}
                  className="px-3.5 py-2 rounded-lg text-[12.5px] font-semibold ml-auto"
                  style={{ background: 'var(--accent-solid)', color: 'var(--text-on-accent)' }}
                >
                  Mark as sent
                </button>
              </div>
              <p className="text-[11px] mt-3 leading-relaxed" style={{ color: 'var(--text-faint)' }}>
                ApplyMaster does not send this for you. You send it, then mark it sent so the ask is tracked.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/* ============================================================
   Page
   ============================================================ */

type Tab = 'find' | 'network' | 'requests'

export default function NetworkPage() {
  const [tab, setTab] = useState<Tab>('find')
  const [connections, setConnections] = useState<Connection[]>([])
  const [requests, setRequests] = useState<ReferralRequest[]>([])
  const [loading, setLoading] = useState(true)

  const [query, setQuery] = useState('')
  const [hits, setHits] = useState<SearchHit[] | null>(null)
  const [gaps, setGaps] = useState<string[]>([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')

  const [drafting, setDrafting] = useState<Connection | null>(null)

  const loadAll = useCallback(async () => {
    const [c, r] = await Promise.all([
      fetch('/api/network/connections').then(res => res.json()).catch(() => ({ connections: [] })),
      fetch('/api/referrals/requests').then(res => res.json()).catch(() => ({ requests: [] })),
    ])
    setConnections(c.connections ?? [])
    setRequests(r.requests ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  /* Takes an explicit term so a click-to-search shortcut does not race the
     state update and search the previous query. */
  const search = async (e?: React.FormEvent, term?: string) => {
    e?.preventDefault()
    const q = (term ?? query).trim()
    if (!q) return
    setSearching(true)
    setSearchError('')
    try {
      const res = await fetch('/api/referrals/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Search failed')
      setHits(json.results ?? [])
      setGaps(json.companiesWithNoPath ?? [])
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'Search failed')
      setHits([])
    } finally {
      setSearching(false)
    }
  }

  const removeConnection = async (id: string) => {
    setConnections(cs => cs.filter(c => c.id !== id))
    await fetch(`/api/network/connections?id=${id}`, { method: 'DELETE' })
    setHits(h => (h ? h.filter(x => x.connection.id !== id) : h))
  }

  const setRequestStatus = async (id: string, status: string) => {
    setRequests(rs => rs.map(r => (r.id === id ? { ...r, status } : r)))
    await fetch('/api/referrals/requests', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    loadAll()
  }

  /* Companies you actually have a way into — the most useful summary of a
     network for someone who is job hunting. */
  const companies = useMemo(() => {
    const map = new Map<string, number>()
    for (const c of connections) {
      if (!c.company) continue
      map.set(c.company, (map.get(c.company) ?? 0) + 1)
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1])
  }, [connections])

  const openAsks = requests.filter(r => ['sent', 'drafted', 'suggested'].includes(r.status)).length

  const TABS: { id: Tab; label: string; count?: number }[] = [
    { id: 'find', label: 'Find a referral' },
    { id: 'network', label: 'Your network', count: connections.length },
    { id: 'requests', label: 'Requests', count: requests.length },
  ]

  return (
    <div className="space-y-5 max-w-[1360px] mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 pt-1">
        <div>
          <h1 className="font-display text-[clamp(1.75rem,2.6vw,2.15rem)] leading-tight" style={{ color: 'var(--text)' }}>
            Referral network
          </h1>
          <p className="text-[13px] mt-1" style={{ color: 'var(--text-muted)' }}>
            A referral converts far better than a cold application. This finds the people you already know.
          </p>
        </div>
        <div className="flex gap-6">
          <div>
            <div className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>
              Contacts
            </div>
            <div className="font-display text-[1.6rem] leading-none tabular-nums" style={{ color: 'var(--text)' }}>
              {connections.length}
            </div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>
              Companies
            </div>
            <div className="font-display text-[1.6rem] leading-none tabular-nums" style={{ color: 'var(--text)' }}>
              {companies.length}
            </div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>
              Open asks
            </div>
            <div className="font-display text-[1.6rem] leading-none tabular-nums" style={{ color: 'var(--text)' }}>
              {openAsks}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div
        className="inline-flex gap-1 p-1 rounded-xl"
        role="tablist"
        aria-label="Referral network sections"
        style={{ background: 'var(--bg-overlay)' }}
      >
        {TABS.map(t => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className="px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors"
            style={
              tab === t.id
                ? { background: 'var(--bg-card)', color: 'var(--text)', boxShadow: 'var(--shadow-sm)' }
                : { color: 'var(--text-muted)' }
            }
          >
            {t.label}
            {typeof t.count === 'number' && (
              <span className="ml-1.5 tabular-nums" style={{ color: 'var(--text-faint)' }}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Find ── */}
      {tab === 'find' && (
        <div className="space-y-4">
          <PremiumCard accent="pink" hover={false}>
            <form onSubmit={search} className="p-5">
              <label htmlFor="referral-query" className="block font-display text-[1.2rem] mb-1" style={{ color: 'var(--text)' }}>
                Who are you trying to reach?
              </label>
              <p className="text-[12px] mb-3" style={{ color: 'var(--text-muted)' }}>
                Searches the {connections.length} {connections.length === 1 ? 'person' : 'people'} in your network — nobody else.
              </p>
              <div className="flex gap-2">
                <input
                  id="referral-query"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Who can refer me at Stripe for a backend role?"
                  className="flex-1 px-4 py-3 rounded-xl text-[13.5px] outline-none"
                  style={{ background: 'var(--bg-input)', color: 'var(--text)', boxShadow: 'inset 0 0 0 1px var(--card-ring)' }}
                />
                <button
                  type="submit"
                  disabled={searching || !query.trim()}
                  className="px-5 rounded-xl text-[13px] font-semibold shrink-0 transition-colors"
                  style={
                    searching || !query.trim()
                      ? // A washed-out fill with white text on it fails contrast and
                        // reads as broken rather than disabled. Say it plainly instead.
                        { background: 'var(--bg-overlay)', color: 'var(--text-faint)', cursor: 'not-allowed' }
                      : { background: 'var(--accent-solid)', color: 'var(--text-on-accent)' }
                  }
                >
                  {searching ? 'Searching…' : 'Search'}
                </button>
              </div>

              {companies.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {companies.slice(0, 6).map(([name, n]) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setQuery(`Who can refer me at ${name}?`)}
                      className="px-2.5 py-1 rounded-full text-[11.5px] font-medium"
                      style={{ background: 'var(--bg-overlay)', color: 'var(--text-secondary)' }}
                    >
                      {name}
                      <span className="ml-1" style={{ color: 'var(--text-faint)' }}>
                        {n}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </form>
          </PremiumCard>

          {searchError && (
            <p role="alert" className="text-[13px] px-1" style={{ color: 'var(--red)' }}>
              {searchError}
            </p>
          )}

          {/* The graph is the point of this page: a fan of paths converging on
              you says "these are your routes in" faster than any list. Every
              node is a real row; the right column only fills from a real search. */}
          {connections.length > 0 && (
            <PremiumCard accent="none" hover={false}>
              <div className="px-2 pt-2 pb-4">
                <NetworkGraph
                  connections={connections}
                  hits={
                    hits === null
                      ? null
                      : hits.map(h => ({
                          id: h.connection.id,
                          name: h.connection.name,
                          title: h.connection.title,
                          company: h.connection.company,
                          score: h.score,
                          canRefer: h.connection.can_refer !== false,
                        }))
                  }
                  searching={searching}
                  onPick={id => {
                    const c = connections.find(x => x.id === id)
                    if (c) setDrafting(c)
                  }}
                />
              </div>
            </PremiumCard>
          )}

          {/* The companies you already have a way into — the fastest read on
              what this network is actually worth for a search. */}
          {hits === null && companies.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {companies.map(([name, count], i) => {
                const people = connections.filter(c => c.company === name)
                const t = toneFor(name)
                return (
                  <PremiumCard key={name} accent={t === 'accent' ? 'pink' : t} hover={false} animationDelay={i * 0.04}>
                    <button
                      onClick={() => {
                        const q = `Who can refer me at ${name}?`
                        setQuery(q)
                        search(undefined, q)
                      }}
                      className="w-full text-left p-4"
                    >
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <span className="text-[13px] font-semibold truncate" style={{ color: 'var(--text)' }}>
                          {name}
                        </span>
                        <span
                          className="px-2 py-0.5 rounded-full text-[10.5px] font-semibold tabular-nums shrink-0"
                          style={{ background: toneSurface(t, 0.13), color: tone(t) }}
                        >
                          {count} {count === 1 ? 'path' : 'paths'}
                        </span>
                      </div>
                      <div className="flex -space-x-2">
                        {people.slice(0, 5).map(pp => (
                          <span key={pp.id} style={{ boxShadow: '0 0 0 2px var(--bg-card)', borderRadius: '9999px' }}>
                            <Avatar name={pp.name} id={pp.id} size={26} />
                          </span>
                        ))}
                      </div>
                    </button>
                  </PremiumCard>
                )
              })}
            </div>
          )}

          <AnimatePresence>
            {hits?.map((hit, i) => {
              const t = toneFor(hit.connection.id)
              return (
                <motion.div
                  key={hit.connection.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.05, 0.3) }}
                >
                  <PremiumCard accent={t === 'accent' ? 'pink' : t} hover={false}>
                    <div className="flex flex-wrap items-center gap-4 p-4">
                      <Avatar name={hit.connection.name} id={hit.connection.id} size={44} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>
                            {hit.connection.name}
                          </span>
                          <span
                            className="px-2 py-0.5 rounded-full text-[10.5px] font-semibold"
                            style={{ background: toneSurface(t, 0.12), color: tone(t) }}
                          >
                            {RELATIONSHIP_LABEL[hit.connection.relationship] ?? hit.connection.relationship}
                          </span>
                        </div>
                        <p className="text-[12.5px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                          {[hit.connection.title, hit.connection.company].filter(Boolean).join(' · ') || 'No role on file'}
                        </p>
                        <p className="text-[11.5px] mt-1" style={{ color: 'var(--text-faint)' }}>
                          {hit.reason}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <StrengthBar value={hit.score} t={t} />
                        <button
                          onClick={() => setDrafting(hit.connection)}
                          className="px-3.5 py-2 rounded-lg text-[12.5px] font-semibold"
                          style={{ background: toneSurface(t, 0.14), color: tone(t) }}
                        >
                          Draft the ask
                        </button>
                      </div>
                    </div>
                  </PremiumCard>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* ── Network ── */}
      {tab === 'network' && (
        <div className="space-y-4">
          <AddConnection onAdded={c => setConnections(cs => [c, ...cs])} />

          {loading ? (
            <p className="text-[13px] px-1" style={{ color: 'var(--text-muted)' }}>
              Loading your network…
            </p>
          ) : connections.length === 0 ? (
            <PremiumCard accent="none" hover={false}>
              <div className="p-10 text-center">
                <p className="text-[14px] mb-1" style={{ color: 'var(--text)' }}>
                  Nobody here yet
                </p>
                <p className="text-[12.5px] max-w-md mx-auto leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  Start with five people you would happily message today. That is enough for the finder to be useful.
                </p>
              </div>
            </PremiumCard>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {connections.map(c => {
                const t = toneFor(c.id)
                return (
                  <PremiumCard key={c.id} accent={t === 'accent' ? 'pink' : t} hover={false}>
                    <div className="flex items-start gap-3 p-4">
                      <Avatar name={c.name} id={c.id} />
                      <div className="min-w-0 flex-1">
                        <div className="text-[13.5px] font-semibold truncate" style={{ color: 'var(--text)' }}>
                          {c.name}
                        </div>
                        <div className="text-[12px] truncate" style={{ color: 'var(--text-secondary)' }}>
                          {[c.title, c.company].filter(Boolean).join(' · ') || 'No role on file'}
                        </div>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span
                            className="px-2 py-0.5 rounded-full text-[10.5px] font-semibold"
                            style={{ background: toneSurface(t, 0.12), color: tone(t) }}
                          >
                            {RELATIONSHIP_LABEL[c.relationship] ?? c.relationship}
                          </span>
                          {c.can_refer === false && (
                            <span className="text-[10.5px]" style={{ color: 'var(--text-faint)' }}>
                              cannot refer
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5 shrink-0">
                        <button
                          onClick={() => setDrafting(c)}
                          disabled={!c.company}
                          className="px-2.5 py-1.5 rounded-lg text-[11.5px] font-semibold disabled:opacity-40"
                          style={{ background: toneSurface(t, 0.13), color: tone(t) }}
                        >
                          Ask
                        </button>
                        <button
                          onClick={() => removeConnection(c.id)}
                          aria-label={`Remove ${c.name}`}
                          className="px-2.5 py-1.5 rounded-lg text-[11.5px]"
                          style={{ color: 'var(--text-faint)' }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </PremiumCard>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Requests ── */}
      {tab === 'requests' && (
        <div className="space-y-3">
          {requests.length === 0 ? (
            <PremiumCard accent="none" hover={false}>
              <div className="p-10 text-center">
                <p className="text-[14px] mb-1" style={{ color: 'var(--text)' }}>
                  No referral asks yet
                </p>
                <p className="text-[12.5px] max-w-md mx-auto leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  Find someone in your network and draft an ask. Every one you make is tracked here so you know who owes
                  you a reply.
                </p>
              </div>
            </PremiumCard>
          ) : (
            requests.map(r => {
              const t = STATUS_TONE[r.status] ?? 'blue'
              return (
                <PremiumCard key={r.id} accent={t === 'accent' ? 'pink' : t} hover={false}>
                  <div className="p-4">
                    <div className="flex flex-wrap items-start gap-3">
                      {r.connection && <Avatar name={r.connection.name} id={r.connection.id} />}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[13.5px] font-semibold" style={{ color: 'var(--text)' }}>
                            {r.connection?.name ?? 'Removed contact'}
                          </span>
                          <span
                            className="px-2 py-0.5 rounded-full text-[10.5px] font-semibold"
                            style={{ background: toneSurface(t, 0.13), color: tone(t) }}
                          >
                            {STATUS_LABEL[r.status] ?? r.status}
                          </span>
                        </div>
                        <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                          {r.job_title ? `${r.job_title} · ` : ''}
                          {r.company}
                        </p>
                        {r.match_reason && (
                          <p className="text-[11.5px] mt-1" style={{ color: 'var(--text-faint)' }}>
                            {r.match_reason}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        {r.status !== 'sent' && r.status !== 'accepted' && r.status !== 'declined' && (
                          <button
                            onClick={() => setRequestStatus(r.id, 'sent')}
                            className="px-2.5 py-1.5 rounded-lg text-[11.5px] font-semibold"
                            style={{ background: toneSurface('yellow', 0.14), color: tone('yellow') }}
                          >
                            Mark sent
                          </button>
                        )}
                        {r.status === 'sent' && (
                          <>
                            <button
                              onClick={() => setRequestStatus(r.id, 'accepted')}
                              className="px-2.5 py-1.5 rounded-lg text-[11.5px] font-semibold"
                              style={{ background: toneSurface('green', 0.14), color: tone('green') }}
                            >
                              They said yes
                            </button>
                            <button
                              onClick={() => setRequestStatus(r.id, 'no_response')}
                              className="px-2.5 py-1.5 rounded-lg text-[11.5px] font-semibold"
                              style={{ background: 'var(--bg-overlay)', color: 'var(--text-muted)' }}
                            >
                              No reply
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {(r.message_sent || r.message_draft) && (
                      <details className="mt-3">
                        <summary className="cursor-pointer text-[12px] font-medium" style={{ color: tone(t) }}>
                          {r.message_sent ? 'What you sent' : 'Draft message'}
                        </summary>
                        <p
                          className="mt-2 p-3 rounded-lg text-[12.5px] leading-relaxed whitespace-pre-wrap"
                          style={{ background: 'var(--bg-overlay)', color: 'var(--text-secondary)' }}
                        >
                          {r.message_sent || r.message_draft}
                        </p>
                      </details>
                    )}
                  </div>
                </PremiumCard>
              )
            })
          )}
        </div>
      )}

      {drafting && (
        <DraftDialog
          connection={drafting}
          onClose={() => setDrafting(null)}
          onSaved={loadAll}
        />
      )}
    </div>
  )
}
