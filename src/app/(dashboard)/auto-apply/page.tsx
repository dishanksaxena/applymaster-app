'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase-browser'

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } }
const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } } }

const sources = [
  { name: 'LinkedIn', color: '#0077b5', icon: 'in' },
  { name: 'Indeed', color: '#2164f3', icon: 'I' },
  { name: 'Glassdoor', color: '#0caa41', icon: 'G' },
  { name: 'ZipRecruiter', color: '#5ba71b', icon: 'Z' },
  { name: 'Greenhouse', color: '#3ab549', icon: 'GH' },
  { name: 'Lever', color: '#1f2532', icon: 'L' },
]

export default function AutoApplyPage() {
  const [mode, setMode] = useState<'copilot' | 'autopilot' | 'off'>('off')
  const [dailyLimit, setDailyLimit] = useState(10)
  const [matchThreshold, setMatchThreshold] = useState(80)
  const [activeSources, setActiveSources] = useState(['LinkedIn', 'Indeed', 'Glassdoor'])
  const [logs, setLogs] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [mounted, setMounted] = useState(false)
  const supabase = createClient()

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('job_preferences').select('*').eq('user_id', user.id).single()
      if (data) { setMode(data.auto_apply_mode); setDailyLimit(data.daily_apply_limit); setMatchThreshold(data.match_threshold) }
      const { data: logData } = await supabase.from('apply_log').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20)
      if (logData) setLogs(logData)
    }
    load()
  }, [supabase])

  const saveSettings = async () => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('job_preferences').upsert({ user_id: user.id, auto_apply_mode: mode, daily_apply_limit: dailyLimit, match_threshold: matchThreshold })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const modes = [
    { id: 'off' as const, label: 'Off', desc: 'Auto-apply disabled', color: '#5a5a6a', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> },
    { id: 'copilot' as const, label: 'Copilot', desc: 'Review before each application is sent', color: '#74b9ff', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> },
    { id: 'autopilot' as const, label: 'Autopilot', desc: 'AI applies automatically to matching jobs', color: '#00b894', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="13,2 3,14 12,14 11,22 21,10 12,10"/></svg> },
  ]

  if (!mounted) return <div className="p-8" />

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8 max-w-[1200px] mx-auto">

      {/* Header */}
      <motion.div variants={fadeUp} className="relative overflow-hidden rounded-2xl p-8" style={{
        background: 'linear-gradient(135deg, rgba(0,184,148,0.08) 0%, rgba(253,121,168,0.06) 100%)',
        border: `1px solid ${mode === 'autopilot' ? 'rgba(0,184,148,0.15)' : mode === 'copilot' ? 'rgba(116,185,255,0.15)' : 'rgba(255,255,255,0.1)'}`,
      }}>
        <div className="absolute top-[-50%] right-[-10%] w-[300px] h-[300px] rounded-full opacity-[0.07]" style={{ background: 'radial-gradient(circle, #00b894, transparent 70%)' }} />
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: mode === 'autopilot' ? 'rgba(0,184,148,0.15)' : mode === 'copilot' ? 'rgba(116,185,255,0.15)' : 'rgba(255,255,255,0.1)' }}>
              <motion.div animate={mode !== 'off' ? { scale: [1, 1.15, 1] } : {}} transition={{ duration: 1.5, repeat: Infinity }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={mode === 'autopilot' ? '#00b894' : mode === 'copilot' ? '#74b9ff' : '#5a5a6a'} strokeWidth="1.8"><polygon points="13,2 3,14 12,14 11,22 21,10 12,10"/></svg>
              </motion.div>
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-black tracking-tight">Auto-Apply Engine</h1>
              <p className="text-[14px] text-[#8a8a9a] mt-1">Let AI handle applications while you prepare for interviews</p>
            </div>
          </div>
          {mode !== 'off' && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: mode === 'autopilot' ? 'rgba(0,184,148,0.1)' : 'rgba(116,185,255,0.1)', border: `1px solid ${mode === 'autopilot' ? 'rgba(0,184,148,0.2)' : 'rgba(116,185,255,0.2)'}` }}>
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping" style={{ background: mode === 'autopilot' ? '#00b894' : '#74b9ff' }} />
                <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: mode === 'autopilot' ? '#00b894' : '#74b9ff' }} />
              </span>
              <span className="text-[12px] font-bold capitalize" style={{ color: mode === 'autopilot' ? '#00b894' : '#74b9ff' }}>{mode} Active</span>
            </div>
          )}
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-[1fr_380px] gap-6">
        <div className="space-y-6">

          {/* Mode Selection */}
          <motion.div variants={fadeUp} className="p-6 rounded-2xl" style={{ background: 'linear-gradient(135deg, #1c1c2e 0%, #16162a 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 className="text-[16px] font-bold mb-4">Operating Mode</h3>
            <div className="grid sm:grid-cols-3 gap-3">
              {modes.map(m => (
                <motion.button key={m.id} whileHover={{ y: -3, scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setMode(m.id)}
                  className="p-5 rounded-xl text-left transition-all duration-300"
                  style={mode === m.id ? { background: `${m.color}10`, border: `1px solid ${m.color}30`, boxShadow: `0 0 20px ${m.color}08` } : { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${m.color}15`, color: m.color }}>{m.icon}</div>
                    {mode === m.id && <div className="w-3 h-3 rounded-full" style={{ background: m.color, boxShadow: `0 0 8px ${m.color}` }} />}
                  </div>
                  <div className="text-[14px] font-bold" style={{ color: mode === m.id ? 'white' : '#6a6a7a' }}>{m.label}</div>
                  <div className="text-[11px] mt-1" style={{ color: mode === m.id ? '#8a8a9a' : '#4a4a5a' }}>{m.desc}</div>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Settings */}
          <motion.div variants={fadeUp} className="p-6 rounded-2xl" style={{ background: 'linear-gradient(135deg, #1c1c2e 0%, #16162a 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 className="text-[16px] font-bold mb-6">Settings</h3>
            <div className="space-y-8">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-[13px] font-semibold text-[#8a8a9a]">Daily Apply Limit</label>
                  <span className="text-[14px] font-black text-[#fd79a8]">{dailyLimit}/day</span>
                </div>
                <input type="range" min="5" max="50" value={dailyLimit} onChange={e => setDailyLimit(parseInt(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer" style={{ background: `linear-gradient(to right, #fd79a8 0%, #fd79a8 ${((dailyLimit - 5) / 45) * 100}%, rgba(255,255,255,0.1) ${((dailyLimit - 5) / 45) * 100}%, rgba(255,255,255,0.1) 100%)` }} />
                <div className="flex justify-between mt-2 text-[10px] text-[#3a3a4a]"><span>5</span><span>50</span></div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-[13px] font-semibold text-[#8a8a9a]">Match Threshold</label>
                  <span className="text-[14px] font-black text-[#00b894]">{matchThreshold}%</span>
                </div>
                <input type="range" min="50" max="100" value={matchThreshold} onChange={e => setMatchThreshold(parseInt(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer" style={{ background: `linear-gradient(to right, #00b894 0%, #00b894 ${((matchThreshold - 50) / 50) * 100}%, rgba(255,255,255,0.1) ${((matchThreshold - 50) / 50) * 100}%, rgba(255,255,255,0.1) 100%)` }} />
                <div className="flex justify-between mt-2 text-[10px] text-[#3a3a4a]"><span>50%</span><span>100%</span></div>
              </div>
            </div>
          </motion.div>

          {/* Sources */}
          <motion.div variants={fadeUp} className="p-6 rounded-2xl" style={{ background: 'linear-gradient(135deg, #1c1c2e 0%, #16162a 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 className="text-[16px] font-bold mb-4">Job Sources</h3>
            <div className="grid grid-cols-3 gap-3">
              {sources.map(source => {
                const active = activeSources.includes(source.name)
                return (
                  <motion.button key={source.name} whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveSources(active ? activeSources.filter(s => s !== source.name) : [...activeSources, source.name])}
                    className="p-4 rounded-xl text-center transition-all duration-300"
                    style={active ? { background: `${source.color}10`, border: `1px solid ${source.color}30` } : { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2 text-[11px] font-black"
                      style={{ background: active ? `${source.color}20` : 'rgba(255,255,255,0.04)', color: active ? source.color : '#5a5a6a' }}>{source.icon}</div>
                    <div className="text-[12px] font-bold" style={{ color: active ? 'white' : '#5a5a6a' }}>{source.name}</div>
                  </motion.button>
                )
              })}
            </div>
          </motion.div>

          <motion.button variants={fadeUp} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={saveSettings} disabled={saving}
            className="w-full py-4 rounded-xl font-bold text-[14px] text-white disabled:opacity-30 transition-all"
            style={{ background: saved ? 'linear-gradient(135deg, #00b894, #00a381)' : 'linear-gradient(135deg, #fd79a8, #e84393)' }}>
            {saving ? 'Saving...' : saved ? '✓ Settings Saved!' : 'Save Settings'}
          </motion.button>

          {/* Info Banner */}
          <motion.div variants={fadeUp} className="p-5 rounded-2xl" style={{ background: 'rgba(116,185,255,0.04)', border: '1px solid rgba(116,185,255,0.1)' }}>
            <div className="flex items-start gap-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#74b9ff" strokeWidth="2" className="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <div>
                <div className="text-[13px] font-bold text-[#74b9ff] mb-1">How Auto-Apply Works</div>
                <div className="text-[12px] text-[#5a5a6a] leading-relaxed space-y-1">
                  <p>• <strong className="text-[#8a8a9a]">Copilot:</strong> AI finds matching jobs and queues them for your review — you approve before each send.</p>
                  <p>• <strong className="text-[#8a8a9a]">Autopilot:</strong> AI applies automatically to jobs above your match threshold (Elite plan feature).</p>
                  <p>• Activity logs will appear here once applications start processing.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Activity Feed */}
        <motion.div variants={fadeUp} className="h-fit rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="flex items-center gap-2 px-5 py-3 border-b border-white/[0.04]" style={{ background: '#0d0d14' }}>
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
            </div>
            <span className="text-[10px] font-mono text-[#4a4a5a] ml-2">auto-apply — activity</span>
            {mode !== 'off' && (
              <div className="ml-auto flex items-center gap-1.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-[#00b894] opacity-60 animate-ping" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#00b894]" />
                </span>
                <span className="text-[9px] font-mono text-[#00b894]">LIVE</span>
              </div>
            )}
          </div>
          <div className="p-4 max-h-[500px] overflow-y-auto font-mono text-[11px] space-y-3" style={{ background: 'linear-gradient(180deg, #0d0d14, #0a0a10)' }}>
            {logs.length === 0 ? (
              <div className="text-center py-10">
                <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 2, repeat: Infinity }} className="text-[#4a4a5a]">
                  No activity yet...
                </motion.div>
                <p className="text-[#3a3a4a] text-[10px] mt-2">Enable Copilot or Autopilot to start</p>
              </div>
            ) : (
              logs.map((log, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                  className="pb-3 border-b border-white/[0.03] last:border-0">
                  <div className="flex items-start gap-2">
                    <span className="text-[#3a3a4a] shrink-0">{new Date(log.created_at).toLocaleTimeString('en-US', { hour12: false })}</span>
                    <span className="text-[#00b894]">$</span>
                    <span className="text-[#e0e0e8]">{log.action}</span>
                  </div>
                  {log.details && <div className="ml-[100px] text-[#5a5a6a] text-[10px] mt-0.5">{log.details}</div>}
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
