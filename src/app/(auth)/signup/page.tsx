'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) setError(error.message)
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] relative overflow-hidden">
        <div className="absolute top-[-30%] right-[-20%] w-[600px] h-[600px] rounded-full opacity-[0.06]" style={{ background: 'radial-gradient(circle, #00b894, transparent 70%)' }} />
        <div className="relative z-10 max-w-md px-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[rgba(0,184,148,0.1)] border border-[rgba(0,184,148,0.2)] flex items-center justify-center text-3xl mx-auto mb-6">✓</div>
          <h1 className="text-2xl font-black mb-3">Check your email</h1>
          <p className="text-[14px] text-[#8a8a9a] leading-relaxed mb-8">
            We sent a confirmation link to <span className="text-white font-semibold">{email}</span>. Click it to activate your account and start applying.
          </p>
          <Link href="/login" className="text-[#fd79a8] font-semibold text-[14px] hover:underline">Back to login</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute top-[-30%] right-[-20%] w-[600px] h-[600px] rounded-full opacity-[0.06]" style={{ background: 'radial-gradient(circle, #fd79a8, transparent 70%)' }} />
      <div className="absolute bottom-[-30%] left-[-20%] w-[600px] h-[600px] rounded-full opacity-[0.04]" style={{ background: 'radial-gradient(circle, #a29bfe, transparent 70%)' }} />
      <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '80px 80px' }} />

      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-3 mb-10">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#fd79a8] to-[#e84393] flex items-center justify-center text-white font-black text-sm">AM</div>
          <span className="text-xl font-extrabold tracking-tight">Apply<span className="text-[#fd79a8]">Master</span></span>
        </Link>

        {/* Card */}
        <div className="p-8 rounded-2xl bg-[#12121a] border border-[rgba(255,255,255,0.06)] shadow-[0_40px_100px_rgba(0,0,0,0.5)]">
          <h1 className="text-2xl font-black tracking-tight mb-2">Create your account</h1>
          <p className="text-[14px] text-[#8a8a9a] mb-8">Start applying to jobs on autopilot — free forever</p>

          {error && (
            <div className="p-3 rounded-xl bg-[rgba(255,95,87,0.08)] border border-[rgba(255,95,87,0.15)] text-[13px] text-[#ff5f57] mb-6">
              {error}
            </div>
          )}

          {/* Google OAuth */}
          <button onClick={handleGoogleSignup} className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl bg-white text-[#0a0a0f] font-bold text-[14px] hover:bg-gray-100 transition-colors mb-6">
            <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-[rgba(255,255,255,0.06)]" />
            <span className="text-[12px] text-[#5a5a6a] font-medium">or sign up with email</span>
            <div className="flex-1 h-px bg-[rgba(255,255,255,0.06)]" />
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-[12px] font-semibold text-[#8a8a9a] mb-2">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-[#16161f] border border-[rgba(255,255,255,0.06)] text-white text-[14px] placeholder-[#5a5a6a] focus:outline-none focus:border-[rgba(253,121,168,0.3)] focus:ring-1 focus:ring-[rgba(253,121,168,0.15)] transition-all"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-[#8a8a9a] mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-[#16161f] border border-[rgba(255,255,255,0.06)] text-white text-[14px] placeholder-[#5a5a6a] focus:outline-none focus:border-[rgba(253,121,168,0.3)] focus:ring-1 focus:ring-[rgba(253,121,168,0.15)] transition-all"
                placeholder="you@email.com"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-[#8a8a9a] mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 rounded-xl bg-[#16161f] border border-[rgba(255,255,255,0.06)] text-white text-[14px] placeholder-[#5a5a6a] focus:outline-none focus:border-[rgba(253,121,168,0.3)] focus:ring-1 focus:ring-[rgba(253,121,168,0.15)] transition-all"
                placeholder="Min 6 characters"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#fd79a8] to-[#e84393] text-white font-bold text-[14px] hover:shadow-[0_8px_30px_rgba(253,121,168,0.3)] hover:translate-y-[-1px] transition-all disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-[11px] text-[#5a5a6a] mt-5 text-center leading-relaxed">
            By signing up, you agree to our <a href="/terms" className="text-[#fd79a8] hover:underline">Terms</a> and <a href="/privacy" className="text-[#fd79a8] hover:underline">Privacy Policy</a>.
          </p>
        </div>

        <p className="text-center text-[13px] text-[#5a5a6a] mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-[#fd79a8] font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
