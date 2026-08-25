'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

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
      setError(error.message)
    } else {
      setSent(true)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] relative overflow-hidden">
      <div className="absolute top-[-30%] right-[-20%] w-[600px] h-[600px] rounded-full opacity-[0.06]" style={{ background: 'radial-gradient(circle, var(--accent), transparent 70%)' }} />
      <div className="absolute bottom-[-30%] left-[-20%] w-[600px] h-[600px] rounded-full opacity-[0.04]" style={{ background: 'radial-gradient(circle, var(--purple), transparent 70%)' }} />

      <div className="relative z-10 w-full max-w-md px-6">
        <Link href="/" className="flex items-center justify-center gap-3 mb-10">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-solid)] flex items-center justify-center text-[var(--text-on-accent)] font-black text-sm">AM</div>
          <span className="text-xl font-extrabold tracking-tight text-ink">Apply<span className="text-[var(--accent)]">Master</span></span>
        </Link>

        <div className="p-8 rounded-2xl bg-[var(--bg-card)] border border-[var(--bg-overlay)] shadow-[0_40px_100px_rgba(0,0,0,0.5)]">
          {!sent ? (
            <>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 mx-auto" style={{ background: 'rgb(var(--accent-rgb) / calc(0.1 * var(--tint-scale)))' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
              </div>
              <h1 className="text-2xl font-black tracking-tight mb-2 text-ink text-center">Forgot Password?</h1>
              <p className="text-[14px] text-[var(--text-muted)] mb-8 text-center">Enter your email and we&apos;ll send you a reset link</p>

              {error && (
                <div role="alert" className="p-3 rounded-xl bg-[var(--red-dim)] border border-[var(--border)] text-[13px] text-[var(--red)] mb-6">
                  {error}
                </div>
              )}

              <form onSubmit={handleReset} className="space-y-4">
                <div>
                  <label className="block text-[12px] font-semibold text-[var(--text-muted)] mb-2">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--bg-overlay)] text-ink text-[14px] placeholder-[var(--text-faint)] focus:outline-none focus:border-[rgb(var(--accent-rgb)/0.3)] focus:ring-1 focus:ring-[rgb(var(--accent-rgb)/0.15)] transition-all"
                    placeholder="you@email.com"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[var(--accent)] to-[var(--accent-solid)] text-[var(--text-on-accent)] font-bold text-[14px] hover:shadow-[0_8px_30px_rgb(var(--accent-rgb) / 0.3)] hover:translate-y-[-1px] transition-all disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: 'rgb(var(--green-rgb) / calc(0.1 * var(--tint-scale)))' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <h2 className="text-xl font-black text-ink mb-2">Check your inbox!</h2>
              <p className="text-[14px] text-[var(--text-muted)] mb-6">
                We sent a password reset link to<br />
                <span className="text-[var(--accent)] font-semibold">{email}</span>
              </p>
              <p className="text-[12px] text-[var(--text-faint)]">Didn&apos;t receive it? Check your spam folder or try again.</p>
            </div>
          )}
        </div>

        <p className="text-center text-[13px] text-[var(--text-faint)] mt-6">
          Remember your password?{' '}
          <Link href="/login" className="text-[var(--accent)] font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
