'use client'

import { useMemo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import Reveal from '@/components/motion/Reveal'
import { tone, toneA } from '@/lib/tone'

interface TrendLineChartProps {
  applications: any[]
  height?: number
}

const EASE = [0.16, 1, 0.3, 1] as const

export default function TrendLineChart({ applications, height = 280 }: TrendLineChartProps) {
  const reduced = useReducedMotion()

  const chartData = useMemo(() => {
    // Get last 7 days
    const days: Record<string, number> = {}
    const today = new Date()

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      days[dateStr] = 0
    }

    // Count applications per day
    applications.forEach(app => {
      if (app.applied_at) {
        const dateStr = new Date(app.applied_at).toISOString().split('T')[0]
        if (dateStr in days) {
          days[dateStr]++
        }
      }
    })

    return Object.entries(days).map(([date, count]) => ({
      date,
      count,
      label: new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
    }))
  }, [applications])

  // Whole-number ticks that never repeat, however small the counts are.
  const maxCount = Math.max(...chartData.map(d => d.count), 4)
  const tickStep = Math.max(1, Math.ceil(maxCount / 4))
  const tickTop = Math.ceil(maxCount / tickStep) * tickStep
  const ticks = Array.from({ length: tickTop / tickStep + 1 }, (_, i) => i * tickStep)
  const padding = { top: 20, right: 20, bottom: 40, left: 50 }
  const chartHeight = height - padding.top - padding.bottom
  const chartWidth = 320 - padding.left - padding.right
  const pointSpacing = chartWidth / (chartData.length - 1)

  const coords = chartData.map((d, i) => ({
    x: padding.left + i * pointSpacing,
    y: padding.top + (1 - d.count / tickTop) * chartHeight,
  }))
  const lineD = coords.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaD = `M ${padding.left} ${padding.top + chartHeight} ${coords.map(p => `L ${p.x} ${p.y}`).join(' ')} L ${coords[coords.length - 1].x} ${padding.top + chartHeight} Z`

  const t = 'blue' as const
  const draw = reduced ? 0 : 1.1

  return (
    <Reveal effect="scale" amount={0.12}>
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-6">
        <h3 className="text-[14px] font-bold text-ink mb-4">7-Day Trend</h3>

        <svg width="100%" height={height} viewBox={`0 0 320 ${height}`} className="overflow-visible">
          {/* Y-axis */}
          <line x1={padding.left - 5} y1={padding.top} x2={padding.left - 5} y2={height - padding.bottom} stroke="var(--bg-overlay)" strokeWidth="1" />

          {/* X-axis */}
          <line x1={padding.left - 5} y1={height - padding.bottom} x2={320 - padding.right} y2={height - padding.bottom} stroke="var(--bg-overlay)" strokeWidth="1" />

          {/* Y-axis grid lines and labels */}
          {ticks.map((value, i) => {
            const y = padding.top + (1 - value / tickTop) * chartHeight
            return (
              <g key={`grid-${i}`}>
                <line x1={padding.left - 5} y1={y} x2={320 - padding.right} y2={y} stroke="var(--bg-overlay)" strokeWidth="1" strokeDasharray="4,4" />
                <text x={padding.left - 10} y={y + 4} fontSize="11" fill="var(--text-faint)" textAnchor="end" dominantBaseline="middle">
                  {value}
                </text>
              </g>
            )
          })}

          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={tone(t)} stopOpacity="0.3" />
              <stop offset="100%" stopColor={tone(t)} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Area under the line: fades in once the line has drawn */}
          <motion.path
            d={areaD}
            fill="url(#lineGradient)"
            initial={{ opacity: reduced ? 1 : 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: draw * 0.7, ease: 'easeOut' }}
          />

          {/* Line: draws left to right */}
          <motion.path
            d={lineD}
            fill="none"
            stroke={tone(t)}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: reduced ? 1 : 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: draw, ease: EASE }}
            style={{ filter: `drop-shadow(0 0 4px ${toneA(t, 0.35)})` }}
          />

          {/* Data points */}
          {chartData.map((d, i) => {
            const { x, y } = coords[i]
            const delay = reduced ? 0 : (i / Math.max(chartData.length - 1, 1)) * draw
            return (
              <motion.g
                key={`point-${i}`}
                initial={{ opacity: reduced ? 1 : 0, scale: reduced ? 1 : 0.4 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={reduced ? undefined : { scale: 1.4 }}
                transition={{ duration: 0.4, delay, ease: EASE }}
                style={{ transformOrigin: `${x}px ${y}px`, transformBox: 'view-box' as any }}
              >
                <circle cx={x} cy={y} r="7" fill={toneA(t, 0.25)} />
                <circle cx={x} cy={y} r="4" fill={tone(t)} style={{ filter: `drop-shadow(0 0 6px ${toneA(t, 0.5)})` }} />
                <circle cx={x} cy={y} r="4" fill="none" stroke={tone(t)} strokeWidth="2" opacity="0.3" />

                {/* Value label on hover via title */}
                <title>{d.label}: {d.count} applications</title>

                {/* Always show value for non-zero points */}
                {d.count > 0 && (
                  <text x={x} y={y - 12} fontSize="11" fill={tone(t)} textAnchor="middle" fontWeight="bold">
                    {d.count}
                  </text>
                )}
              </motion.g>
            )
          })}

          {/* X-axis labels */}
          {chartData.map((d, i) => {
            const x = padding.left + i * pointSpacing
            return (
              <text key={`label-${i}`} x={x} y={height - padding.bottom + 20} fontSize="11" fill="var(--text-faint)" textAnchor="middle">
                {d.label.split(' ')[0].replace(/,$/, '')}
              </text>
            )
          })}
        </svg>
      </div>
    </Reveal>
  )
}
