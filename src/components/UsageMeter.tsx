'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { CREDIT_PACK } from '@/lib/plan-limits'
import { toast } from '@/components/Toast'

type Usage = {
  plan: 'free' | 'pro' | 'elite' | 'lifetime'
  monthlyUsed: number
  monthlyLimit: number | null
  dailyUsed: number
  dailyLimit: number | null
  credits: number
  blocked: null | 'daily' | 'monthly'
}

/**
 * The application allowance, always visible — like a token meter in an AI
 * tool. Free and Pro see the monthly pool fill up (accent, then yellow past
 * half, red past 80%) instead of discovering the limit by hitting it. The
 * block states say what actually helps: a daily pace resets by itself, a
 * spent pool needs credits (Pro) or an upgrade (Free). Elite and Lifetime
 * see nothing unless the unadvertised daily safety cap fires.
 */
export default function UsageMeter() {
  const [u, setU] = useState<Usage | null>(null)
  const pathname = usePathname()

  const load = useCallback(() => {
    fetch('/api/usage')
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (d && !d.error) setU(d)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    load()
  }, [load, pathname])

  useEffect(() => {
    const on = () => load()
    window.addEventListener('applymaster:usage-changed', on)
    return () => window.removeEventListener('applymaster:usage-changed', on)
  }, [load])

  const [buying, setBuying] = useState(false)
  const buyCredits = async () => {
    setBuying(true)
    try {
      const res = await fetch('/api/credits/checkout', { method: 'POST' })
      const json = await res.json().catch(() => ({}))
      if (json.url) {
        window.location.href = json.url
        return
      }
      toast.error(json.error || 'Checkout is unavailable right now')
    } catch {
      toast.error('Checkout is unavailable right now')
    }
    setBuying(false)
  }

  if (!u) return null

  if (u.monthlyLimit === null) {
    if (u.blocked !== 'daily') return null
    return (
      <div className="px-3 py-2.5 rounded-xl text-[11px] leading-snug" style={{ background: 'rgb(var(--yellow-rgb) / calc(0.12 * var(--tint-scale)))', color: 'var(--text-secondary)' }}>
        Daily safety limit reached — applications resume at midnight UTC.
      </div>
    )
  }

  const total = u.monthlyLimit + u.credits
  const pct = Math.min(100, Math.round((u.monthlyUsed / Math.max(1, total)) * 100))
  const tone = pct >= 80 ? 'var(--red)' : pct >= 50 ? 'var(--yellow)' : 'var(--accent)'
  const toneRgb = pct >= 80 ? 'var(--red-rgb)' : pct >= 50 ? 'var(--yellow-rgb)' : 'var(--accent-rgb)'

  return (
    <div className="px-3 py-2.5 rounded-xl" style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border)' }}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>
          Applications
        </span>
        <span className="text-[12px] font-bold tabular-nums" style={{ color: tone }}>
          {u.monthlyUsed}/{total}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-card)' }} role="progressbar" aria-valuenow={u.monthlyUsed} aria-valuemax={total} aria-label="Applications used this month">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, rgb(${toneRgb} / 0.7), ${tone})` }}
        />
      </div>
      <div className="mt-1.5 flex items-center justify-between gap-2 text-[10.5px]" style={{ color: 'var(--text-faint)' }}>
        <span>this month</span>
        {u.dailyLimit !== null && (
          <span className="tabular-nums" style={{ color: u.dailyUsed >= u.dailyLimit ? 'var(--yellow)' : 'var(--text-faint)' }}>
            {u.dailyUsed}/{u.dailyLimit} today
          </span>
        )}
        {u.credits > 0 && <span style={{ color: 'var(--green)' }}>incl. {u.credits} credits</span>}
      </div>

      {u.blocked === 'daily' && (
        <p className="mt-2 text-[10.5px] leading-snug" style={{ color: 'var(--text-muted)' }}>
          Today&rsquo;s pace of {u.dailyLimit} is reached — resets at midnight UTC.
        </p>
      )}
      {u.blocked === 'monthly' && u.plan === 'free' && (
        <Link
          href="/settings"
          className="am-press mt-2 block text-center px-3 py-1.5 rounded-lg text-[11px] font-bold text-[var(--text-on-accent)]"
          style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-solid))' }}
        >
          Monthly limit reached — upgrade
        </Link>
      )}
      {u.blocked === 'monthly' && u.plan === 'pro' && (
        <button
          onClick={buyCredits}
          disabled={buying}
          className="am-press mt-2 w-full px-3 py-1.5 rounded-lg text-[11px] font-bold text-[var(--text-on-accent)]"
          style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-solid))' }}
        >
          {buying ? 'Opening…' : `Get ${CREDIT_PACK.credits} more — $${CREDIT_PACK.dollars}`}
        </button>
      )}
    </div>
  )
}
