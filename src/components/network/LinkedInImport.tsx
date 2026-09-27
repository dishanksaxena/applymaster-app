'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { readLinkedInArchive, signalsFor, type LinkedInArchive } from '@/lib/linkedin-import'
import { claudeImportPrompt } from '@/lib/linkedin-claude-prompt'

/**
 * Import your LinkedIn network, then turn it into referral paths.
 *
 * LinkedIn does not give apps access to a member's connections, but it lets
 * every member download their own. This walks someone through requesting
 * that archive, reads it in the browser, and then does the part a raw list
 * cannot: separates the people you actually know from the people you are
 * merely connected to, and points them at the jobs you are chasing.
 *
 *   choose   what to import — connections, message history (who and when,
 *            never the text), endorsements, skills
 *   helpers  "who would refer you?" — ranked by who you actually talk to
 *   paths    warm paths: people at companies you are applying to,
 *            recruiters and hiring managers, your strongest relationships
 */

const LINKEDIN_EXPORT_URL = 'https://www.linkedin.com/mypreferences/d/download-my-data'
const REQUESTED_KEY = 'am_li_export_requested_at'
const CHUNK = 1000

type Step = 'request' | 'upload' | 'reading' | 'choose' | 'importing' | 'helpers' | 'paths' | 'done'
type Summary = { inserted: number; updated: number; total: number; skillsAdded: number }

export type ImportedConnection = {
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
  message_count?: number | null
  endorsed_you?: number | null
  would_help?: boolean | null
  connected_on?: string | null
}

const norm = (s: string | null | undefined) =>
  (s || '')
    .toLowerCase()
    .replace(/\b(inc|llc|ltd|corp|corporation|technologies|labs|group|the|pvt|private|limited)\b/g, '')
    .replace(/[^a-z0-9]/g, '')

const RECRUITER = /\b(recruit|talent|sourcer|hiring|people partner|hrbp|human resources|staffing)\w*/i
const HIRING_LEVEL = /\b(manager|director|head of|vp|vice president|chief|cto|ceo|founder|principal|lead)\b/i

function ago(ts: number) {
  const m = Math.round((Date.now() - ts) / 60000)
  if (m < 2) return 'just now'
  if (m < 60) return `${m} minutes ago`
  const h = Math.round(m / 60)
  return h < 48 ? `${h} hour${h === 1 ? '' : 's'} ago` : `${Math.round(h / 24)} days ago`
}

const monthYear = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : ''

function strengthOf(c: { would_help?: boolean | null; message_count?: number | null; endorsed_you?: number | null; last_contacted_at?: string | null }) {
  let s = 0
  if (c.would_help) s += 100
  s += Math.min(40, (c.message_count ?? 0) * 2)
  s += Math.min(15, (c.endorsed_you ?? 0) * 5)
  if (c.last_contacted_at) {
    const days = (Date.now() - new Date(c.last_contacted_at).getTime()) / 86400000
    if (days < 180) s += 10
    else if (days < 540) s += 4
  }
  return s
}

/* ── small pieces ─────────────────────────────────────────────────── */

function LinkedInMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <rect width="24" height="24" rx="5" fill="#0A66C2" />
      <path
        fill="#fff"
        d="M7.1 9.5h2.3v7.4H7.1zM8.25 5.9a1.33 1.33 0 110 2.66 1.33 1.33 0 010-2.66zM10.8 9.5h2.2v1h.03c.31-.58 1.06-1.2 2.18-1.2 2.33 0 2.76 1.53 2.76 3.53v4.07h-2.3v-3.6c0-.86-.02-1.97-1.2-1.97-1.2 0-1.38.94-1.38 1.9v3.67h-2.3z"
      />
    </svg>
  )
}

function ClaudeMark({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <g stroke="#D97757" strokeWidth="2.6" strokeLinecap="round">
        {[0, 45, 90, 135].map(a => (
          <line key={a} x1="12" y1="2.5" x2="12" y2="21.5" transform={`rotate(${a} 12 12)`} />
        ))}
      </g>
    </svg>
  )
}

function Initials({ name, size = 36 }: { name: string; size?: number }) {
  const ini = name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || '?'
  const hue = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  return (
    <span
      aria-hidden="true"
      className="grid place-items-center rounded-full font-semibold shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.36, background: `hsl(${hue} 45% 92%)`, color: `hsl(${hue} 40% 32%)` }}
    >
      {ini}
    </span>
  )
}

function Check({ on, disabled }: { on: boolean; disabled?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className="grid place-items-center w-5 h-5 rounded-md shrink-0"
      style={{
        background: on ? (disabled ? 'rgb(var(--green-rgb) / 0.45)' : 'var(--green)') : 'var(--bg-card)',
        boxShadow: on ? 'none' : 'inset 0 0 0 1.5px var(--border-hover)',
      }}
    >
      {on && (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.4">
          <path d="M20 6L9 17l-5-5" />
        </svg>
      )}
    </span>
  )
}

function Chip({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'green' | 'accent' | 'blue' }) {
  const style =
    tone === 'green'
      ? { background: 'var(--green-dim)', color: 'var(--green)' }
      : tone === 'accent'
        ? { background: 'var(--accent-dim)', color: 'var(--accent)' }
        : tone === 'blue'
          ? { background: 'var(--blue-dim)', color: 'var(--blue)' }
          : { background: 'var(--bg-overlay)', color: 'var(--text-secondary)' }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap" style={style}>
      {children}
    </span>
  )
}

