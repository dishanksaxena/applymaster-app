'use client'

import { motion, useReducedMotion, type Variants } from 'framer-motion'
import type { ReactNode } from 'react'

/**
 * Scroll-triggered entrance. Elements blur-fade and settle upward as they
 * enter the viewport, once. Under reduced motion they render in place.
 *
 * `data-reveal` keeps the root layout's <noscript> rule working: with
 * scripts off, everything marked this way is forced visible.
 */

export const EASE = [0.16, 1, 0.3, 1] as const

export type RevealEffect = 'up' | 'scale' | 'blur' | 'left' | 'right' | 'none'

const HIDDEN: Record<RevealEffect, Record<string, number | string>> = {
  up: { opacity: 0, y: 28, filter: 'blur(6px)' },
  scale: { opacity: 0, scale: 0.94, y: 12, filter: 'blur(6px)' },
  blur: { opacity: 0, filter: 'blur(10px)' },
  left: { opacity: 0, x: -36, filter: 'blur(4px)' },
  right: { opacity: 0, x: 36, filter: 'blur(4px)' },
  none: { opacity: 0 },
}

const SHOWN = { opacity: 1, x: 0, y: 0, scale: 1, filter: 'blur(0px)' }

export function revealVariants(effect: RevealEffect = 'up', duration = 0.75, delay = 0): Variants {
  return {
    hidden: HIDDEN[effect],
    show: { ...SHOWN, transition: { duration, delay, ease: EASE } },
  }
}

type Tag = 'div' | 'li' | 'section' | 'span' | 'article' | 'figure' | 'header' | 'p'

export default function Reveal({
  children,
  className = '',
  style,
  delay = 0,
  duration = 0.75,
  effect = 'up',
  amount = 0.18,
  as = 'div',
}: {
  children: ReactNode
  className?: string
  style?: React.CSSProperties
  /** Seconds. */
  delay?: number
  duration?: number
  effect?: RevealEffect
  /** How much of the element must be visible before it plays. */
  amount?: number
  as?: Tag
}) {
  const reduced = useReducedMotion()
  const M = motion[as] as typeof motion.div

  if (reduced) {
    return (
      <M data-reveal className={className} style={style}>
        {children}
      </M>
    )
  }

  return (
    <M
      data-reveal
      className={className}
      style={style}
      variants={revealVariants(effect, duration, delay)}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount, margin: '0px 0px -48px 0px' }}
    >
      {children}
    </M>
  )
}

/**
 * A parent that staggers its Reveal-like children. Children should use
 * `variants={revealVariants(...)}` without their own initial/whileInView so
 * the parent drives them.
 */
export function RevealGroup({
  children,
  className = '',
  stagger = 0.08,
  delay = 0,
  amount = 0.15,
  as = 'div',
}: {
  children: ReactNode
  className?: string
  stagger?: number
  delay?: number
  amount?: number
  as?: Tag
}) {
  const reduced = useReducedMotion()
  const M = motion[as] as typeof motion.div
  if (reduced) return <M className={className}>{children}</M>
  return (
    <M
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount, margin: '0px 0px -48px 0px' }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: stagger, delayChildren: delay } } }}
    >
      {children}
    </M>
  )
}

/** A child of RevealGroup. */
export function RevealItem({
  children,
  className = '',
  style,
  effect = 'up',
  duration = 0.7,
  as = 'div',
}: {
  children: ReactNode
  className?: string
  style?: React.CSSProperties
  effect?: RevealEffect
  duration?: number
  as?: Tag
}) {
  const M = motion[as] as typeof motion.div
  return (
    <M data-reveal className={className} style={style} variants={revealVariants(effect, duration)}>
      {children}
    </M>
  )
}
