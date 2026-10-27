'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'

/**
 * The resume checker on a job page, loaded only when someone asks for it.
 * Rendering it up front put the whole posting into the page twice and sent
 * the checker's code to every crawler that read any of the 17,000 job pages.
 */

const ResumeChecker = dynamic(() => import('./ResumeChecker'), { ssr: false, loading: () => <p style={{ color: 'var(--text-muted)' }}>Loading…</p> })

export default function JobResumeCheck({ board, id, label }: { board: string; id: string; label: string }) {
  const [jd, setJd] = useState<string | null>(null)
  const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle')

  const open = async () => {
    setState('loading')
    try {
      const res = await fetch(`/api/public/job-text?board=${encodeURIComponent(board)}&id=${encodeURIComponent(id)}`)
      if (!res.ok) throw new Error()
      const { text } = (await res.json()) as { text: string }
      setJd(text)
      setState('idle')
    } catch {
      setState('error')
    }
  }

  if (jd !== null) return <ResumeChecker mode="resume" initialJd={jd} jdLabel={label} />
  return (
    <div className="flex flex-wrap items-center gap-4">
      <button
        type="button"
        onClick={open}
        disabled={state === 'loading'}
        className="rounded-full bg-[var(--accent-solid)] px-7 py-3 text-[15px] font-semibold text-[var(--text-on-accent)] shadow-lg disabled:opacity-70"
      >
        {state === 'loading' ? 'Opening…' : 'Check my resume against this job'}
      </button>
      {state === 'error' && (
        <span role="alert" className="text-[13.5px]" style={{ color: 'var(--red)' }}>
          Could not load the posting. Try again, or paste it into the free ATS resume checker.
        </span>
      )}
    </div>
  )
}