/** A neutral mock of LinkedIn's export screen, with the two things to click marked. */
function ExportIllustration() {
  const Callout = ({ n }: { n: number }) => (
    <span
      className="grid place-items-center w-6 h-6 rounded-full text-[12px] font-bold shrink-0"
      style={{ background: 'var(--green)', color: '#fff', boxShadow: '0 0 0 3px rgb(var(--green-rgb) / 0.25)' }}
    >
      {n}
    </span>
  )
  return (
    <div className="rounded-xl p-4 text-[12px]" style={{ background: '#1d2226', color: '#e9e9e9' }} aria-hidden="true">
      <div className="font-semibold text-[13px] mb-0.5">Download my data</div>
      <div className="mb-3" style={{ color: '#a8a8a8' }}>
        Your LinkedIn data belongs to you, and you can download an archive any time.
      </div>
      <div className="flex items-start gap-2.5 rounded-lg p-2.5 mb-2" style={{ background: '#fff', color: '#1d2226' }}>
        <Callout n={1} />
        <span className="w-4 h-4 mt-0.5 rounded-full shrink-0" style={{ boxShadow: 'inset 0 0 0 4.5px #057642' }} />
        <span>
          <strong>Download larger data archive</strong>, including connections, verifications, contacts, account history…
        </span>
      </div>
      <div className="flex items-center gap-2.5 pl-2.5 mb-3" style={{ color: '#8c8c8c' }}>
        <span className="w-4 h-4 rounded-full shrink-0" style={{ boxShadow: 'inset 0 0 0 1.5px #8c8c8c' }} />
        Want something in particular? Select the data files…
      </div>
      <div className="flex items-center gap-2.5">
        <Callout n={2} />
        <span className="px-4 py-1.5 rounded-full font-semibold" style={{ background: '#0A66C2', color: '#fff' }}>
          Request archive
        </span>
      </div>
    </div>
  )
}

/* ── the dialog ───────────────────────────────────────────────────── */

