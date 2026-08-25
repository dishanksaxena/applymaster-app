'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { tone, toneA, toneSurface, type Tone } from '@/lib/tone'

/**
 * The referral graph: your contacts on the left, you in the middle, the
 * people a search surfaced on the right.
 *
 * This visual came from the original page and is worth keeping — a fan of
 * curved paths converging on you reads as "these are your routes in" far
 * faster than a list does. What was wrong with it was the data: it drew a
 * fixed cast of invented contacts. Every node here comes from
 * `network_connections`, and the right-hand column only ever holds real
 * search results.
 *
 * Geometry is computed against the measured container width so the paths
 * stay attached to the cards at any size.
 */

export type GraphPerson = {
  id: string
  name: string
  title: string | null
  company: string | null
}

export type GraphHit = GraphPerson & { score: number; canRefer: boolean }

const TONES: Tone[] = ['accent', 'purple', 'blue', 'green', 'yellow']
const toneFor = (id: string) => TONES[[...id].reduce((a, c) => a + c.charCodeAt(0), 0) % TONES.length]

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('') || '?'

const KEYFRAMES = `
@keyframes amFlow { from { stroke-dashoffset: 20; } to { stroke-dashoffset: 0; } }
@keyframes amFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
@media (prefers-reduced-motion: reduce) {
  .am-graph [style*="amFlow"], .am-graph [style*="amFloat"] { animation: none !important; }
  .am-graph animateMotion { display: none; }
}
`

const CARD_W = 232
const CARD_H = 62
const GUTTER = 18
/** Kept above the tallest column so nothing is clipped at narrow widths. */
const MIN_H = 520

