'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import Reveal from '@/components/motion/Reveal'

interface SuccessDonutChartProps {
  applications: any[]
  height?: number
}

const EASE = [0.16, 1, 0.3, 1] as const

function CountUp({ value, duration = 1100 }: { value: number; duration?: number }) {
  const reduced = useReducedMotion()
  const [n, setN] = useState(reduced ? value : 0)
  useEffect(() => {
    if (reduced) { setN(value); return }
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      setN(Math.round(value * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, duration, reduced])
  return <>{n}</>
}

export default function SuccessDonutChart({ applications, height = 280 }: SuccessDonutChartProps) {
  const reduced = useReducedMotion()

  const chartData = useMemo(() => {
    const total = applications.length
    if (total === 0) return null

    const interviewed = applications.filter(a => ['interview', 'offer'].includes(a.status)).length
    const applied = applications.filter(a => a.applied_at).length
    const saved = applications.filter(a => a.status === 'saved' && !a.applied_at).length
    const rejected = applications.filter(a => a.status === 'rejected').length

    return {
      total,
      interviewed,
      applied: applied - interviewed,
      saved,
      rejected,
      interviewRate: total > 0 ? Math.round((interviewed / total) * 100) : 0,
    }
  }, [applications])

  if (!chartData) {
    return (
      <div
        className="flex items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--bg)]"
        style={{ height }}
      >
        <p className="text-[13px] text-[var(--text-faint)]">No data</p>
      </div>
    )
  }

  const centerX = 160
  const centerY = height / 2
  const radius = 60
  const donutWidth = 14
  const ringR = radius - donutWidth / 2

  const total = chartData.interviewed + chartData.applied + chartData.saved + chartData.rejected

  const slices = [
    { label: 'Interview/Offer', value: chartData.interviewed, color: 'var(--accent)', rgb: '--accent-rgb', percentage: Math.round((chartData.interviewed / total) * 100) },
    { label: 'Applied', value: chartData.applied, color: 'var(--blue)', rgb: '--blue-rgb', percentage: Math.round((chartData.applied / total) * 100) },
    { label: 'Saved', value: chartData.saved, color: 'var(--purple)', rgb: '--purple-rgb', percentage: Math.round((chartData.saved / total) * 100) },
    { label: 'Rejected', value: chartData.rejected, color: 'var(--red)', rgb: '--red-rgb', percentage: Math.round((chartData.rejected / total) * 100) },
  ].filter(s => s.value > 0)

  // Each segment is a stroked arc on the same circle; pathOffset places it
  // where the previous one ended, pathLength is its share of the ring.
  let cursor = 0
  const segments = slices.map(slice => {
    const frac = slice.value / total
    const start = cursor
    cursor += frac
    const labelAngle = -Math.PI / 2 + (start + frac / 2) * 2 * Math.PI
    const labelRadius = ringR
    return {
      ...slice,
      frac,
      start,
      labelX: centerX + Math.cos(labelAngle) * labelRadius,
      labelY: centerY + Math.sin(labelAngle) * labelRadius,
    }
  })

  const segDur = reduced ? 0 : 0.7
  const totalDraw = segDur * segments.length

  return (
    <Reveal effect="scale" amount={0.12}>
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-6">
        <h3 className="text-[14px] font-bold text-ink mb-4">Success Breakdown</h3>

        <div className="flex flex-wrap items-center gap-6">
          <svg viewBox={`0 0 320 ${height}`} className="w-full max-w-[260px] h-auto flex-shrink-0 overflow-visible">
            {/* Faint glow behind the ring */}
            <circle
              cx={centerX}
              cy={centerY}
              r={ringR}
              fill="none"
              stroke="rgb(var(--accent-rgb) / 0.18)"
              strokeWidth={donutWidth + 10}
              style={{ filter: 'blur(10px)' }}
            />
            {/* Track */}
            <circle cx={centerX} cy={centerY} r={ringR} fill="none" stroke="var(--bg-overlay)" strokeWidth={donutWidth} />

            {/* Segments draw in sequence, clockwise from the top */}
            <g transform={`rotate(-90 ${centerX} ${centerY})`}>
              {segments.map((s, i) => (
                <motion.circle
                  key={`slice-${i}`}
                  cx={centerX}
                  cy={centerY}
                  r={ringR}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={donutWidth}
                  strokeLinecap="butt"
                  initial={{ pathLength: reduced ? s.frac : 0, pathOffset: s.start, opacity: 0.85 }}
                  animate={{ pathLength: s.frac, pathOffset: s.start, opacity: 0.85 }}
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: segDur, delay: i * segDur, ease: EASE }}
                  style={{ filter: `drop-shadow(0 0 6px rgb(var(${s.rgb}) / 0.45))` }}
                />
              ))}
            </g>

            {/* Center text - interview rate */}
            <text x={centerX} y={centerY - 8} fontSize="24" fontWeight="bold" fill="var(--blue)" textAnchor="middle" dominantBaseline="middle">
              <CountUp value={chartData.interviewRate} />%
            </text>
            <text x={centerX} y={centerY + 12} fontSize="11" fill="var(--text-faint)" textAnchor="middle">
              Interview Rate
            </text>

            {/* Labels on slices */}
            {segments.filter(s => s.percentage >= 12).map((s, i) => (
              <motion.text
                key={`label-${i}`}
                x={s.labelX}
                y={s.labelY}
                fontSize="9"
                fontWeight="bold"
                fill="white"
                style={{ paintOrder: 'stroke', stroke: 'rgb(0 0 0 / 0.25)', strokeWidth: 2 }}
                textAnchor="middle"
                dominantBaseline="middle"
                initial={{ opacity: reduced ? 1 : 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: totalDraw }}
              >
                {s.percentage}%
              </motion.text>
            ))}
          </svg>

          {/* Legend */}
          <div className="space-y-3 min-w-0">
            {slices.map((slice, i) => (
              <div key={i} className="group flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: slice.color, boxShadow: `0 0 0 0 rgb(var(${slice.rgb}) / 0.4)`, transition: 'box-shadow 0.3s ease' }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 0 0 4px rgb(var(${slice.rgb}) / 0.22), 0 0 10px rgb(var(${slice.rgb}) / 0.5)` }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = `0 0 0 0 rgb(var(${slice.rgb}) / 0.4)` }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-ink truncate">{slice.label}</p>
                  <p className="text-[11px] text-[var(--text-faint)]">
                    {slice.value} ({slice.percentage}%)
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Reveal>
  )
}
