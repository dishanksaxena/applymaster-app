'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { track } from '@/lib/track'
import AuthError from '@/components/auth/AuthError'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import AuthShell, { AUTH_INPUT, DrawnCheck } from '../AuthShell'

export default function ResetPasswordPage() {
  const reduced = useReducedMotion()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [show, setShow] = useState(false)
  const [supabase] = useState(() => createClient())
  const router = useRouter()

  useEffect(() => {
    track('auth_page_view', { meta: { page: 'reset_password' } })
  }, [])

  // Supabase puts the recovery token in the URL hash — this handles the session
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        // User arrived via reset link — they are now in a recovery session
      }
    })
    return () => subscription.unsubscribe()
  }, [supabase])

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match.'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) {
      track('password_update_failed', { error_message: error.message })
      setError(error.message)
    } else {
      track('password_updated', {})
      setDone(true)
      setTimeout(() => router.push('/dashboard'), 3000)
    }
  }

  return (
    <AuthShell>
          <style>{`
            .am-reset-input:focus { border-color: var(--purple) !important; box-shadow: 0 0 0 3px rgb(var(--purple-rgb) / 0.18), 0 10px 30px -18px rgb(var(--purple-rgb) / 0.4) !important; }
            .am-reset-submit { transition: transform .2s cubic-bezier(.16,1,.3,1), box-shadow .3s ease; box-shadow: 0 6px 18px -8px rgb(var(--purple-rgb) / .55); }
            .am-reset-submit:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 14px 34px -10px rgb(var(--purple-rgb) / .55), 0 0 0 1px rgb(var(--purple-rgb) / .2); }
          `}</style>
          <AnimatePresence mode="wait" initial={false}>
          {!done ? (
            <motion.div
              key="form"
              initial={reduced ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? undefined : { opacity: 0, scale: 0.98, filter: 'blur(4px)' }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 mx-auto" style={{ background: 'rgb(var(--purple-rgb) / calc(0.1 * var(--tint-scale)))', boxShadow: '0 10px 28px -14px rgb(var(--purple-rgb) / 0.45)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth="1.8">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
              </div>
              <h1 className="font-display text-[2rem] tracking-tight mb-2 text-center" style={{ color: 'var(--text)' }}>Set New Password</h1>
              <p className="text-[14px] text-[var(--text-muted)] mb-8 text-center">Choose a strong password for your account</p>

              {error && (
                <AuthError error={error} />
              )}

              <form onSubmit={handleReset} className="space-y-4">
                <div>
                  <label htmlFor="reset-password" className="block text-[12px] font-semibold text-[var(--text-muted)] mb-2">New Password</label>
                  <div className="relative">
                    <input
                      id="reset-password"
                      autoComplete="new-password"
                      type={show ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      minLength={8}
                      className={`${AUTH_INPUT} am-reset-input pr-12`}
                      placeholder="Minimum 8 characters"
                    />
                    <button type="button" onClick={() => setShow(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)] hover:text-ink transition-colors">
                      {show ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label htmlFor="reset-confirm" className="block text-[12px] font-semibold text-[var(--text-muted)] mb-2">Confirm Password</label>
                  <input
                    id="reset-confirm" autoComplete="new-password" type={show ? 'text' : 'password'}
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    required
                    className={`${AUTH_INPUT} am-reset-input`}
                    placeholder="Re-enter password"
                  />
                </div>
                {password && (
                  <div className="flex gap-1.5">
                    {['8+ chars', 'uppercase', 'number'].map((req, i) => {
                      const checks = [password.length >= 8, /[A-Z]/.test(password), /\d/.test(password)]
                      return (
                        <span key={req} className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{
                          background: checks[i] ? 'rgb(var(--green-rgb) / calc(0.1 * var(--tint-scale)))' : 'var(--bg-overlay)',
                          color: checks[i] ? 'var(--green)' : 'var(--text-faint)',
                          border: `1px solid ${checks[i] ? 'rgb(var(--green-rgb) / calc(0.2 * var(--tint-scale)))' : 'var(--bg-overlay)'}`
                        }}>{checks[i] ? '✓' : '·'} {req}</span>
                      )
                    })}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  aria-busy={loading || undefined}
                  className="am-reset-submit am-press w-full py-3.5 rounded-xl bg-gradient-to-r from-[var(--purple)] to-[var(--purple)] text-[var(--text-on-accent)] font-bold text-[14px] disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="done"
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
              <h2 className="font-display text-[1.6rem] mb-2" style={{ color: 'var(--text)' }}>Password Updated!</h2>
              <p className="text-[14px] text-[var(--text-muted)]">Redirecting you to the dashboard...</p>
            </motion.div>
          )}
          </AnimatePresence>
    </AuthShell>
  )
}
