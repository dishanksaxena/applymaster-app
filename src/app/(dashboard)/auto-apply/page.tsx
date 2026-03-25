'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'

export default function AutoApplyPage() {
  const [mode, setMode] = useState<'copilot' | 'autopilot' | 'off'>('off')
  const [dailyLimit, setDailyLimit] = useState(10)
  const [matchThreshold, setMatchThreshold] = useState(80)
  const [activeSources, setActiveSources] = useState(['LinkedIn', 'Indeed', 'Glassdoor'])
  const [logs, setLogs] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('job_preferences').select('*').eq('user_id', user.id).single()
    if (data) {
      setMode(data.auto_apply_mode)
      setDailyLimit(data.daily_apply_limit)
      setMatchThreshold(data.match_threshold)
    }

    // Load recent activity
    const { data: logData } = await supabase.from('apply_log').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20)
    if (logData) setLogs(logData)
  }

  const saveSettings = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('job_preferences').upsert({
      user_id: user.id,
      auto_apply_mode: mode,
      daily_apply_limit: dailyLimit,
      match_threshold: matchThreshold,
    })
    alert('Settings saved!')
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black tracking-tight mb-1">Auto-Apply Engine</h2>
        <p className="text-[14px] text-[#8a8a9a]">Let AI handle the applications while you focus on preparing for interviews.</p>
      </div>

      <div className="grid lg:grid-cols-[1fr_380px] gap-6">
        {/* Main */}
        <div className="space-y-6">
          {/* Mode Selection */}
          <div className="p-6 rounded-2xl bg-[#12121a] border border-[rgba(255,255,255,0.06)]">
            <h3 className="text-[15px] font-bold mb-5">Operating Mode</h3>
            <div className="space-y-3">
              {[
                { id: 'off', label: 'Off', desc: 'No auto-apply', icon: '⏹️' },
                { id: 'copilot', label: 'Copilot', desc: 'Review before submit', icon: '👁️' },
                { id: 'autopilot', label: 'Autopilot', desc: 'Apply automatically', icon: '⚡' },
              ].map(m => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id as any)}
                  className={`w-full p-4 rounded-xl border transition-all text-left flex items-center justify-between ${
                    mode === m.id ? 'bg-[rgba(253,121,168,0.08)] border-[rgba(253,121,168,0.2)]' : 'bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.1)]'
                  }`}
                >
                  <div>
                    <div className="text-[14px] font-bold flex items-center gap-2">
                      <span>{m.icon}</span>
                      {m.label}
                    </div>
                    <div className="text-[11px] text-[#5a5a6a] mt-1">{m.desc}</div>
                  </div>
                  {mode === m.id && <div className="w-3 h-3 rounded-full bg-[#fd79a8]" />}
                </button>
              ))}
            </div>
          </div>

          {/* Settings */}
          <div className="p-6 rounded-2xl bg-[#12121a] border border-[rgba(255,255,255,0.06)]">
            <h3 className="text-[15px] font-bold mb-5">Settings</h3>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-[13px] font-semibold">Daily Apply Limit</label>
                  <span className="text-[13px] font-bold text-[#fd79a8]">{dailyLimit}/day</span>
                </div>
                <input type="range" min="5" max="50" value={dailyLimit} onChange={e => setDailyLimit(parseInt(e.target.value))} className="w-full" />
                <div className="text-[11px] text-[#5a5a6a] mt-2">Max applications per day</div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-[13px] font-semibold">Match Threshold</label>
                  <span className="text-[13px] font-bold text-[#00b894]">{matchThreshold}%</span>
                </div>
                <input type="range" min="50" max="100" value={matchThreshold} onChange={e => setMatchThreshold(parseInt(e.target.value))} className="w-full" />
                <div className="text-[11px] text-[#5a5a6a] mt-2">Only apply to jobs above this match %</div>
              </div>
            </div>
          </div>

          {/* Job Sources */}
          <div className="p-6 rounded-2xl bg-[#12121a] border border-[rgba(255,255,255,0.06)]">
            <h3 className="text-[15px] font-bold mb-5">Job Sources</h3>
            <div className="grid grid-cols-2 gap-3">
              {['LinkedIn', 'Indeed', 'Glassdoor', 'ZipRecruiter', 'Greenhouse', 'Lever'].map(source => (
                <button
                  key={source}
                  onClick={() => setActiveSources(activeSources.includes(source) ? activeSources.filter(s => s !== source) : [...activeSources, source])}
                  className={`p-3 rounded-xl border text-[12px] font-bold transition-all ${
                    activeSources.includes(source) ? 'bg-[rgba(253,121,168,0.08)] border-[rgba(253,121,168,0.2)] text-[#fd79a8]' : 'bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.06)] text-[#8a8a9a]'
                  }`}
                >
                  {source}
                </button>
              ))}
            </div>
          </div>

          <button onClick={saveSettings} className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#fd79a8] to-[#e84393] text-white font-bold text-[14px] hover:shadow-[0_8px_30px_rgba(253,121,168,0.3)] transition-all">
            💾 Save Settings
          </button>
        </div>

        {/* Activity Feed */}
        <div className="h-fit p-6 rounded-2xl bg-[#12121a] border border-[rgba(255,255,255,0.06)]">
          <h3 className="text-[15px] font-bold mb-5">Recent Activity</h3>
          {logs.length === 0 ? (
            <div className="text-center py-8 text-[#5a5a6a]">
              <div className="text-2xl mb-2">📭</div>
              <div className="text-[11px]">No activity yet</div>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log, i) => (
                <div key={i} className="text-[12px] space-y-0.5 pb-3 border-b border-[rgba(255,255,255,0.04)] last:border-0">
                  <div className="font-semibold text-white">{log.action}</div>
                  {log.details && <div className="text-[11px] text-[#5a5a6a]">{log.details}</div>}
                  <div className="text-[10px] text-[#3a3a4a]">{new Date(log.created_at).toLocaleTimeString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
