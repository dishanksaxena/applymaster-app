'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  applyTheme,
  getStoredTheme,
  NEXT_THEME,
  THEME_LABEL,
  type Theme,
} from '@/lib/theme'

const ICONS: Record<Theme, JSX.Element> = {
  light: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </>
  ),
  dark: <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />,
  system: (
    <>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </>
  ),
}

export default function ThemeToggle({ className = '' }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>('system')
  const [mounted, setMounted] = useState(false)
  const [hover, setHover] = useState(false)
  const reduced = useReducedMotion()

  useEffect(() => {
    setTheme(getStoredTheme())
    setMounted(true)
  }, [])

  // Keep the label honest if the OS flips while we're following it.
  useEffect(() => {
    if (theme !== 'system' || !window.matchMedia) return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => setTheme('system')
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [theme])

  const cycle = () => {
    const next = NEXT_THEME[theme]
    setTheme(next)
    applyTheme(next)
  }

  // Before mount the stored value is unknown, so render the neutral icon.
  // The button itself is always present, so nothing shifts on hydration.
  const shown: Theme = mounted ? theme : 'system'

  return (
    <motion.button
      type="button"
      onClick={cycle}
      aria-label={THEME_LABEL[shown]}
      title={THEME_LABEL[shown]}
      whileTap={reduced ? undefined : { scale: 0.92 }}
      onHoverStart={() => setHover(true)}
      onHoverEnd={() => setHover(false)}
      className={`relative inline-grid place-items-center w-9 h-9 rounded-md border overflow-hidden transition-colors ${className}`}
      style={{
        borderColor: hover ? 'var(--border-hover)' : 'var(--border)',
        color: hover ? 'var(--text)' : 'var(--text-secondary)',
        background: hover ? 'var(--bg-overlay)' : 'transparent',
      }}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.svg
          key={shown}
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          initial={reduced ? false : { rotate: -70, scale: 0.5, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          exit={reduced ? undefined : { rotate: 70, scale: 0.5, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 26 }}
        >
          {ICONS[shown]}
        </motion.svg>
      </AnimatePresence>
    </motion.button>
  )
}
