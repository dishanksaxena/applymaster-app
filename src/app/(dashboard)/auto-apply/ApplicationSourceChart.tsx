'use client'

import { useMemo } from 'react'

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
  'Lever': '#1f2532',
  'default': '#74b9ff',
}

export default function ApplicationSourceChart({ applications, height = 280 }: ApplicationSourceChartProps) {
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
        className="flex items-center justify-center rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#0d0d15]"
        style={{ height }}
      >
        <p className="text-[13px] text-[#4a4a5a]">No application data available</p>
      </div>
    )
  }

  const maxCount = Math.max(...chartData.map(d => d.count))
  const padding = { top: 20, right: 20, bottom: 40, left: 50 }
  const chartHeight = height - padding.top - padding.bottom
  const chartWidth = 300 - padding.left - padding.right
  const barWidth = chartWidth / chartData.length
  const barGap = barWidth * 0.2

  return (
    <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#0d0d15] p-6">
      <h3 className="text-[14px] font-bold text-white mb-4">Applications by Source</h3>

      <svg width="100%" height={height} viewBox={`0 0 300 ${height}`} className="overflow-visible">
        {/* Y-axis */}
        <line
          x1={padding.left - 5}
          y1={padding.top}
          x2={padding.left - 5}
          y2={height - padding.bottom}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="1"
        />

        {/* X-axis */}
        <line
          x1={padding.left - 5}
          y1={height - padding.bottom}
          x2={300 - padding.right}
          y2={height - padding.bottom}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="1"
        />

        {/* Y-axis grid lines and labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const y = padding.top + (1 - ratio) * chartHeight
          const value = Math.round(ratio * maxCount)
          return (
            <g key={`grid-${i}`}>
              <line
                x1={padding.left - 5}
                y1={y}
                x2={300 - padding.right}
                y2={y}
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="1"
                strokeDasharray="4,4"
              />
              <text
                x={padding.left - 10}
                y={y + 4}
                fontSize="11"
                fill="#5a5a6a"
                textAnchor="end"
                dominantBaseline="middle"
              >
                {value}
              </text>
            </g>
          )
        })}

        {/* Bars */}
        {chartData.map((item, idx) => {
          const barHeight = (item.count / maxCount) * chartHeight
          const x = padding.left + idx * barWidth + (barWidth - (barWidth - barGap)) / 2
          const y = padding.top + (chartHeight - barHeight)

          return (
            <g key={item.source}>
              {/* Bar with gradient */}
              <defs>
                <linearGradient id={`grad-${idx}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={item.color} stopOpacity="0.9" />
                  <stop offset="100%" stopColor={item.color} stopOpacity="0.5" />
                </linearGradient>
              </defs>
              <rect
                x={x}
                y={y}
                width={barWidth - barGap}
                height={barHeight}
                fill={`url(#grad-${idx})`}
                rx="4"
                style={{
                  transition: 'opacity 0.3s ease',
                  opacity: 0.85,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.85')}
              />

              {/* Value label on top of bar */}
              <text
                x={x + (barWidth - barGap) / 2}
                y={y - 5}
                fontSize="11"
                fill="white"
                textAnchor="middle"
                fontWeight="bold"
              >
                {item.count}
              </text>

              {/* X-axis label */}
              <text
                x={x + (barWidth - barGap) / 2}
                y={height - padding.bottom + 20}
                fontSize="11"
                fill="#6a6a7a"
                textAnchor="middle"
              >
                {item.source.length > 10 ? item.source.substring(0, 7) + '...' : item.source}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