export default function NetworkGraph({
  connections,
  hits,
  searching,
  onPick,
}: {
  connections: GraphPerson[]
  hits: GraphHit[] | null
  searching: boolean
  onPick?: (id: string) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [w, setW] = useState(1040)
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    if (!ref.current) return
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width))
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [])

  /* Six is where the fan stops reading as a fan. The rest are counted, not
     drawn, which is more honest than cramming them in unreadably. */
  const left = connections.slice(0, 6)
  const overflow = connections.length - left.length
  const right = hits?.slice(0, 6) ?? []

  const h = Math.max(MIN_H, Math.max(left.length, right.length) * (CARD_H + 20) + 90)
  const cx = w / 2
  const cy = h / 2

  const column = (n: number, i: number) => {
    const spacing = Math.min(CARD_H + 26, (h - 110) / Math.max(n, 1))
    return cy - ((n - 1) * spacing) / 2 + i * spacing - CARD_H / 2
  }

  const leftCards = left.map((p, i) => ({ ...p, x: GUTTER, y: column(left.length, i), t: toneFor(p.id) }))
  const rightCards = right.map((p, i) => ({
    ...p,
    x: w - CARD_W - GUTTER,
    y: column(right.length, i),
    t: (p.canRefer ? 'green' : 'blue') as Tone,
  }))

  const flow = (delay: number) =>
    reduced ? undefined : { animation: `amFlow 0.9s linear infinite`, animationDelay: `${delay}s` }

  return (
    <div ref={ref} className="am-graph relative w-full" style={{ minHeight: h }}>
      <style>{KEYFRAMES}</style>

      <div
        className="absolute top-2 left-5 text-[10.5px] font-semibold tracking-[0.11em] uppercase"
        style={{ color: 'var(--text-faint)' }}
      >
        Your network
      </div>
      <div
        className="absolute top-2 right-5 text-[10.5px] font-semibold tracking-[0.11em] uppercase text-right"
        style={{ color: 'var(--text-faint)' }}
      >
        Referral paths
      </div>

      <svg className="absolute inset-0 w-full pointer-events-none" style={{ height: h }} aria-hidden="true">
        <defs>
          <filter id="amGlow">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Contact -> you */}
        {leftCards.map((c, i) => {
          const sx = GUTTER + CARD_W
          const sy = c.y + CARD_H / 2
          const d = `M ${sx} ${sy} C ${sx + (cx - sx) * 0.45} ${sy}, ${cx - (cx - sx) * 0.2} ${cy}, ${cx} ${cy}`
          return (
            <g key={`l-${c.id}`}>
              <path d={d} fill="none" stroke={toneA(c.t, 0.18)} strokeWidth="3" filter="url(#amGlow)" />
              <path
                d={d}
                fill="none"
                stroke={tone(c.t)}
                strokeWidth="1.4"
                strokeDasharray="6 4"
                opacity="0.55"
                style={flow(i * 0.15)}
              />
              {!reduced && (
                <circle r="2.6" fill={tone(c.t)} opacity="0.85">
                  <animateMotion dur={`${2 + i * 0.3}s`} repeatCount="indefinite" path={d} />
                </circle>
              )}
            </g>
          )
        })}

        {/* You -> referral path */}
        {rightCards.map((c, i) => {
          const ex = c.x
          const ey = c.y + CARD_H / 2
          const d = `M ${cx} ${cy} C ${cx + (ex - cx) * 0.3} ${cy}, ${ex - (ex - cx) * 0.4} ${ey}, ${ex} ${ey}`
          return (
            <g key={`r-${c.id}`}>
              <path d={d} fill="none" stroke={toneA(c.t, 0.18)} strokeWidth="3" filter="url(#amGlow)" />
              <path
                d={d}
                fill="none"
                stroke={tone(c.t)}
                strokeWidth="1.4"
                strokeDasharray="6 4"
                opacity="0.5"
                style={flow(i * 0.15)}
              />
              {!reduced && (
                <circle r="2.6" fill={tone(c.t)} opacity="0.85">
                  <animateMotion dur={`${2.2 + i * 0.25}s`} repeatCount="indefinite" path={d} />
                </circle>
              )}
            </g>
          )
        })}

        {searching && !reduced && (
          <circle cx={cx} cy={cy} r="30" fill="none" stroke={tone('accent')} strokeWidth="2" opacity="0.4">
            <animate attributeName="r" from="30" to="240" dur="1.8s" repeatCount="indefinite" />
            <animate attributeName="opacity" from="0.45" to="0" dur="1.8s" repeatCount="indefinite" />
          </circle>
        )}
      </svg>

      {/* You */}
      <div
        className="absolute z-20 grid place-content-center text-center rounded-full"
        style={{
          left: cx - 42,
          top: cy - 42,
          width: 84,
          height: 84,
          background: 'var(--accent-solid)',
          color: 'var(--text-on-accent)',
          boxShadow: `0 0 0 6px ${toneA('accent', 0.12)}, 0 10px 30px -10px ${toneA('accent', 0.5)}`,
          animation: reduced ? undefined : 'amFloat 4s ease-in-out infinite',
        }}
      >
        <span className="font-semibold text-[14px] tracking-wide">YOU</span>
        <span className="text-[9.5px] opacity-75 mt-0.5">
          {connections.length} {connections.length === 1 ? 'contact' : 'contacts'}
        </span>
      </div>
      <div
        className="absolute z-10 rounded-full pointer-events-none"
        style={{
          left: cx - 52,
          top: cy - 52,
          width: 104,
          height: 104,
          boxShadow: `inset 0 0 0 1px ${toneA('accent', 0.16)}`,
        }}
      />

      {/* Contacts */}
      {leftCards.map((c, i) => (
        <motion.button
          key={c.id}
          type="button"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 + i * 0.07, ease: [0.16, 1, 0.3, 1] }}
          onClick={() => onPick?.(c.id)}
          className="absolute z-10 rounded-xl p-3 flex items-center gap-3 text-left transition-shadow hover:shadow-md"
          style={{
            left: c.x,
            top: c.y,
            width: CARD_W,
            height: CARD_H,
            background: 'var(--card-face)',
            boxShadow: `var(--card-lift), inset 0 0 0 1px ${toneA(c.t, 0.16)}`,
          }}
        >
          <span
            className="grid place-items-center w-9 h-9 rounded-full text-[11.5px] font-semibold shrink-0"
            style={{ background: toneSurface(c.t, 0.16), color: tone(c.t) }}
          >
            {initialsOf(c.name)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[12.5px] font-semibold truncate" style={{ color: 'var(--text)' }}>
              {c.name}
            </span>
            <span className="block text-[10.5px] truncate" style={{ color: 'var(--text-muted)' }}>
              {c.title || 'No role on file'}
            </span>
            {c.company && (
              <span className="block text-[10px] font-semibold truncate" style={{ color: tone(c.t) }}>
                {c.company}
              </span>
            )}
          </span>
        </motion.button>
      ))}

      {overflow > 0 && (
        <div
          className="absolute z-10 text-[11px]"
          style={{ left: GUTTER, top: column(left.length, left.length - 1) + CARD_H + 12, color: 'var(--text-faint)' }}
        >
          +{overflow} more in your network
        </div>
      )}

      {/* Referral paths */}
      {rightCards.map((c, i) => (
        <motion.button
          key={c.id}
          type="button"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25 + i * 0.07, ease: [0.16, 1, 0.3, 1] }}
          onClick={() => onPick?.(c.id)}
          className="absolute z-10 rounded-xl p-3 flex items-center gap-3 text-left transition-shadow hover:shadow-md"
          style={{
            left: c.x,
            top: c.y,
            width: CARD_W,
            height: CARD_H,
            background: 'var(--card-face)',
            boxShadow: `var(--card-lift), inset 0 0 0 1px ${toneA(c.t, 0.22)}`,
          }}
        >
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5">
              <span className="text-[12.5px] font-semibold truncate" style={{ color: 'var(--text)' }}>
                {c.name}
              </span>
              {c.canRefer && (
                <span
                  className="shrink-0 text-[8.5px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: tone('green'), color: '#fff' }}
                >
                  REFER
                </span>
              )}
            </span>
            <span className="block text-[10.5px] truncate" style={{ color: 'var(--text-muted)' }}>
              {c.title || 'No role on file'}
            </span>
            <span className="flex items-center gap-2">
              <span className="text-[10px] font-semibold truncate" style={{ color: tone(c.t) }}>
                {c.company}
              </span>
              <span className="text-[9.5px] tabular-nums shrink-0" style={{ color: 'var(--text-faint)' }}>
                {c.score}% match
              </span>
            </span>
          </span>
          <span
            className="grid place-items-center w-9 h-9 rounded-full text-[11.5px] font-semibold shrink-0"
            style={{ background: toneSurface(c.t, 0.16), color: tone(c.t) }}
          >
            {initialsOf(c.name)}
          </span>
        </motion.button>
      ))}

      {/* Right column before a search, or when a search found nothing. The
          distinction matters: one is "ask me something", the other is "there
          is no path" — collapsing them would hide a real answer. */}
      {right.length === 0 && !searching && (
        <div
          className="absolute z-10 flex flex-col items-center text-center"
          style={{ left: w - CARD_W - GUTTER, top: cy - 62, width: CARD_W }}
        >
          <span
            className="grid place-items-center w-14 h-14 rounded-2xl mb-3"
            style={{ background: 'var(--bg-overlay)', boxShadow: 'inset 0 0 0 1px var(--card-ring)' }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" style={{ color: 'var(--text-faint)' }}>
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
            </svg>
          </span>
          <p className="text-[11.5px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            {hits === null ? (
              <>
                Search a company above to
                <br />
                trace your paths in
              </>
            ) : (
              <>
                No path to that company
                <br />
                in your network yet
              </>
            )}
          </p>
        </div>
      )}
    </div>
  )
}