export default function LinkedInImport({
  onClose,
  onImported,
  onDraft,
  initialStep,
  viaClaude = false,
}: {
  onClose: () => void
  onImported: (s: Summary) => void
  /** Open the referral-ask dialog for one imported person, with the role you're tracking there. */
  onDraft?: (c: ImportedConnection, role?: string) => void
  /** Deep links open straight on a step (Claude uses step=upload). */
  initialStep?: 'request' | 'upload'
  /** Claude is driving: counts only, so no names reach its screenshots. */
  viaClaude?: boolean
}) {
  const [requestedAt, setRequestedAt] = useState<number | null>(null)
  const [step, setStep] = useState<Step>(initialStep ?? 'request')
  const [mode, setMode] = useState<'manual' | 'claude'>('manual')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const [archive, setArchive] = useState<LinkedInArchive | null>(null)
  const [fileName, setFileName] = useState('')
  const [progress, setProgress] = useState(0)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [dragging, setDragging] = useState(false)
  const [include, setInclude] = useState({ messages: true, endorsements: true, skills: true })
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const [helperQuery, setHelperQuery] = useState('')
  const [saving, setSaving] = useState(false)
  const [imported, setImported] = useState<ImportedConnection[]>([])
  const [appCompanies, setAppCompanies] = useState<Map<string, { name: string; n: number; role: string | null }>>(new Map())
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try {
      const v = Number(localStorage.getItem(REQUESTED_KEY))
      if (v) {
        setRequestedAt(v)
        if (!initialStep) setStep('upload')
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const busy = step === 'reading' || step === 'importing' || saving
  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // A draft dialog opened from the warm paths sits on top; leave its keys alone.
      const active = document.activeElement
      if (panelRef.current && active && active !== document.body && !panelRef.current.contains(active)) return
      if (e.key === 'Escape' && !busy) return onClose()
      if (e.key !== 'Tab' || !panelRef.current) return
      const f = panelRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input, [tabindex]:not([tabindex="-1"])')
      if (!f.length) return
      if (e.shiftKey && document.activeElement === f[0]) {
        e.preventDefault()
        f[f.length - 1].focus()
      } else if (!e.shiftKey && document.activeElement === f[f.length - 1]) {
        e.preventDefault()
        f[0].focus()
      }
    },
    [onClose, busy]
  )
  useEffect(() => {
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onKeyDown])

  const goToLinkedIn = () => {
    const now = Date.now()
    try {
      localStorage.setItem(REQUESTED_KEY, String(now))
    } catch {}
    setRequestedAt(now)
    window.open(LINKEDIN_EXPORT_URL, '_blank', 'noopener,noreferrer')
    setStep('upload')
  }

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(claudeImportPrompt(window.location.origin))
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      setError('Could not copy — your browser blocked clipboard access.')
    }
  }

  const readFile = async (file: File) => {
    setError('')
    setFileName(file.name)
    setStep('reading')
    try {
      const a = await readLinkedInArchive(file)
      if (!a.connections.length) throw new Error('That file has no connections in it.')
      setArchive(a)
      setInclude({ messages: !!a.messages, endorsements: !!a.endorsements, skills: !!a.skills?.length })
      setStep('choose')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read that file.')
      setStep('upload')
    }
  }

  const companies = useMemo(() => {
    const m = new Map<string, number>()
    for (const r of archive?.connections ?? []) if (r.company) m.set(r.company, (m.get(r.company) ?? 0) + 1)
    return [...m.entries()].sort((a, b) => b[1] - a[1])
  }, [archive])

  const runImport = async () => {
    if (!archive) return
    setStep('importing')
    setProgress(0)
    setError('')
    const rows = archive.connections
    let inserted = 0
    let updated = 0
    let skillsAdded = 0
    try {
      for (let i = 0; i < rows.length; i += CHUNK) {
        const last = i + CHUNK >= rows.length
        const chunk = rows.slice(i, i + CHUNK).map(r => {
          const sig = signalsFor(archive, r.linkedin_url)
          return {
            name: r.name,
            linkedin_url: r.linkedin_url,
            email: r.email,
            company: r.company,
            title: r.title,
            connected_on: r.connected_on,
            ...(include.messages ? { message_count: sig.messages, last_message_at: sig.lastMessageAt } : {}),
            ...(include.endorsements ? { endorsed_you: sig.endorsements } : {}),
          }
        })
        const res = await fetch('/api/network/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            connections: chunk,
            final: last,
            total: rows.length,
            signals: last ? include : undefined,
            skills: last && include.skills ? archive.skills ?? [] : undefined,
          }),
        })
        const json = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(json.error || 'The import stopped part-way. Run it again — nothing will be duplicated.')
        inserted += json.inserted ?? 0
        updated += json.updated ?? 0
        skillsAdded += json.skillsAdded ?? 0
        setProgress(Math.min(1, (i + CHUNK) / rows.length))
      }
      try {
        localStorage.removeItem(REQUESTED_KEY)
      } catch {}
      const s = { inserted, updated, total: rows.length, skillsAdded }
      setSummary(s)
      onImported(s)
      // Claude's run ends here: picking who would help is the person's call.
      setStep(viaClaude ? 'done' : 'helpers')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed')
      setStep('choose')
    }
  }

  /* People worth asking first: those you actually talk to, then those who
     vouched for you, then seniority. The list a person picks from. */
  const helperCandidates = useMemo(() => {
    if (!archive) return []
    const q = helperQuery.trim().toLowerCase()
    return archive.connections
      .map(c => {
        const sig = signalsFor(archive, c.linkedin_url)
        // Log scale: 30 messages beats 3 by a lot, 300 beats 30 by a little.
        const recent = sig.lastMessageAt ? (Date.now() - new Date(sig.lastMessageAt).getTime()) / 86400000 : Infinity
        const score =
          (include.messages ? 12 * Math.log2(sig.messages + 1) + (recent < 180 ? 8 : recent < 540 ? 3 : 0) : 0) +
          (include.endorsements && sig.endorsements ? 6 : 0) +
          (HIRING_LEVEL.test(c.title || '') ? 3 : 0)
        return { c, sig, score }
      })
      .filter(x => !q || `${x.c.name} ${x.c.company ?? ''} ${x.c.title ?? ''}`.toLowerCase().includes(q))
      .sort((a, b) => b.score - a.score || a.c.name.localeCompare(b.c.name))
      .slice(0, q ? 60 : 40)
  }, [archive, helperQuery, include])

  const loadPaths = async () => {
    const [cRes, appsRes] = await Promise.all([
      fetch('/api/network/connections').then(r => r.json()).catch(() => ({ connections: [] })),
      (async () => {
        const sb = createClient()
        const {
          data: { user },
        } = await sb.auth.getUser()
        if (!user) return []
        const { data } = await sb
          .from('applications')
          .select('status, job:jobs(company, title)')
          .eq('user_id', user.id)
          .in('status', ['saved', 'queued', 'applied', 'screening', 'interview'])
        return (data ?? []) as unknown as { status: string; job: { company: string | null; title: string | null } | null }[]
      })(),
    ])
    setImported((cRes.connections ?? []) as ImportedConnection[])
    const m = new Map<string, { name: string; n: number; role: string | null }>()
    for (const a of appsRes) {
      const name = a.job?.company
      if (!name) continue
      const k = norm(name)
      const cur = m.get(k) ?? { name, n: 0, role: a.job?.title ?? null }
      cur.n += 1
      m.set(k, cur)
    }
    setAppCompanies(m)
  }

  const saveHelpers = async (skip: boolean) => {
    setSaving(true)
    setError('')
    try {
      if (!skip && picked.size) {
        const res = await fetch('/api/network/helpers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ linkedin_urls: [...picked] }),
        })
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Could not save your picks')
      }
      await loadPaths()
      setStep('paths')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save your picks')
    } finally {
      setSaving(false)
    }
  }

  /* Warm paths, from facts only: where they work, what they do, how you
     know them. No generated descriptions — nothing invented about people
     you know. */
  const paths = useMemo(() => {
    const reasonsFor = (c: ImportedConnection) => {
      const out: { text: string; tone: 'green' | 'accent' | 'blue' | 'neutral' }[] = []
      const app = appCompanies.get(norm(c.company))
      if (c.would_help) out.push({ text: 'You said they’d help', tone: 'green' })
      if (app) out.push({ text: `${app.n} job${app.n === 1 ? '' : 's'} in your tracker here`, tone: 'accent' })
      if (c.message_count) {
        out.push({
          text: `${c.message_count} message${c.message_count === 1 ? '' : 's'}${c.last_contacted_at ? ` · last ${monthYear(c.last_contacted_at)}` : ''}`,
          tone: 'blue',
        })
      }
      if (c.endorsed_you) out.push({ text: 'Endorsed you', tone: 'neutral' })
      if (RECRUITER.test(c.title || '')) out.push({ text: 'Recruiter — can put you forward', tone: 'neutral' })
      else if (HIRING_LEVEL.test(c.title || '')) out.push({ text: 'Senior enough to refer', tone: 'neutral' })
      if (c.connected_on) out.push({ text: `Connected since ${new Date(c.connected_on).getFullYear()}`, tone: 'neutral' })
      return out
    }
    const rank = (a: ImportedConnection, b: ImportedConnection) => strengthOf(b) - strengthOf(a)
    const used = new Set<string>()
    const take = (list: ImportedConnection[], n: number) => {
      const out = list.filter(c => !used.has(c.id)).sort(rank).slice(0, n)
      out.forEach(c => used.add(c.id))
      return out.map(c => ({ c, reasons: reasonsFor(c) }))
    }
    const atApplied = take(imported.filter(c => appCompanies.has(norm(c.company))), 6)
    const recruiters = take(imported.filter(c => RECRUITER.test(c.title || '')), 5)
    const strongest = take(imported.filter(c => strengthOf(c) > 0), 6)
    return { atApplied, recruiters, strongest }
  }, [imported, appCompanies])

  const card = { background: 'var(--bg-overlay)', boxShadow: 'inset 0 0 0 1px var(--card-ring)' } as const
  const primaryBtn = { background: 'var(--accent-solid)', color: 'var(--text-on-accent)' } as const
  const wide = step === 'helpers' || step === 'paths'

  const subtitle =
    mode === 'claude' && (step === 'request' || step === 'upload')
      ? 'Let Claude do it for you'
      : step === 'request'
        ? 'Step 1 of 2 · Ask LinkedIn for your data'
        : step === 'upload' || step === 'reading'
          ? 'Step 2 of 2 · Upload the file LinkedIn sends you'
          : step === 'choose'
            ? 'Choose what to import'
            : step === 'importing'
              ? 'Importing…'
              : step === 'helpers'
                ? 'Who would refer you?'
                : step === 'paths'
                  ? 'Your warm paths'
                  : 'Done'

  /* ── render ── */

  const PathSection = ({
    title,
    note,
    rows,
  }: {
    title: string
    note: string
    rows: { c: ImportedConnection; reasons: { text: string; tone: 'green' | 'accent' | 'blue' | 'neutral' }[] }[]
  }) =>
    rows.length ? (
      <section className="mb-6">
        <h3 className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>
          {title}
        </h3>
        <p className="text-[12px] mb-2.5" style={{ color: 'var(--text-muted)' }}>
          {note}
        </p>
        <ul className="rounded-xl overflow-hidden" style={{ boxShadow: 'inset 0 0 0 1px var(--card-ring)' }}>
          {rows.map(({ c, reasons }, i) => (
            <li key={c.id} className="flex items-start gap-3 px-4 py-3" style={{ borderTop: i ? '1px solid var(--border)' : 'none' }}>
              <Initials name={c.name} />
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-semibold" style={{ color: 'var(--text)' }}>
                  {c.name}
                </div>
                <div className="text-[12px] leading-snug" style={{ color: 'var(--text-secondary)' }}>
                  {[c.title, c.company].filter(Boolean).join(' · ') || 'No role on file'}
                </div>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {reasons.map(r => (
                    <Chip key={r.text} tone={r.tone}>
                      {r.text}
                    </Chip>
                  ))}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                {onDraft && c.company && (
                  <button
                    onClick={() => onDraft(c, appCompanies.get(norm(c.company))?.role ?? undefined)}
                    className="px-3 py-1.5 rounded-lg text-[12px] font-semibold"
                    style={primaryBtn}
                  >
                    Draft the ask
                  </button>
                )}
                {c.linkedin_url && (
                  <a
                    href={c.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11.5px] font-semibold"
                    style={{ color: '#0A66C2' }}
                  >
                    <LinkedInMark size={12} /> Profile
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
    ) : null

  return (
    <div
      className="fixed inset-0 z-[190] flex items-center justify-center p-4"
      style={{ background: 'var(--bg-scrim)' }}
      onClick={() => !busy && onClose()}
      role="presentation"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Import your LinkedIn network"
        className={`w-full ${wide ? 'max-w-[760px]' : 'max-w-[560px]'} max-h-[90vh] flex flex-col rounded-2xl`}
        style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-xl), 0 0 0 1px var(--card-ring)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 px-6 pt-5 pb-4 shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3">
            <LinkedInMark size={28} />
            <div>
              <h2 className="font-display text-[1.35rem] leading-tight" style={{ color: 'var(--text)' }}>
                {step === 'helpers' ? 'Who would refer you?' : step === 'paths' ? 'Your warm paths' : 'Import your LinkedIn network'}
              </h2>
              <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                {step === 'helpers'
                  ? 'The people who’d actually open a door if you asked'
                  : step === 'paths'
                    ? 'Where your network meets your job search'
                    : subtitle}
              </p>
            </div>
          </div>
          {!busy && (
            <button
              onClick={onClose}
              aria-label="Close"
              className="grid place-items-center w-8 h-8 rounded-lg shrink-0"
              style={{ color: 'var(--text-secondary)', boxShadow: 'inset 0 0 0 1px var(--card-ring)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <div className="px-6 py-5 overflow-y-auto">
          {/* Manual / Claude */}
          {(step === 'request' || step === 'upload') && !viaClaude && (
            <div className="flex justify-center mb-5">
              <div role="tablist" aria-label="How to import" className="inline-flex p-1 rounded-full" style={{ background: 'var(--bg-overlay)' }}>
                {(['manual', 'claude'] as const).map(m => (
                  <button
                    key={m}
                    role="tab"
                    aria-selected={mode === m}
                    onClick={() => setMode(m)}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[13px] font-semibold transition-colors"
                    style={mode === m ? { background: 'var(--bg-card)', color: 'var(--text)', boxShadow: 'var(--shadow-sm)' } : { color: 'var(--text-muted)' }}
                  >
                    {m === 'claude' && <ClaudeMark />}
                    {m === 'manual' ? 'Manual' : 'Claude'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* The two steps, always reachable in both directions. */}
          {mode === 'manual' && (step === 'request' || step === 'upload') && !viaClaude && (
            <ol className="grid grid-cols-2 gap-2 mb-5" aria-label="Steps">
              {([['request', '1', 'Request your archive'], ['upload', '2', 'Upload it']] as const).map(([id, n, label]) => {
                const active = step === id
                return (
                  <li key={id}>
                    <button
                      onClick={() => {
                        setError('')
                        setStep(id)
                      }}
                      aria-current={active ? 'step' : undefined}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-[12.5px] font-semibold transition-colors"
                      style={
                        active
                          ? { background: 'var(--accent-dim)', color: 'var(--accent)', boxShadow: 'inset 0 0 0 1px rgb(var(--accent-rgb) / 0.25)' }
                          : { background: 'var(--bg-overlay)', color: 'var(--text-secondary)' }
                      }
                    >
                      <span
                        className="grid place-items-center w-5 h-5 rounded-full text-[11px] shrink-0"
                        style={active ? { background: 'var(--accent-solid)', color: 'var(--text-on-accent)' } : { background: 'var(--bg-card)', color: 'var(--text-muted)' }}
                      >
                        {id === 'request' && requestedAt && !active ? '✓' : n}
                      </span>
                      {label}
                    </button>
                  </li>
                )
              })}
            </ol>
          )}

          {/* ── Claude ── */}
          {mode === 'claude' && (step === 'request' || step === 'upload') && (
            <>
              <h3 className="text-[15px] font-semibold" style={{ color: 'var(--text)' }}>
                Let Claude handle the export
              </h3>
              <p className="text-[13px] mt-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Claude requests your LinkedIn archive, waits for it — which can take a day — and uploads it to ApplyMaster for you.
              </p>
              <div className="mt-4 p-4 rounded-xl" style={card}>
                <p className="text-[13px] font-semibold mb-2" style={{ color: 'var(--text)' }}>
                  Before you start
                </p>
                <ul className="space-y-1.5 text-[12.5px] list-disc pl-5" style={{ color: 'var(--text-secondary)' }}>
                  <li>Use Claude Cowork or Claude Code on a computer.</li>
                  <li>Install the Claude Chrome extension when Claude asks.</li>
                  <li>You need a paid Claude plan.</li>
                  <li>Stay signed in to ApplyMaster and LinkedIn in that browser.</li>
                </ul>
              </div>
              <button
                onClick={copyPrompt}
                className="w-full mt-5 flex items-center justify-center gap-2 py-3 rounded-xl text-[14px] font-semibold"
                style={{ background: copied ? 'var(--green)' : 'var(--accent-solid)', color: '#fff' }}
              >
                {copied ? 'Copied — paste it into Claude' : 'Copy prompt'}
              </button>
              {error && (
                <p role="alert" className="mt-3 text-[12.5px]" style={{ color: 'var(--red)' }}>
                  {error}
                </p>
              )}
              <p className="text-[12px] mt-3 text-center leading-relaxed" style={{ color: 'var(--text-faint)' }}>
                Claude never opens your archive — ApplyMaster reads it in your browser — and the page it uploads to shows only a count, so
                your connections never appear on Claude’s screen. Afterwards, you pick who would help.
              </p>
            </>
          )}

          {/* ── 1. Request ── */}
          {mode === 'manual' && step === 'request' && (
            <>
              <p className="text-[13.5px] leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
                LinkedIn doesn’t let apps read your connections directly, but it lets you download them. It takes two minutes, then one
                upload.
              </p>
              <ExportIllustration />
              <ol className="mt-4 space-y-2 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
                <li>
                  <strong style={{ color: 'var(--text)' }}>1.</strong> Choose <strong style={{ color: 'var(--text)' }}>“Download larger data archive”</strong> — the smaller one leaves connections out.
                </li>
                <li>
                  <strong style={{ color: 'var(--text)' }}>2.</strong> Click <strong style={{ color: 'var(--text)' }}>Request archive</strong>.
                </li>
                <li>
                  <strong style={{ color: 'var(--text)' }}>3.</strong> LinkedIn emails you a download link, usually within a few hours. Come back and upload it here.
                </li>
              </ol>
              <button
                onClick={goToLinkedIn}
                className="w-full mt-5 flex items-center justify-center gap-2.5 py-3 rounded-xl text-[14px] font-semibold"
                style={{ background: '#0A66C2', color: '#fff' }}
              >
                <LinkedInMark size={18} />
                Continue to LinkedIn
              </button>
              <button onClick={() => setStep('upload')} className="w-full mt-2 py-2.5 text-[13px] font-semibold" style={{ color: 'var(--text-secondary)' }}>
                I already have the file
              </button>
            </>
          )}

          {/* ── 2. Upload ── */}
          {((mode === 'manual' && step === 'upload') || step === 'reading') && (
            <>
              {requestedAt && step === 'upload' && (
                <div className="flex gap-3 p-3 rounded-xl mb-4 text-[12.5px]" style={{ background: 'var(--blue-dim)', color: 'var(--text-secondary)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5" style={{ color: 'var(--blue)' }} aria-hidden="true">
                    <path d="M4 4h16v16H4zM22 6l-10 7L2 6" />
                  </svg>
                  <span>
                    You asked LinkedIn for your archive <strong style={{ color: 'var(--text)' }}>{ago(requestedAt)}</strong>. Look for an email from LinkedIn titled “Your
                    LinkedIn data archive is ready”, download the ZIP, and drop it below.{' '}
                    <button onClick={goToLinkedIn} className="underline underline-offset-2" style={{ color: 'var(--blue)' }}>
                      Open LinkedIn again
                    </button>
                  </span>
                </div>
              )}
              <label
                htmlFor="li-file"
                onDragOver={e => {
                  e.preventDefault()
                  setDragging(true)
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={e => {
                  e.preventDefault()
                  setDragging(false)
                  const f = e.dataTransfer.files?.[0]
                  if (f) readFile(f)
                }}
                className="flex flex-col items-center justify-center text-center gap-2 py-10 px-6 rounded-2xl cursor-pointer transition-colors"
                style={{
                  background: dragging ? 'var(--accent-dim)' : 'var(--bg-overlay)',
                  boxShadow: `inset 0 0 0 1.5px ${dragging ? 'var(--accent)' : 'var(--card-ring)'}`,
                }}
              >
                {step === 'reading' ? (
                  <>
                    <span className="w-6 h-6 rounded-full animate-spin" style={{ border: '2.5px solid var(--border)', borderTopColor: 'var(--accent)' }} aria-hidden="true" />
                    <span className="text-[13.5px] font-semibold" style={{ color: 'var(--text)' }}>
                      Reading {fileName}…
                    </span>
                    <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                      On your device — nothing has been sent yet.
                    </span>
                  </>
                ) : (
                  <>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" style={{ color: 'var(--text-muted)' }} aria-hidden="true">
                      <path d="M12 16V4M7 9l5-5 5 5M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3" />
                    </svg>
                    <span className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>
                      Drop your LinkedIn export here, or click to browse
                    </span>
                    <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                      The ZIP LinkedIn emails you · you choose what to import next
                    </span>
                  </>
                )}
              </label>
              <input
                id="li-file"
                type="file"
                accept=".zip,.csv,application/zip,text/csv"
                className="sr-only"
                onChange={e => {
                  const f = e.target.files?.[0]
                  if (f) readFile(f)
                  e.target.value = ''
                }}
              />
              {error && (
                <p role="alert" className="mt-3 text-[12.5px]" style={{ color: 'var(--red)' }}>
                  {error}
                </p>
              )}
              <div className="flex gap-2.5 mt-4 p-3 rounded-xl text-[12px] leading-relaxed" style={card}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5" style={{ color: 'var(--green)' }} aria-hidden="true">
                  <rect x="4" y="11" width="16" height="10" rx="2" />
                  <path d="M8 11V7a4 4 0 018 0v4" />
                </svg>
                <span style={{ color: 'var(--text-secondary)' }}>
                  <strong style={{ color: 'var(--text)' }}>Opened on your device.</strong> You choose what to import on the next screen. Message text never leaves
                  your computer, and neither does anything else you don’t select.
                </span>
              </div>
            </>
          )}

          {/* ── Choose what to import ── */}
          {step === 'choose' && archive && (
            <>
              <div className="flex items-end gap-8 mb-4">
                <div>
                  <div className="font-display text-[2.2rem] leading-none tabular-nums" style={{ color: 'var(--text)' }}>
                    {archive.connections.length.toLocaleString()}
                  </div>
                  <div className="text-[12px] mt-1" style={{ color: 'var(--text-muted)' }}>
                    connections
                  </div>
                </div>
                <div>
                  <div className="font-display text-[2.2rem] leading-none tabular-nums" style={{ color: 'var(--text)' }}>
                    {companies.length.toLocaleString()}
                  </div>
                  <div className="text-[12px] mt-1" style={{ color: 'var(--text-muted)' }}>
                    companies
                  </div>
                </div>
                {archive.messages && (
                  <div>
                    <div className="font-display text-[2.2rem] leading-none tabular-nums" style={{ color: 'var(--text)' }}>
                      {archive.messages.people.toLocaleString()}
                    </div>
                    <div className="text-[12px] mt-1" style={{ color: 'var(--text-muted)' }}>
                      you’ve messaged
                    </div>
                  </div>
                )}
              </div>

              <p className="text-[13px] font-semibold mb-2" style={{ color: 'var(--text)' }}>
                Choose what to import
              </p>
              <div className="rounded-xl overflow-hidden mb-4" style={{ boxShadow: 'inset 0 0 0 1px var(--card-ring)' }}>
                {(
                  [
                    { key: 'connections', title: 'Connections', desc: `${archive.connections.length.toLocaleString()} people, with where they work and their profile links`, available: true, required: true },
                    {
                      key: 'messages',
                      title: 'Message history',
                      desc: archive.messages
                        ? `Who you’ve messaged and when — ${archive.messages.people.toLocaleString()} people. The text of your messages is never uploaded.`
                        : 'Not in this file. Upload the full ZIP to see who you actually talk to.',
                      available: !!archive.messages,
                    },
                    {
                      key: 'endorsements',
                      title: 'Endorsements',
                      desc: archive.endorsements
                        ? `${archive.endorsements.people.toLocaleString()} people who endorsed your skills — they can vouch for your work`
                        : 'None in this file.',
                      available: !!archive.endorsements,
                    },
                    {
                      key: 'skills',
                      title: 'Your skills',
                      desc: archive.skills?.length
                        ? `${archive.skills.length} skills, added to the ones your daily job matches use`
                        : 'None in this file.',
                      available: !!archive.skills?.length,
                    },
                  ] as const
                ).map((o, i) => {
                  const on = o.key === 'connections' ? true : o.available && include[o.key as 'messages' | 'endorsements' | 'skills']
                  return (
                    <button
                      key={o.key}
                      type="button"
                      disabled={o.key === 'connections' || !o.available}
                      onClick={() => setInclude(v => ({ ...v, [o.key]: !v[o.key as 'messages' | 'endorsements' | 'skills'] }))}
                      aria-pressed={on}
                      className="w-full flex items-start gap-3 px-4 py-3 text-left disabled:cursor-default"
                      style={{ borderTop: i ? '1px solid var(--border)' : 'none', opacity: o.available ? 1 : 0.55 }}
                    >
                      <Check on={on} disabled={o.key === 'connections'} />
                      <span className="min-w-0">
                        <span className="flex items-center gap-2 text-[13.5px] font-semibold" style={{ color: 'var(--text)' }}>
                          {o.title}
                          {'required' in o && o.required && <Chip tone="green">Required</Chip>}
                        </span>
                        <span className="block text-[12px] mt-0.5 leading-snug" style={{ color: 'var(--text-muted)' }}>
                          {o.desc}
                        </span>
                      </span>
                    </button>
                  )
                })}
              </div>

              {!viaClaude && companies.length > 0 && (
                <>
                  <p className="text-[12px] font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>
                    Where your network works most
                  </p>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {companies.slice(0, 10).map(([c, n]) => (
                      <span key={c} className="px-2.5 py-1 rounded-full text-[12px]" style={{ background: 'var(--bg-overlay)', color: 'var(--text-secondary)' }}>
                        {c} <span style={{ color: 'var(--text-faint)' }}>{n}</span>
                      </span>
                    ))}
                  </div>
                </>
              )}

              {error && (
                <p role="alert" className="mb-3 text-[12.5px]" style={{ color: 'var(--red)' }}>
                  {error}
                </p>
              )}
              <div className="flex gap-2">
                <button onClick={() => setStep('upload')} className="px-4 py-3 rounded-xl text-[13.5px] font-semibold" style={{ background: 'var(--bg-overlay)', color: 'var(--text)' }}>
                  Back
                </button>
                <button onClick={runImport} className="flex-1 py-3 rounded-xl text-[14px] font-semibold" style={primaryBtn}>
                  Import {archive.connections.length.toLocaleString()} connections
                </button>
              </div>
              <p className="text-[11.5px] mt-2 text-center" style={{ color: 'var(--text-faint)' }}>
                People already in your network are updated with where they work now, not duplicated.
              </p>
            </>
          )}

          {/* ── Importing ── */}
          {step === 'importing' && (
            <div className="py-6">
              <p className="text-[13.5px] font-semibold mb-3" style={{ color: 'var(--text)' }}>
                Importing {archive?.connections.length.toLocaleString()} connections…
              </p>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-overlay)' }}>
                <div className="h-full rounded-full transition-all duration-300" style={{ width: `${Math.max(4, progress * 100)}%`, background: 'var(--accent-solid)' }} />
              </div>
              <p className="text-[12px] mt-2 tabular-nums" style={{ color: 'var(--text-muted)' }}>
                {Math.round(progress * 100)}%
              </p>
            </div>
          )}

          {/* ── Who would refer you? ── */}
          {step === 'helpers' && archive && (
            <>
              {summary && (
                <p className="text-[12.5px] mb-3 px-3 py-2 rounded-lg" style={{ background: 'var(--green-dim)', color: 'var(--green)' }}>
                  Imported {summary.inserted.toLocaleString()} {summary.inserted === 1 ? 'person' : 'people'}
                  {summary.updated ? ` · ${summary.updated.toLocaleString()} updated with new jobs` : ''}
                  {summary.skillsAdded ? ` · ${summary.skillsAdded} skills added to your job matching` : ''}
                </p>
              )}
              <p className="text-[13.5px] leading-relaxed mb-3" style={{ color: 'var(--text-secondary)' }}>
                Pick the people who’d make an intro or put you forward if you asked. They’re ranked first in every referral search.
                {include.messages && archive.messages ? ' The list starts with who you talk to most.' : ''}{' '}
                <strong style={{ color: 'var(--text)' }}>Pick at least 3.</strong>
              </p>
              <input
                value={helperQuery}
                onChange={e => setHelperQuery(e.target.value)}
                placeholder="Search your connections by name, company or title…"
                aria-label="Search your connections"
                className="w-full px-4 py-2.5 rounded-xl text-[13.5px] outline-none mb-3"
                style={{ background: 'var(--bg-input)', color: 'var(--text)', boxShadow: 'inset 0 0 0 1px var(--card-ring)' }}
              />
              <ul className="grid sm:grid-cols-2 gap-2">
                {helperCandidates.map(({ c, sig }) => {
                  const on = !!c.linkedin_url && picked.has(c.linkedin_url)
                  return (
                    <li key={c.linkedin_url ?? c.name}>
                      <button
                        type="button"
                        disabled={!c.linkedin_url}
                        aria-pressed={on}
                        onClick={() =>
                          setPicked(p => {
                            const n = new Set(p)
                            if (c.linkedin_url) (n.has(c.linkedin_url) ? n.delete(c.linkedin_url) : n.add(c.linkedin_url))
                            return n
                          })
                        }
                        className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors"
                        style={{
                          background: on ? 'var(--green-dim)' : 'var(--bg-card)',
                          boxShadow: `inset 0 0 0 1px ${on ? 'rgb(var(--green-rgb) / 0.4)' : 'var(--card-ring)'}`,
                        }}
                      >
                        <Initials name={c.name} size={34} />
                        <span className="min-w-0 flex-1">
                          <span className="block text-[13px] font-semibold truncate" style={{ color: 'var(--text)' }}>
                            {c.name}
                          </span>
                          <span
                            className="text-[11.5px] leading-snug overflow-hidden"
                            style={{ color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}
                          >
                            {[c.title, c.company].filter(Boolean).join(' · ')}
                          </span>
                          {(sig.messages > 0 || sig.endorsements > 0) && (
                            <span className="block text-[11px] mt-0.5" style={{ color: 'var(--blue)' }}>
                              {[
                                sig.messages ? `${sig.messages} message${sig.messages === 1 ? '' : 's'}` : '',
                                sig.endorsements ? 'endorsed you' : '',
                              ]
                                .filter(Boolean)
                                .join(' · ')}
                            </span>
                          )}
                        </span>
                        <Check on={on} />
                      </button>
                    </li>
                  )
                })}
              </ul>
              {helperCandidates.length === 0 && (
                <p className="text-[13px] py-6 text-center" style={{ color: 'var(--text-muted)' }}>
                  Nobody matches “{helperQuery}”.
                </p>
              )}
              {error && (
                <p role="alert" className="mt-3 text-[12.5px]" style={{ color: 'var(--red)' }}>
                  {error}
                </p>
              )}
            </>
          )}

          {/* ── Warm paths ── */}
          {step === 'paths' && (
            <>
              <PathSection
                title="At companies you’re applying to"
                note="People inside the companies in your application tracker — the most valuable referral you can get."
                rows={paths.atApplied}
              />
              <PathSection title="Recruiters in your network" note="They can put you forward directly, at their company or elsewhere." rows={paths.recruiters} />
              <PathSection title="Your strongest relationships" note="The people you actually talk to — most likely to say yes." rows={paths.strongest} />
              {!paths.atApplied.length && !paths.recruiters.length && !paths.strongest.length && (
                <div className="py-8 text-center">
                  <p className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>
                    Your network is in
                  </p>
                  <p className="text-[12.5px] mt-1 max-w-sm mx-auto" style={{ color: 'var(--text-muted)' }}>
                    Save or queue jobs and ApplyMaster will show who you know at each company, right on the job card.
                  </p>
                </div>
              )}
              {!appCompanies.size && (paths.recruiters.length > 0 || paths.strongest.length > 0) && (
                <p className="text-[12px] mb-2" style={{ color: 'var(--text-muted)' }}>
                  Add jobs to your tracker and you’ll also see who you know at each of those companies.
                </p>
              )}
            </>
          )}

          {/* ── Done (Claude's run ends here) ── */}
          {step === 'done' && summary && (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full grid place-items-center mx-auto mb-3" style={{ background: 'var(--green-dim)', color: 'var(--green)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <h3 className="font-display text-[1.5rem]" style={{ color: 'var(--text)' }}>
                Your network is in
              </h3>
              <p className="text-[13.5px] mt-1" style={{ color: 'var(--text-secondary)' }}>
                {summary.inserted.toLocaleString()} added
                {summary.updated ? ` · ${summary.updated.toLocaleString()} updated with new jobs` : ''}
                {summary.total - summary.inserted - summary.updated > 0
                  ? ` · ${(summary.total - summary.inserted - summary.updated).toLocaleString()} already up to date`
                  : ''}
              </p>
              <p className="text-[12.5px] mt-3" style={{ color: 'var(--text-muted)' }}>
                Open ApplyMaster’s network page to pick who would help you.
              </p>
            </div>
          )}
        </div>

        {/* Sticky actions for the two longer steps */}
        {step === 'helpers' && (
          <div className="flex items-center justify-between gap-3 px-6 py-4 shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
            <span className="text-[12.5px] tabular-nums" style={{ color: 'var(--text-muted)' }}>
              {picked.size} selected
            </span>
            <div className="flex gap-2">
              <button onClick={() => saveHelpers(true)} disabled={saving} className="px-4 py-2.5 rounded-xl text-[13px] font-semibold" style={{ color: 'var(--text-secondary)' }}>
                Skip for now
              </button>
              <button
                onClick={() => saveHelpers(false)}
                disabled={saving || picked.size < 3}
                className="px-5 py-2.5 rounded-xl text-[13px] font-semibold disabled:opacity-45"
                style={primaryBtn}
              >
                {saving ? 'Saving…' : picked.size < 3 ? `Pick ${3 - picked.size} more` : 'See my warm paths'}
              </button>
            </div>
          </div>
        )}
        {step === 'paths' && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
            <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-[13px] font-semibold" style={primaryBtn}>
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
