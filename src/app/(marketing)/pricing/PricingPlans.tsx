'use client'

import { motion, useReducedMotion } from 'framer-motion'
import Link from 'next/link'
import { useCallback, useRef } from 'react'
import { toneA } from '@/lib/tone'

export type Tier = {
  name: string
  price: string
  period: string
  description: string
  cta: string
  highlight: boolean
  features: string[]
  limitations: string[]
}

const EASE = [0.16, 1, 0.3, 1] as const

function PlanCard({ tier }: { tier: Tier }) {
  const reduced = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    el.style.setProperty('--mx', `${e.clientX - r.left}px`)
    el.style.setProperty('--my', `${e.clientY - r.top}px`)
  }, [])

  const restShadow = tier.highlight
    ? `var(--card-lift-hover), 0 20px 60px -24px ${toneA('accent', 0.45)}, inset 0 1px 0 0 var(--card-edge-top)`
    : `var(--card-lift), 0 0 0 1px var(--card-ring), inset 0 1px 0 0 var(--card-edge-top)`
  const hoverShadow = tier.highlight
    ? `var(--shadow-xl), 0 28px 80px -24px ${toneA('accent', 0.55)}, inset 0 1px 0 0 var(--card-edge-top)`
    : `var(--card-lift-hover), var(--shadow-xl), 0 0 0 1px var(--card-ring-hover), inset 0 1px 0 0 var(--card-edge-top)`

  return (
    <motion.div
      ref={ref}
      onPointerMove={onPointerMove}
      whileHover={reduced ? undefined : { y: -6, scale: tier.highlight ? 1.03 : 1.02, boxShadow: hoverShadow }}
      transition={{ duration: 0.35, ease: EASE }}
      className={`am-spot-host relative rounded-2xl flex flex-col h-full ${tier.highlight ? 'lg:-mt-3 lg:mb-[-12px]' : ''}`}
      style={{ boxShadow: restShadow, background: tier.highlight ? 'transparent' : 'var(--card-face)' }}
    >
      {tier.highlight && (
        <>
          {/* Rotating conic ring, clipped to a 1px edge by the face sitting on top. */}
          <span aria-hidden="true" className="absolute inset-0 rounded-2xl overflow-hidden" style={{ zIndex: 0 }}>
            <span
              className={`absolute left-1/2 top-1/2 ${reduced ? '' : 'am-spin'}`}
              style={{
                width: '320%',
                paddingBottom: '320%',
                marginLeft: '-160%',
                marginTop: '-160%',
                background: 'conic-gradient(from 0deg, var(--accent), var(--purple), var(--accent-light), var(--accent))',
                opacity: 0.9,
              }}
            />
          </span>
          <span
            aria-hidden="true"
            className="absolute inset-[1.5px] rounded-[15px]"
            style={{ background: 'var(--card-face)', zIndex: 0 }}
          />
          <span
            aria-hidden="true"
            className="absolute inset-[1.5px] rounded-[15px]"
            style={{
              background: `radial-gradient(120% 80% at 50% 0%, ${toneA('accent', 0.14)}, transparent 60%)`,
              zIndex: 0,
            }}
          />
        </>
      )}

      <span aria-hidden="true" className="am-spot" style={tier.highlight ? { zIndex: 1 } : undefined} />
      {!tier.highlight && <span aria-hidden="true" className="am-spot-ring" />}

      <div className="relative p-8 flex flex-col flex-1" style={{ zIndex: 2 }}>
        {tier.highlight && (
          <div
            className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-xs font-semibold whitespace-nowrap"
            style={{
              background: 'var(--accent-solid)',
              color: 'var(--text-on-accent)',
              boxShadow: 'var(--pill-glow)',
            }}
          >
            Most Popular
          </div>
        )}
        <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>{tier.name}</h3>
        <div className="flex items-baseline gap-1 mb-2">
          <span className="font-display text-[2.75rem] leading-none" style={{ color: 'var(--text)' }}>{tier.price}</span>
          <span className="text-[var(--text-muted)] text-sm">{tier.period}</span>
        </div>
        <p className="text-sm text-[var(--text-muted)] mb-6">{tier.description}</p>

        <motion.div whileTap={reduced ? undefined : { scale: 0.99 }} className="mb-8">
          <Link
            href="/signup"
            className={`am-press block rounded-full py-3 text-center text-sm font-semibold transition-all ${
              tier.highlight
                ? 'bg-[var(--accent-solid)] text-[var(--text-on-accent)] hover:bg-[var(--accent-solid)] hover:shadow-[var(--pill-glow)]'
                : 'border border-[var(--border-hover)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-ink hover:shadow-[var(--shadow-sm)]'
            }`}
            style={tier.highlight ? { boxShadow: `0 8px 24px -10px ${toneA('accent', 0.6)}` } : undefined}
          >
            {tier.cta}
          </Link>
        </motion.div>

        <ul className="space-y-3 flex-1">
          {tier.features.map((f) => (
            <li key={f} className="flex items-start gap-3 text-sm text-[var(--text-secondary)]">
              <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-[var(--green-dim)] flex items-center justify-center text-xs text-[var(--green)]">&#10003;</span>
              {f}
            </li>
          ))}
          {tier.limitations.map((l) => (
            <li key={l} className="flex items-start gap-3 text-sm text-[var(--text-faint)]">
              <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-[var(--bg-card-hover)] flex items-center justify-center text-xs text-[var(--text-faint)]">&times;</span>
              {l}
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  )
}

export default function PricingPlans({ tiers }: { tiers: Tier[] }) {
  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 items-stretch">
        {tiers.map((tier, i) => (
          <div key={tier.name} className="am-rise h-full" style={{ animationDelay: `${200 + i * 90}ms` }}>
            <PlanCard tier={tier} />
          </div>
        ))}
      </div>
    </>
  )
}
