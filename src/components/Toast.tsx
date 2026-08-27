'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { tone, toneA, toneSurface, type Tone } from '@/lib/tone'

/**
 * Toasts, replacing 21 native `alert()` calls.
 *
 * `alert()` blocks the whole page behind a browser chrome dialog that says
 * "localhost:3000 says". It cannot be styled, cannot be dismissed by
 * anything but a click, freezes any work in flight, and is the single
 * loudest tell that something is a prototype. It was carrying real product
 * messages here — "Applied to X at Y", "Upload failed", "Cover letter
 * saved".
 *
 * Deliberately imperative: `toast.error(...)` from anywhere, no provider to
 * thread through seven files, no context. The emitter is module-scoped and
 * the single <Toaster /> in the dashboard shell subscribes to it.
 */

export type ToastKind = 'success' | 'error' | 'info'
type ToastItem = { id: number; kind: ToastKind; message: string }

type Listener = (t: ToastItem) => void
const listeners = new Set<Listener>()
let nextId = 1

function emit(kind: ToastKind, message: string) {
  const item = { id: nextId++, kind, message: String(message ?? '').slice(0, 400) }
  // Nothing mounted yet (or a server render): fall back so a message is
  // never simply swallowed.
  if (listeners.size === 0) {
    if (typeof window !== 'undefined') console[kind === 'error' ? 'error' : 'log'](message)
    return
  }
  listeners.forEach(l => l(item))
}

export const toast = Object.assign((message: string) => emit('info', message), {
  success: (message: string) => emit('success', message),
  error: (message: string) => emit('error', message),
  info: (message: string) => emit('info', message),
})

const TONE: Record<ToastKind, Tone> = { success: 'green', error: 'red', info: 'blue' }

const ICON: Record<ToastKind, React.ReactNode> = {
  success: <path d="M20 6L9 17l-5-5" />,
  error: <path d="M12 8v5M12 16h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />,
  info: <path d="M12 16v-4M12 8h.01M12 21a9 9 0 100-18 9 9 0 000 18z" />,
}

export default function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([])

  useEffect(() => {
    const onToast = (t: ToastItem) => {
      setItems(prev => [...prev.slice(-3), t])
      // Errors stay longer: they usually carry something to act on.
      const ttl = t.kind === 'error' ? 7000 : 4000
      setTimeout(() => setItems(prev => prev.filter(x => x.id !== t.id)), ttl)
    }
    listeners.add(onToast)
    return () => {
      listeners.delete(onToast)
    }
  }, [])

  return (
    <div
      className="fixed z-[300] bottom-5 right-5 flex flex-col gap-2 pointer-events-none"
      role="status"
      aria-live="polite"
    >
      <AnimatePresence initial={false}>
        {items.map(t => {
          const c = TONE[t.kind]
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-auto flex items-start gap-2.5 max-w-[380px] px-3.5 py-3 rounded-xl"
              style={{
                background: 'var(--card-face)',
                boxShadow: `var(--card-lift), inset 0 0 0 1px ${toneA(c, 0.25)}`,
              }}
            >
              <span
                className="grid place-items-center w-6 h-6 rounded-lg shrink-0 mt-px"
                style={{ background: toneSurface(c, 0.15), color: tone(c) }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
                  {ICON[t.kind]}
                </svg>
              </span>
              <p className="text-[12.5px] leading-snug whitespace-pre-line" style={{ color: 'var(--text)' }}>
                {t.message}
              </p>
              <button
                type="button"
                onClick={() => setItems(prev => prev.filter(x => x.id !== t.id))}
                aria-label="Dismiss"
                className="shrink-0 ml-1 -mr-1 -mt-0.5 p-1 rounded"
                style={{ color: 'var(--text-faint)' }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
