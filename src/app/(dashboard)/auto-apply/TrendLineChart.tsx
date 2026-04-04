'use client'

import { useMemo } from 'react'

interface TrendLineChartProps {
  applications: any[]
  height?: number
}

export default function TrendLineChart({ applications, height = 280 }: TrendLineChartProps) {
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

  const maxCount = Math.max(...chartData.map(d => d.count), 5)
  const padding = { top: 20, right: 20, bottom: 40, left: 50 }
  const chartHeight = height - padding.top - padding.bottom
  const chartWidth = 320 - padding.left - padding.right
  const pointSpacing = chartWidth / (chartData.length - 1)

  // Generate polyline points for the line
  const points = chartData
    .map((d, i) => {
      const x = padding.left + i * pointSpacing
      const y = padding.top + (1 - d.count / maxCount) * chartHeight
      return `${x},${y}`
    })
    .join(' ')

  return (
    <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#0d0d15] p-6">
      <h3 className="text-[14px] font-bold text-white mb-4">7-Day Trend</h3>

      <svg width="100%" height={height} viewBox={`0 0 320 ${height}`} className="overflow-visible">
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
          x2={320 - padding.right}
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
                x2={320 - padding.right}
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

        {/* Line with gradient fill */}
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#74b9ff" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#74b9ff" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Area under the line */}
        <path
          d={`M ${padding.left} ${padding.top + chartHeight} L ${points} L ${padding.left + (chartData.length - 1) * pointSpacing} ${padding.top + chartHeight} Z`}
          fill="url(#lineGradient)"
        />

        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke="#74b9ff"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points (circles) */}
        {chartData.map((d, i) => {
          const x = padding.left + i * pointSpacing
          const y = padding.top + (1 - d.count / maxCount) * chartHeight
          return (
            <g key={`point-${i}`}>
              <circle
                cx={x}
                cy={y}
                r="4"
                fill="#74b9ff"
                opacity="0.8"
              />
              <circle
                cx={x}
                cy={y}
                r="4"
                fill="none"
                stroke="#74b9ff"
                strokeWidth="2"
                opacity="0.3"
              />

              {/* Value label on hover via title */}
              <title>{d.label}: {d.count} applications</title>

              {/* Always show value for non-zero points */}
              {d.count > 0 && (
                <text
                  x={x}
                  y={y - 10}
                  fontSize="11"
                  fill="#74b9ff"
                  textAnchor="middle"
                  fontWeight="bold"
                >
                  {d.count}
                </text>
              )}
            </g>
          )
        })}

        {/* X-axis labels */}
        {chartData.map((d, i) => {
          const x = padding.left + i * pointSpacing
          return (
            <text
              key={`label-${i}`}
              x={x}
              y={height - padding.bottom + 20}
              fontSize="11"
              fill="#6a6a7a"
              textAnchor="middle"
            >
              {d.label.split(' ')[0]}
            </text>
          )
        })}
      </svg>
    </div>
  )
}
