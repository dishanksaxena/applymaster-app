import { Suspense } from 'react'
import type { Metadata } from 'next'
import SupportForm from './SupportForm'

export const metadata: Metadata = {
  title: { absolute: 'Support — ApplyMaster' },
  description: 'Trouble signing in, a bug, or a question about billing? Message the ApplyMaster team.',
}

const FAQ = [
  {
    q: 'The login page says my password is wrong',
    a: 'If you created your account with Google, there is no password to enter — choose Continue with Google. Otherwise use “Forgot password?” on the login page.',
  },
  {
    q: 'I never got the confirmation email',
    a: 'It can take a few minutes and often lands in spam or promotions. On the login page, try signing in — you will get a button to send it again.',
  },
  {
    q: 'My password reset link does not work',
    a: 'Reset links work once, and only in the browser you requested them from. Request a new one and open it on the same device.',
  },
]

export default function SupportPage() {
  return (
    <div className="max-w-[760px] mx-auto px-4 sm:px-6 pt-28 pb-24">
      <h1 className="font-display text-[clamp(2.2rem,4.5vw,3.2rem)] leading-[1.05]" style={{ color: 'var(--text)' }}>
        How can we help?
      </h1>
      <p className="text-[15px] mt-3 mb-10 max-w-lg" style={{ color: 'var(--text-secondary)' }}>
        A real person reads every message. Tell us what happened and we will get back to you, usually within a day.
      </p>

      <Suspense fallback={<div className="h-[520px]" />}>
        <SupportForm />
      </Suspense>

      <h2 className="font-display text-[1.5rem] mt-16 mb-4" style={{ color: 'var(--text)' }}>
        Common sign-in problems
      </h2>
      <div className="space-y-2">
        {FAQ.map(f => (
          <details
            key={f.q}
            className="group rounded-xl px-4 py-3"
            style={{ background: 'var(--bg-card)', boxShadow: '0 0 0 1px var(--card-ring)' }}
          >
            <summary className="cursor-pointer text-[14px] font-semibold list-none flex justify-between gap-4" style={{ color: 'var(--text)' }}>
              {f.q}
              <span aria-hidden="true" className="transition-transform group-open:rotate-45" style={{ color: 'var(--text-faint)' }}>
                +
              </span>
            </summary>
            <p className="text-[13.5px] mt-2 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {f.a}
            </p>
          </details>
        ))}
      </div>
    </div>
  )
}
