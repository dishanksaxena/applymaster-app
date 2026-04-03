'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [show, setShow] = useState(false)
  const supabase = createClient()
  const router = useRouter()

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
      setError(error.message)
    } else {
      setDone(true)
      setTimeout(() => router.push('/dashboard'), 3000)
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
          {!done ? (
            <>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 mx-auto" style={{ background: 'rgba(162,155,254,0.1)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a29bfe" strokeWidth="1.8">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
              </div>
              <h1 className="text-2xl font-black tracking-tight mb-2 text-white text-center">Set New Password</h1>
              <p className="text-[14px] text-[#8a8a9a] mb-8 text-center">Choose a strong password for your account</p>

              {error && (
                <div className="p-3 rounded-xl bg-[rgba(255,95,87,0.08)] border border-[rgba(255,95,87,0.15)] text-[13px] text-[#ff5f57] mb-6">
                  {error}
                </div>
              )}

              <form onSubmit={handleReset} className="space-y-4">
                <div>
                  <label className="block text-[12px] font-semibold text-[#8a8a9a] mb-2">New Password</label>
                  <div className="relative">
                    <input
                      type={show ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      minLength={8}
                      className="w-full px-4 py-3 pr-12 rounded-xl bg-[#16161f] border border-[rgba(255,255,255,0.06)] text-white text-[14px] placeholder-[#5a5a6a] focus:outline-none focus:border-[rgba(162,155,254,0.3)] transition-all"
                      placeholder="Minimum 8 characters"
                    />
                    <button type="button" onClick={() => setShow(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5a5a6a] hover:text-white transition-colors">
                      {show ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-[#8a8a9a] mb-2">Confirm Password</label>
                  <input
                    type={show ? 'text' : 'password'}
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl bg-[#16161f] border border-[rgba(255,255,255,0.06)] text-white text-[14px] placeholder-[#5a5a6a] focus:outline-none focus:border-[rgba(162,155,254,0.3)] transition-all"
                    placeholder="Re-enter password"
                  />
                </div>
                {password && (
                  <div className="flex gap-1.5">
                    {['8+ chars', 'uppercase', 'number'].map((req, i) => {
                      const checks = [password.length >= 8, /[A-Z]/.test(password), /\d/.test(password)]
                      return (
                        <span key={req} className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{
                          background: checks[i] ? 'rgba(0,184,148,0.1)' : 'rgba(255,255,255,0.04)',
                          color: checks[i] ? '#00b894' : '#5a5a6a',
                          border: `1px solid ${checks[i] ? 'rgba(0,184,148,0.2)' : 'rgba(255,255,255,0.06)'}`
                        }}>{checks[i] ? '✓' : '·'} {req}</span>
                      )
                    })}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#a29bfe] to-[#6c5ce7] text-white font-bold text-[14px] hover:shadow-[0_8px_30px_rgba(162,155,254,0.3)] hover:translate-y-[-1px] transition-all disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Update Password'}
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
              <h2 className="text-xl font-black text-white mb-2">Password Updated!</h2>
              <p className="text-[14px] text-[#8a8a9a]">Redirecting you to the dashboard...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
