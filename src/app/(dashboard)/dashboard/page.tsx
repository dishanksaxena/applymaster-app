'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase-browser'
import Link from 'next/link'

/* ─── Animated Counter ─── */
function AnimatedNumber({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    const end = value
    const duration = 1200
    const startTime = Date.now()
    const tick = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(end * eased))
      if (progress < 1) requestAnimationFrame(tick)
    }
    tick()
  }, [value])
  return <span>{display}{suffix}</span>
}

/* ─── Sparkline Chart ─── */
function Sparkline({ data, color, height = 40 }: { data: number[]; color: string; height?: number }) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const w = 120
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${height - ((v - min) / range) * (height - 4) - 2}`).join(' ')
  const gradId = `sg-${color.replace('#', '')}`
  return (
    <svg width={w} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.polyline
        fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
        points={points}
      />
      <polygon points={`0,${height} ${points} ${w},${height}`} fill={`url(#${gradId})`} opacity="0.5" />
    </svg>
  )
}

/* ─── Live Activity Terminal ─── */
function LiveTerminal({ activities }: { activities: { action: string; details: string | null; created_at: string }[] }) {
  const [dots, setDots] = useState('')
  useEffect(() => {
    const t = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 500)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="rounded-2xl overflow-hidden border border-white/[0.06] h-full" style={{ background: 'linear-gradient(180deg, #0d0d14 0%, #0a0a10 100%)' }}>
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.04]">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
        </div>
        <span className="text-[10px] font-mono text-[#4a4a5a] ml-2">applymaster — activity-feed</span>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-[#00b894] opacity-60 animate-ping" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#00b894]" />
          </span>
          <span className="text-[9px] font-mono text-[#00b894]">LIVE</span>
        </div>
      </div>
      <div className="p-4 max-h-[360px] overflow-y-auto font-mono text-[11px] space-y-2">
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 2, repeat: Infinity }} className="text-[#4a4a5a]">
              Waiting for activity{dots}
            </motion.div>
            <p className="text-[#3a3a4a] text-[10px] mt-2">Upload your resume to get started</p>
          </div>
        ) : (
          <AnimatePresence>
            {activities.map((log, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex items-start gap-3">
                <span className="text-[#3a3a4a] shrink-0 mt-px">{new Date(log.created_at).toLocaleTimeString('en-US', { hour12: false })}</span>
                <span className="text-[#00b894]">$</span>
                <div>
                  <span className="text-[#e0e0e8]">{log.action}</span>
                  {log.details && <span className="text-[#5a5a6a]"> — {log.details}</span>}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } }
const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } } }

