'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase-browser'
import ApplicationSourceChart from './ApplicationSourceChart'
import TrendLineChart from './TrendLineChart'
import SuccessDonutChart from './SuccessDonutChart'
import ActivityFeed from './ActivityFeed'
import { withAlpha } from '@/lib/tone'
import { toast } from '@/components/Toast'

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } }
const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } } }

// Animated number counter
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



export default function AutoApplyPage() {
  const [mode, setMode] = useState<'copilot' | 'autopilot' | 'off'>('off')
  const [dailyLimit, setDailyLimit] = useState(10)
  const [matchThreshold, setMatchThreshold] = useState(80)
  /* Live status of the sources we can actually reach, asked at runtime
     rather than asserted. The four that used to sit here — LinkedIn,
     Indeed, Glassdoor, ZipRecruiter — had no code behind them at all. */
  const [sourceStatus, setSourceStatus] = useState<any[] | null>(null)
  const [logs, setLogs] = useState<any[]>([])
  const [applications, setApplications] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [testingAuto, setTestingAuto] = useState(false)
  const [testResult, setTestResult] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  // God Mode
  const [godModeEnabled, setGodModeEnabled] = useState(false)
  const [godModeTailorResume, setGodModeTailorResume] = useState(true)
  const [godModeCoverLetter, setGodModeCoverLetter] = useState(true)
  const [godModeScoreThreshold, setGodModeScoreThreshold] = useState<'A' | 'B' | 'C'>('B')
  const supabaseRef = useRef<any>(null)

  useEffect(() => {
    setMounted(true)
    supabaseRef.current = createClient()

    // Ask each source whether it is actually up, rather than asserting it.
    fetch('/api/sources/status')
      .then(r => r.json())
      .then(d => setSourceStatus(d.sources ?? []))
      .catch(() => setSourceStatus([]))
  }, [])

  const supabase = supabaseRef.current

  // Load initial data only once
  useEffect(() => {
    if (!mounted || isInitialized || !supabase) return

    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Load preferences
      const { data } = await supabase.from('job_preferences').select('*').eq('user_id', user.id).maybeSingle()
      if (data) {
        setMode(data.auto_apply_mode || 'off')
        setDailyLimit(data.daily_apply_limit || 10)
        setMatchThreshold(data.match_threshold || 80)
        setGodModeEnabled(data.god_mode_enabled || false)
        setGodModeTailorResume(data.god_mode_tailor_resume ?? true)
        setGodModeCoverLetter(data.god_mode_cover_letter ?? true)
        setGodModeScoreThreshold(data.god_mode_score_threshold || 'B')
      }

      // Load activity logs
      const { data: logData } = await supabase.from('apply_log').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20)
      if (logData) setLogs(logData)

      // Load applications
      const { data: appData } = await supabase.from('applications').select('*, job:jobs(*)').eq('user_id', user.id)
      if (appData) setApplications(appData)

      setIsInitialized(true)
    }

    load()
  }, [mounted, isInitialized])

  // Compute analytics data
  const analytics = useMemo(() => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(today)
    weekStart.setDate(weekStart.getDate() - today.getDay())
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const appsToday = applications.filter(a => a.applied_at && new Date(a.applied_at) >= today).length
    const appsThisWeek = applications.filter(a => a.applied_at && new Date(a.applied_at) >= weekStart).length
    const appsThisMonth = applications.filter(a => a.applied_at && new Date(a.applied_at) >= monthStart).length

    const successToday = applications.filter(a => a.applied_at && new Date(a.applied_at) >= today && ['interview', 'offer'].includes(a.status)).length
    const successThisWeek = applications.filter(a => a.applied_at && new Date(a.applied_at) >= weekStart && ['interview', 'offer'].includes(a.status)).length
    const successThisMonth = applications.filter(a => a.applied_at && new Date(a.applied_at) >= monthStart && ['interview', 'offer'].includes(a.status)).length

    const successRateToday = appsToday > 0 ? Math.round((successToday / appsToday) * 100) : 0
    const successRateThisWeek = appsThisWeek > 0 ? Math.round((successThisWeek / appsThisWeek) * 100) : 0
    const successRateThisMonth = appsThisMonth > 0 ? Math.round((successThisMonth / appsThisMonth) * 100) : 0

    return {
      today: { apps: appsToday, success: successRateToday },
      thisWeek: { apps: appsThisWeek, success: successRateThisWeek },
      thisMonth: { apps: appsThisMonth, success: successRateThisMonth },
    }
  }, [applications])

  const saveSettings = async () => {
    if (!supabase) return
    setSaving(true)
    setSaved(false)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Not authenticated. Please log in first.')
        setSaving(false)
        return
      }

      console.log('[AUTO-APPLY] Saving settings:', { mode, dailyLimit, matchThreshold, userId: user.id })

      // Save base settings first (always works)
      const { data, error } = await supabase.from('job_preferences').upsert(
        {
          user_id: user.id,
          auto_apply_mode: mode,
          daily_apply_limit: dailyLimit,
          match_threshold: matchThreshold,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'user_id' }
      ).select()

      // Try saving God Mode settings separately — columns may not exist yet if migration hasn't run
      if (!error) {
        await supabase.from('job_preferences').upsert(
          {
            user_id: user.id,
            god_mode_enabled: godModeEnabled,
            god_mode_tailor_resume: godModeTailorResume,
            god_mode_cover_letter: godModeCoverLetter,
            god_mode_score_threshold: godModeScoreThreshold,
          },
          { onConflict: 'user_id' }
        ).select()
        // Silently ignore error — columns added after migration runs
      }

      console.log('[AUTO-APPLY] Save response:', { data, error })

      setSaving(false)

      if (error) {
        console.error('[AUTO-APPLY] Save failed:', error)
        toast.error('Failed to save: ' + error.message)
      } else {
        setSaved(true)
        console.log('[AUTO-APPLY] Settings saved successfully - mode is now:', mode)
        // Keep saved state - don't timeout
      }
    } catch (err) {
      console.error('[AUTO-APPLY] Save exception:', err)
      setSaving(false)
      toast.error('Error saving settings: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
  }

  // ── Queued apps for review ──────────────────────────────────────
  const queuedApps = applications.filter((a: any) => a.status === 'queued')
  const [reviewLoading, setReviewLoading] = useState<string | null>(null)

  const approveApp = async (appId: string) => {
    if (!supabase) return
    setReviewLoading(appId)
    await supabase.from('applications').update({ status: 'applied', applied_at: new Date().toISOString() }).eq('id', appId)
    setApplications((prev: any[]) => prev.map((a: any) => a.id === appId ? { ...a, status: 'applied', applied_at: new Date().toISOString() } : a))
    setReviewLoading(null)
  }

  const dismissApp = async (appId: string) => {
    if (!supabase) return
    setReviewLoading(appId)
    await supabase.from('applications').update({ status: 'rejected' }).eq('id', appId)
    setApplications((prev: any[]) => prev.map((a: any) => a.id === appId ? { ...a, status: 'rejected' } : a))
    setReviewLoading(null)
  }

  const refreshApplications = async () => {
    if (!supabase) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('applications').select('*, job:jobs(*)').eq('user_id', user.id)
    if (data) setApplications(data)
  }

  const testAutoApply = async () => {
    setTestingAuto(true)
    setTestResult(null)
    try {
      const response = await fetch('/api/auto-apply/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      const data = await response.json()
      if (response.ok) {
        setTestResult(`✅ Done — ${data.processed} application(s) ${data.mode === 'autopilot' ? 'sent' : 'queued for review'}`)
        // Refresh applications so the review queue populates immediately
        await refreshApplications()
      } else {
        setTestResult(`❌ Error: ${data.error}`)
      }
    } catch (err) {
      setTestResult(`❌ Failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setTestingAuto(false)
    }
  }

  const modes = [
    { id: 'off' as const, label: 'Off', desc: 'Auto-apply disabled', color: 'var(--text-faint)', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> },
    { id: 'copilot' as const, label: 'Copilot', desc: 'Review before each application is sent', color: 'var(--blue)', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> },
    { id: 'autopilot' as const, label: 'Autopilot', desc: 'AI applies automatically to matching jobs', color: 'var(--green)', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="13,2 3,14 12,14 11,22 21,10 12,10"/></svg> },
  ]

  if (!mounted) return <div className="p-8" />

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8 max-w-[1200px] mx-auto">

      {/* Header */}
      <motion.div variants={fadeUp} className="relative overflow-hidden rounded-2xl p-8" style={{
        background: 'linear-gradient(135deg, rgb(var(--green-rgb) / calc(0.08 * var(--tint-scale))) 0%, rgb(var(--accent-rgb) / calc(0.06 * var(--tint-scale))) 100%)',
        border: `1px solid ${mode === 'autopilot' ? 'rgb(var(--green-rgb) / calc(0.15 * var(--tint-scale)))' : mode === 'copilot' ? 'rgb(var(--blue-rgb) / calc(0.15 * var(--tint-scale)))' : 'var(--bg-overlay)'}`,
      }}>
        <div className="absolute top-[-50%] right-[-10%] w-[300px] h-[300px] rounded-full opacity-[0.07]" style={{ background: 'radial-gradient(circle, var(--green), transparent 70%)' }} />
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: mode === 'autopilot' ? 'rgb(var(--green-rgb) / calc(0.15 * var(--tint-scale)))' : mode === 'copilot' ? 'rgb(var(--blue-rgb) / calc(0.15 * var(--tint-scale)))' : 'var(--bg-overlay)' }}>
              <motion.div animate={mode !== 'off' ? { scale: [1, 1.15, 1] } : {}} transition={{ duration: 1.5, repeat: Infinity }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={mode === 'autopilot' ? 'var(--green)' : mode === 'copilot' ? 'var(--blue)' : 'var(--text-faint)'} strokeWidth="1.8"><polygon points="13,2 3,14 12,14 11,22 21,10 12,10"/></svg>
              </motion.div>
            </div>
            <div>
              <h1 className="font-display text-[clamp(1.7rem,3vw,2.2rem)]">Auto-Apply Engine</h1>
              <p className="text-[14px] text-[var(--text-secondary)] mt-1">Let AI handle applications while you prepare for interviews</p>
            </div>
          </div>
          {mode !== 'off' && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: mode === 'autopilot' ? 'rgb(var(--green-rgb) / calc(0.1 * var(--tint-scale)))' : 'rgb(var(--blue-rgb) / calc(0.1 * var(--tint-scale)))', border: `1px solid ${mode === 'autopilot' ? 'rgb(var(--green-rgb) / calc(0.2 * var(--tint-scale)))' : 'rgb(var(--blue-rgb) / calc(0.2 * var(--tint-scale)))'}` }}>
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping" style={{ background: mode === 'autopilot' ? 'var(--green)' : 'var(--blue)' }} />
                <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: mode === 'autopilot' ? 'var(--green)' : 'var(--blue)' }} />
              </span>
              <span className="text-[12px] font-bold capitalize" style={{ color: mode === 'autopilot' ? 'var(--green)' : 'var(--blue)' }}>{mode} Active</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Review Queue: shown when copilot has queued applications ── */}
      {queuedApps.length > 0 && (
        <motion.div variants={fadeUp} className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgb(var(--yellow-rgb) / 0.25)', background: 'linear-gradient(135deg, rgb(var(--yellow-rgb) / calc(0.06 * var(--tint-scale))) 0%, rgb(var(--yellow-rgb) / calc(0.02 * var(--tint-scale))) 100%)' }}>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[rgb(var(--yellow-rgb)/0.12)]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgb(var(--yellow-rgb) / calc(0.15 * var(--tint-scale)))' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--yellow)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              <div>
                <div className="text-[14px] font-bold text-[var(--text)]">Review Queue</div>
                <div className="text-[11px] text-[var(--text-secondary)]">{queuedApps.length} application{queuedApps.length !== 1 ? 's' : ''} waiting for your approval</div>
              </div>
            </div>
            <button onClick={refreshApplications} className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors px-3 py-1.5 rounded-lg" style={{ border: '1px solid var(--border)' }}>
              ↻ Refresh
            </button>
          </div>

          {/* Queue items */}
          <div className="divide-y divide-[var(--bg-overlay)]">
            {queuedApps.map((app: any) => (
              <div key={app.id} className="flex items-center gap-4 px-6 py-4">
                {/* Company avatar */}
                <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-[13px] font-black text-[var(--text-on-accent)]" style={{ background: 'linear-gradient(135deg, rgb(var(--yellow-rgb) / 0.3), rgb(var(--yellow-rgb) / calc(0.1 * var(--tint-scale))))' }}>
                  {(app.job?.company || 'C')[0].toUpperCase()}
                </div>

                {/* Job info */}
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-bold text-[var(--text)] truncate">{app.job?.title || 'Job Title'}</div>
                  <div className="text-[11px] text-[var(--text-secondary)] truncate">
                    {app.job?.company || 'Company'}
                    {app.job?.location ? ` · ${app.job.location}` : ''}
                    {app.job?.remote_type ? ` · ${app.job.remote_type}` : ''}
                  </div>
                </div>

                {/* Match score */}
                {app.match_score != null && (
                  <div className="flex-shrink-0 text-center hidden sm:block">
                    <div className="text-[16px] font-black" style={{ color: app.match_score >= 75 ? 'var(--green)' : app.match_score >= 60 ? 'var(--yellow)' : 'var(--red)' }}>{app.match_score}%</div>
                    <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">match</div>
                  </div>
                )}

                {/* Salary if present */}
                {app.job?.salary_min && (
                  <div className="flex-shrink-0 text-center hidden lg:block">
                    <div className="text-[12px] font-bold text-[var(--purple)]">${(app.job.salary_min / 1000).toFixed(0)}k+</div>
                    <div className="text-[9px] text-[var(--text-faint)]">salary</div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex-shrink-0 flex items-center gap-2">
                  {reviewLoading === app.id ? (
                    <div className="w-4 h-4 rounded-full border-2 border-[var(--border)] border-t-[var(--yellow)] animate-spin" />
                  ) : (
                    <>
                      <button
                        onClick={() => approveApp(app.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold text-ink transition-all hover:scale-105 active:scale-95"
                        style={{ background: 'linear-gradient(135deg, var(--green), var(--green))' }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                        Approve
                      </button>
                      <button
                        onClick={() => dismissApp(app.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all hover:scale-105 active:scale-95"
                        style={{ background: 'rgba(255,100,100,0.1)', border: '1px solid rgba(255,100,100,0.2)', color: 'var(--red)' }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        Dismiss
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-[rgb(var(--yellow-rgb)/0.08)] flex items-center justify-between">
            <span className="text-[11px] text-[var(--text-muted)]">Approving marks the application as sent and moves it to Applied.</span>
            <div className="flex gap-2">
              <button
                onClick={async () => { for (const app of queuedApps) await approveApp(app.id) }}
                className="text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
                style={{ background: 'rgb(var(--green-rgb) / calc(0.15 * var(--tint-scale)))', color: 'var(--green)', border: '1px solid rgb(var(--green-rgb) / calc(0.2 * var(--tint-scale)))' }}
              >
                ✓ Approve All
              </button>
              <button
                onClick={async () => { for (const app of queuedApps) await dismissApp(app.id) }}
                className="text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
                style={{ background: 'rgba(255,100,100,0.08)', color: 'var(--red)', border: '1px solid rgba(255,100,100,0.15)' }}
              >
                ✗ Dismiss All
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Configuration + Activity Feed (always visible at top) ── */}
      <div className="grid lg:grid-cols-[1fr_380px] gap-6">
        <div className="space-y-6">

          {/* Mode Selection */}
          <motion.div variants={fadeUp} className="p-6 rounded-2xl" style={{ background: 'linear-gradient(135deg, var(--bg-card-gradient-start), var(--bg-card-gradient-end))', border: '1px solid var(--border)' }}>
            <h3 className="text-[16px] font-bold mb-4">Operating Mode</h3>
            <div className="grid sm:grid-cols-3 gap-3">
              {modes.map(m => (
                <motion.button key={m.id} whileHover={{ y: -3, scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setMode(m.id)}
                  className="p-5 rounded-xl text-left transition-all duration-300"
                  style={mode === m.id ? { background: `${withAlpha(m.color, 0.09, true)}`, border: `1px solid ${withAlpha(m.color, 0.18, true)}`, boxShadow: `0 0 20px ${withAlpha(m.color, 0.06, true)}` } : { background: 'var(--bg-overlay)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${withAlpha(m.color, 0.11, true)}`, color: m.color }}>{m.icon}</div>
                    {mode === m.id && <div className="w-3 h-3 rounded-full" style={{ background: m.color, boxShadow: `0 0 8px ${m.color}` }} />}
                  </div>
                  <div className="text-[14px] font-bold" style={{ color: mode === m.id ? 'var(--text)' : 'var(--text-secondary)' }}>{m.label}</div>
                  <div className="text-[11px] mt-1" style={{ color: mode === m.id ? 'var(--text-secondary)' : 'var(--text-faint)' }}>{m.desc}</div>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Settings */}
          <motion.div variants={fadeUp} className="p-6 rounded-2xl" style={{ background: 'linear-gradient(135deg, var(--bg-card-gradient-start), var(--bg-card-gradient-end))', border: '1px solid var(--border)' }}>
            <h3 className="text-[16px] font-bold mb-6">Settings</h3>
            <div className="space-y-8">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-[13px] font-semibold text-[var(--text-secondary)]">Daily Apply Limit</label>
                  <span className="text-[14px] font-black text-[var(--accent)]">{dailyLimit}/day</span>
                </div>
                <input type="range" min="5" max="50" value={dailyLimit} onChange={e => setDailyLimit(parseInt(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer" style={{ background: `linear-gradient(to right, var(--accent) 0%, var(--accent) ${((dailyLimit - 5) / 45) * 100}%, var(--bg-overlay) ${((dailyLimit - 5) / 45) * 100}%, var(--bg-overlay) 100%)` }} />
                <div className="flex justify-between mt-2 text-[10px] text-[var(--text-faint)]"><span>5</span><span>50</span></div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-[13px] font-semibold text-[var(--text-secondary)]">Match Threshold</label>
                  <span className="text-[14px] font-black text-[var(--green)]">{matchThreshold}%</span>
                </div>
                <input type="range" min="50" max="100" value={matchThreshold} onChange={e => setMatchThreshold(parseInt(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer" style={{ background: `linear-gradient(to right, var(--green) 0%, var(--green) ${((matchThreshold - 50) / 50) * 100}%, var(--bg-overlay) ${((matchThreshold - 50) / 50) * 100}%, var(--bg-overlay) 100%)` }} />
                <div className="flex justify-between mt-2 text-[10px] text-[var(--text-faint)]"><span>50%</span><span>100%</span></div>
              </div>
            </div>
          </motion.div>

          {/* Sources — reported, not claimed. Each row is a live check. */}
          <motion.div variants={fadeUp} className="p-6 rounded-2xl" style={{ background: 'linear-gradient(135deg, var(--bg-card-gradient-start), var(--bg-card-gradient-end))', border: '1px solid var(--border)' }}>
            <div className="flex items-baseline justify-between mb-1">
              <h3 className="text-[16px] font-bold">Where jobs come from</h3>
              {sourceStatus && (
                <span className="text-[11px]" style={{ color: 'var(--text-faint)' }}>
                  checked just now
                </span>
              )}
            </div>
            <p className="text-[12px] mb-4" style={{ color: 'var(--text-muted)' }}>
              These are the sources we actually query. Status is checked live, not assumed.
            </p>

            {!sourceStatus && (
              <p className="text-[12.5px] py-3" style={{ color: 'var(--text-muted)' }}>
                Checking sources…
              </p>
            )}

            <div className="space-y-2">
              {(sourceStatus ?? []).map((s: any) => (
                <div
                  key={s.id}
                  className="flex items-start gap-3 p-3 rounded-xl"
                  style={{ background: 'var(--bg-overlay)', boxShadow: 'inset 0 0 0 1px var(--card-ring)' }}
                >
                  <span
                    className="mt-1.5 w-2 h-2 rounded-full shrink-0"
                    style={{ background: s.reachable ? 'var(--green)' : 'var(--red)' }}
                    aria-label={s.reachable ? 'reachable' : 'unreachable'}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>
                        {s.name}
                      </span>
                      {s.canApply ? (
                        <span
                          className="px-1.5 py-0.5 rounded text-[9.5px] font-bold tracking-wide"
                          style={{ background: 'var(--green-dim)', color: 'var(--green)' }}
                        >
                          CAN AUTO-APPLY
                        </span>
                      ) : (
                        <span
                          className="px-1.5 py-0.5 rounded text-[9.5px] font-semibold tracking-wide"
                          style={{ background: 'var(--bg-card)', color: 'var(--text-faint)' }}
                        >
                          SEARCH ONLY
                        </span>
                      )}
                    </div>
                    <p className="text-[11.5px] mt-0.5 leading-snug" style={{ color: 'var(--text-muted)' }}>
                      {s.covers}
                    </p>
                    {s.note && (
                      <p className="text-[11px] mt-0.5" style={{ color: 'var(--red)' }}>
                        {s.note}
                      </p>
                    )}
                  </div>
                  {typeof s.sample === 'number' && s.reachable && (
                    <span className="text-[11px] tabular-nums shrink-0 mt-0.5" style={{ color: 'var(--text-faint)' }}>
                      {s.sample.toLocaleString()}
                    </span>
                  )}
                </div>
              ))}
            </div>

            <p className="text-[11px] mt-3 leading-relaxed" style={{ color: 'var(--text-faint)' }}>
              LinkedIn, Indeed and Glassdoor block automated access and are not searched. Anything
              claiming otherwise is guessing.
            </p>
          </motion.div>

          <motion.div variants={fadeUp} className="space-y-3">
            {/* Activate Engine Button */}
            {mode !== 'off' ? (
              <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={saveSettings} disabled={saving}
                className="w-full py-4 rounded-xl font-bold text-[15px] text-ink disabled:opacity-30 transition-all flex items-center justify-center gap-3"
                style={{ background: saved ? 'linear-gradient(135deg, var(--green), var(--green))' : mode === 'autopilot' ? 'linear-gradient(135deg, var(--green), var(--green))' : 'linear-gradient(135deg, var(--blue), var(--blue))' }}>
                {saving ? (
                  <>
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-4 h-4 rounded-full border-2 border-[var(--border)] border-t-white" />
                    Activating...
                  </>
                ) : saved ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    {mode === 'autopilot' ? 'Autopilot Engine Active!' : 'Copilot Mode Active!'}
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polygon points="13,2 3,14 12,14 11,22 21,10 12,10"/></svg>
                    {mode === 'autopilot' ? 'Activate Autopilot Engine' : 'Activate Copilot Mode'}
                  </>
                )}
              </motion.button>
            ) : (
              <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={saveSettings} disabled={saving}
                className="w-full py-4 rounded-xl font-bold text-[14px] text-ink disabled:opacity-30 transition-all"
                style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border)' }}>
                {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save Settings (Engine Off)'}
              </motion.button>
            )}
            {mode !== 'off' && !saved && (
              <p className="text-center text-[11px] text-[var(--text-muted)]">Select your mode above, configure settings, then click Activate</p>
            )}

            {/* Test Auto-Apply Button - Always Available */}
            <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={testAutoApply} disabled={testingAuto}
              className="w-full py-3 rounded-xl font-bold text-[13px] text-ink disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              style={{ background: 'rgb(var(--blue-rgb) / calc(0.1 * var(--tint-scale)))', border: '1px solid rgb(var(--blue-rgb) / calc(0.2 * var(--tint-scale)))' }}>
              {testingAuto ? (
                <>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-3 h-3 rounded-full border-2 border-[var(--border)] border-t-[var(--blue)]" />
                  Searching &amp; matching jobs...
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13,2 3,14 12,14 11,22 21,10 12,10"/></svg>
                  Run Auto-Apply Now
                </>
              )}
            </motion.button>
            {testResult && (
              <div className="text-center text-[12px] font-medium py-2 px-4 rounded-lg"
                style={{ background: testResult.startsWith('✅') ? 'rgb(var(--green-rgb) / calc(0.1 * var(--tint-scale)))' : 'rgba(255,100,100,0.1)', color: testResult.startsWith('✅') ? 'var(--green)' : 'var(--red)' }}>
                {testResult}
              </div>
            )}
          </motion.div>

          {/* Info Banner */}
          <motion.div variants={fadeUp} className="p-5 rounded-2xl" style={{ background: 'rgb(var(--blue-rgb) / calc(0.04 * var(--tint-scale)))', border: '1px solid rgb(var(--blue-rgb) / calc(0.1 * var(--tint-scale)))' }}>
            <div className="flex items-start gap-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2" className="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <div>
                <div className="text-[13px] font-bold text-[var(--blue)] mb-1">How Auto-Apply Works</div>
                <div className="text-[12px] text-[var(--text-muted)] leading-relaxed space-y-1">
                  <p>• <strong className="text-[var(--text-secondary)]">Copilot:</strong> AI finds matching jobs and queues them for your review — you approve before each send.</p>
                  <p>• <strong className="text-[var(--text-secondary)]">Autopilot:</strong> AI applies automatically to jobs above your match threshold (Elite plan feature).</p>
                  <p>• Activity logs will appear here once applications start processing.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Activity Feed - Real-time Updates */}
        <motion.div variants={fadeUp} className="h-fit">
          <ActivityFeed />
        </motion.div>
      </div>

      {/* ── God Mode Panel ───────────────────────────────────────────── */}
      <motion.div variants={fadeUp} className="rounded-2xl overflow-hidden" style={{
        border: godModeEnabled ? '1px solid rgb(var(--accent-rgb) / 0.25)' : '1px solid var(--border)',
        background: godModeEnabled
          ? 'linear-gradient(135deg, rgb(var(--accent-rgb) / calc(0.06 * var(--tint-scale))) 0%, rgba(108,92,231,0.04) 100%)'
          : 'var(--bg-card)',
      }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: godModeEnabled ? 'rgb(var(--accent-rgb) / calc(0.12 * var(--tint-scale)))' : 'var(--border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: godModeEnabled ? 'rgb(var(--accent-rgb) / calc(0.15 * var(--tint-scale)))' : 'var(--bg-overlay)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={godModeEnabled ? 'var(--accent-solid)' : 'var(--text-muted)'} strokeWidth="2">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-black" style={{ color: 'var(--text)' }}>God Mode</span>
                {godModeEnabled && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-[var(--text-on-accent)]" style={{ background: 'linear-gradient(135deg, var(--accent-solid), var(--purple))' }}>ACTIVE</span>
                )}
              </div>
              <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                AI tailors your resume + writes cover letter for every job before submitting
              </p>
            </div>
          </div>
          {/* Toggle */}
          <button
            onClick={() => setGodModeEnabled(v => !v)}
            className="relative w-12 h-6 rounded-full transition-all duration-300 flex-shrink-0"
            style={{ background: godModeEnabled ? 'linear-gradient(135deg, var(--accent-solid), var(--accent-solid))' : 'var(--bg-overlay)', border: '1px solid var(--border)' }}
          >
            <span
              className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-300"
              style={{ left: godModeEnabled ? '26px' : '2px' }}
            />
          </button>
        </div>

        {/* God Mode options */}
        {godModeEnabled && (
          <div className="p-6 space-y-5">
            {/* What God Mode does */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: '📄', title: 'Resume Tailoring', desc: 'ATS keywords injected per job', active: godModeTailorResume, toggle: () => setGodModeTailorResume(v => !v) },
                { icon: '✉️', title: 'Cover Letter', desc: 'Personalized letter per job', active: godModeCoverLetter, toggle: () => setGodModeCoverLetter(v => !v) },
                { icon: '🎯', title: 'ATS Submission', desc: 'Direct API: Greenhouse, Lever, Ashby', active: true, toggle: () => {} },
              ].map((item, i) => (
                <div key={i}
                  onClick={item.toggle}
                  className={`rounded-xl p-4 transition-all duration-200 ${i < 2 ? 'cursor-pointer' : 'cursor-default'}`}
                  style={{
                    background: item.active ? 'rgb(var(--accent-rgb) / calc(0.06 * var(--tint-scale)))' : 'var(--bg-overlay)',
                    border: `1px solid ${item.active ? 'rgb(var(--accent-rgb) / calc(0.2 * var(--tint-scale)))' : 'var(--border)'}`,
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-lg">{item.icon}</span>
                    {i < 2 && (
                      <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center" style={{ borderColor: item.active ? 'var(--accent-solid)' : 'var(--border)' }}>
                        {item.active && <div className="w-2 h-2 rounded-full bg-[var(--accent-solid)]" />}
                      </div>
                    )}
                    {i === 2 && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded text-[var(--green)]" style={{ background: 'rgb(var(--green-rgb) / calc(0.1 * var(--tint-scale)))' }}>Always on</span>}
                  </div>
                  <div className="text-[12px] font-bold" style={{ color: item.active ? 'var(--text)' : 'var(--text-muted)' }}>{item.title}</div>
                  <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-faint)' }}>{item.desc}</div>
                </div>
              ))}
            </div>

            {/* Score threshold */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-[13px] font-bold" style={{ color: 'var(--text)' }}>Minimum Score to Auto-Apply</span>
                  <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Only apply to jobs scoring at or above this grade</p>
                </div>
                <span className="text-[20px] font-black" style={{ color: 'var(--accent-solid)' }}>{godModeScoreThreshold}</span>
              </div>
              <div className="flex gap-2">
                {(['A', 'B', 'C'] as const).map(grade => (
                  <button
                    key={grade}
                    onClick={() => setGodModeScoreThreshold(grade)}
                    className="flex-1 py-2.5 rounded-xl text-[13px] font-bold transition-all duration-200"
                    style={godModeScoreThreshold === grade
                      ? { background: 'linear-gradient(135deg, var(--accent-solid), var(--accent-solid))', color: '#fff', boxShadow: '0 4px 14px rgb(var(--accent-rgb) / 0.25)' }
                      : { background: 'var(--bg-overlay)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                  >
                    {grade === 'A' ? 'A (85%+) — Elite only' : grade === 'B' ? 'B (70%+) — Recommended' : 'C (55%+) — Wider net'}
                  </button>
                ))}
              </div>
            </div>

            {/* Supported portals */}
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>Supported ATS portals:</span> Greenhouse · Lever · Ashby — covers thousands of tech companies.
                For LinkedIn/Indeed, Chrome Extension coming soon.
              </p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Analytics Cards - Today, This Week, This Month */}
      {applications.length > 0 && (
        <motion.div variants={fadeUp} className="grid sm:grid-cols-3 gap-4">
          {[
            { period: 'Today', apps: analytics.today.apps, rate: analytics.today.success, color: 'var(--blue)' },
            { period: 'This Week', apps: analytics.thisWeek.apps, rate: analytics.thisWeek.success, color: 'var(--accent)' },
            { period: 'This Month', apps: analytics.thisMonth.apps, rate: analytics.thisMonth.success, color: 'var(--purple)' },
          ].map((stat, i) => (
            <div
              key={stat.period}
              className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6"
              style={{ animation: `floatUp 0.5s ease ${i * 0.1}s both` }}
            >
              <div className="text-[12px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">{stat.period}</div>
              <div className="space-y-4">
                <div>
                  <div className="text-[13px] text-[var(--text-secondary)] mb-1">Applications</div>
                  <div className="font-display text-[1.9rem] text-[var(--text)]">
                    <AnimatedNumber value={stat.apps} delay={i * 150} />
                  </div>
                </div>
                <div>
                  <div className="text-[13px] text-[var(--text-secondary)] mb-1">Success Rate</div>
                  <div className="font-display text-[1.9rem]" style={{ color: stat.color }}>
                    <AnimatedNumber value={stat.rate} delay={i * 150 + 100} />%
                  </div>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Charts Section */}
      {applications.length > 0 && (
        <motion.div variants={fadeUp} className="grid lg:grid-cols-3 gap-6">
          <ApplicationSourceChart applications={applications} />
          <TrendLineChart applications={applications} />
          <SuccessDonutChart applications={applications} />
        </motion.div>
      )}
    </motion.div>
  )
}
