'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { readLinkedInFile, type LinkedInConnection } from '@/lib/linkedin-import'

/**
 * Import your LinkedIn network.
 *
 * LinkedIn does not give apps access to a member's connections, but it lets
 * every member download their own. This walks someone through requesting
 * that archive, then reads it — in the browser, so only the connection list
 * ever reaches ApplyMaster.
 */

const LINKEDIN_EXPORT_URL = 'https://www.linkedin.com/mypreferences/d/download-my-data'
const REQUESTED_KEY = 'am_li_export_requested_at'
const CHUNK = 1000

type Step = 'request' | 'upload' | 'reading' | 'preview' | 'importing' | 'done'
type Summary = { inserted: number; updated: number; total: number }

function ago(ts: number) {
  const m = Math.round((Date.now() - ts) / 60000)
  if (m < 2) return 'just now'
  if (m < 60) return `${m} minutes ago`
  const h = Math.round(m / 60)
  return h < 48 ? `${h} hour${h === 1 ? '' : 's'} ago` : `${Math.round(h / 24)} days ago`
}

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

export default function LinkedInImport({
  onClose,
  onImported,
}: {
  onClose: () => void
  onImported: (s: Summary) => void
}) {
  const [requestedAt, setRequestedAt] = useState<number | null>(null)
  const [step, setStep] = useState<Step>('request')
  const [error, setError] = useState('')
  const [rows, setRows] = useState<LinkedInConnection[]>([])
  const [fileName, setFileName] = useState('')
  const [progress, setProgress] = useState(0)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [dragging, setDragging] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Someone who already requested the archive comes back to the upload step.
  useEffect(() => {
    try {
      const v = Number(localStorage.getItem(REQUESTED_KEY))
      if (v) {
        setRequestedAt(v)
        setStep('upload')
      }
    } catch {}
  }, [])

  const busy = step === 'reading' || step === 'importing'
  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) return onClose()
      if (e.key !== 'Tab' || !panelRef.current) return
      const f = panelRef.current.querySelectorAll<HTMLElement>('button, a[href], input, [tabindex]:not([tabindex="-1"])')
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

  const readFile = async (file: File) => {
    setError('')
    setFileName(file.name)
    setStep('reading')
    try {
      const parsed = await readLinkedInFile(file)
      if (!parsed.length) throw new Error('That file has no connections in it.')
      setRows(parsed)
      setStep('preview')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read that file.')
      setStep('upload')
    }
  }

  const companies = useMemo(() => {
    const m = new Map<string, number>()
    for (const r of rows) if (r.company) m.set(r.company, (m.get(r.company) ?? 0) + 1)
    return [...m.entries()].sort((a, b) => b[1] - a[1])
  }, [rows])

  const runImport = async () => {
    setStep('importing')
    setProgress(0)
    setError('')
    let inserted = 0
    let updated = 0
    try {
      for (let i = 0; i < rows.length; i += CHUNK) {
        const chunk = rows.slice(i, i + CHUNK).map(r => ({
          name: r.name,
          linkedin_url: r.linkedin_url,
          email: r.email,
          company: r.company,
          title: r.title,
        }))
        const last = i + CHUNK >= rows.length
        const res = await fetch('/api/network/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ connections: chunk, final: last, total: rows.length }),
        })
        const json = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(json.error || 'The import stopped part-way. Run it again — nothing will be duplicated.')
        inserted += json.inserted ?? 0
        updated += json.updated ?? 0
        setProgress(Math.min(1, (i + CHUNK) / rows.length))
      }
      try {
        localStorage.removeItem(REQUESTED_KEY)
      } catch {}
      const s = { inserted, updated, total: rows.length }
      setSummary(s)
      setStep('done')
      onImported(s)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed')
      setStep('preview')
    }
  }

  const card = { background: 'var(--bg-overlay)', boxShadow: 'inset 0 0 0 1px var(--card-ring)' } as const

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
        className="w-full max-w-[560px] max-h-[90vh] overflow-y-auto rounded-2xl"
        style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-xl), 0 0 0 1px var(--card-ring)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 px-6 pt-5 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3">
            <LinkedInMark size={28} />
            <div>
              <h2 className="font-display text-[1.35rem] leading-tight" style={{ color: 'var(--text)' }}>
                Import your LinkedIn network
              </h2>
              <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                {step === 'request' && 'Step 1 of 2 · Ask LinkedIn for your data'}
                {(step === 'upload' || step === 'reading') && 'Step 2 of 2 · Upload the file LinkedIn sends you'}
                {step === 'preview' && 'Check it, then import'}
                {step === 'importing' && 'Importing…'}
                {step === 'done' && 'Done'}
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

        <div className="px-6 py-5">
          {/* ── 1. Request ── */}
          {step === 'request' && (
            <>
              <p className="text-[13.5px] leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
                LinkedIn doesn’t let apps read your connections directly, but it lets you download them. It takes two
                minutes, then one upload.
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
              <button
                onClick={() => setStep('upload')}
                className="w-full mt-2 py-2.5 text-[13px] font-semibold"
                style={{ color: 'var(--text-secondary)' }}
              >
                I already have the file
              </button>
            </>
          )}

          {/* ── 2. Upload ── */}
          {(step === 'upload' || step === 'reading') && (
            <>
              {requestedAt && (
                <div className="flex gap-3 p-3 rounded-xl mb-4 text-[12.5px]" style={{ background: 'var(--blue-dim)', color: 'var(--text-secondary)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5" style={{ color: 'var(--blue)' }} aria-hidden="true">
                    <path d="M4 4h16v16H4zM22 6l-10 7L2 6" />
                  </svg>
                  <span>
                    You asked LinkedIn for your archive <strong style={{ color: 'var(--text)' }}>{ago(requestedAt)}</strong>. Look for an email
                    from LinkedIn titled “Your LinkedIn data archive is ready”, download the ZIP, and drop it below.{' '}
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
                  borderRadius: 16,
                }}
              >
                {step === 'reading' ? (
                  <>
                    <span
                      className="w-6 h-6 rounded-full animate-spin"
                      style={{ border: '2.5px solid var(--border)', borderTopColor: 'var(--accent)' }}
                      aria-hidden="true"
                    />
                    <span className="text-[13.5px] font-semibold" style={{ color: 'var(--text)' }}>
                      Reading {fileName}…
                    </span>
                    <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                      Only your connections list is being read.
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
                      The ZIP LinkedIn emails you, or Connections.csv on its own
                    </span>
                  </>
                )}
              </label>
              <input
                ref={inputRef}
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
                  <strong style={{ color: 'var(--text)' }}>Opened on your device.</strong> Only your connections — names, companies, job
                  titles and profile links — are sent to ApplyMaster. Your messages and the rest of the archive never leave your computer.
                </span>
              </div>

              {!requestedAt && (
                <button onClick={() => setStep('request')} className="mt-3 text-[12.5px] font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  ← I haven’t requested it yet
                </button>
              )}
            </>
          )}

          {/* ── Preview ── */}
          {step === 'preview' && (
            <>
              <div className="flex items-end gap-6 mb-4">
                <div>
                  <div className="font-display text-[2.2rem] leading-none tabular-nums" style={{ color: 'var(--text)' }}>
                    {rows.length.toLocaleString()}
                  </div>
                  <div className="text-[12px] mt-1" style={{ color: 'var(--text-muted)' }}>
                    connections found
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
              </div>

              {companies.length > 0 && (
                <>
                  <p className="text-[12px] font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>
                    Where your network works most
                  </p>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {companies.slice(0, 12).map(([c, n]) => (
                      <span key={c} className="px-2.5 py-1 rounded-full text-[12px]" style={{ background: 'var(--bg-overlay)', color: 'var(--text-secondary)' }}>
                        {c} <span style={{ color: 'var(--text-faint)' }}>{n}</span>
                      </span>
                    ))}
                  </div>
                </>
              )}

              <div className="rounded-xl overflow-hidden mb-4" style={{ boxShadow: 'inset 0 0 0 1px var(--card-ring)' }}>
                {rows.slice(0, 5).map((r, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-[12.5px]" style={{ borderTop: i ? '1px solid var(--border)' : 'none' }}>
                    <span className="font-medium truncate" style={{ color: 'var(--text)' }}>
                      {r.name}
                    </span>
                    <span className="truncate text-right" style={{ color: 'var(--text-muted)' }}>
                      {[r.title, r.company].filter(Boolean).join(' · ') || '—'}
                    </span>
                  </div>
                ))}
                {rows.length > 5 && (
                  <div className="px-3.5 py-2 text-[11.5px]" style={{ borderTop: '1px solid var(--border)', color: 'var(--text-faint)' }}>
                    and {(rows.length - 5).toLocaleString()} more
                  </div>
                )}
              </div>

              {error && (
                <p role="alert" className="mb-3 text-[12.5px]" style={{ color: 'var(--red)' }}>
                  {error}
                </p>
              )}

              <button
                onClick={runImport}
                className="w-full py-3 rounded-xl text-[14px] font-semibold"
                style={{ background: 'var(--accent-solid)', color: 'var(--text-on-accent)' }}
              >
                Import {rows.length.toLocaleString()} connections
              </button>
              <p className="text-[11.5px] mt-2 text-center" style={{ color: 'var(--text-faint)' }}>
                People already in your network are updated with where they work now, not duplicated.
              </p>
            </>
          )}

          {/* ── Importing ── */}
          {step === 'importing' && (
            <div className="py-6">
              <p className="text-[13.5px] font-semibold mb-3" style={{ color: 'var(--text)' }}>
                Importing {rows.length.toLocaleString()} connections…
              </p>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-overlay)' }}>
                <div className="h-full rounded-full transition-all duration-300" style={{ width: `${Math.max(4, progress * 100)}%`, background: 'var(--accent-solid)' }} />
              </div>
              <p className="text-[12px] mt-2 tabular-nums" style={{ color: 'var(--text-muted)' }}>
                {Math.round(progress * 100)}%
              </p>
            </div>
          )}

          {/* ── Done ── */}
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
                Jobs at companies where you know someone are now flagged across ApplyMaster.
              </p>
              <button
                onClick={onClose}
                className="mt-5 px-6 py-2.5 rounded-xl text-[13.5px] font-semibold"
                style={{ background: 'var(--accent-solid)', color: 'var(--text-on-accent)' }}
              >
                Find a referral
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
