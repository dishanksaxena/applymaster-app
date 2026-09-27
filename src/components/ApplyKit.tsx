'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * The apply kit: everything for one application, ready to copy into the
 * employer's form.
 *
 * Employers' forms take applications only from a person (see lib/ats), so
 * this puts every answer one click from the clipboard — details, standing
 * answers, the tailored resume and cover letter, and an answer to any other
 * question the form asks — then records the submission when the person
 * says they sent it. The receipt keeps what they copied and what the
 * employer's confirmation said.
 */

type Packet = {
  application_id: string | null
  job: { id: string; title: string; company: string; url: string | null; description: string | null } | null
  applicant: {
    first_name: string
    last_name: string
    full_name: string
    email: string
    phone: string | null
    location: string | null
    country: string | null
    linkedin: string | null
    website: string | null
  }
  facts: {
    requires_sponsorship: boolean | null
    work_authorization: string | null
    years_experience: number | null
    salary_expectation: string | null
    notice_period: string | null
    willing_to_relocate: boolean | null
  }
  resume: { id: string; name: string; url: string | null } | null
  tailored_resume: { id: string; text: string } | null
  cover_letter: { id: string; text: string } | null
}

type Asked = { question: string; answer: string | null; source: 'profile' | 'preferences' | 'model' | null }

const yesNo = (v: boolean | null) => (v == null ? null : v ? 'Yes' : 'No')

function CopyButton({ value, onCopied, label = 'Copy' }: { value: string; onCopied?: () => void; label?: string }) {
  const [done, setDone] = useState(false)
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value)
          setDone(true)
          onCopied?.()
          setTimeout(() => setDone(false), 1400)
        } catch {}
      }}
      className="shrink-0 px-2.5 py-1 rounded-md text-[11.5px] font-semibold transition-colors"
      style={done ? { background: 'var(--green-dim)', color: 'var(--green)' } : { background: 'var(--bg-overlay)', color: 'var(--text-secondary)' }}
    >
      {done ? 'Copied' : label}
    </button>
  )
}

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="py-4" style={{ borderBottom: '1px solid var(--border)' }}>
      <h3 className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-faint)' }}>
        {title}
      </h3>
      {note && (
        <p className="text-[12px] mt-1" style={{ color: 'var(--text-muted)' }}>
          {note}
        </p>
      )}
      <div className="mt-2.5">{children}</div>
    </section>
  )
}

