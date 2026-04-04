'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase-browser'
import type { Application } from '@/lib/database.types'
import Link from 'next/link'

// ─── Status Configuration ───────────────────────────────────────────────────
const statuses = ['saved', 'queued', 'applied', 'screening', 'interview', 'offer', 'rejected'] as const
type Status = (typeof statuses)[number]

const pipelineStatuses: Status[] = ['saved', 'queued', 'applied', 'screening', 'interview', 'offer']

const statusConfig: Record<Status, { label: string; color: string; gradient: string; icon: React.ReactNode; bg: string }> = {
  saved:     { label: 'Saved',     color: '#8a8a9a', gradient: 'from-gray-500 to-gray-600',     bg: 'rgba(138,138,154,0.10)', icon: <BookmarkIcon /> },
  queued:    { label: 'Queued',    color: '#f0b429', gradient: 'from-yellow-400 to-amber-500',   bg: 'rgba(240,180,41,0.10)',  icon: <ClockIcon /> },
  applied:   { label: 'Applied',   color: '#4c9aff', gradient: 'from-blue-400 to-blue-600',     bg: 'rgba(76,154,255,0.10)',  icon: <SendIcon /> },
  screening: { label: 'Screening', color: '#a78bfa', gradient: 'from-purple-400 to-violet-600', bg: 'rgba(167,139,250,0.10)', icon: <EyeIcon /> },
  interview: { label: 'Interview', color: '#f472b6', gradient: 'from-pink-400 to-rose-500',     bg: 'rgba(244,114,182,0.10)', icon: <MicIcon /> },
  offer:     { label: 'Offer',     color: '#34d399', gradient: 'from-emerald-400 to-green-500',  bg: 'rgba(52,211,153,0.10)',  icon: <TrophyIcon /> },
  rejected:  { label: 'Rejected',  color: '#f87171', gradient: 'from-red-400 to-red-600',       bg: 'rgba(248,113,113,0.10)', icon: <XCircleIcon /> },
}

// ─── SVG Icons ──────────────────────────────────────────────────────────────
function BookmarkIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
}
function ClockIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
}
function SendIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
}
function EyeIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
}
function MicIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
}
function TrophyIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 010-5H6"/><path d="M18 9h1.5a2.5 2.5 0 000-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22"/><path d="M18 2H6v7a6 6 0 0012 0V2z"/></svg>
}
function XCircleIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
}
function KanbanIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="6" height="18" rx="1"/><rect x="9" y="3" width="6" height="10" rx="1"/><rect x="15" y="3" width="6" height="14" rx="1"/></svg>
}
function ListIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
}
function ChevronDownIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
}
function ArrowUpDownIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 15l5 5 5-5"/><path d="M7 9l5-5 5 5"/></svg>
}
function RocketIcon() {
  return <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>
}

// ─── Animated Counter ───────────────────────────────────────────────────────
function AnimatedNumber({ value, delay = 0 }: { value: number; delay?: number }) {
  const [displayed, setDisplayed] = useState(0)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setStarted(true), delay)
    return () => clearTimeout(t)
  }, [delay])

  useEffect(() => {
    if (!started) return
    if (value === 0) { setDisplayed(0); return }
    const duration = 600
    const steps = 20
    const increment = value / steps
    let current = 0
    const interval = setInterval(() => {
      current += increment
      if (current >= value) {
        setDisplayed(value)
        clearInterval(interval)
      } else {
        setDisplayed(Math.floor(current))
      }
    }, duration / steps)
    return () => clearInterval(interval)
  }, [value, started])

  return <>{displayed}</>
}

// ─── Match Score Ring ───────────────────────────────────────────────────────
function MatchRing({ score, color, size = 40 }: { score: number; color: string; size?: number }) {
  const [animatedScore, setAnimatedScore] = useState(0)
  const radius = (size - 6) / 2
  const circumference = 2 * Math.PI * radius

  useEffect(() => {
    const t = setTimeout(() => setAnimatedScore(score), 300)
    return () => clearTimeout(t)
  }, [score])

  const strokeDashoffset = circumference - (animatedScore / 100) * circumference

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth="3" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-white">
        {animatedScore}%
      </span>
    </div>
  )
}

