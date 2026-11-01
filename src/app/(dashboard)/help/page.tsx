'use client'

import { Suspense } from 'react'
import SupportForm from '@/app/(marketing)/support/SupportForm'

/* The sidebar's "Help & support" used to point at the public /support page,
   which has no dashboard shell — signed-in users lost their navigation.
   This renders the same form inside the shell. */

export default function HelpPage() {
  return (
    <div className="max-w-[760px] mx-auto">
      <h1 className="font-display text-[clamp(1.75rem,2.6vw,2.15rem)] leading-tight" style={{ color: 'var(--text)' }}>
        How can we help?
      </h1>
      <p className="text-[13px] mt-1 mb-6" style={{ color: 'var(--text-muted)' }}>
        A real person reads every message. Tell us what happened and we will get back to you, usually within a day.
      </p>
      <Suspense fallback={null}>
        <SupportForm />
      </Suspense>
    </div>
  )
}
