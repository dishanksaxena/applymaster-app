'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { track } from '@/lib/track'
import AuthError from '@/components/auth/AuthError'

export default function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle')
  const router = useRouter()
  const [supabase] = useState(() => createClient())

  useEffect(() => {
    track('auth_page_view', { meta: { page: 'signup' } })
  }, [])

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    track('signup_attempt', { method: 'password', email })

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      track('signup_failed', {
        method: 'password',
        email,
        error_code: (error as { code?: string }).code ?? String(error.status ?? ''),
        error_message: error.message,
      })
      setError(error.message)
      setLoading(false)
      return
    }

    /* When the address already has an account, Supabase deliberately answers
       with a normal-looking success and an empty identities list, and sends
       no email — so sign-up cannot be used to discover who is registered.
       Taken at face value, the person sees "Check your email" and waits for a
       message that will never arrive. Most ApplyMaster accounts were made with
       Google, so this is the likely case for anyone signing up a second time. */
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      track('signup_existing_account', { method: 'password', email })
      setError('existing_account')
      setLoading(false)
      return
    }

    track('signup_success', { method: 'password', email, meta: { needs_confirmation: !data.session } })

    // Confirmation switched off: there is already a session, so go straight in.
    if (data.session) {
      router.push('/onboarding')
      router.refresh()
      return
    }
    setSuccess(true)
    setLoading(false)
  }

  const handleGoogleSignup = async () => {
    track('oauth_start', { method: 'google', meta: { from: 'signup' } })
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
      },
    })
    if (error) {
      track('oauth_failed', { method: 'google', error_message: error.message })
      setError(error.message)
    }
  }

  /* The confirmation email is the single point of failure in email sign-up:
     slow, filtered to spam, or never sent. The success screen used to be a
     dead end with no way to ask for it again. */
  const resend = async () => {
    setResendState('sending')
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) {
      track('confirm_resend_failed', { email, error_message: error.message })
      setResendState('failed')
    } else {
      track('confirm_resend', { email, meta: { from: 'signup' } })
      setResendState('sent')
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] relative overflow-hidden">
        <div className="absolute top-[-30%] right-[-20%] w-[600px] h-[600px] rounded-full opacity-[0.06]" style={{ background: 'radial-gradient(circle, var(--green), transparent 70%)' }} />
        <div className="relative z-10 max-w-md px-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[rgb(var(--green-rgb)/0.1)] border border-[rgb(var(--green-rgb)/0.2)] flex items-center justify-center text-3xl mx-auto mb-6">✓</div>
          <h1 className="text-2xl font-black mb-3">Check your email</h1>
          <p className="text-[14px] text-[var(--text-muted)] leading-relaxed mb-8">
            We sent a confirmation link to <span className="text-ink font-semibold">{email}</span>. Click it to activate your account and start applying.
          </p>
          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={resend}
              disabled={resendState === 'sending' || resendState === 'sent'}
              className="px-4 py-2.5 rounded-xl text-[13px] font-semibold disabled:opacity-70"
              style={{ background: 'var(--bg-overlay)', color: 'var(--text)' }}
            >
              {resendState === 'sending'
                ? 'Sending…'
                : resendState === 'sent'
                  ? 'Sent again — check spam and promotions too'
                  : resendState === 'failed'
                    ? 'Could not send — wait a minute and try again'
                    : 'Didn\u2019t get it? Send it again'}
            </button>
            <p className="text-[12px]" style={{ color: 'var(--text-faint)' }}>
              Wrong address or still nothing?{' '}
              <Link
                href={`/support?topic=sign_up&error=${encodeURIComponent('Confirmation email not received')}`}
                className="underline underline-offset-2"
                style={{ color: 'var(--text-secondary)' }}
              >
                Message us
              </Link>
            </p>
            <Link href="/login" className="text-[var(--accent)] font-semibold text-[14px] hover:underline mt-2">
              Back to login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute top-[-30%] right-[-20%] w-[600px] h-[600px] rounded-full opacity-[0.06]" style={{ background: 'radial-gradient(circle, var(--accent), transparent 70%)' }} />
      <div className="absolute bottom-[-30%] left-[-20%] w-[600px] h-[600px] rounded-full opacity-[0.04]" style={{ background: 'radial-gradient(circle, var(--purple), transparent 70%)' }} />
      <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(var(--bg-overlay) 1px, transparent 1px), linear-gradient(90deg, var(--bg-overlay) 1px, transparent 1px)', backgroundSize: '80px 80px' }} />

      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-3 mb-10">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-solid)] flex items-center justify-center text-[var(--text-on-accent)] font-black text-sm">AM</div>
          <span className="text-xl font-extrabold tracking-tight">Apply<span className="text-[var(--accent)]">Master</span></span>
        </Link>

        {/* Card */}
        <div className="p-8 rounded-2xl bg-[var(--bg-card)] border border-[var(--bg-overlay)] shadow-[var(--card-lift)]">
          <h1 className="text-2xl font-black tracking-tight mb-2">Create your account</h1>
          <p className="text-[14px] text-[var(--text-muted)] mb-8">Start applying to jobs on autopilot — free forever</p>

          {error && <AuthError error={error} topic="sign_up" />}

          {/* Google OAuth */}
          <button type="button" onClick={handleGoogleSignup} className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl bg-[var(--bg-card)] text-[var(--text)] border border-[var(--border)] font-bold text-[14px] hover:bg-[var(--bg-card-hover)] transition-colors mb-6">
            <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-[var(--bg-overlay)]" />
            <span className="text-[12px] text-[var(--text-faint)] font-medium">or sign up with email</span>
            <div className="flex-1 h-px bg-[var(--bg-overlay)]" />
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label htmlFor="signup-name" className="block text-[12px] font-semibold text-[var(--text-muted)] mb-2">Full Name</label>
              <input
                id="signup-name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--bg-overlay)] text-ink text-[14px] placeholder-[var(--text-faint)] focus:outline-none focus:border-[rgb(var(--accent-rgb)/0.3)] focus:ring-1 focus:ring-[rgb(var(--accent-rgb)/0.15)] transition-all"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label htmlFor="signup-email" className="block text-[12px] font-semibold text-[var(--text-muted)] mb-2">Email</label>
              <input
                id="signup-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--bg-overlay)] text-ink text-[14px] placeholder-[var(--text-faint)] focus:outline-none focus:border-[rgb(var(--accent-rgb)/0.3)] focus:ring-1 focus:ring-[rgb(var(--accent-rgb)/0.15)] transition-all"
                placeholder="you@email.com"
              />
            </div>
            <div>
              <label htmlFor="signup-password" className="block text-[12px] font-semibold text-[var(--text-muted)] mb-2">Password</label>
              <input
                id="signup-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--bg-overlay)] text-ink text-[14px] placeholder-[var(--text-faint)] focus:outline-none focus:border-[rgb(var(--accent-rgb)/0.3)] focus:ring-1 focus:ring-[rgb(var(--accent-rgb)/0.15)] transition-all"
                placeholder="Min 6 characters"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[var(--accent)] to-[var(--accent-solid)] text-[var(--text-on-accent)] font-bold text-[14px] hover:shadow-[0_8px_30px_rgb(var(--accent-rgb) / 0.3)] hover:translate-y-[-1px] transition-all disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-[11px] text-[var(--text-faint)] mt-5 text-center leading-relaxed">
            By signing up, you agree to our <a href="/terms" className="text-[var(--accent)] hover:underline">Terms</a> and <a href="/privacy" className="text-[var(--accent)] hover:underline">Privacy Policy</a>.
          </p>
        </div>

        <p className="text-center text-[13px] text-[var(--text-faint)] mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-[var(--accent)] font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
