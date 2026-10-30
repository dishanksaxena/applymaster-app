'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { ReactNode, useCallback, useRef } from 'react'
import { toneA, type Tone } from '@/lib/tone'

/**
 * The card everything in the dashboard sits on.
 *
 * What gives a card presence here, in order of how much it contributes:
 *   1. A layered shadow rather than a border alone. Borders describe an edge;
 *      shadows describe a surface sitting above another surface.
 *   2. A bright top edge, so the card catches light like a physical object.
 *   3. A vertical gradient face — flat fills read as placeholder.
 *   4. Accent, applied as a tinted ring and a coloured shadow rather than a
 *      visible stripe, which would be decoration rather than information.
 *   5. A specular highlight and edge glow that follow the pointer. They are
 *      driven by two CSS variables written straight to the element, so a
 *      pointer move never re-renders React.
 */

const ACCENT_TONE: Record<string, Tone | null> = {
  pink: 'accent',
  purple: 'purple',
  blue: 'blue',
  green: 'green',
  yellow: 'yellow',
  red: 'red',
  none: null,
}

interface PremiumCardProps {
  children: ReactNode
  onClick?: () => void
  hover?: boolean
  gradient?: boolean
  accent?: 'pink' | 'purple' | 'blue' | 'green' | 'yellow' | 'red' | 'none'
  /** Adds a tone-coloured shadow. Reserve it for cards that carry a metric. */
  glowEffect?: boolean
  /** Pointer-tracked specular face and edge glow. On by default. */
  spotlight?: boolean
  className?: string
  animationDelay?: number
}

export default function PremiumCard({
  children,
  onClick,
  hover = true,
  gradient = true,
  accent = 'pink',
  glowEffect = false,
  spotlight = true,
  className = '',
  animationDelay = 0,
}: PremiumCardProps) {
  const t = ACCENT_TONE[accent] ?? null
  const interactive = Boolean(onClick)
  const reduced = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)

  const ring = t && glowEffect ? toneA(t, 0.16) : 'var(--card-ring)'
  const ringHover = t ? toneA(t, 0.3) : 'var(--card-ring-hover)'

  const restShadow = [
    'var(--card-lift)',
    `inset 0 1px 0 0 var(--card-edge-top)`,
    `0 0 0 1px ${ring}`,
    glowEffect && t ? `0 10px 30px -14px ${toneA(t, 0.28)}` : '',
  ]
    .filter(Boolean)
    .join(', ')

  const hoverShadow = [
    'var(--card-lift-hover)',
    'var(--shadow-xl)',
    `inset 0 1px 0 0 var(--card-edge-top)`,
    `0 0 0 1px ${ringHover}`,
    t ? `0 18px 44px -18px ${toneA(t, 0.34)}` : '',
  ]
    .filter(Boolean)
    .join(', ')

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    el.style.setProperty('--mx', `${e.clientX - r.left}px`)
    el.style.setProperty('--my', `${e.clientY - r.top}px`)
  }, [])

  const lift = hover && !reduced

  return (
    <motion.div
      ref={ref}
      initial={reduced ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: animationDelay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={lift ? { y: -3, boxShadow: hoverShadow } : undefined}
      whileTap={interactive && !reduced ? { scale: 0.985 } : undefined}
      onPointerMove={spotlight ? onPointerMove : undefined}
      onClick={onClick}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={
        interactive
          ? e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick?.()
              }
            }
          : undefined
      }
      className={`am-spot-host relative rounded-2xl overflow-hidden ${interactive ? 'cursor-pointer' : ''} ${className}`}
      style={{
        background: gradient ? 'var(--card-face)' : 'var(--bg-card)',
        boxShadow: restShadow,
        // Border is deliberately absent: the ring above is the border, drawn
        // as a shadow so it can animate and tint without layout shift.
      }}
    >
      {spotlight && (
        <>
          <span aria-hidden="true" className="am-spot" style={t ? { background: `radial-gradient(420px circle at var(--mx, 50%) var(--my, 50%), ${toneA(t, 0.09)}, transparent 62%)` } : undefined} />
          <span aria-hidden="true" className="am-spot-ring" style={t ? { background: `radial-gradient(260px circle at var(--mx, 50%) var(--my, 50%), ${toneA(t, 0.7)}, transparent 70%)` } : undefined} />
        </>
      )}
      {children}
    </motion.div>
  )
}
