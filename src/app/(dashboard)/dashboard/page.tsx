'use client'

import { useEffect, useState, useId, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase-browser'
import Link from 'next/link'
import { PremiumCard } from '@/components/premium'
import { staggerContainer, fadeInUp } from '@/lib/animations'
import { tone, toneA, toneSurface, type Tone } from '@/lib/tone'

/* ============================================================
   Trend maths

   Every series on this page is derived from the user's own rows.
   There is no sample data: an account with three applications
   shows a three-point line, not a decorative curve.
   ============================================================ */

const WEEKS = 8
const WEEK_MS = 7 * 86400000

type AppRow = {
  status: string
  match_score: number | null
  created_at: string
  applied_at: string | null
}

/** Index 0 is the oldest week in the window, index WEEKS-1 is this week. */
function weekIndex(iso: string, now: number): number | null {
  const age = now - new Date(iso).getTime()
  if (age < 0) return WEEKS - 1
  const i = WEEKS - 1 - Math.floor(age / WEEK_MS)
  return i < 0 ? null : i
}

function bucket(rows: AppRow[], dateOf: (r: AppRow) => string | null, now: number) {
  const out: number[] = new Array(WEEKS).fill(0)
  for (const r of rows) {
    const d = dateOf(r)
    if (!d) continue
    const i = weekIndex(d, now)
    if (i !== null) out[i] += 1
  }
  return out
}

/** Running total, so a cumulative metric reads as growth rather than noise. */
function cumulative(weekly: number[], base = 0) {
  let run = base
  return weekly.map(v => (run += v))
}

/* ============================================================
   Pieces
   ============================================================ */

function AnimatedNumber({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplay(value)
      return
    }
    const start = Date.now()
    let raf = 0
    const tick = () => {
      const p = Math.min((Date.now() - start) / 900, 1)
      setDisplay(Math.round(value * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(raf)
  }, [value])
  return (
    <span style={{ fontVariantNumeric: 'tabular-nums' }}>
      {display}
      {suffix}
    </span>
  )
}

/**
 * Full-bleed area chart that sits under the metric as its ground.
 *
 * preserveAspectRatio="none" lets one viewBox stretch to any card width;
 * non-scaling-stroke stops that stretch from distorting the line.
 */
function TrendArea({ data, t, height = 56 }: { data: number[]; t: Tone; height?: number }) {
  const uid = useId().replace(/:/g, '')
  const gradId = `trend-${uid}`

  const max = Math.max(...data)
  const min = Math.min(...data)
  const w = 100
  const h = 40

  /* A series with no variation — a brand-new account, or a metric that has
     not moved — has nowhere to plot. Left to the normal maths it flattens
     onto the baseline, where a 1.75px stroke across the full width reads as
     a border stripe rather than a chart. Sitting it above the floor keeps
     the area fill visible and the shape honest: flat is flat. */
  const flat = max === min
  const range = max - min || 1

  const pts = data.map((v, i) => ({
    x: data.length === 1 ? w : (i / (data.length - 1)) * w,
    y: flat ? h * 0.52 : h - ((v - min) / range) * (h - 10) - 5,
  }))
  const line = pts.map(p => `${p.x},${p.y}`).join(' ')
  const last = pts[pts.length - 1]

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      width="100%"
      height={height}
      className="block"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" style={{ stopColor: tone(t), stopOpacity: 0.28 }} />
          <stop offset="100%" style={{ stopColor: tone(t), stopOpacity: 0 }} />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${line} ${w},${h}`} fill={`url(#${gradId})`} />
      <motion.polyline
        fill="none"
        style={{ stroke: tone(t) }}
        strokeWidth="1.75"
        vectorEffect="non-scaling-stroke"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        points={line}
      />
      <circle cx={last.x} cy={last.y} r="2.4" style={{ fill: tone(t) }} vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

/** Change against the previous week. Direction is stated, not only coloured. */
function Delta({ value, t }: { value: number; t: Tone }) {
  if (value === 0) {
    return (
      <span className="text-[11px] font-medium" style={{ color: 'var(--text-faint)' }}>
        No change this week
      </span>
    )
  }
  const up = value > 0
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-[3px] rounded-full text-[11px] font-semibold"
      style={{
        background: up ? toneSurface(t, 0.12) : 'var(--bg-overlay)',
        color: up ? tone(t) : 'var(--text-muted)',
      }}
    >
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
        {up ? <path d="M12 19V5M5 12l7-7 7 7" /> : <path d="M12 5v14M19 12l-7 7-7-7" />}
      </svg>
      {up ? '+' : ''}
      {value} this week
    </span>
  )
}

function StatCard({
  label,
  value,
  suffix,
  t,
  series,
  delta,
  icon,
  index,
}: {
  label: string
  value: number
  suffix?: string
  t: Tone
  series: number[]
  delta: number
  icon: React.ReactNode
  index: number
}) {
  return (
    <PremiumCard
      accent={t === 'accent' ? 'pink' : t}
      glowEffect
      hover={false}
      animationDelay={index * 0.06}
    >
      <div className="pt-4 px-4">
        <div className="flex items-center gap-2 mb-3">
          <span
            className="grid place-items-center w-7 h-7 rounded-lg shrink-0"
            style={{ background: toneSurface(t, 0.13), color: tone(t) }}
          >
            {icon}
          </span>
          <span
            className="text-[10.5px] font-semibold uppercase tracking-[0.07em] truncate"
            style={{ color: 'var(--text-muted)' }}
          >
            {label}
          </span>
        </div>
        <div className="font-display leading-none text-[2.4rem]" style={{ color: 'var(--text)' }}>
          <AnimatedNumber value={value} suffix={suffix} />
        </div>
        <div className="mt-2 mb-1">
          <Delta value={delta} t={t} />
        </div>
      </div>
      {/* The chart runs to the card edge: it is the ground the number stands on. */}
      <TrendArea data={series} t={t} />
    </PremiumCard>
  )
}

function ActivityFeed({
  activities,
}: {
  activities: { action: string; details: string | null; created_at: string }[]
}) {
  return (
    <PremiumCard accent="none" hover={false}>
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div>
          <h2 className="font-display text-[1.25rem] leading-tight" style={{ color: 'var(--text)' }}>
            Activity
          </h2>
          <p className="text-[11.5px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Everything ApplyMaster did for you
          </p>
        </div>
        <span
          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider"
          style={{ background: toneSurface('green', 0.12), color: tone('green') }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'currentColor' }} />
          Live
        </span>
      </div>

      <div className="max-h-[340px] overflow-y-auto px-2 pb-3">
        {activities.length === 0 ? (
          <div className="px-3 py-10 text-center">
            <p className="text-[13px] mb-1" style={{ color: 'var(--text)' }}>
              Nothing yet
            </p>
            <p className="text-[12px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Upload a resume and this fills up as we search, tailor and apply.
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {activities.map((log, i) => (
              <motion.div
                key={`${log.created_at}-${i}`}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
                className="flex gap-3 px-3 py-2.5 rounded-xl"
              >
                <span
                  className="mt-[5px] w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: toneA('accent', 0.55) }}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] leading-snug" style={{ color: 'var(--text)' }}>
                    {log.action}
                  </p>
                  {log.details && (
                    <p className="text-[11.5px] leading-snug mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                      {log.details}
                    </p>
                  )}
                </div>
                <time
                  className="text-[10.5px] shrink-0 mt-[2px] tabular-nums"
                  style={{ color: 'var(--text-faint)' }}
                  dateTime={log.created_at}
                >
                  {new Date(log.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </time>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </PremiumCard>
  )
}

/* ============================================================
   Page
   ============================================================ */

const ICONS = {
  send: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
    </svg>
  ),
  mic: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3zM19 10v2a7 7 0 01-14 0v-2" />
    </svg>
  ),
  trophy: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3" />
    </svg>
  ),
  chart: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 20V10M18 20V4M6 20v-4" />
    </svg>
  ),
}

export default function DashboardPage() {
  const [rows, setRows] = useState<AppRow[]>([])
  const [hasResume, setHasResume] = useState(false)
  const [activity, setActivity] = useState<{ action: string; details: string | null; created_at: string }[]>([])
  const [userName, setUserName] = useState('')
  const [greeting, setGreeting] = useState('Good morning')
  const [mounted, setMounted] = useState(false)
  const [supabase] = useState(() => createClient())

  useEffect(() => {
    setMounted(true)
    const hour = new Date().getHours()
    setGreeting(hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening')
  }, [])

  useEffect(() => {
    ;(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: profile }, { data: apps }, { data: resumes }, { data: logs }] = await Promise.all([
        supabase.from('profiles').select('full_name').eq('id', user.id).single(),
        supabase.from('applications').select('status, match_score, created_at, applied_at').eq('user_id', user.id),
        supabase.from('resumes').select('id').eq('user_id', user.id).limit(1),
        supabase
          .from('apply_log')
          .select('action, details, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20),
      ])

      if (profile?.full_name) setUserName(profile.full_name.split(' ')[0])
      if (apps) setRows(apps as AppRow[])
      if (resumes?.length) setHasResume(true)
      if (logs) setActivity(logs)
    })()
  }, [supabase])

  const metrics = useMemo(() => {
    const now = Date.now()
    const dateOf = (r: AppRow) => r.applied_at ?? r.created_at

    const applied = rows.filter(r => !['saved', 'queued'].includes(r.status))
    const interviews = rows.filter(r => r.status === 'interview')
    const offers = rows.filter(r => r.status === 'offer')
    const scored = rows.filter(r => typeof r.match_score === 'number')

    // Rows older than the window still count toward the total, so the line
    // starts where the user actually is rather than at zero.
    const before = (list: AppRow[]) => list.filter(r => weekIndex(dateOf(r), now) === null).length

    const appliedWeekly = bucket(applied, dateOf, now)
    const interviewWeekly = bucket(interviews, dateOf, now)
    const offerWeekly = bucket(offers, dateOf, now)

    // Match score is an average, not a count, so it is carried forward across
    // empty weeks rather than accumulated.
    const sums: number[] = new Array(WEEKS).fill(0)
    const counts: number[] = new Array(WEEKS).fill(0)
    for (const r of scored) {
      const i = weekIndex(dateOf(r), now)
      if (i === null) continue
      sums[i] += r.match_score as number
      counts[i] += 1
    }
    let carried = 0
    const scoreSeries = sums.map((sum, i) => {
      if (counts[i] > 0) carried = Math.round(sum / counts[i])
      return carried
    })

    const avgScore = scored.length
      ? Math.round(scored.reduce((a, r) => a + (r.match_score as number), 0) / scored.length)
      : 0

    return {
      applied: {
        value: applied.length,
        series: cumulative(appliedWeekly, before(applied)),
        delta: appliedWeekly[WEEKS - 1],
      },
      interviews: {
        value: interviews.length,
        series: cumulative(interviewWeekly, before(interviews)),
        delta: interviewWeekly[WEEKS - 1],
      },
      offers: {
        value: offers.length,
        series: cumulative(offerWeekly, before(offers)),
        delta: offerWeekly[WEEKS - 1],
      },
      score: {
        value: avgScore,
        series: scoreSeries,
        delta: scoreSeries[WEEKS - 1] - scoreSeries[WEEKS - 2],
      },
    }
  }, [rows])

  /* Applications that have gone quiet. Following up after a week is one of the
     highest-leverage things a job seeker can do, and nothing surfaced it. */
  const stale = useMemo(() => {
    const now = Date.now()
    return rows.filter(
      r => r.status === 'applied' && r.applied_at && now - new Date(r.applied_at).getTime() > 7 * 86400000
    )
  }, [rows])

  const journeySteps = [
    { step: 1, label: 'Upload resume', desc: 'Get your ATS score', href: '/resume', done: hasResume, t: 'accent' as Tone },
    { step: 2, label: 'Search jobs', desc: 'Find matching roles', href: '/jobs', done: rows.length > 0, t: 'blue' as Tone },
    { step: 3, label: 'Turn on auto-apply', desc: 'Apply on autopilot', href: '/auto-apply', done: metrics.applied.value > 0, t: 'purple' as Tone },
    { step: 4, label: 'Practise interviews', desc: 'Rehearse with the coach', href: '/interview-coach', done: metrics.interviews.value > 0, t: 'green' as Tone },
  ]
  const doneCount = journeySteps.filter(s => s.done).length
  const journeyComplete = doneCount === journeySteps.length

  const quickActions = [
    { label: 'Search jobs', desc: 'Across every connected board', href: '/jobs', t: 'blue' as Tone, icon: <path d="M11 18a7 7 0 100-14 7 7 0 000 14zM21 21l-4.35-4.35" /> },
    { label: 'Optimize resume', desc: 'ATS score and fixes', href: '/resume', t: 'green' as Tone, icon: <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zM14 2v6h6" /> },
    { label: 'Find a referral', desc: 'Warm paths in your network', href: '/network', t: 'accent' as Tone, icon: <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /> },
    { label: 'Auto-apply', desc: 'Queue and submit for you', href: '/auto-apply', t: 'yellow' as Tone, icon: <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /> },
  ]

  if (!mounted) return <div className="p-8" />

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-5 max-w-[1360px] mx-auto">
      {/* Greeting: one line, no wasted band */}
      <motion.div variants={fadeInUp} className="flex flex-wrap items-end justify-between gap-4 pt-1">
        <div>
          <h1 className="font-display text-[clamp(1.75rem,2.6vw,2.15rem)] leading-tight" style={{ color: 'var(--text)' }}>
            {greeting}
            {userName ? `, ${userName}` : ''}
          </h1>
          <p className="text-[13px] mt-1" style={{ color: 'var(--text-muted)' }}>
            {metrics.applied.value === 0
              ? 'Let us get your first application out today.'
              : `${metrics.applied.value} application${metrics.applied.value === 1 ? '' : 's'} out · ${metrics.interviews.value} interview${metrics.interviews.value === 1 ? '' : 's'} · ${metrics.offers.value} offer${metrics.offers.value === 1 ? '' : 's'}`}
          </p>
        </div>
        <Link
          href="/jobs"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-transform hover:-translate-y-0.5"
          style={{
            background: 'var(--accent-solid)',
            color: 'var(--text-on-accent)',
            boxShadow: '0 6px 18px -8px rgb(var(--accent-rgb) / 0.6)',
          }}
        >
          Find jobs
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      </motion.div>

      {/* Metrics */}
      <motion.div variants={staggerContainer} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard index={0} label="Applications sent" value={metrics.applied.value} t="accent" series={metrics.applied.series} delta={metrics.applied.delta} icon={ICONS.send} />
        <StatCard index={1} label="Interviews" value={metrics.interviews.value} t="green" series={metrics.interviews.series} delta={metrics.interviews.delta} icon={ICONS.mic} />
        <StatCard index={2} label="Offers" value={metrics.offers.value} t="purple" series={metrics.offers.series} delta={metrics.offers.delta} icon={ICONS.trophy} />
        <StatCard index={3} label="Avg match score" value={metrics.score.value} suffix="%" t="yellow" series={metrics.score.series} delta={metrics.score.delta} icon={ICONS.chart} />
      </motion.div>

      {/* Needs attention: real, actionable, from the user's own rows */}
      {stale.length > 0 && (
        <motion.div variants={fadeInUp}>
          <PremiumCard accent="yellow" hover={false}>
            <div className="flex flex-wrap items-center gap-4 p-5">
              <span
                className="grid place-items-center w-10 h-10 rounded-xl shrink-0"
                style={{ background: toneSurface('yellow', 0.14), color: tone('yellow') }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </svg>
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>
                  {stale.length} application{stale.length === 1 ? '' : 's'}{stale.length === 1 ? ' has' : ' have'} gone quiet
                </h2>
                <p className="text-[12.5px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  No reply after a week. A short follow-up is the cheapest way to restart a conversation.
                </p>
              </div>
              <Link
                href="/applications?filter=applied"
                className="px-3.5 py-2 rounded-lg text-[12.5px] font-semibold shrink-0"
                style={{ background: toneSurface('yellow', 0.16), color: tone('yellow') }}
              >
                Review them
              </Link>
            </div>
          </PremiumCard>
        </motion.div>
      )}

      {/* Onboarding journey: disappears once it is finished */}
      {!journeyComplete && (
        <motion.div variants={fadeInUp}>
          <PremiumCard accent="pink" hover={false}>
            <div className="p-5">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                  <h2 className="font-display text-[1.25rem] leading-tight" style={{ color: 'var(--text)' }}>
                    Get set up
                  </h2>
                  <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    Four steps between you and an automated search
                  </p>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-overlay)' }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: 'var(--accent-solid)' }}
                      initial={{ width: 0 }}
                      animate={{ width: `${(doneCount / journeySteps.length) * 100}%` }}
                      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </div>
                  <span className="text-[11.5px] font-semibold tabular-nums" style={{ color: 'var(--text-muted)' }}>
                    {doneCount}/{journeySteps.length}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {journeySteps.map(step => (
                  <Link
                    key={step.step}
                    href={step.href}
                    className="group relative p-4 rounded-xl transition-all duration-200 hover:-translate-y-0.5"
                    style={{
                      background: step.done ? toneSurface(step.t, 0.09) : 'var(--bg-overlay)',
                      boxShadow: `inset 0 0 0 1px ${step.done ? toneA(step.t, 0.22) : 'var(--card-ring)'}`,
                    }}
                  >
                    <span
                      className="grid place-items-center w-7 h-7 rounded-full text-[11.5px] font-bold mb-2.5"
                      style={{
                        background: step.done ? tone(step.t) : 'var(--bg-card)',
                        color: step.done ? '#fff' : 'var(--text-muted)',
                        boxShadow: step.done ? 'none' : 'inset 0 0 0 1px var(--card-ring)',
                      }}
                    >
                      {step.done ? (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" aria-hidden="true">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      ) : (
                        step.step
                      )}
                    </span>
                    <div className="text-[12.5px] font-semibold" style={{ color: 'var(--text)' }}>
                      {step.label}
                    </div>
                    <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {step.done ? 'Done' : step.desc}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </PremiumCard>
        </motion.div>
      )}

      {/* Actions + activity */}
      <motion.div variants={staggerContainer} className="grid lg:grid-cols-[1fr_400px] gap-4 items-start">
        <motion.div variants={fadeInUp}>
          <PremiumCard accent="none" hover={false}>
            <div className="p-5">
              <h2 className="font-display text-[1.25rem] leading-tight mb-0.5" style={{ color: 'var(--text)' }}>
                Jump in
              </h2>
              <p className="text-[11.5px] mb-4" style={{ color: 'var(--text-muted)' }}>
                The four things that move a search forward
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                {quickActions.map(a => (
                  <Link
                    key={a.label}
                    href={a.href}
                    className="group flex items-start gap-3 p-4 rounded-xl transition-all duration-200 hover:-translate-y-0.5"
                    style={{
                      background: toneSurface(a.t, 0.06),
                      boxShadow: `inset 0 0 0 1px ${toneA(a.t, 0.14)}`,
                    }}
                  >
                    <span
                      className="grid place-items-center w-9 h-9 rounded-lg shrink-0"
                      style={{ background: toneSurface(a.t, 0.15), color: tone(a.t) }}
                    >
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
                        {a.icon}
                      </svg>
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13px] font-semibold" style={{ color: 'var(--text)' }}>
                        {a.label}
                      </span>
                      <span className="block text-[11.5px] mt-0.5 leading-snug" style={{ color: 'var(--text-muted)' }}>
                        {a.desc}
                      </span>
                    </span>
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden="true"
                      className="ml-auto shrink-0 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all"
                      style={{ color: tone(a.t) }}
                    >
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </Link>
                ))}
              </div>
            </div>
          </PremiumCard>
        </motion.div>

        <motion.div variants={fadeInUp}>
          <ActivityFeed activities={activity} />
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
