'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase-browser'

interface ActivityLog {
  id: string
  user_id: string
  action: string
  details: string | null
  created_at: string
}

const activityColors = {
  queued_applications: { bg: 'rgba(116,185,255,0.1)', text: '#74b9ff', icon: '⏳' },
  auto_applied: { bg: 'rgba(52,211,153,0.1)', text: '#34d399', icon: '✨' },
  scanning: { bg: 'rgba(167,139,250,0.1)', text: '#a78bfa', icon: '🔍' },
  matched: { bg: 'rgba(59,130,246,0.1)', text: '#3b82f6', icon: '✅' },
  analyzing: { bg: 'rgba(244,114,182,0.1)', text: '#f472b6', icon: '🔬' },
  default: { bg: 'rgba(255,255,255,0.05)', text: '#6a6a7a', icon: '📝' }
}

export default function ActivityFeed() {
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const loadActivities = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setLoading(false)
          return
        }

        console.log('[ActivityFeed] Loading activities for user:', user.id)

        // Load recent activity logs
        const { data, error } = await supabase
          .from('apply_log')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50)

        if (error) {
          console.error('[ActivityFeed] Error loading:', error)
          setLoading(false)
          return
        }

        if (data) {
          console.log('[ActivityFeed] Loaded', data.length, 'activities')
          setActivities(data)
        }
        setLoading(false)
      } catch (err) {
        console.error('[ActivityFeed] Exception:', err)
        setLoading(false)
      }
    }

    loadActivities()

    // Reload activities every 3 seconds to see new logs
    const interval = setInterval(loadActivities, 3000)

    // Real-time subscription
    const channel = supabase
      .channel('apply_log_updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'apply_log',
        },
        (payload: any) => {
          console.log('[ActivityFeed] New log received:', payload.new)
          const newLog = payload.new as ActivityLog
          setActivities((prev) => [newLog, ...prev.slice(0, 49)])
        }
      )
      .subscribe()

    return () => {
      clearInterval(interval)
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const formatTime = (dateStr: string): string => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
  }

  const getActionStyle = (action: string) => {
    const actionLower = action.toLowerCase()
    if (actionLower.includes('queue')) return activityColors.queued_applications
    if (actionLower.includes('auto_applied')) return activityColors.auto_applied
    if (actionLower.includes('scan')) return activityColors.scanning
    if (actionLower.includes('match')) return activityColors.matched
    if (actionLower.includes('analyz')) return activityColors.analyzing
    return activityColors.default
  }

  return (
    <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#0d0d15] p-6 h-fit">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[14px] font-bold text-white">Live Activity Feed</h3>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#00b894] animate-pulse" />
          <span className="text-[10px] text-[#00b894] font-medium">auto-refreshing</span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-5 h-5 rounded-full border-2 border-[rgba(116,185,255,0.2)] border-t-[#74b9ff] animate-spin" />
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-[12px] text-[#5a5a6a] font-medium">No activity yet</p>
          <p className="text-[10px] text-[#3a3a4a] mt-2">Run auto-apply to see live activity</p>
        </div>
      ) : (
        <div className="space-y-1 max-h-[500px] overflow-y-auto font-mono text-[11px]">
          {activities.map((activity) => {
            const style = getActionStyle(activity.action)
            const time = formatTime(activity.created_at)

            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-2 rounded-lg transition-all hover:bg-[rgba(255,255,255,0.03)]"
                style={{ backgroundColor: style.bg }}
              >
                <div className="flex items-start gap-2">
                  <span className="text-lg flex-shrink-0">{style.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span style={{ color: '#5a5a6a' }} className="text-[10px]">{time}</span>
                      <span style={{ color: style.text }} className="font-semibold">→</span>
                      <span style={{ color: style.text }}>
                        {activity.action.replace(/_/g, ' ').charAt(0).toUpperCase() + activity.action.replace(/_/g, ' ').slice(1)}
                      </span>
                    </div>
                    {activity.details && (
                      <div style={{ color: '#8a8a9a' }} className="text-[10px] mt-0.5 line-clamp-1">
                        {activity.details}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