export default function ApplyKit({
  applicationId,
  onClose,
  onRecorded,
}: {
  applicationId: string
  onClose: () => void
  /** After "I submitted it" is recorded: refresh the tracker, maybe show the receipt. */
  onRecorded: (applicationId: string, openReceipt: boolean) => void
}) {
  const [packet, setPacket] = useState<Packet | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState<Record<string, string>>({})
  const [question, setQuestion] = useState('')
  const [asking, setAsking] = useState(false)
  const [asked, setAsked] = useState<Asked[]>([])
  const [busy, setBusy] = useState<'' | 'tailor' | 'letter' | 'resume-pdf' | 'letter-pdf'>('')
  const [finishing, setFinishing] = useState(false)
  const [confirmRef, setConfirmRef] = useState('')
  const [confirmText, setConfirmText] = useState('')
  const [recording, setRecording] = useState(false)
  const [recorded, setRecorded] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    let live = true
    fetch('/api/apply/packet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ application_id: applicationId }),
    })
      .then(async r => {
        const j = await r.json().catch(() => ({}))
        if (!live) return
        if (!r.ok) setError(j.error || 'Could not load your details')
        else setPacket(j)
      })
      .catch(() => live && setError('Could not load your details'))
    return () => {
      live = false
    }
  }, [applicationId])

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') return onClose()
      if (e.key !== 'Tab' || !panelRef.current) return
      const f = panelRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input, textarea, [tabindex]:not([tabindex="-1"])')
      if (!f.length) return
      if (e.shiftKey && document.activeElement === f[0]) {
        e.preventDefault()
        f[f.length - 1].focus()
      } else if (!e.shiftKey && document.activeElement === f[f.length - 1]) {
        e.preventDefault()
        f[0].focus()
      }
    },
    [onClose]
  )
  useEffect(() => {
    document.addEventListener('keydown', onKeyDown)
    closeRef.current?.focus()
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onKeyDown])

  const noteCopy = (label: string, value: string) => setCopied(c => ({ ...c, [label]: value }))

  const ask = async () => {
    const q = question.trim()
    if (!q || asking) return
    setAsking(true)
    try {
      const r = await fetch('/api/apply/answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: [q], application_id: applicationId }),
      })
      const j = await r.json().catch(() => ({}))
      const a = (j.answers ?? [])[0] as { answer: string; source: Asked['source'] } | undefined
      setAsked(list => [{ question: q, answer: a?.answer ?? null, source: a?.source ?? null }, ...list])
      setQuestion('')
    } finally {
      setAsking(false)
    }
  }

  const download = async (url: string, body: unknown, filename: string, kind: 'resume-pdf' | 'letter-pdf') => {
    setBusy(kind)
    setError('')
    try {
      const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!r.ok) throw new Error()
      const blob = await r.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = filename
      a.click()
      setTimeout(() => URL.revokeObjectURL(a.href), 5000)
    } catch {
      setError('The PDF could not be made. Try again, or copy the text instead.')
    } finally {
      setBusy('')
    }
  }

  const tailor = async () => {
    if (!packet?.job) return
    setBusy('tailor')
    setError('')
    try {
      const r = await fetch('/api/optimize-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_title: packet.job.title, job_description: packet.job.description ?? '', job_id: packet.job.id }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok || !j.tailored_resume) throw new Error(j.error)
      setPacket(p => (p ? { ...p, tailored_resume: { id: 'new', text: j.tailored_resume } } : p))
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : 'Could not tailor the resume. Try again.')
    } finally {
      setBusy('')
    }
  }

  const writeLetter = async () => {
    if (!packet?.job) return
    setBusy('letter')
    setError('')
    try {
      const r = await fetch('/api/generate-cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_title: packet.job.title,
          company: packet.job.company,
          job_description: packet.job.description ?? '',
          job_id: packet.job.id,
        }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok || !j.cover_letter) throw new Error(j.error)
      setPacket(p => (p ? { ...p, cover_letter: { id: j.cover_letter_id ?? 'new', text: j.cover_letter } } : p))
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : 'Could not write the cover letter. Try again.')
    } finally {
      setBusy('')
    }
  }

  const record = async () => {
    if (!packet || recording) return
    setRecording(true)
    setError('')
    const answers = [
      ...Object.entries(copied).map(([question, answer]) => ({ question, answer, source: 'you' })),
      ...asked.filter(a => a.answer).map(a => ({ question: a.question, answer: a.answer!, source: a.source ?? 'you' })),
    ]
    try {
      const r = await fetch('/api/apply/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          application_id: applicationId,
          method: 'manual',
          answers,
          resume_id: packet.resume?.id ?? null,
          resume_label: packet.tailored_resume ? `Tailored for ${packet.job?.company ?? 'this job'}` : packet.resume?.name ?? null,
          cover_letter_id: packet.cover_letter && packet.cover_letter.id !== 'new' ? packet.cover_letter.id : null,
          cover_letter_text: packet.cover_letter?.text ?? null,
          destination_url: packet.job?.url ?? null,
          confirmation_ref: confirmRef.trim() || null,
          confirmation_text: confirmText.trim() || null,
        }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(j.error)
      setRecorded(true)
      onRecorded(applicationId, false)
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : 'Could not record it. Try again.')
    } finally {
      setRecording(false)
    }
  }

  const detailRows: [string, string | null][] = packet
    ? [
        ['Full name', packet.applicant.full_name || null],
        ['First name', packet.applicant.first_name || null],
        ['Last name', packet.applicant.last_name || null],
        ['Email', packet.applicant.email || null],
        ['Phone', packet.applicant.phone],
        ['Location', packet.applicant.location],
        ['Country', packet.applicant.country],
        ['LinkedIn', packet.applicant.linkedin],
        ['Website', packet.applicant.website],
      ]
    : []

  const factRows: [string, string | null][] = packet
    ? [
        ['Will you require visa sponsorship?', yesNo(packet.facts.requires_sponsorship)],
        [
          `Are you authorized to work${packet.applicant.country ? ` in ${packet.applicant.country}` : ''}?`,
          packet.facts.requires_sponsorship == null ? null : packet.facts.requires_sponsorship ? 'No' : 'Yes',
        ],
        ['Years of experience', packet.facts.years_experience != null ? String(packet.facts.years_experience) : null],
        ['Expected salary', packet.facts.salary_expectation],
        ['Earliest start date', packet.facts.notice_period],
        ['Willing to relocate?', yesNo(packet.facts.willing_to_relocate)],
      ]
    : []

  const primaryBtn = { background: 'var(--accent-solid)', color: 'var(--text-on-accent)' } as const
  const quietBtn = { background: 'var(--bg-overlay)', color: 'var(--text)' } as const

  return (
    <div className="fixed inset-0 z-[190] flex justify-end" style={{ background: 'var(--bg-scrim)' }} onClick={onClose} role="presentation">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Apply kit"
        className="h-full w-full max-w-[520px] flex flex-col"
        style={{ background: 'var(--bg-card)', borderLeft: '1px solid var(--border)', boxShadow: 'var(--shadow-xl)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 px-5 py-4 shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: 'var(--accent)' }}>
              Apply kit
            </p>
            <h2 className="font-display text-[1.3rem] leading-tight mt-0.5" style={{ color: 'var(--text)' }}>
              {packet?.job?.title ?? 'Loading…'}
            </h2>
            {packet?.job?.company && (
              <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
                {packet.job.company}
              </p>
            )}
          </div>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Close"
            className="grid place-items-center w-8 h-8 rounded-lg shrink-0"
            style={{ color: 'var(--text-secondary)', boxShadow: 'inset 0 0 0 1px var(--card-ring)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5">
          {!packet && !error && (
            <p className="py-10 text-center text-[13px]" style={{ color: 'var(--text-muted)' }}>
              Gathering your details…
            </p>
          )}

          {packet && (
            <>
              <div className="py-4" style={{ borderBottom: '1px solid var(--border)' }}>
                {packet.job?.url ? (
                  <a
                    href={packet.job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-[13.5px] font-semibold"
                    style={primaryBtn}
                  >
                    Open the application
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                      <path d="M7 17 17 7M9 7h8v8" />
                    </svg>
                  </a>
                ) : (
                  <p className="text-[12.5px]" style={{ color: 'var(--text-muted)' }}>
                    This job has no link saved. Find the application on the employer&apos;s site.
                  </p>
                )}
                <p className="text-[12px] mt-2 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  Keep this open beside the form and copy each answer across. When you&apos;ve sent it, press{' '}
                  <strong style={{ color: 'var(--text)' }}>I submitted it</strong> below.
                </p>
              </div>

              <Section title="Your details">
                <ul className="space-y-1">
                  {detailRows.map(([label, value]) => (
                    <li key={label} className="flex items-center gap-3 py-1">
                      <span className="w-[92px] shrink-0 text-[12px]" style={{ color: 'var(--text-muted)' }}>
                        {label}
                      </span>
                      <span className="flex-1 min-w-0 text-[13px] truncate" style={{ color: value ? 'var(--text)' : 'var(--text-faint)' }} title={value ?? undefined}>
                        {value ?? 'Not in your resume'}
                      </span>
                      {value && <CopyButton value={value} onCopied={() => noteCopy(label, value)} />}
                    </li>
                  ))}
                </ul>
              </Section>

              <Section
                title="Resume"
                note={packet.tailored_resume ? 'Upload the tailored version: it was rewritten for this job.' : 'Upload your resume, or tailor it to this job first.'}
              >
                <div className="space-y-2">
                  {packet.resume?.url && (
                    <div className="flex items-center gap-3">
                      <span className="flex-1 min-w-0 text-[13px] truncate" style={{ color: 'var(--text)' }}>
                        {packet.resume.name}
                      </span>
                      <a href={packet.resume.url} target="_blank" rel="noopener noreferrer" className="px-2.5 py-1 rounded-md text-[11.5px] font-semibold" style={quietBtn}>
                        Download
                      </a>
                    </div>
                  )}
                  {packet.tailored_resume ? (
                    <div className="flex items-center gap-3">
                      <span className="flex-1 min-w-0 text-[13px] truncate" style={{ color: 'var(--text)' }}>
                        Tailored for {packet.job?.company ?? 'this job'}
                      </span>
                      <CopyButton value={packet.tailored_resume.text} label="Copy text" />
                      <button
                        type="button"
                        disabled={busy === 'resume-pdf'}
                        onClick={() =>
                          download(
                            '/api/resume/export-pdf',
                            { content: packet.tailored_resume!.text, name: packet.applicant.full_name, filename: `${packet.applicant.full_name || 'Resume'} - ${packet.job?.company ?? ''}` },
                            `${packet.applicant.full_name || 'Resume'} - ${packet.job?.company ?? 'tailored'}.pdf`,
                            'resume-pdf'
                          )
                        }
                        className="px-2.5 py-1 rounded-md text-[11.5px] font-semibold disabled:opacity-50"
                        style={quietBtn}
                      >
                        {busy === 'resume-pdf' ? 'Making PDF…' : 'Download PDF'}
                      </button>
                    </div>
                  ) : (
                    packet.job && (
                      <button type="button" onClick={tailor} disabled={!!busy} className="w-full py-2 rounded-lg text-[12.5px] font-semibold disabled:opacity-50" style={quietBtn}>
                        {busy === 'tailor' ? 'Tailoring your resume… (about 20 seconds)' : 'Tailor my resume for this job'}
                      </button>
                    )
                  )}
                </div>
              </Section>

              <Section title="Cover letter">
                {packet.cover_letter ? (
                  <>
                    <p
                      className="text-[12.5px] leading-relaxed whitespace-pre-wrap overflow-hidden"
                      style={{ color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 5, WebkitBoxOrient: 'vertical' }}
                    >
                      {packet.cover_letter.text}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <CopyButton value={packet.cover_letter.text} label="Copy letter" />
                      <button
                        type="button"
                        disabled={busy === 'letter-pdf'}
                        onClick={() =>
                          download(
                            '/api/cover-letters/export-pdf',
                            { title: `Cover letter - ${packet.job?.company ?? ''}`, content: packet.cover_letter!.text },
                            `Cover letter - ${packet.job?.company ?? 'application'}.pdf`,
                            'letter-pdf'
                          )
                        }
                        className="px-2.5 py-1 rounded-md text-[11.5px] font-semibold disabled:opacity-50"
                        style={quietBtn}
                      >
                        {busy === 'letter-pdf' ? 'Making PDF…' : 'Download PDF'}
                      </button>
                    </div>
                  </>
                ) : (
                  packet.job && (
                    <button type="button" onClick={writeLetter} disabled={!!busy} className="w-full py-2 rounded-lg text-[12.5px] font-semibold disabled:opacity-50" style={quietBtn}>
                      {busy === 'letter' ? 'Writing your cover letter…' : 'Write a cover letter for this job'}
                    </button>
                  )
                )}
              </Section>

              <Section title="Questions most forms ask" note="From your profile. Check each one matches your situation before you send it.">
                <ul className="space-y-1">
                  {factRows.map(([label, value]) => (
                    <li key={label} className="flex items-center gap-3 py-1">
                      <span className="flex-1 min-w-0 text-[12.5px]" style={{ color: 'var(--text-secondary)' }}>
                        {label}
                      </span>
                      <span className="text-[13px] font-semibold" style={{ color: value ? 'var(--text)' : 'var(--text-faint)' }}>
                        {value ?? '—'}
                      </span>
                      {value ? (
                        <CopyButton value={value} onCopied={() => noteCopy(label, value)} />
                      ) : (
                        <a href="/profile" className="text-[11.5px] font-semibold underline underline-offset-2" style={{ color: 'var(--text-muted)' }}>
                          Add it
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </Section>

              <Section title="Any other question" note="Paste a question from the form. Answers come only from your profile and resume.">
                <textarea
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) ask()
                  }}
                  rows={2}
                  placeholder="e.g. Why do you want to work at this company?"
                  aria-label="A question from the application form"
                  className="w-full px-3 py-2 rounded-lg text-[13px] outline-none resize-none"
                  style={{ background: 'var(--bg-input)', color: 'var(--text)', boxShadow: 'inset 0 0 0 1px var(--card-ring)' }}
                />
                <button type="button" onClick={ask} disabled={!question.trim() || asking} className="mt-2 px-3 py-1.5 rounded-lg text-[12.5px] font-semibold disabled:opacity-50" style={primaryBtn}>
                  {asking ? 'Answering…' : 'Answer it'}
                </button>
                {asked.length > 0 && (
                  <ul className="mt-3 space-y-2.5">
                    {asked.map((a, i) => (
                      <li key={i} className="p-3 rounded-lg" style={{ background: 'var(--bg-overlay)' }}>
                        <p className="text-[12px] font-semibold" style={{ color: 'var(--text-secondary)' }}>
                          {a.question}
                        </p>
                        {a.answer ? (
                          <>
                            <p className="text-[13px] mt-1 leading-relaxed" style={{ color: 'var(--text)' }}>
                              {a.answer}
                            </p>
                            <div className="flex items-center justify-between gap-2 mt-2">
                              <span className="text-[11px]" style={{ color: a.source === 'model' ? 'var(--yellow)' : 'var(--text-faint)' }}>
                                {a.source === 'model' ? 'Written from your resume: read it before you paste' : 'From your profile'}
                              </span>
                              <CopyButton value={a.answer} />
                            </div>
                          </>
                        ) : (
                          <p className="text-[12.5px] mt-1" style={{ color: 'var(--text-muted)' }}>
                            Your profile and resume don&apos;t answer this one, so it&apos;s yours to write.
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </Section>
              <div className="h-4" />
            </>
          )}
        </div>

        {error && (
          <p role="alert" className="px-5 py-2 text-[12.5px] shrink-0" style={{ color: 'var(--red)', borderTop: '1px solid var(--border)' }}>
            {error}
          </p>
        )}

        {packet && (
          <div className="px-5 py-4 shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
            {recorded ? (
              <div className="flex items-center justify-between gap-3">
                <p className="text-[13px]" style={{ color: 'var(--green)' }}>
                  Recorded. It&apos;s in Applied, with a receipt.
                </p>
                <button type="button" onClick={() => onRecorded(applicationId, true)} className="px-3 py-1.5 rounded-lg text-[12.5px] font-semibold" style={quietBtn}>
                  View receipt
                </button>
              </div>
            ) : finishing ? (
              <div className="space-y-2">
                <input
                  value={confirmRef}
                  onChange={e => setConfirmRef(e.target.value)}
                  placeholder="Reference number, if the employer gave one"
                  aria-label="Reference number"
                  className="w-full px-3 py-2 rounded-lg text-[13px] outline-none"
                  style={{ background: 'var(--bg-input)', color: 'var(--text)', boxShadow: 'inset 0 0 0 1px var(--card-ring)' }}
                />
                <textarea
                  value={confirmText}
                  onChange={e => setConfirmText(e.target.value)}
                  rows={2}
                  placeholder="Paste the employer's confirmation email (optional)"
                  aria-label="Confirmation email"
                  className="w-full px-3 py-2 rounded-lg text-[13px] outline-none resize-none"
                  style={{ background: 'var(--bg-input)', color: 'var(--text)', boxShadow: 'inset 0 0 0 1px var(--card-ring)' }}
                />
                <div className="flex gap-2">
                  <button type="button" onClick={() => setFinishing(false)} className="px-4 py-2.5 rounded-xl text-[13px] font-semibold" style={quietBtn}>
                    Not yet
                  </button>
                  <button type="button" onClick={record} disabled={recording} className="flex-1 py-2.5 rounded-xl text-[13.5px] font-semibold disabled:opacity-50" style={primaryBtn}>
                    {recording ? 'Recording…' : 'Record it as applied'}
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => setFinishing(true)} className="w-full py-2.5 rounded-xl text-[13.5px] font-semibold" style={primaryBtn}>
                I submitted it
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
