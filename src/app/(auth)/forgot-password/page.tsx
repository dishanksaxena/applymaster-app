'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import Link from 'next/link'
import { track } from '@/lib/track'
import AuthError from '@/components/auth/AuthError'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import AuthShell, { AUTH_INPUT, AUTH_SUBMIT, DrawnCheck } from '../AuthShell'

export default function ForgotPasswordPage() {
  const reduced = useReducedMotion()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [supabase] = useState(() => createClient())

  useEffect(() => {
    track('auth_page_view', { meta: { page: 'forgot_password' } })
  }, [])

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setLoading(false)
    if (error) {
      track('password_reset_failed', { email, error_message: error.message })
      setError(error.message)
    } else {
      track('password_reset_requested', { email })
      setSent(true)
    }
  }

  return (
    <AuthShell
      footer={
        <p className="text-center text-[13px] text-[var(--text-faint)] mt-6">
          Remember your password?{' '}
          <Link href="/login" className="text-[var(--accent)] font-semibold hover:underline">Sign in</Link>
        </p>
      }
    >
          <AnimatePresence mode="wait" initial={false}>
          {!sent ? (
            <motion.div
              key="form"
              initial={reduced ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? undefined : { opacity: 0, scale: 0.98, filter: 'blur(4px)' }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 mx-auto" style={{ background: 'rgb(var(--accent-rgb) / calc(0.1 * var(--tint-scale)))', boxShadow: '0 10px 28px -14px rgb(var(--accent-rgb) / 0.45)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
              </div>
              <h1 className="font-display text-[2rem] tracking-tight mb-2 text-center" style={{ color: 'var(--text)' }}>Forgot Password?</h1>
              <p className="text-[14px] text-[var(--text-muted)] mb-8 text-center">Enter your email and we&apos;ll send you a reset link</p>

              {error && (
                <AuthError error={error} />
              )}

              <form onSubmit={handleReset} className="space-y-4">
                <div>
                  <label htmlFor="forgot-email" className="block text-[12px] font-semibold text-[var(--text-muted)] mb-2">Email Address</label>
                  <input
                    id="forgot-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className={AUTH_INPUT}
                    placeholder="you@email.com"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  aria-busy={loading || undefined}
                  className={AUTH_SUBMIT}
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="sent"
              className="text-center py-4"
              initial={reduced ? false : { opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            >
              <motion.div
                initial={reduced ? false : { scale: 0.6 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{ background: 'rgb(var(--green-rgb) / calc(0.1 * var(--tint-scale)))', boxShadow: '0 12px 32px -14px rgb(var(--green-rgb) / 0.5)' }}
              >
                <DrawnCheck />
              </motion.div>
              <h2 className="font-display text-[1.6rem] mb-2" style={{ color: 'var(--text)' }}>Check your inbox!</h2>
              <p className="text-[14px] text-[var(--text-muted)] mb-6">
                We sent a password reset link to<br />
                <span className="text-[var(--accent)] font-semibold">{email}</span>
              </p>
              <p className="text-[12px] text-[var(--text-faint)]">Didn&apos;t receive it? Check your spam folder or try again.</p>
            </motion.div>
          )}
          </AnimatePresence>
    </AuthShell>
  )
}