export default function DashboardPage() {
  const [stats, setStats] = useState({ applied: 0, interviews: 0, offers: 0, matchRate: 0 })
  const [recentActivity, setRecentActivity] = useState<{ action: string; details: string | null; created_at: string }[]>([])
  const [userName, setUserName] = useState('')
  const [greeting, setGreeting] = useState('Good morning')
  const [mounted, setMounted] = useState(false)
  const supabase = createClient()

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    const hour = new Date().getHours()
    setGreeting(hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening')

    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
      if (profile?.full_name) setUserName(profile.full_name.split(' ')[0])

      const { data: apps } = await supabase.from('applications').select('status, match_score').eq('user_id', user.id)
      if (apps) {
        const applied = apps.filter(a => !['saved', 'queued'].includes(a.status)).length
        const interviews = apps.filter(a => a.status === 'interview').length
        const offers = apps.filter(a => a.status === 'offer').length
        const scores = apps.filter(a => a.match_score).map(a => a.match_score!)
        const matchRate = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
        setStats({ applied, interviews, offers, matchRate })
      }

      const { data: logs } = await supabase.from('apply_log').select('action, details, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(15)
      if (logs) setRecentActivity(logs)
    }
    load()
  }, [supabase])

  const statCards = [
    { label: 'Applications Sent', value: stats.applied, suffix: '', color: '#fd79a8', sparkData: [2, 5, 3, 8, 6, 9, 7, 12, 10, 15], icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 2L11 13"/><path d="M22 2L15 22L11 13L2 9L22 2Z"/></svg>
    )},
    { label: 'Interviews Lined Up', value: stats.interviews, suffix: '', color: '#00b894', sparkData: [1, 2, 1, 3, 2, 4, 3, 5, 4, 6], icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/></svg>
    )},
    { label: 'Offers Received', value: stats.offers, suffix: '', color: '#a29bfe', sparkData: [0, 0, 1, 0, 1, 1, 2, 1, 2, 3], icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>
    )},
    { label: 'Avg Match Score', value: stats.matchRate, suffix: '%', color: '#fdcb6e', sparkData: [60, 65, 72, 68, 75, 78, 82, 80, 85, 88], icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20V16"/></svg>
    )},
  ]

  const quickActions = [
    { label: 'Search Jobs', desc: 'Browse 50+ job portals with AI matching', href: '/jobs', color: '#fd79a8', icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>
    )},
    { label: 'Optimize Resume', desc: 'AI-powered ATS scoring and improvements', href: '/resume', color: '#00b894', icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"/><polyline points="14,2 14,8 20,8"/></svg>
    )},
    { label: 'Cover Letter', desc: 'AI writes personalized letters in seconds', href: '/cover-letters', color: '#a29bfe', icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
    )},
    { label: 'Auto-Apply', desc: 'Let AI apply to jobs on autopilot', href: '/auto-apply', color: '#fdcb6e', icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="13,2 3,14 12,14 11,22 21,10 12,10"/></svg>
    )},
  ]

  const journeySteps = [
    { step: 1, label: 'Upload Resume', desc: 'Get your ATS score', href: '/resume', done: stats.applied > 0 || stats.matchRate > 0, color: '#fd79a8' },
    { step: 2, label: 'Search Jobs', desc: 'Find matching roles', href: '/jobs', done: stats.applied > 0, color: '#00b894' },
    { step: 3, label: 'Enable Auto-Apply', desc: 'Apply on autopilot', href: '/auto-apply', done: false, color: '#a29bfe' },
    { step: 4, label: 'Ace Interviews', desc: 'Practice with AI coach', href: '/interview-coach', done: stats.interviews > 0, color: '#fdcb6e' },
  ]

  if (!mounted) return <div className="p-8" />

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8 max-w-[1400px] mx-auto">

      {/* ─── Welcome Banner ─── */}
      <motion.div variants={fadeUp} className="relative overflow-hidden rounded-2xl p-8" style={{
        background: 'linear-gradient(135deg, rgba(253,121,168,0.08) 0%, rgba(162,155,254,0.06) 50%, rgba(0,184,148,0.04) 100%)',
        border: '1px solid rgba(253,121,168,0.1)',
      }}>
        <div className="absolute top-[-50%] right-[-10%] w-[300px] h-[300px] rounded-full opacity-[0.07]" style={{ background: 'radial-gradient(circle, #fd79a8, transparent 70%)' }} />
        <div className="absolute bottom-[-50%] left-[-10%] w-[250px] h-[250px] rounded-full opacity-[0.05]" style={{ background: 'radial-gradient(circle, #a29bfe, transparent 70%)' }} />
        <div className="relative z-10">
          <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="text-3xl lg:text-4xl font-black tracking-tight mb-2">
            {greeting}{userName ? `, ${userName}` : ''}
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            className="text-[15px] text-[#8a8a9a] max-w-lg">
            Your job search command center. Track everything, optimize your approach, and land your dream role.
          </motion.p>
        </div>
      </motion.div>

      {/* ─── Stats Grid ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <motion.div key={s.label} variants={fadeUp} whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="relative group p-5 rounded-2xl overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #1c1c2e 0%, #16162a 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              style={{ background: `radial-gradient(circle at 50% 50%, ${s.color}08, transparent 70%)` }} />
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${s.color}12`, color: s.color }}>{s.icon}</div>
              <Sparkline data={s.sparkData} color={s.color} height={32} />
            </div>
            <div className="text-3xl font-black tracking-tight" style={{ color: s.color }}>
              <AnimatedNumber value={typeof s.value === 'number' ? s.value : 0} suffix={s.suffix} />
            </div>
            <div className="text-[12px] text-[#5a5a6a] mt-1 font-medium">{s.label}</div>
            <div className="absolute bottom-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: `linear-gradient(90deg, transparent, ${s.color}40, transparent)` }} />
          </motion.div>
        ))}
      </div>

      {/* ─── Getting Started Journey ─── */}
      <motion.div variants={fadeUp} className="p-6 rounded-2xl" style={{
        background: 'linear-gradient(135deg, #1c1c2e 0%, #16162a 100%)', border: '1px solid rgba(255,255,255,0.1)',
      }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-[16px] font-bold">Your Journey</h3>
            <p className="text-[12px] text-[#5a5a6a] mt-1">Follow these steps to land your next role</p>
          </div>
          <div className="text-[12px] font-bold px-3 py-1 rounded-full" style={{ background: 'rgba(253,121,168,0.08)', color: '#fd79a8' }}>
            {journeySteps.filter(s => s.done).length}/{journeySteps.length} completed
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {journeySteps.map((step) => (
            <Link key={step.step} href={step.href}>
              <motion.div whileHover={{ y: -3, scale: 1.02 }} className="relative p-5 rounded-xl cursor-pointer group transition-all duration-300"
                style={{ background: step.done ? `${step.color}08` : 'rgba(255,255,255,0.02)', border: `1px solid ${step.done ? `${step.color}20` : 'rgba(255,255,255,0.1)'}` }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold mb-3" style={{
                  background: step.done ? `${step.color}20` : 'rgba(255,255,255,0.04)', color: step.done ? step.color : '#5a5a6a',
                  boxShadow: step.done ? `0 0 12px ${step.color}20` : 'none',
                }}>
                  {step.done ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17L4 12"/></svg> : step.step}
                </div>
                <div className="text-[13px] font-bold text-white group-hover:text-[#fd79a8] transition-colors">{step.label}</div>
                <div className="text-[11px] text-[#5a5a6a] mt-1">{step.desc}</div>
                <div className="absolute top-1/2 right-4 -translate-y-1/2 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300 text-[#5a5a6a]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* ─── Main Grid ─── */}
      <div className="grid lg:grid-cols-[1fr_420px] gap-6">
        <motion.div variants={fadeUp} className="p-6 rounded-2xl" style={{
          background: 'linear-gradient(135deg, #1c1c2e 0%, #16162a 100%)', border: '1px solid rgba(255,255,255,0.1)',
        }}>
          <h3 className="text-[16px] font-bold mb-1">Quick Actions</h3>
          <p className="text-[12px] text-[#5a5a6a] mb-6">Jump right into any workflow</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {quickActions.map((a) => (
              <Link key={a.label} href={a.href}>
                <motion.div whileHover={{ y: -3, scale: 1.01 }} whileTap={{ scale: 0.98 }}
                  className="relative p-5 rounded-xl cursor-pointer group overflow-hidden"
                  style={{ background: `${a.color}06`, border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: `radial-gradient(circle at 30% 30%, ${a.color}10, transparent 70%)` }} />
                  <div className="relative z-10">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: `${a.color}15`, color: a.color }}>{a.icon}</div>
                    <div className="text-[14px] font-bold text-white group-hover:text-[#fd79a8] transition-colors">{a.label}</div>
                    <div className="text-[12px] text-[#5a5a6a] mt-1 leading-relaxed">{a.desc}</div>
                  </div>
                  <div className="absolute top-5 right-5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-2 transition-all duration-300" style={{ color: a.color }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>
        <motion.div variants={fadeUp}>
          <LiveTerminal activities={recentActivity} />
        </motion.div>
      </div>
    </motion.div>
  )
}
