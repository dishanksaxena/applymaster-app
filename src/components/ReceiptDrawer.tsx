'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import type { ApplicationReceipt } from '@/lib/database.types'

/**
 * Shows exactly what was submitted for one application.
 *
 * Reads real rows from application_receipts, which are written by the submit
 * path at the moment of submission. "We applied for you" is not a claim a
 * user can check; this makes it checkable.
 */

const METHOD_LABEL: Record<string, string> = {
  auto: 'Submitted automatically',
  assisted: 'Pre-filled, you submitted',
  manual: 'Marked applied manually',
}

export default function ReceiptDrawer({
  applicationId,
  jobTitle,
  company,
  onClose,
}: {
  applicationId: string
  jobTitle?: string
  company?: string
  onClose: () => void
}) {
  const [receipt, setReceipt] = useState<ApplicationReceipt | null>(null)
  const [loading, setLoading] = useState(true)
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const supabase = createClient()
        const { data } = await supabase
          .from('application_receipts')
          .select('*')
          .eq('application_id', applicationId)
          .order('submitted_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        if (!cancelled) setReceipt((data as ApplicationReceipt) ?? null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [applicationId])

  /* Escape to close, and keep focus inside the panel while it is open. */
  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab' || !panelRef.current) return
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
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

  const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="py-3" style={{ borderBottom: '1px solid var(--border)' }}>
      <div className="text-[11px] uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-faint)' }}>
        {label}
      </div>
      <div className="text-[13.5px]" style={{ color: 'var(--text)' }}>
        {children}
      </div>
    </div>
  )

  return (
    <div
      className="fixed inset-0 z-[190] flex justify-end"
      style={{ background: 'var(--bg-scrim)' }}
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Application receipt"
        className="h-full w-full max-w-[460px] overflow-y-auto"
        style={{ background: 'var(--bg-card)', borderLeft: '1px solid var(--border)', boxShadow: 'var(--shadow-xl)' }}
        onClick={e => e.stopPropagation()}
      >
        <div
          className="sticky top-0 flex items-start justify-between gap-4 px-5 py-4"
          style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}
        >
          <div className="min-w-0">
            <h2 className="font-display text-[1.35rem] leading-tight" style={{ color: 'var(--text)' }}>
              Application receipt
            </h2>
            {(jobTitle || company) && (
              <p className="text-[12px] truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {[jobTitle, company].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Close receipt"
            className="shrink-0 grid place-items-center w-8 h-8 rounded-lg"
            style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-5 pb-8">
          {loading && (
            <p className="py-10 text-center text-[13px]" style={{ color: 'var(--text-muted)' }}>
              Loading receipt…
            </p>
          )}

          {!loading && !receipt && (
            <div className="py-10 text-center">
              <p className="text-[13.5px] mb-1" style={{ color: 'var(--text)' }}>
                No receipt for this application
              </p>
              <p className="text-[12px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Receipts are recorded from the moment of submission. Applications added before
                receipts existed, or marked applied by hand elsewhere, will not have one.
              </p>
            </div>
          )}

          {!loading && receipt && (
            <>
              <div className="flex items-center gap-2 py-4">
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold"
                  style={
                    receipt.status === 'submitted'
                      ? { background: 'var(--green-dim)', color: 'var(--green)' }
                      : receipt.status === 'failed'
                        ? { background: 'var(--red-dim)', color: 'var(--red)' }
                        : { background: 'var(--yellow-dim)', color: 'var(--yellow)' }
                  }
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'currentColor' }} />
                  {receipt.status === 'submitted' ? 'Submitted' : receipt.status === 'failed' ? 'Failed' : 'Needs review'}
                </span>
                <span className="text-[11.5px]" style={{ color: 'var(--text-muted)' }}>
                  {METHOD_LABEL[receipt.submission_method] ?? receipt.submission_method}
                </span>
              </div>

              {receipt.failure_reason && (
                <p
                  role="alert"
                  className="text-[12.5px] p-3 rounded-lg mb-3"
                  style={{ background: 'var(--red-dim)', color: 'var(--red)' }}
                >
                  {receipt.failure_reason}
                </p>
              )}

              <Row label="Submitted at">
                {new Date(receipt.submitted_at).toLocaleString(undefined, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </Row>

              <Row label="Destination">
                {receipt.destination ? (
                  <span className="capitalize">{receipt.destination}</span>
                ) : (
                  <span style={{ color: 'var(--text-muted)' }}>Not recorded</span>
                )}
                {receipt.destination_url && (
                  <>
                    {' · '}
                    <a
                      href={receipt.destination_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-2"
                      style={{ color: 'var(--accent)' }}
                    >
                      View posting
                    </a>
                  </>
                )}
              </Row>

              <Row label="Resume sent">
                {receipt.resume_version_label ?? (
                  <span style={{ color: 'var(--text-muted)' }}>Not recorded</span>
                )}
                {receipt.resume_file_url && (
                  <>
                    {' · '}
                    <a
                      href={receipt.resume_file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-2"
                      style={{ color: 'var(--accent)' }}
                    >
                      Download
                    </a>
                  </>
                )}
              </Row>

              <Row label="Cover letter">
                {receipt.cover_letter_text ? (
                  <details>
                    <summary className="cursor-pointer text-[13px]" style={{ color: 'var(--accent)' }}>
                      Show what was sent
                    </summary>
                    <pre
                      className="mt-2 p-3 rounded-lg whitespace-pre-wrap text-[12.5px] leading-relaxed font-sans"
                      style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                    >
                      {receipt.cover_letter_text}
                    </pre>
                  </details>
                ) : (
                  <span style={{ color: 'var(--text-muted)' }}>None sent</span>
                )}
              </Row>

              <Row label={`Screening answers (${receipt.screening_answers?.length ?? 0})`}>
                {receipt.screening_answers?.length ? (
                  <ul className="space-y-3">
                    {receipt.screening_answers.map((qa, i) => (
                      <li key={i}>
                        <p className="text-[12.5px] mb-0.5" style={{ color: 'var(--text-secondary)' }}>
                          {qa.question}
                        </p>
                        <p className="text-[13px] font-medium" style={{ color: 'var(--text)' }}>
                          {qa.answer}
                        </p>
                        {qa.source && (
                          <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-faint)' }}>
                            from {qa.source}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span style={{ color: 'var(--text-muted)' }}>None asked</span>
                )}
              </Row>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
