'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

/**
 * Route-change entrance for the app shell. Keyed on the pathname so every
 * navigation plays once; there is deliberately no exit animation, because
 * the App Router swaps children synchronously and an exit would have
 * nothing left to animate.
 */
export default function PageTransition({ children, className = '' }: { children: ReactNode; className?: string }) {
  const pathname = usePathname()
  const reduced = useReducedMotion()

  if (reduced) return <div className={className}>{children}</div>

  return (
    <motion.div
      key={pathname}
      className={className}
      initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}
