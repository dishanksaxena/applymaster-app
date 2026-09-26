'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

/** Re-render the server page every minute so the dashboard stays live. */
export function AutoRefresh({ seconds = 60 }: { seconds?: number }) {
  const router = useRouter()
  const [at, setAt] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => {
      router.refresh()
      setAt(new Date())
    }, seconds * 1000)
    return () => clearInterval(id)
  }, [router, seconds])
  return (
    <span className="text-[11px] tabular-nums" style={{ color: 'var(--text-faint)' }}>
      Updated {at.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} · refreshes every minute
    </span>
  )
}

export function SupportStatus({ id, status }: { id: string; status: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const set = async (next: string) => {
    setBusy(true)
    await fetch('/api/admin/support', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: next }),
    })
    setBusy(false)
    router.refresh()
  }
  const btn = 'px-2.5 py-1 rounded-md text-[11.5px] font-semibold disabled:opacity-50'
  return (
    <div className="flex gap-1.5">
      {status !== 'replied' && status !== 'resolved' && (
        <button disabled={busy} onClick={() => set('replied')} className={btn} style={{ background: 'var(--blue-dim)', color: 'var(--blue)' }}>
          Mark replied
        </button>
      )}
      {status !== 'resolved' ? (
        <button disabled={busy} onClick={() => set('resolved')} className={btn} style={{ background: 'var(--green-dim)', color: 'var(--green)' }}>
          Resolve
        </button>
      ) : (
        <button disabled={busy} onClick={() => set('open')} className={btn} style={{ background: 'var(--bg-overlay)', color: 'var(--text-muted)' }}>
          Reopen
        </button>
      )}
    </div>
  )
}

export function ResendConfirmation({ email }: { email: string }) {
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle')
  const [err, setErr] = useState('')
  const go = async () => {
    setState('sending')
    const res = await fetch('/api/admin/resend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const j = await res.json().catch(() => ({}))
    if (res.ok) setState('sent')
    else {
      setErr(j.error || 'failed')
      setState('failed')
    }
  }
  return (
    <button
      onClick={go}
      disabled={state === 'sending' || state === 'sent'}
      title={err || undefined}
      className="px-2.5 py-1 rounded-md text-[11.5px] font-semibold disabled:opacity-60"
      style={
        state === 'failed'
          ? { background: 'var(--red-dim)', color: 'var(--red)' }
          : state === 'sent'
            ? { background: 'var(--green-dim)', color: 'var(--green)' }
            : { background: 'var(--accent-dim)', color: 'var(--accent)' }
      }
    >
      {state === 'sending' ? 'Sending…' : state === 'sent' ? 'Sent' : state === 'failed' ? 'Failed — retry' : 'Resend confirmation'}
    </button>
  )
}
