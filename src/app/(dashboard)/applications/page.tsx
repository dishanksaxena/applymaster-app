'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'
import type { Application } from '@/lib/database.types'

const statuses = ['saved', 'queued', 'applied', 'screening', 'interview', 'offer', 'rejected']
const statusLabels: Record<string, { label: string; color: string; icon: string }> = {
  saved: { label: 'Saved', color: '#8a8a9a', icon: '💾' },
  queued: { label: 'Queued', color: '#fdcb6e', icon: '⏳' },
  applied: { label: 'Applied', color: '#74b9ff', icon: '✉️' },
  screening: { label: 'Screening', color: '#a29bfe', icon: '👁️' },
  interview: { label: 'Interview', color: '#fd79a8', icon: '🎤' },
  offer: { label: 'Offer', color: '#00b894', icon: '🎉' },
  rejected: { label: 'Rejected', color: '#ff5f57', icon: '❌' },
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Map<string, Application[]>>(new Map())
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadApplications()
  }, [])

  const loadApplications = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase.from('applications').select('*, job:jobs(*)').eq('user_id', user.id).order('created_at', { ascending: false })

    const grouped = new Map<string, Application[]>()
    statuses.forEach(s => grouped.set(s, []))

    if (data) {
      data.forEach(app => {
        const list = grouped.get(app.status) || []
        list.push(app)
        grouped.set(app.status, list)
      })
    }

    setApplications(grouped)
    setLoading(false)
  }

  const updateStatus = async (appId: string, newStatus: string) => {
    await supabase.from('applications').update({ status: newStatus }).eq('id', appId)
    await loadApplications()
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black tracking-tight mb-1">Application Tracker</h2>
        <p className="text-[14px] text-[#8a8a9a]">Track your job applications through the pipeline.</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-[#5a5a6a]">Loading...</div>
      ) : (
        <div className="overflow-x-auto pb-6">
          <div className="flex gap-6 min-w-max">
            {statuses.map(status => {
              const apps = applications.get(status) || []
              const config = statusLabels[status]
              return (
                <div key={status} className="flex-shrink-0 w-[320px]">
                  {/* Column Header */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-lg">{config.icon}</span>
                    <h3 className="text-[13px] font-bold" style={{ color: config.color }}>
                      {config.label}
                    </h3>
                    <span className="ml-auto text-[11px] font-bold px-2 py-0.5 rounded-full bg-[rgba(255,255,255,0.05)]">
                      {apps.length}
                    </span>
                  </div>

                  {/* Card List */}
                  <div className="space-y-3">
                    {apps.map(app => (
                      <div key={app.id} className="p-4 rounded-xl bg-[#12121a] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.1)] transition-all group cursor-move">
                        <div className="text-[13px] font-bold text-white mb-2 line-clamp-2">
                          {app.job?.title || 'Job Title'}
                        </div>
                        <div className="text-[11px] text-[#8a8a9a] mb-3">
                          {app.job?.company || 'Company'} • {app.job?.location || 'Location'}
                        </div>

                        {app.match_score && (
                          <div className="mb-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-bold text-[#5a5a6a]">Match</span>
                              <span className="text-[10px] font-bold" style={{ color: config.color }}>
                                {app.match_score}%
                              </span>
                            </div>
                            <div className="h-1.5 rounded-full bg-[rgba(255,255,255,0.04)] overflow-hidden">
                              <div className="h-full" style={{ width: `${app.match_score}%`, background: config.color }} />
                            </div>
                          </div>
                        )}

                        {status !== 'rejected' && status !== 'offer' && (
                          <select
                            value={status}
                            onChange={e => updateStatus(app.id, e.target.value)}
                            className="w-full text-[10px] px-2 py-1.5 rounded-lg bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] text-white focus:outline-none focus:border-[rgba(253,121,168,0.2)]"
                          >
                            {statuses.map(s => (
                              <option key={s} value={s}>
                                {statusLabels[s].label}
                              </option>
                            ))}
                          </select>
                        )}

                        {(status === 'rejected' || status === 'offer') && (
                          <div className="text-[10px] font-bold px-2 py-1 rounded-lg text-center" style={{ color: config.color, backgroundColor: `${config.color}15` }}>
                            {status === 'offer' ? '🎉 Offer Received!' : '❌ Did not advance'}
                          </div>
                        )}
                      </div>
                    ))}

                    {apps.length === 0 && (
                      <div className="text-center py-8 text-[#5a5a6a]">
                        <div className="text-2xl mb-2">📭</div>
                        <div className="text-[11px]">No applications yet</div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