// ─── Days Ago Helper ────────────────────────────────────────────────────────
function daysAgo(dateStr: string | null): string {
  if (!dateStr) return ''
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return '1 day ago'
  return `${diff} days ago`
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Map<string, Application[]>>(new Map())
  const [allApps, setAllApps] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'kanban' | 'list'>('kanban')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'match'>('newest')
  const [mounted, setMounted] = useState(false)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const kanbanScrollRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Drag and drop state
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null)
  const [draggedFromStatus, setDraggedFromStatus] = useState<string | null>(null)
  const [dragSourcePos, setDragSourcePos] = useState<number | null>(null)
  const [dropTargetStatus, setDropTargetStatus] = useState<string | null>(null)
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null)
  const [isSwappingCard, setIsSwappingCard] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    loadApplications()
  }, [])

  // Check scroll position for arrow visibility
  const checkScroll = useCallback(() => {
    if (!kanbanScrollRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = kanbanScrollRef.current
    setCanScrollLeft(scrollLeft > 0)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
  }, [])

  useEffect(() => {
    checkScroll()
    window.addEventListener('resize', checkScroll)
    return () => window.removeEventListener('resize', checkScroll)
  }, [checkScroll])

  const scroll = (direction: 'left' | 'right') => {
    if (!kanbanScrollRef.current) return
    const scrollAmount = 350
    kanbanScrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    })
    setTimeout(checkScroll, 300)
  }

  const loadApplications = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('applications')
      .select('*, job:jobs(*)')
      .eq('user_id', user.id)
      .order('status')
      .order('position', { ascending: true })

    const grouped = new Map<string, Application[]>()
    statuses.forEach(s => grouped.set(s, []))

    if (data) {
      data.forEach(app => {
        const list = grouped.get(app.status) || []
        list.push(app as Application)
        grouped.set(app.status, list)
      })
      setAllApps(data as Application[])
    }

    setApplications(grouped)
    setLoading(false)
  }

  const updateStatus = async (appId: string, newStatus: string) => {
    await supabase.from('applications').update({ status: newStatus, position: 0 }).eq('id', appId)
    await loadApplications()
  }

  const updatePosition = async (appId: string, newPosition: number) => {
    await supabase.from('applications').update({ position: newPosition }).eq('id', appId)
    await loadApplications()
  }

  const askConfirmation = (title: string, message: string): boolean => {
    return confirm(`${title}\n\n${message}`)
  }

  // Drag and drop handlers
  const handleDragStart = useCallback((e: React.DragEvent, appId: string, fromStatus: string, fromPosition: number) => {
    setDraggedCardId(appId)
    setDraggedFromStatus(fromStatus)
    setDragSourcePos(fromPosition)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('appId', appId)
    e.dataTransfer.setData('fromStatus', fromStatus)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const handleDragEnterColumn = useCallback((status: string) => {
    setDropTargetStatus(status)
  }, [])

  const handleDragLeaveColumn = useCallback(() => {
    setDropTargetStatus(null)
    setDropTargetIndex(null)
  }, [])

  const handleDropOnColumn = useCallback(async (e: React.DragEvent, toStatus: string) => {
    e.preventDefault()
    const appId = e.dataTransfer.getData('appId')
    const fromStatus = e.dataTransfer.getData('fromStatus')

    if (!appId || !draggedCardId) {
      setDropTargetStatus(null)
      setDropTargetIndex(null)
      return
    }

    // Cross-column move (status change)
    if (fromStatus !== toStatus) {
      // Check for critical moves that need confirmation
      const criticalMoves = [
        ['screening', 'offer'],
        ['interview', 'offer'],
        ['interview', 'rejected'],
      ]

      const isCritical = criticalMoves.some(
        ([from, to]) => (from === fromStatus && to === toStatus)
      )

      if (isCritical) {
        const confirmed = askConfirmation(
          'Confirm Status Change',
          `Move this application from ${statusConfig[fromStatus as Status].label} to ${statusConfig[toStatus as Status].label}?`
        )
        if (!confirmed) {
          setDropTargetStatus(null)
          setDropTargetIndex(null)
          return
        }
      }

      setIsSwappingCard(true)
      await updateStatus(appId, toStatus)
      setIsSwappingCard(false)
    } else {
      // Same column - just reorder
      // Position will be recalculated based on drop index
      setIsSwappingCard(true)
      await updatePosition(appId, dropTargetIndex ?? dragSourcePos ?? 0)
      setIsSwappingCard(false)
    }

    setDraggedCardId(null)
    setDraggedFromStatus(null)
    setDragSourcePos(null)
    setDropTargetStatus(null)
    setDropTargetIndex(null)
  }, [draggedCardId, dragSourcePos, dropTargetIndex, askConfirmation])

  const handleDragEnd = useCallback(() => {
    setDraggedCardId(null)
    setDraggedFromStatus(null)
    setDragSourcePos(null)
    setDropTargetStatus(null)
    setDropTargetIndex(null)
  }, [])

  // ─── Computed Stats ─────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = allApps.length
    const interviews = allApps.filter(a => ['interview', 'offer'].includes(a.status)).length
    const interviewRate = total > 0 ? Math.round((interviews / total) * 100) : 0
    const appliedApps = allApps.filter(a => a.applied_at)
    const avgResponseDays = appliedApps.length > 0
      ? Math.round(appliedApps.reduce((sum, a) => {
          const applied = new Date(a.applied_at!).getTime()
          const updated = new Date(a.updated_at).getTime()
          return sum + (updated - applied) / 86400000
        }, 0) / appliedApps.length)
      : 0
    return { total, interviewRate, avgResponseDays }
  }, [allApps])

  // ─── Filtered & Sorted for List View ──────────────────────────────────
  const filteredApps = useMemo(() => {
    let apps = [...allApps]
    if (statusFilter !== 'all') {
      apps = apps.filter(a => a.status === statusFilter)
    }
    switch (sortBy) {
      case 'newest': apps.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); break
      case 'oldest': apps.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()); break
      case 'match':  apps.sort((a, b) => (b.match_score ?? 0) - (a.match_score ?? 0)); break
    }
    return apps
  }, [allApps, statusFilter, sortBy])

  const totalCount = allApps.length
  const isEmpty = totalCount === 0 && !loading

  // ─── Pipeline counts ─────────────────────────────────────────────────
  const pipelineCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    pipelineStatuses.forEach(s => counts[s] = (applications.get(s) || []).length)
    return counts
  }, [applications])

  // Determine the "active" pipeline stage (furthest stage with any app)
  const activeStageIndex = useMemo(() => {
    let idx = 0
    pipelineStatuses.forEach((s, i) => { if (pipelineCounts[s] > 0) idx = i })
    return idx
  }, [pipelineCounts])

  if (!mounted) return <div className="p-8" />

  return (
    <div className="space-y-8">
      {/* ─── Inline Styles for Animations ────────────────────────────── */}
      <style>{`
        @keyframes pipelinePulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes gradientFlow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes floatUp {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes rocketBob {
          0%, 100% { transform: translateY(0) rotate(-15deg); }
          50% { transform: translateY(-10px) rotate(-15deg); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .card-hover {
          transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
        }
        .card-hover:hover {
          transform: translateY(-4px) scale(1.02);
        }
        .view-toggle-slider {
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .pipeline-node {
          transition: all 0.4s ease;
        }
        .pipeline-node:hover {
          transform: scale(1.15);
        }
        .list-row {
          transition: background-color 0.2s ease, transform 0.15s ease;
        }
        .list-row:hover {
          background-color: rgba(255,255,255,0.03);
          transform: translateX(4px);
        }
        .status-pill {
          transition: all 0.2s ease;
        }
        .status-pill:hover {
          filter: brightness(1.2);
          transform: scale(1.05);
        }
        .filter-select {
          appearance: none;
          background-image: none;
        }
      `}</style>

      {/* ─── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tight mb-1 bg-gradient-to-r from-white via-white to-gray-400 bg-clip-text text-transparent">
            Application Tracker
          </h2>
          <p className="text-[14px] text-[#6a6a7a]">
            Track your job applications through every stage of the pipeline.
          </p>
        </div>

        {/* View Toggle */}
        {!isEmpty && (
          <div className="relative flex items-center bg-[#0d0d15] border border-[rgba(255,255,255,0.06)] rounded-xl p-1">
            <div
              className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg bg-gradient-to-r from-[rgba(244,114,182,0.15)] to-[rgba(167,139,250,0.15)] border border-[rgba(255,255,255,0.08)] view-toggle-slider"
              style={{ transform: view === 'kanban' ? 'translateX(0)' : 'translateX(calc(100% + 4px))' }}
            />
            <button
              onClick={() => setView('kanban')}
              className={`relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors ${view === 'kanban' ? 'text-white' : 'text-[#5a5a6a] hover:text-[#8a8a9a]'}`}
            >
              <KanbanIcon /> Board
            </button>
            <button
              onClick={() => setView('list')}
              className={`relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors ${view === 'list' ? 'text-white' : 'text-[#5a5a6a] hover:text-[#8a8a9a]'}`}
            >
              <ListIcon /> List
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 rounded-full border-2 border-[rgba(244,114,182,0.3)] border-t-[#f472b6] animate-spin" />
            <span className="text-[13px] text-[#5a5a6a] font-medium">Loading applications...</span>
          </div>
        </div>
      ) : isEmpty ? (
        /* ─── Empty State ────────────────────────────────────────────── */
        <div className="flex flex-col items-center justify-center py-20" style={{ animation: 'floatUp 0.6s ease forwards' }}>
          <div className="relative mb-6">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-pink-500/20 to-purple-500/20 blur-2xl scale-150" />
            <div className="relative text-[#5a5a6a]" style={{ animation: 'rocketBob 3s ease-in-out infinite' }}>
              <RocketIcon />
            </div>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No applications yet</h3>
          <p className="text-[14px] text-[#5a5a6a] mb-6 text-center max-w-sm">
            Start your journey by browsing jobs and adding them to your pipeline. We will track every step.
          </p>
          <Link
            href="/jobs"
            className="px-6 py-2.5 rounded-xl text-[13px] font-bold text-white bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 transition-all shadow-lg shadow-pink-500/20 hover:shadow-pink-500/40 hover:scale-105 active:scale-95"
          >
            Browse Jobs
          </Link>
        </div>
      ) : (
        <>
          {/* ─── Stats Summary ─────────────────────────────────────── */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Applications', value: stats.total, suffix: '', color: '#4c9aff' },
              { label: 'Interview Rate', value: stats.interviewRate, suffix: '%', color: '#f472b6' },
              { label: 'Avg Response Time', value: stats.avgResponseDays, suffix: 'd', color: '#a78bfa' },
            ].map((stat, i) => (
              <div
                key={stat.label}
                className="relative overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#0d0d15] p-5"
                style={{ animation: `floatUp 0.5s ease ${i * 0.1}s both` }}
              >
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r opacity-60" style={{ backgroundImage: `linear-gradient(to right, transparent, ${stat.color}, transparent)` }} />
                <div className="text-[11px] font-semibold text-[#5a5a6a] uppercase tracking-wider mb-2">{stat.label}</div>
                <div className="text-3xl font-black text-white">
                  <AnimatedNumber value={stat.value} delay={i * 150} />{stat.suffix}
                </div>
              </div>
            ))}
          </div>

          {/* ─── Pipeline Funnel ──────────────────────────────────── */}
          <div
            className="relative rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#0d0d15] p-6 overflow-hidden"
            style={{ animation: 'floatUp 0.5s ease 0.2s both' }}
          >
            <div className="absolute inset-0 opacity-30" style={{
              background: 'radial-gradient(ellipse at 50% 0%, rgba(167,139,250,0.1) 0%, transparent 60%)',
            }} />
            <div className="relative flex items-center justify-between">
              {pipelineStatuses.map((status, i) => {
                const config = statusConfig[status]
                const count = pipelineCounts[status]
                const isActive = i <= activeStageIndex
                const isLast = i === pipelineStatuses.length - 1

                return (
                  <div key={status} className="flex items-center flex-1">
                    {/* Node */}
                    <div className="flex flex-col items-center gap-2 pipeline-node cursor-default">
                      <div
                        className="relative flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-500"
                        style={{
                          borderColor: isActive ? config.color : 'rgba(255,255,255,0.08)',
                          background: isActive ? `${config.color}15` : 'rgba(255,255,255,0.02)',
                          boxShadow: isActive ? `0 0 20px ${config.color}25, 0 0 40px ${config.color}10` : 'none',
                        }}
                      >
                        {isActive && (
                          <div
                            className="absolute inset-0 rounded-full"
                            style={{
                              border: `2px solid ${config.color}`,
                              animation: 'pipelinePulse 2s ease-in-out infinite',
                              animationDelay: `${i * 0.2}s`,
                            }}
                          />
                        )}
                        <span className="text-lg font-black" style={{ color: isActive ? config.color : '#3a3a4a' }}>
                          <AnimatedNumber value={count} delay={i * 100 + 400} />
                        </span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span
                          className="text-[10px] font-bold uppercase tracking-wider"
                          style={{ color: isActive ? config.color : '#3a3a4a' }}
                        >
                          {config.label}
                        </span>
                      </div>
                    </div>

                    {/* Connector */}
                    {!isLast && (
                      <div className="flex-1 h-[2px] mx-2 rounded-full overflow-hidden relative">
                        <div
                          className="absolute inset-0 rounded-full"
                          style={{
                            background: i < activeStageIndex
                              ? `linear-gradient(90deg, ${statusConfig[pipelineStatuses[i]].color}, ${statusConfig[pipelineStatuses[i + 1]].color})`
                              : 'rgba(255,255,255,0.06)',
                            backgroundSize: '200% 100%',
                            animation: i < activeStageIndex ? 'gradientFlow 3s ease infinite' : 'none',
                          }}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* ─── Filter Bar ──────────────────────────────────────── */}
          <div
            className="flex items-center gap-3 flex-wrap"
            style={{ animation: 'floatUp 0.5s ease 0.3s both' }}
          >
            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="filter-select pl-3 pr-8 py-2 rounded-xl bg-[#0d0d15] border border-[rgba(255,255,255,0.06)] text-[12px] font-semibold text-white focus:outline-none focus:border-[rgba(167,139,250,0.3)] transition-colors cursor-pointer"
              >
                <option value="all">All Statuses</option>
                {statuses.map(s => (
                  <option key={s} value={s}>{statusConfig[s].label}</option>
                ))}
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#5a5a6a]">
                <ChevronDownIcon />
              </div>
            </div>

            {/* Sort By */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as 'newest' | 'oldest' | 'match')}
                className="filter-select pl-3 pr-8 py-2 rounded-xl bg-[#0d0d15] border border-[rgba(255,255,255,0.06)] text-[12px] font-semibold text-white focus:outline-none focus:border-[rgba(167,139,250,0.3)] transition-colors cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="match">Highest Match</option>
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#5a5a6a]">
                <ChevronDownIcon />
              </div>
            </div>

            <div className="ml-auto text-[11px] text-[#4a4a5a] font-medium">
              {filteredApps.length} application{filteredApps.length !== 1 ? 's' : ''}
            </div>
          </div>

          {/* ─── Kanban Board ────────────────────────────────────── */}
          {view === 'kanban' && (
            <div className="relative" style={{ animation: 'floatUp 0.4s ease 0.35s both' }}>
              {/* Left Arrow */}
              {canScrollLeft && (
                <button
                  onClick={() => scroll('left')}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-[rgba(253,121,168,0.2)] to-[rgba(162,155,254,0.2)] border border-[rgba(255,255,255,0.1)] hover:border-[rgba(253,121,168,0.3)] transition-all hover:scale-110 active:scale-95 group"
                  title="Scroll left"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[#fd79a8] group-hover:text-[#ff9abf] transition-colors">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
              )}

              {/* Right Arrow */}
              {canScrollRight && (
                <button
                  onClick={() => scroll('right')}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-[rgba(162,155,254,0.2)] to-[rgba(116,185,255,0.2)] border border-[rgba(255,255,255,0.1)] hover:border-[rgba(116,185,255,0.3)] transition-all hover:scale-110 active:scale-95 group"
                  title="Scroll right"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[#74b9ff] group-hover:text-[#99d5ff] transition-colors">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              )}

              <div
                ref={kanbanScrollRef}
                onScroll={checkScroll}
                className="overflow-x-auto pb-6 scroll-smooth"
              >
                <div className="flex gap-5 min-w-max">
                {statuses.map((status, colIndex) => {
                  const apps = applications.get(status) || []
                  const config = statusConfig[status]
                  return (
                    <div
                      key={status}
                      className="flex-shrink-0 w-[300px]"
                      style={{ animation: `floatUp 0.4s ease ${0.35 + colIndex * 0.05}s both` }}
                    >
                      {/* Column Header */}
                      <div
                        className="relative mb-4 rounded-xl overflow-hidden transition-all"
                        style={{
                          borderBottom: dropTargetStatus === status ? `2px solid ${config.color}` : 'none',
                          opacity: dropTargetStatus && dropTargetStatus !== status ? 0.5 : 1,
                        }}
                      >
                        <div className="absolute inset-0 opacity-[0.07]" style={{ background: `linear-gradient(180deg, ${config.color}, transparent)` }} />
                        <div className="relative flex items-center gap-2.5 px-4 py-3">
                          <div
                            className="flex items-center justify-center w-7 h-7 rounded-lg"
                            style={{ color: config.color, backgroundColor: config.bg }}
                          >
                            {config.icon}
                          </div>
                          <h3 className="text-[13px] font-bold text-white">
                            {config.label}
                          </h3>
                          <span
                            className="ml-auto text-[11px] font-black px-2.5 py-0.5 rounded-full"
                            style={{ color: config.color, backgroundColor: config.bg }}
                          >
                            {apps.length}
                          </span>
                          {dropTargetStatus === status && draggedFromStatus && draggedFromStatus !== status && (
                            <div className="absolute right-2 -bottom-1 text-[10px] text-[#4a4a5a]">
                              Drop to move →
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Cards */}
                      <div
                        className="space-y-3"
                        onDragOver={handleDragOver}
                        onDragEnter={() => handleDragEnterColumn(status)}
                        onDragLeave={handleDragLeaveColumn}
                        onDrop={(e) => handleDropOnColumn(e, status)}
                        style={{
                          backgroundColor: dropTargetStatus === status ? 'rgba(255,255,255,0.05)' : 'transparent',
                          borderRadius: '0.75rem',
                          padding: '0.75rem',
                          transition: 'background-color 0.2s ease',
                          minHeight: apps.length === 0 ? '180px' : 'auto',
                        }}
                      >
                        {apps.map((app, cardIndex) => (
                          <div
                            key={app.id}
                            draggable={!isSwappingCard}
                            onDragStart={(e) => handleDragStart(e, app.id, status, app.position || cardIndex)}
                            onDragEnd={handleDragEnd}
                            className={`card-hover relative rounded-2xl border border-[rgba(255,255,255,0.06)] p-4 cursor-grab active:cursor-grabbing group transition-all ${
                              draggedCardId === app.id ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
                            }`}
                            style={{
                              background: 'linear-gradient(135deg, rgba(18,18,28,0.9), rgba(13,13,21,0.95))',
                              backdropFilter: 'blur(20px)',
                              animation: `floatUp 0.4s ease ${0.4 + cardIndex * 0.06}s both`,
                            }}
                            onMouseEnter={e => {
                              const el = e.currentTarget
                              el.style.borderColor = `${config.color}30`
                              el.style.boxShadow = `0 8px 32px ${config.color}15, 0 0 0 1px ${config.color}10`
                            }}
                            onMouseLeave={e => {
                              const el = e.currentTarget
                              el.style.borderColor = 'rgba(255,255,255,0.06)'
                              el.style.boxShadow = 'none'
                            }}
                          >
                            <div className="flex items-start gap-3">
                              {/* Company Logo Placeholder */}
                              <div
                                className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-[14px] font-black text-white"
                                style={{
                                  background: `linear-gradient(135deg, ${config.color}40, ${config.color}20)`,
                                  border: `1px solid ${config.color}20`,
                                }}
                              >
                                {(app.job?.company || 'C')[0].toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-[13px] font-bold text-white mb-0.5 line-clamp-2 leading-tight">
                                  {app.job?.title || 'Job Title'}
                                </div>
                                <div className="text-[11px] text-[#6a6a7a] line-clamp-1">
                                  {app.job?.company || 'Company'} {app.job?.location ? `\u00B7 ${app.job.location}` : ''}
                                </div>
                              </div>
                              {/* Match Ring */}
                              {app.match_score != null && (
                                <MatchRing score={app.match_score} color={config.color} />
                              )}
                            </div>

                            {/* Timestamp */}
                            {app.applied_at && (
                              <div className="mt-3 text-[10px] text-[#4a4a5a] font-medium">
                                Applied {daysAgo(app.applied_at)}
                              </div>
                            )}
                            {!app.applied_at && app.created_at && (
                              <div className="mt-3 text-[10px] text-[#4a4a5a] font-medium">
                                Added {daysAgo(app.created_at)}
                              </div>
                            )}

                            {/* Status Control */}
                            {status !== 'rejected' && status !== 'offer' ? (
                              <div className="mt-3 relative">
                                <select
                                  value={status}
                                  onChange={e => updateStatus(app.id, e.target.value)}
                                  className="filter-select w-full text-[11px] font-semibold px-3 py-2 rounded-xl border transition-all cursor-pointer focus:outline-none"
                                  style={{
                                    color: config.color,
                                    backgroundColor: config.bg,
                                    borderColor: `${config.color}20`,
                                  }}
                                >
                                  {statuses.map(s => (
                                    <option key={s} value={s} style={{ backgroundColor: '#12121a', color: '#fff' }}>
                                      {statusConfig[s].label}
                                    </option>
                                  ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: config.color }}>
                                  <ChevronDownIcon />
                                </div>
                              </div>
                            ) : (
                              <div
                                className="mt-3 text-[11px] font-bold px-3 py-2 rounded-xl text-center"
                                style={{ color: config.color, backgroundColor: config.bg }}
                              >
                                {status === 'offer' ? 'Offer Received!' : 'Did not advance'}
                              </div>
                            )}
                          </div>
                        ))}

                        {apps.length === 0 && (
                          <div className="flex flex-col items-center py-10 text-[#3a3a4a]">
                            <div className="w-8 h-8 rounded-full border-2 border-dashed border-[rgba(255,255,255,0.06)] flex items-center justify-center mb-2">
                              <span className="text-[16px] opacity-40">+</span>
                            </div>
                            <div className="text-[11px] font-medium">No applications</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
              </div>
            </div>
          )}

          {/* ─── List View ───────────────────────────────────────── */}
          {view === 'list' && (
            <div
              className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#0d0d15] overflow-hidden"
              style={{ animation: 'floatUp 0.4s ease 0.35s both' }}
            >
              {/* Table Header */}
              <div className="grid grid-cols-[2fr_1.5fr_1fr_0.8fr_0.8fr_1fr] gap-4 px-5 py-3 border-b border-[rgba(255,255,255,0.04)] text-[10px] font-bold uppercase tracking-wider text-[#4a4a5a]">
                <div>Position</div>
                <div>Company</div>
                <div className="flex items-center gap-1 cursor-pointer hover:text-[#8a8a9a] transition-colors" onClick={() => setSortBy('match')}>
                  Match <ArrowUpDownIcon />
                </div>
                <div>Status</div>
                <div className="flex items-center gap-1 cursor-pointer hover:text-[#8a8a9a] transition-colors" onClick={() => setSortBy(sortBy === 'newest' ? 'oldest' : 'newest')}>
                  Date <ArrowUpDownIcon />
                </div>
                <div>Action</div>
              </div>

              {/* Table Rows */}
              {filteredApps.map((app, i) => {
                const config = statusConfig[app.status as Status]
                return (
                  <div
                    key={app.id}
                    className="list-row grid grid-cols-[2fr_1.5fr_1fr_0.8fr_0.8fr_1fr] gap-4 px-5 py-3.5 border-b border-[rgba(255,255,255,0.03)] items-center"
                    style={{ animation: `floatUp 0.3s ease ${i * 0.03}s both` }}
                  >
                    {/* Position */}
                    <div className="flex items-center gap-3">
                      <div
                        className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-[12px] font-black text-white"
                        style={{ background: `linear-gradient(135deg, ${config.color}40, ${config.color}20)` }}
                      >
                        {(app.job?.company || 'C')[0].toUpperCase()}
                      </div>
                      <span className="text-[13px] font-semibold text-white line-clamp-1">
                        {app.job?.title || 'Job Title'}
                      </span>
                    </div>

                    {/* Company */}
                    <div className="text-[12px] text-[#6a6a7a] line-clamp-1">
                      {app.job?.company || 'Company'} {app.job?.location ? `\u00B7 ${app.job.location}` : ''}
                    </div>

                    {/* Match */}
                    <div>
                      {app.match_score != null ? (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-[rgba(255,255,255,0.04)] overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{ width: `${app.match_score}%`, backgroundColor: config.color }}
                            />
                          </div>
                          <span className="text-[11px] font-bold" style={{ color: config.color }}>{app.match_score}%</span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-[#3a3a4a]">--</span>
                      )}
                    </div>

                    {/* Status Pill */}
                    <div>
                      <span
                        className="status-pill inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold cursor-default"
                        style={{ color: config.color, backgroundColor: config.bg }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: config.color }} />
                        {config.label}
                      </span>
                    </div>

                    {/* Date */}
                    <div className="text-[11px] text-[#5a5a6a]">
                      {daysAgo(app.applied_at || app.created_at)}
                    </div>

                    {/* Action */}
                    <div>
                      {app.status !== 'rejected' && app.status !== 'offer' ? (
                        <div className="relative">
                          <select
                            value={app.status}
                            onChange={e => updateStatus(app.id, e.target.value)}
                            className="filter-select w-full text-[10px] font-semibold px-2.5 py-1.5 rounded-lg border cursor-pointer focus:outline-none"
                            style={{
                              color: config.color,
                              backgroundColor: config.bg,
                              borderColor: `${config.color}20`,
                            }}
                          >
                            {statuses.map(s => (
                              <option key={s} value={s} style={{ backgroundColor: '#12121a', color: '#fff' }}>
                                {statusConfig[s].label}
                              </option>
                            ))}
                          </select>
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: config.color }}>
                            <ChevronDownIcon />
                          </div>
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold" style={{ color: config.color }}>
                          {app.status === 'offer' ? 'Offer Received!' : 'Closed'}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}

              {filteredApps.length === 0 && (
                <div className="text-center py-12 text-[#4a4a5a] text-[13px]">
                  No applications match this filter.
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
