'use client'

import Link from 'next/link'

/**
 * Auth failures, explained, with a way out.
 *
 * Supabase's messages are accurate but not actionable. "Invalid login
 * credentials" is the clearest case: most ApplyMaster accounts were created
 * with Google, so a person who comes back and types an email and password is
 * told their credentials are wrong when in fact they never had a password.
 * Each explanation here says what most likely happened and what to do next,
 * and every one ends in a way to reach a human.
 */

type Explained = { title: string; body: string; action?: 'resend' | 'google' | 'reset' }

export function explainAuthError(codeOrMessage: string): Explained {
  const m = (codeOrMessage || '').toLowerCase()

  if (m === 'oauth_cancelled' || m.includes('access_denied')) {
    return { title: 'Google sign-in was cancelled', body: 'Nothing was changed. Choose Continue with Google again when you are ready.' }
  }
  if (m === 'link_other_browser') {
    return {
      title: 'Your email is confirmed — please sign in',
      body: 'The link was opened in a different browser from the one you signed up in, so we could not sign you in automatically. Your address is verified; sign in below.',
    }
  }
  if (m === 'oauth_provider_error' || m === 'exchange_failed' || m === 'missing_code' || m === 'auth_failed') {
    return {
      title: 'Sign-in did not complete',
      body: 'Something interrupted the sign-in. Please try again — if it happens twice, message us and we will sort it out.',
    }
  }
  if (m.includes('invalid login credentials')) {
    return {
      title: 'That email and password do not match',
      body: 'If you created your account with Google, there is no password to enter — use Continue with Google instead. Otherwise, check the password or reset it.',
      action: 'google',
    }
  }
  if (m.includes('email not confirmed')) {
    return {
      title: 'Confirm your email first',
      body: 'We sent a confirmation link when you signed up. It can take a few minutes and sometimes lands in spam or promotions.',
      action: 'resend',
    }
  }
  if (m.includes('already registered') || m === 'existing_account') {
    return {
      title: 'You already have an account',
      body: 'This email is already registered. Sign in instead — and if you originally used Google, choose Continue with Google.',
      action: 'google',
    }
  }
  if (m.includes('rate limit') || m.includes('security purposes') || m.includes('too many')) {
    return { title: 'Too many attempts', body: 'Please wait a minute before trying again.' }
  }
  if (m.includes('auth session missing') || (m.includes('session') && m.includes('expired'))) {
    return {
      title: 'This reset link has expired or was opened in another browser',
      body: 'Password reset links only work in the browser you requested them from, and only once. Request a fresh link and open it on this device.',
      action: 'reset',
    }
  }
  if (m.includes('password should be') || m.includes('weak password')) {
    return { title: 'Choose a stronger password', body: codeOrMessage }
  }
  if (m.includes('failed to fetch') || m.includes('network')) {
    return { title: 'Could not reach the server', body: 'Check your connection and try again.' }
  }
  return { title: 'Something went wrong', body: codeOrMessage || 'Please try again.' }
}

export default function AuthError({
  error,
  onResend,
  resendState,
  topic = 'sign_in',
}: {
  error: string
  onResend?: () => void
  resendState?: 'idle' | 'sending' | 'sent' | 'failed'
  topic?: 'sign_in' | 'sign_up'
}) {
  const e = explainAuthError(error)
  const supportHref = `/support?topic=${topic}&error=${encodeURIComponent(error.slice(0, 160))}`

  return (
    <div
      role="alert"
      className="p-3.5 rounded-xl text-[13px] mb-6"
      style={{ background: 'var(--red-dim)', boxShadow: 'inset 0 0 0 1px rgb(var(--red-rgb) / 0.18)' }}
    >
      <p className="font-semibold" style={{ color: 'var(--red)' }}>
        {e.title}
      </p>
      <p className="mt-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        {e.body}
      </p>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2.5">
        {e.action === 'resend' && onResend && (
          <button
            type="button"
            onClick={onResend}
            disabled={resendState === 'sending' || resendState === 'sent'}
            className="font-semibold underline underline-offset-2 disabled:no-underline"
            style={{ color: 'var(--accent)' }}
          >
            {resendState === 'sending'
              ? 'Sending…'
              : resendState === 'sent'
                ? 'Sent — check your inbox'
                : resendState === 'failed'
                  ? 'Could not send — try again'
                  : 'Resend confirmation email'}
          </button>
        )}
        {e.action === 'reset' && (
          <Link href="/forgot-password" className="font-semibold underline underline-offset-2" style={{ color: 'var(--accent)' }}>
            Request a new link
          </Link>
        )}
        <Link href={supportHref} className="font-semibold underline underline-offset-2" style={{ color: 'var(--text-secondary)' }}>
          Still stuck? Message us
        </Link>
      </div>
    </div>
  )
}
