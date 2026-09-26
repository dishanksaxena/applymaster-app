'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'
import { track, getAnonId } from '@/lib/track'

const TOPICS = [
  { id: 'sign_in', label: 'I can’t sign in' },
  { id: 'sign_up', label: 'I can’t sign up' },
  { id: 'bug', label: 'Something is broken' },
  { id: 'billing', label: 'Billing' },
  { id: 'feature', label: 'Feature request' },
  { id: 'other', label: 'Something else' },
] as const

type TopicId = (typeof TOPICS)[number]['id']

export default function SupportForm() {
  const params = useSearchParams()
  const initialTopic = (TOPICS.find(t => t.id === params.get('topic'))?.id ?? 'other') as TopicId
  const lastError = params.get('error') || ''

  const [topic, setTopic] = useState<TopicId>(initialTopic)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [website, setWebsite] = useState('') // honeypot
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [error, setError] = useState('')
  const [mailtoFallback, setMailtoFallback] = useState(false)

  useEffect(() => {
    track('support_opened', { meta: { topic: initialTopic, from_error: lastError || undefined } })
    // Signed-in people should not have to type their own address.
    createClient()
      .auth.getUser()
      .then(({ data }) => {
        if (data.user?.email) setEmail(e => e || data.user!.email!)
        const n = data.user?.user_metadata?.full_name
        if (typeof n === 'string') setName(v => v || n)
      })
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setState('sending')
    setError('')
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          message,
          category: topic,
          website,
          page: document.referrer || window.location.pathname,
          last_error: lastError,
          anon_id: getAnonId(),
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (json.fallback === 'mailto') setMailtoFallback(true)
        throw new Error(json.error || 'Could not send your message')
      }
      setState('sent')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send your message')
      setState('error')
    }
  }

  if (state === 'sent') {
    return (
      <div
        className="rounded-2xl p-8 text-center"
        style={{ background: 'var(--card-face)', boxShadow: 'var(--card-lift), 0 0 0 1px var(--card-ring)' }}
      >
        <div
          className="w-12 h-12 rounded-full grid place-items-center mx-auto mb-4"
          style={{ background: 'var(--green-dim)', color: 'var(--green)' }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <h2 className="font-display text-[1.6rem] mb-2" style={{ color: 'var(--text)' }}>
          Message received
        </h2>
        <p className="text-[14px] leading-relaxed max-w-sm mx-auto" style={{ color: 'var(--text-secondary)' }}>
          We will reply to <strong style={{ color: 'var(--text)' }}>{email}</strong>, usually within a day. Check spam if
          you do not see it.
        </p>
        <Link href="/" className="inline-block mt-6 text-[13px] font-semibold" style={{ color: 'var(--accent)' }}>
          Back to ApplyMaster
        </Link>
      </div>
    )
  }

  const field = {
    background: 'var(--bg-input)',
    color: 'var(--text)',
    boxShadow: 'inset 0 0 0 1px var(--card-ring)',
  } as const

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl p-6 sm:p-8 space-y-5"
      style={{ background: 'var(--card-face)', boxShadow: 'var(--card-lift), 0 0 0 1px var(--card-ring)' }}
    >
      <fieldset>
        <legend className="block text-[12px] font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>
          What do you need help with?
        </legend>
        <div className="flex flex-wrap gap-2">
          {TOPICS.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTopic(t.id)}
              aria-pressed={topic === t.id}
              className="px-3 py-1.5 rounded-full text-[12.5px] font-medium transition-colors"
              style={
                topic === t.id
                  ? { background: 'var(--accent-solid)', color: 'var(--text-on-accent)' }
                  : { background: 'var(--bg-overlay)', color: 'var(--text-secondary)' }
              }
            >
              {t.label}
            </button>
          ))}
        </div>
      </fieldset>

      {lastError && (
        <p className="text-[12.5px] px-3 py-2.5 rounded-lg" style={{ background: 'var(--bg-overlay)', color: 'var(--text-secondary)' }}>
          We will include the error you saw: <span style={{ color: 'var(--text)' }}>“{lastError}”</span>
        </p>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <label htmlFor="support-name" className="block">
          <span className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>
            Name <span style={{ color: 'var(--text-faint)' }}>(optional)</span>
          </span>
          <input
            id="support-name"
            autoComplete="name"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl text-[14px] outline-none"
            style={field}
          />
        </label>
        <label htmlFor="support-email" className="block">
          <span className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>
            Email we can reply to
          </span>
          <input
            id="support-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl text-[14px] outline-none"
            style={field}
          />
        </label>
      </div>

      <label htmlFor="support-message" className="block">
        <span className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>
          What happened?
        </span>
        <textarea
          id="support-message"
          required
          minLength={5}
          rows={6}
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder={
            topic === 'sign_in'
              ? 'For example: I signed up with Google last month and now the login page says my password is wrong.'
              : 'Tell us what you were trying to do and what you saw.'
          }
          className="w-full px-3.5 py-2.5 rounded-xl text-[14px] leading-relaxed outline-none resize-y"
          style={field}
        />
      </label>

      {/* Honeypot: hidden from people, irresistible to form bots. */}
      <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }}>
        <label>
          Website
          <input tabIndex={-1} autoComplete="off" value={website} onChange={e => setWebsite(e.target.value)} />
        </label>
      </div>

      {error && (
        <div role="alert" className="text-[13px]" style={{ color: 'var(--red)' }}>
          {error}
          {mailtoFallback && (
            <a
              href={`mailto:support@applymaster.ai?subject=${encodeURIComponent(
                (TOPICS.find(t => t.id === topic)?.label ?? 'Support') + (name ? ` — ${name}` : '')
              )}&body=${encodeURIComponent(message + (lastError ? `\n\nError I saw: ${lastError}` : ''))}`}
              className="block mt-2 font-semibold underline underline-offset-2"
              style={{ color: 'var(--accent)' }}
            >
              Open this message in my email app
            </a>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={state === 'sending'}
          className="px-5 py-3 rounded-xl text-[14px] font-semibold disabled:opacity-60"
          style={{ background: 'var(--accent-solid)', color: 'var(--text-on-accent)' }}
        >
          {state === 'sending' ? 'Sending…' : 'Send message'}
        </button>
        <p className="text-[12px]" style={{ color: 'var(--text-faint)' }}>
          Or email{' '}
          <a href="mailto:support@applymaster.ai" className="underline underline-offset-2" style={{ color: 'var(--text-secondary)' }}>
            support@applymaster.ai
          </a>
        </p>
      </div>
    </form>
  )
}
