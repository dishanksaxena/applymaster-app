'use client'

import { useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { checkResume, extractKeywords, type Keyword } from '@/lib/tools/keywords'
import { track } from '@/lib/track'

/**
 * The free resume checker (/tools/ats-resume-checker) and its job-description
 * only variant (/tools/job-description-keyword-extractor). Everything runs in
 * the browser: files are read here and never uploaded.
 */

async function readFile(file: File): Promise<string> {
  const name = file.name.toLowerCase()
  if (name.endsWith('.txt') || file.type === 'text/plain') return file.text()
  if (name.endsWith('.docx')) {
    const JSZip = (await import('jszip')).default
    const zip = await JSZip.loadAsync(await file.arrayBuffer())
    const xml = (await zip.file('word/document.xml')?.async('text')) ?? ''
    return xml
      .replace(/<\/w:p>/g, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
  }
  if (name.endsWith('.pdf') || file.type === 'application/pdf') {
    const pdfjs = await import('pdfjs-dist')
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`
    const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise
    const pages: string[] = []
    for (let i = 1; i <= pdf.numPages; i++) {
      const content = await (await pdf.getPage(i)).getTextContent()
      pages.push(content.items.map(it => ('str' in it ? it.str + (it.hasEOL ? '\n' : ' ') : '')).join(''))
    }
    return pages.join('\n')
  }
  throw new Error('Use a PDF, Word (.docx) or text file, or paste the text.')
}

const KIND_LABEL: Record<Keyword['kind'], string> = { skill: 'Skills and tools', term: 'Other terms the posting repeats', soft: 'Soft skills' }

function Chip({ k, showFound }: { k: Keyword; showFound: boolean }) {
  const tone = !showFound ? 'blue' : k.found ? 'green' : 'red'
  return (
    <li
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-medium"
      style={{ background: `var(--${tone}-dim)`, color: `var(--${tone})` }}
      title={`${k.count}× in the job description${k.required ? ', in its requirements' : ''}`}
    >
      {showFound && <span aria-hidden="true">{k.found ? '✓' : '✕'}</span>}
      <span>{k.term}</span>
      {k.count > 1 && <span className="opacity-70 tabular-nums">×{k.count}</span>}
      {k.required && (
        <span className="text-[10px] font-bold uppercase tracking-wide opacity-80" aria-label="required">
          req
        </span>
      )}
      <span className="sr-only">{showFound ? (k.found ? ' — in your resume' : ' — missing from your resume') : ''}</span>
    </li>
  )
}

export default function ResumeChecker({ mode = 'resume' }: { mode?: 'resume' | 'jd' }) {
  const [resume, setResume] = useState('')
  const [jd, setJd] = useState('')
  const [fileName, setFileName] = useState<string | null>(null)
  const [reading, setReading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ran, setRan] = useState<{ resume: string; jd: string } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  const result = useMemo(() => {
    if (!ran) return null
    return mode === 'jd' ? { keywords: extractKeywords(ran.jd).map(k => ({ ...k, found: false })), score: null, checks: [], title: null, words: 0 } : checkResume(ran.resume, ran.jd)
  }, [ran, mode])

  const onFile = async (file: File | undefined) => {
    if (!file) return
    setError(null)
    setReading(true)
    try {
      const text = (await readFile(file)).trim()
      if (!text) throw new Error('No text found in that file. If it is a scanned image, paste the text instead.')
      setResume(text)
      setFileName(file.name)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read that file. Paste the text instead.')
    } finally {
      setReading(false)
    }
  }

  const run = () => {
    setError(null)
    if (jd.trim().split(/\s+/).length < 20) return setError('Paste the full job description: at least a few sentences, ideally including its requirements.')
    if (mode === 'resume' && resume.trim().split(/\s+/).length < 30) return setError('Add your resume: upload the file or paste its text.')
    setRan({ resume, jd })
    const r = mode === 'jd' ? null : checkResume(resume, jd)
    track('tool_used', { meta: { tool: mode === 'jd' ? 'jd_keywords' : 'ats_checker', score: r?.score ?? null } })
    requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  const missing = result?.keywords.filter(k => !k.found) ?? []
  const groups = (['skill', 'term', 'soft'] as const).map(kind => ({ kind, items: result?.keywords.filter(k => k.kind === kind) ?? [] })).filter(g => g.items.length)
  const scoreTone = result?.score == null ? 'text' : result.score >= 75 ? 'green' : result.score >= 50 ? 'yellow' : 'red'

  const field = 'w-full rounded-2xl px-4 py-3 text-[14px] leading-relaxed theme-input resize-y'

  return (
    <div className="rounded-3xl p-5 sm:p-7" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
      <div className={`grid gap-5 ${mode === 'resume' ? 'lg:grid-cols-2' : ''}`}>
        {mode === 'resume' && (
          <div>
            <div className="flex items-center justify-between gap-3 mb-2">
              <label htmlFor="tool-resume" className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>
                Your resume
              </label>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="text-[13px] font-semibold rounded-full px-3 py-1"
                style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}
              >
                {reading ? 'Reading…' : 'Upload PDF or Word'}
              </button>
              <input ref={fileRef} type="file" accept=".pdf,.docx,.txt,application/pdf,text/plain" className="sr-only" aria-label="Upload your resume" onChange={e => onFile(e.target.files?.[0])} />
            </div>
            <textarea
              id="tool-resume"
              value={resume}
              onChange={e => {
                setResume(e.target.value)
                setFileName(null)
              }}
              rows={12}
              placeholder="Paste your resume text here, or upload the file."
              className={field}
            />
            <p className="mt-1.5 text-[12px]" style={{ color: 'var(--text-muted)' }}>
              {fileName ? `Read from ${fileName}. ` : ''}Stays in your browser: nothing is uploaded or saved.
            </p>
          </div>
        )}
        <div>
          <label htmlFor="tool-jd" className="block text-[14px] font-semibold mb-2" style={{ color: 'var(--text)' }}>
            The job description
          </label>
          <textarea
            id="tool-jd"
            value={jd}
            onChange={e => setJd(e.target.value)}
            rows={12}
            placeholder="Paste the full job posting, including its requirements."
            className={field}
          />
          {mode === 'jd' && (
            <p className="mt-1.5 text-[12px]" style={{ color: 'var(--text-muted)' }}>
              Stays in your browser: nothing is uploaded or saved.
            </p>
          )}
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-4 text-[13.5px] rounded-xl px-4 py-2.5" style={{ background: 'var(--red-dim)', color: 'var(--red)' }}>
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={run}
        className="mt-5 w-full sm:w-auto rounded-full bg-[var(--accent-solid)] px-8 py-3 text-[15px] font-semibold text-[var(--text-on-accent)] shadow-lg transition-transform hover:-translate-y-0.5"
      >
        {mode === 'jd' ? 'Find the keywords' : 'Check my resume'}
      </button>

      <div ref={resultsRef} aria-live="polite" className="scroll-mt-24">
        {result && (
          <div className="mt-8 pt-7 space-y-7" style={{ borderTop: '1px solid var(--border)' }}>
            {mode === 'resume' && (
              <div className="flex flex-wrap items-center gap-6">
                <div
                  className="w-28 h-28 rounded-full grid place-items-center shrink-0"
                  style={{ background: `conic-gradient(var(--${scoreTone}) ${(result.score ?? 0) * 3.6}deg, var(--bg-overlay) 0deg)` }}
                  role="img"
                  aria-label={`Keyword match ${result.score ?? 0} percent`}
                >
                  <div className="w-[88px] h-[88px] rounded-full grid place-items-center" style={{ background: 'var(--bg-card)' }}>
                    <span className="font-display text-[2rem] leading-none tabular-nums" style={{ color: `var(--${scoreTone})` }}>
                      {result.score ?? 0}%
                    </span>
                  </div>
                </div>
                <div className="min-w-0 max-w-xl">
                  <h2 className="font-display text-[1.6rem] leading-tight" style={{ color: 'var(--text)' }}>
                    Keyword match
                  </h2>
                  <p className="mt-1 text-[14.5px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {missing.length === 0
                      ? 'Your resume covers every keyword this posting leans on.'
                      : `Your resume covers ${result.keywords.length - missing.length} of the ${result.keywords.length} terms this posting leans on. Add the missing ones you genuinely have, in the words the posting uses.`}
                  </p>
                  {result.title && (
                    <p className="mt-2 text-[13.5px]" style={{ color: result.title.found ? 'var(--green)' : 'var(--yellow)' }}>
                      {result.title.found
                        ? `✓ The job title “${result.title.term}” appears in your resume.`
                        : `The job title “${result.title.term}” is not in your resume. If it fits, use it in your headline or summary.`}
                    </p>
                  )}
                </div>
              </div>
            )}

            {groups.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>No clear keywords found. Paste the whole posting, including its requirements.</p>
            ) : (
              groups.map(g => (
                <div key={g.kind}>
                  <h3 className="text-[13px] font-semibold uppercase tracking-[0.07em] mb-2.5" style={{ color: 'var(--text-muted)' }}>
                    {KIND_LABEL[g.kind]}
                  </h3>
                  <ul className="flex flex-wrap gap-2">
                    {g.items.map(k => (
                      <Chip key={k.term} k={k} showFound={mode === 'resume'} />
                    ))}
                  </ul>
                </div>
              ))
            )}
            <p className="text-[12.5px]" style={{ color: 'var(--text-muted)' }}>
              ×2 = mentioned twice in the posting · req = in its requirements section, so likely screened for.
            </p>

            {result.checks.length > 0 && (
              <div>
                <h3 className="text-[13px] font-semibold uppercase tracking-[0.07em] mb-3" style={{ color: 'var(--text-muted)' }}>
                  Resume basics
                </h3>
                <ul className="grid sm:grid-cols-2 gap-3">
                  {result.checks.map(c => (
                    <li key={c.label} className="rounded-2xl p-4" style={{ background: 'var(--bg-overlay)' }}>
                      <div className="flex items-center gap-2 text-[14px] font-semibold" style={{ color: c.ok ? 'var(--green)' : 'var(--yellow)' }}>
                        <span aria-hidden="true">{c.ok ? '✓' : '!'}</span>
                        {c.label}
                      </div>
                      <p className="mt-1 text-[13px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                        {c.detail}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="rounded-2xl p-5 sm:p-6" style={{ background: 'var(--accent-dim)' }}>
              <p className="font-display text-[1.35rem] leading-snug" style={{ color: 'var(--text)' }}>
                {mode === 'jd' ? 'Tailoring a resume to every posting takes hours.' : 'Doing this for every job takes hours.'}
              </p>
              <p className="mt-1.5 text-[14px] leading-relaxed max-w-2xl" style={{ color: 'var(--text-secondary)' }}>
                ApplyMaster tailors your resume to each job, and its Chrome extension fills the application on the employer’s site
                for you to check and submit. Free to start.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link href="/signup" className="rounded-full bg-[var(--accent-solid)] px-6 py-2.5 text-[14px] font-semibold text-[var(--text-on-accent)]">
                  Create a free account
                </Link>
                <Link href="/autofill" className="rounded-full px-6 py-2.5 text-[14px] font-semibold" style={{ border: '1px solid var(--border)', color: 'var(--text)' }}>
                  See the extension
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
