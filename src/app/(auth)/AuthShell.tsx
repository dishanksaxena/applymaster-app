'use client'

import { motion, useReducedMotion } from 'framer-motion'
import Link from 'next/link'
import type { ReactNode } from 'react'

const EASE = [0.16, 1, 0.3, 1] as const

/**
 * Shared chrome for the sign-in pages: a drifting aura behind a glass card.
 * Pages keep their own headings and forms; this only frames them.
 */
export default function AuthShell({
  children,
  footer,
  logo = true,
  center = false,
}: {
  children: ReactNode
  /** Rendered under the card. */
  footer?: ReactNode
  logo?: boolean
  /** Card content is a centred message rather than a form. */
  center?: boolean
}) {
  const reduced = useReducedMotion()

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: 'var(--bg)' }}>
      <style>{`
        .am-auth-input { transition: border-color .25s ease, box-shadow .3s cubic-bezier(.16,1,.3,1), background-color .25s ease; }
        .am-auth-input:focus { border-color: var(--accent) !important; box-shadow: 0 0 0 3px var(--input-focus), 0 10px 30px -18px var(--accent-glow); outline: none; }
        .am-auth-submit { transition: transform .2s cubic-bezier(.16,1,.3,1), box-shadow .3s ease, filter .3s ease; box-shadow: 0 6px 18px -8px rgb(var(--accent-rgb) / .55); }
        .am-auth-submit:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 14px 34px -10px rgb(var(--accent-rgb) / .55), 0 0 0 1px rgb(var(--accent-rgb) / .2); filter: saturate(1.08); }
      `}</style>

      {/* Atmosphere */}
      <div aria-hidden="true" className={`am-aura absolute inset-[-20%] ${reduced ? '' : 'am-aura-live'}`} />
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: 'linear-gradient(var(--text) 1px, transparent 1px), linear-gradient(90deg, var(--text) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
          maskImage: 'radial-gradient(60% 60% at 50% 45%, #000, transparent)',
          WebkitMaskImage: 'radial-gradient(60% 60% at 50% 45%, #000, transparent)',
        }}
      />

      <div className="relative z-10 w-full max-w-[440px] px-5 sm:px-6 py-10">
        {logo && (
          <motion.div
            initial={reduced ? false : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
          >
            <Link href="/" className="flex items-center justify-center gap-3 mb-9 am-press">
              <span
                className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm"
                style={{
                  background: 'linear-gradient(135deg, var(--accent), var(--accent-solid))',
                  color: 'var(--text-on-accent)',
                  boxShadow: 'var(--pill-glow)',
                }}
              >
                AM
              </span>
              <span className="text-xl font-extrabold tracking-tight" style={{ color: 'var(--text)' }}>
                Apply<span style={{ color: 'var(--accent)' }}>Master</span>
              </span>
            </Link>
          </motion.div>
        )}

        <motion.div
          initial={reduced ? false : { opacity: 0, y: 16, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.6, delay: reduced ? 0 : 0.08, ease: EASE }}
          className={`am-glass rounded-2xl p-7 sm:p-8 ${center ? 'text-center' : ''}`}
          style={{ boxShadow: 'var(--card-lift-hover), inset 0 1px 0 0 var(--glass-highlight)' }}
        >
          {children}
        </motion.div>

        {footer && (
          <motion.div
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: reduced ? 0 : 0.3 }}
          >
            {footer}
          </motion.div>
        )}
      </div>
    </div>
  )
}

/** A check that draws itself on arrival, for the "done" states. */
export function DrawnCheck({ color = 'var(--green)', size = 28 }: { color?: string; size?: number }) {
  const reduced = useReducedMotion()
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <motion.path
        d="M22 11.08V12a10 10 0 11-5.93-9.14"
        initial={reduced ? false : { pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.7, ease: EASE }}
      />
      <motion.polyline
        points="22 4 12 14.01 9 11.01"
        initial={reduced ? false : { pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: reduced ? 0 : 0.45, ease: EASE }}
      />
    </svg>
  )
}

export const AUTH_INPUT =
  'am-auth-input w-full px-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border)] text-ink text-[14px] placeholder-[var(--text-faint)] focus:outline-none'

export const AUTH_SUBMIT =
  'am-auth-submit am-press w-full py-3.5 rounded-xl bg-gradient-to-r from-[var(--accent-solid)] via-[var(--accent-solid)] to-[var(--accent)] text-[var(--text-on-accent)] font-bold text-[14px] disabled:opacity-50'
