'use client'

import { useMemo } from 'react'

interface SuccessDonutChartProps {
  applications: any[]
  height?: number
}

export default function SuccessDonutChart({ applications, height = 280 }: SuccessDonutChartProps) {
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
        className="flex items-center justify-center rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#0d0d15]"
        style={{ height }}
      >
        <p className="text-[13px] text-[#4a4a5a]">No data</p>
      </div>
    )
  }

  const centerX = 160
  const centerY = height / 2
  const radius = 60
  const donutWidth = 14

  // Calculate angles for each slice
  const total = chartData.interviewed + chartData.applied + chartData.saved + chartData.rejected
  let currentAngle = -Math.PI / 2

  const slices = [
    { label: 'Interview/Offer', value: chartData.interviewed, color: '#f472b6', percentage: Math.round((chartData.interviewed / total) * 100) },
    { label: 'Applied', value: chartData.applied, color: '#74b9ff', percentage: Math.round((chartData.applied / total) * 100) },
    { label: 'Saved', value: chartData.saved, color: '#a78bfa', percentage: Math.round((chartData.saved / total) * 100) },
    { label: 'Rejected', value: chartData.rejected, color: '#f87171', percentage: Math.round((chartData.rejected / total) * 100) },
  ].filter(s => s.value > 0)

  const paths = slices.map((slice, idx) => {
    const sliceAngle = (slice.value / total) * (2 * Math.PI)
    const endAngle = currentAngle + sliceAngle

    // Calculate path for donut slice
    const x1 = centerX + Math.cos(currentAngle) * radius
    const y1 = centerY + Math.sin(currentAngle) * radius
    const x2 = centerX + Math.cos(endAngle) * radius
    const y2 = centerY + Math.sin(endAngle) * radius

    const x3 = centerX + Math.cos(endAngle) * (radius - donutWidth)
    const y3 = centerY + Math.sin(endAngle) * (radius - donutWidth)
    const x4 = centerX + Math.cos(currentAngle) * (radius - donutWidth)
    const y4 = centerY + Math.sin(currentAngle) * (radius - donutWidth)

    const largeArc = sliceAngle > Math.PI ? 1 : 0
    const path = `
      M ${x1} ${y1}
      A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}
      L ${x3} ${y3}
      A ${radius - donutWidth} ${radius - donutWidth} 0 ${largeArc} 0 ${x4} ${y4}
      Z
    `

    const labelAngle = currentAngle + sliceAngle / 2
    const labelRadius = radius - donutWidth / 2 - 15
    const labelX = centerX + Math.cos(labelAngle) * labelRadius
    const labelY = centerY + Math.sin(labelAngle) * labelRadius

    currentAngle = endAngle

    return {
      path,
      color: slice.color,
      labelX,
      labelY,
      percentage: slice.percentage,
      label: slice.label,
      value: slice.value,
    }
  })

  return (
    <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#0d0d15] p-6">
      <h3 className="text-[14px] font-bold text-white mb-4">Success Breakdown</h3>

      <div className="flex items-center gap-6">
        <svg width={320} height={height} viewBox={`0 0 320 ${height}`} className="flex-shrink-0">
          {/* Donut slices */}
          {paths.map((p, i) => (
            <path
              key={`slice-${i}`}
              d={p.path}
              fill={p.color}
              opacity="0.85"
              style={{
                transition: 'opacity 0.3s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.85')}
            />
          ))}

          {/* Center circle (for donut hole) */}
          <circle cx={centerX} cy={centerY} r={radius - donutWidth} fill="#0d0d15" />

          {/* Center text - interview rate */}
          <text
            x={centerX}
            y={centerY - 8}
            fontSize="24"
            fontWeight="bold"
            fill="#74b9ff"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {chartData.interviewRate}%
          </text>
          <text
            x={centerX}
            y={centerY + 12}
            fontSize="11"
            fill="#6a6a7a"
            textAnchor="middle"
          >
            Interview Rate
          </text>

          {/* Labels on slices */}
          {paths.map((p, i) => (
            <text
              key={`label-${i}`}
              x={p.labelX}
              y={p.labelY}
              fontSize="11"
              fontWeight="bold"
              fill="white"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {p.percentage}%
            </text>
          ))}
        </svg>

        {/* Legend */}
        <div className="space-y-3">
          {slices.map((slice, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: slice.color }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-white truncate">{slice.label}</p>
                <p className="text-[11px] text-[#5a5a6a]">
                  {slice.value} ({slice.percentage}%)
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
