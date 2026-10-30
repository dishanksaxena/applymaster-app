'use client'

import { useMemo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import Reveal from '@/components/motion/Reveal'
import { withAlpha } from '@/lib/tone'

interface SourceData {
  source: string
  count: number
  color: string
}

interface ApplicationSourceChartProps {
  applications: any[]
  height?: number
}

const SOURCE_COLORS: Record<string, string> = {
  'LinkedIn': '#0077b5',
  'Indeed': '#2164f3',
  'Glassdoor': '#0caa41',
  'ZipRecruiter': '#5ba71b',
  'Greenhouse': '#3ab549',
  'Lever': 'var(--purple)',
  'default': 'var(--blue)',
}

const EASE = [0.16, 1, 0.3, 1] as const

export default function ApplicationSourceChart({ applications, height = 280 }: ApplicationSourceChartProps) {
  const reduced = useReducedMotion()

  const chartData = useMemo(() => {
    const grouped: Record<string, number> = {}

    applications.forEach(app => {
      const source = app.job?.source || 'Unknown'
      grouped[source] = (grouped[source] || 0) + 1
    })

    const data: SourceData[] = Object.entries(grouped)
      .map(([source, count]) => ({
        source,
        count,
        color: SOURCE_COLORS[source] || SOURCE_COLORS['default'],
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6) // Top 6 sources

    return data
  }, [applications])

  if (chartData.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--bg)]"
        style={{ height }}
      >
        <p className="text-[13px] text-[var(--text-faint)]">No application data available</p>
      </div>
    )
  }

  // Whole-number ticks that never repeat, however small the counts are.
  const maxCount = Math.max(...chartData.map(d => d.count), 1)
  const tickStep = Math.max(1, Math.ceil(maxCount / 4))
  const tickTop = Math.ceil(maxCount / tickStep) * tickStep
  const ticks = Array.from({ length: tickTop / tickStep + 1 }, (_, i) => i * tickStep)
  const padding = { top: 20, right: 20, bottom: 40, left: 50 }
  const chartHeight = height - padding.top - padding.bottom
  const chartWidth = 300 - padding.left - padding.right
  const barWidth = chartWidth / chartData.length
  const barGap = barWidth * 0.2
  const baseline = padding.top + chartHeight

  return (
    <Reveal effect="scale" amount={0.12}>
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-6">
        <h3 className="text-[14px] font-bold text-ink mb-4">Applications by Source</h3>

        <svg width="100%" height={height} viewBox={`0 0 300 ${height}`} className="overflow-visible">
          {/* Y-axis */}
          <line x1={padding.left - 5} y1={padding.top} x2={padding.left - 5} y2={height - padding.bottom} stroke="var(--bg-overlay)" strokeWidth="1" />

          {/* X-axis */}
          <line x1={padding.left - 5} y1={height - padding.bottom} x2={300 - padding.right} y2={height - padding.bottom} stroke="var(--bg-overlay)" strokeWidth="1" />

          {/* Y-axis grid lines and labels */}
          {ticks.map((value, i) => {
            const y = padding.top + (1 - value / tickTop) * chartHeight
            return (
              <g key={`grid-${i}`}>
                <line x1={padding.left - 5} y1={y} x2={300 - padding.right} y2={y} stroke="var(--bg-overlay)" strokeWidth="1" strokeDasharray="4,4" />
                <text x={padding.left - 10} y={y + 4} fontSize="11" fill="var(--text-faint)" textAnchor="end" dominantBaseline="middle">
                  {value}
                </text>
              </g>
            )
          })}

          {/* Bars */}
          {chartData.map((item, idx) => {
            const barHeight = (item.count / tickTop) * chartHeight
            const w = barWidth - barGap
            const x = padding.left + idx * barWidth + barGap / 2
            const y = baseline - barHeight
            const delay = reduced ? 0 : idx * 0.06
            // Rounded top only: the base sits flat on the axis.
            const r = Math.min(5, w / 2)
            const d = `M ${x} ${baseline} V ${y + r} Q ${x} ${y} ${x + r} ${y} H ${x + w - r} Q ${x + w} ${y} ${x + w} ${y + r} V ${baseline} Z`

            return (
              <g key={item.source}>
                <defs>
                  <linearGradient id={`grad-${idx}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={item.color} stopOpacity="1" />
                    <stop offset="100%" stopColor={withAlpha(item.color, 0.55)} />
                  </linearGradient>
                </defs>
                <motion.path
                  d={d}
                  fill={`url(#grad-${idx})`}
                  initial={reduced ? { scaleY: 1, opacity: 0.85 } : { scaleY: 0, opacity: 0.85 }}
                  animate={{ scaleY: 1, opacity: 0.85 }}
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay, ease: EASE }}
                  style={{
                    transformOrigin: `${x + w / 2}px ${baseline}px`,
                    transformBox: 'view-box' as any,
                    filter: `drop-shadow(0 6px 10px ${withAlpha(item.color, 0.25)})`,
                  }}
                />

                {/* Value label on top of bar */}
                <motion.text
                  x={x + w / 2}
                  y={y - 6}
                  fontSize="11"
                  fill="var(--text-secondary)"
                  textAnchor="middle"
                  fontWeight="bold"
                  initial={{ opacity: reduced ? 1 : 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.35, delay: delay + 0.6 }}
                >
                  {item.count}
                </motion.text>

                {/* X-axis label */}
                <text x={x + w / 2} y={height - padding.bottom + 20} fontSize="11" fill="var(--text-faint)" textAnchor="middle">
                  {item.source.length > 10 ? item.source.substring(0, 7) + '...' : item.source}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
    </Reveal>
  )
}
