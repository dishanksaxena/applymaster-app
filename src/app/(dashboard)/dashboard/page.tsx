'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'

interface DashStats {
  applied: number
  interviews: number
  offers: number
  matchRate: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashStats>({ applied: 0, interviews: 0, offers: 0, matchRate: 0 })
  const [recentActivity, setRecentActivity] = useState<{ action: string; details: string | null; created_at: string }[]>([])
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch application stats
      const { data: apps } = await supabase.from('applications').select('status, match_score').eq('user_id', user.id)
      if (apps) {
        const applied = apps.filter(a => !['saved', 'queued'].includes(a.status)).length
        const interviews = apps.filter(a => a.status === 'interview').length
        const offers = apps.filter(a => a.status === 'offer').length
        const scores = apps.filter(a => a.match_score).map(a => a.match_score!)
        const matchRate = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
        setStats({ applied, interviews, offers, matchRate })
      }

      // Fetch recent activity
      const { data: logs } = await supabase.from('apply_log').select('action, details, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10)
      if (logs) setRecentActivity(logs)
    }
    load()
  }, [supabase])

  const statCards = [
    { label: 'Applied', value: stats.applied, delta: '+18%', color: '#fd79a8', icon: '📨' },
    { label: 'Interviews', value: stats.interviews, delta: '+32%', color: '#00b894', icon: '🎯' },
    { label: 'Offers', value: stats.offers, delta: '+100%', color: '#74b9ff', icon: '🎉' },
    { label: 'Avg Match', value: `${stats.matchRate}%`, delta: '+12%', color: '#a29bfe', icon: '📊' },
  ]

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-black tracking-tight mb-1">Welcome back</h2>
        <p className="text-[14px] text-[#8a8a9a]">Here&apos;s what&apos;s happening with your job search today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(s => (
          <div key={s.label} className="p-5 rounded-2xl bg-[#12121a] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.1)] transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: `${s.color}12` }}>{s.icon}</div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[rgba(0,184,148,0.08)] text-[#00b894]">{s.delta}</span>
            </div>
            <div className="text-3xl font-black" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[12px] text-[#5a5a6a] mt-1 font-medium">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_380px] gap-6">
        {/* Quick Actions */}
        <div className="p-6 rounded-2xl bg-[#12121a] border border-[rgba(255,255,255,0.06)]">
          <h3 className="text-[15px] font-bold mb-5">Quick Actions</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { label: 'Search Jobs', desc: 'Browse 50+ portals', href: '/jobs', color: '#fd79a8', icon: '🔍' },
              { label: 'Optimize Resume', desc: 'Boost your ATS score', href: '/resume', color: '#00b894', icon: '📄' },
              { label: 'Generate Cover Letter', desc: 'AI-powered, personalized', href: '/cover-letters', color: '#74b9ff', icon: '✉️' },
              { label: 'Start Auto-Apply', desc: 'Copilot or Autopilot', href: '/auto-apply', color: '#a29bfe', icon: '⚡' },
            ].map(a => (
              <a key={a.label} href={a.href} className="flex items-center gap-4 p-4 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)] hover:border-[rgba(255,255,255,0.1)] transition-all group">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0" style={{ background: `${a.color}12` }}>{a.icon}</div>
                <div>
                  <div className="text-[13px] font-semibold group-hover:text-[#fd79a8] transition-colors">{a.label}</div>
                  <div className="text-[11px] text-[#5a5a6a]">{a.desc}</div>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="p-6 rounded-2xl bg-[#12121a] border border-[rgba(255,255,255,0.06)]">
          <h3 className="text-[15px] font-bold mb-5">Recent Activity</h3>
          {recentActivity.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-3xl mb-3">📭</div>
              <p className="text-[13px] text-[#5a5a6a]">No activity yet. Start by uploading your resume!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((log, i) => (
                <div key={i} className="flex items-start gap-3 text-[12px]">
                  <span className="text-[#3a3a4a] shrink-0 font-mono text-[10px] mt-0.5">{new Date(log.created_at).toLocaleTimeString()}</span>
                  <div>
                    <span className="text-[#8a8a9a]">{log.action}</span>
                    {log.details && <span className="text-[#5a5a6a]"> — {log.details}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
