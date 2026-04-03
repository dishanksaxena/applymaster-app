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
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] relative overflow-hidden">
      <div className="absolute top-[-30%] right-[-20%] w-[600px] h-[600px] rounded-full opacity-[0.06]" style={{ background: 'radial-gradient(circle, #fd79a8, transparent 70%)' }} />
      <div className="absolute bottom-[-30%] left-[-20%] w-[600px] h-[600px] rounded-full opacity-[0.04]" style={{ background: 'radial-gradient(circle, #a29bfe, transparent 70%)' }} />

      <div className="relative z-10 w-full max-w-md px-6">
        <Link href="/" className="flex items-center justify-center gap-3 mb-10">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#fd79a8] to-[#e84393] flex items-center justify-center text-white font-black text-sm">AM</div>
          <span className="text-xl font-extrabold tracking-tight text-white">Apply<span className="text-[#fd79a8]">Master</span></span>
        </Link>

        <div className="p-8 rounded-2xl bg-[#12121a] border border-[rgba(255,255,255,0.06)] shadow-[0_40px_100px_rgba(0,0,0,0.5)]">
          {!sent ? (
            <>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 mx-auto" style={{ background: 'rgba(253,121,168,0.1)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fd79a8" strokeWidth="1.8">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
              </div>
              <h1 className="text-2xl font-black tracking-tight mb-2 text-white text-center">Forgot Password?</h1>
              <p className="text-[14px] text-[#8a8a9a] mb-8 text-center">Enter your email and we&apos;ll send you a reset link</p>

              {error && (
                <div className="p-3 rounded-xl bg-[rgba(255,95,87,0.08)] border border-[rgba(255,95,87,0.15)] text-[13px] text-[#ff5f57] mb-6">
                  {error}
                </div>
              )}

              <form onSubmit={handleReset} className="space-y-4">
                <div>
                  <label className="block text-[12px] font-semibold text-[#8a8a9a] mb-2">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl bg-[#16161f] border border-[rgba(255,255,255,0.06)] text-white text-[14px] placeholder-[#5a5a6a] focus:outline-none focus:border-[rgba(253,121,168,0.3)] focus:ring-1 focus:ring-[rgba(253,121,168,0.15)] transition-all"
                    placeholder="you@email.com"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#fd79a8] to-[#e84393] text-white font-bold text-[14px] hover:shadow-[0_8px_30px_rgba(253,121,168,0.3)] hover:translate-y-[-1px] transition-all disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: 'rgba(0,184,148,0.1)' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00b894" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <h2 className="text-xl font-black text-white mb-2">Check your inbox!</h2>
              <p className="text-[14px] text-[#8a8a9a] mb-6">
                We sent a password reset link to<br />
                <span className="text-[#fd79a8] font-semibold">{email}</span>
              </p>
              <p className="text-[12px] text-[#5a5a6a]">Didn&apos;t receive it? Check your spam folder or try again.</p>
            </div>
          )}
        </div>

        <p className="text-center text-[13px] text-[#5a5a6a] mt-6">
          Remember your password?{' '}
          <Link href="/login" className="text-[#fd79a8] font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
