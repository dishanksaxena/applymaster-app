'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase-browser'

interface ActivityItem {
  id: string
  application_id: string | null
  action: string
  details: string | null
  created_at: string
}

export default function ActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const loadActivities = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('apply_log')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(15)

      if (data) setActivities(data as ActivityItem[])
      setLoading(false)
    }

    loadActivities()

    // Subscribe to new activities in real-time
    const channel = supabase
      .channel('apply_log_realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'apply_log',
        },
        (payload) => {
          const newActivity = payload.new as ActivityItem
          setActivities((prev) => [newActivity, ...prev.slice(0, 14)])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const timeAgo = (dateStr: string): string => {
    const now = new Date()
    const date = new Date(dateStr)
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diff < 60) return 'just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
    return date.toLocaleDateString()
  }

  const getActionIcon = (action: string): string => {
    switch (action.toLowerCase()) {
      case 'applied':
        return '📨'
      case 'interview':
        return '🎤'
      case 'offer':
        return '🏆'
      case 'rejected':
        return '❌'
      case 'saved':
        return '💾'
      case 'cover_letter_generated':
        return '✍️'
      case 'resume_optimized':
        return '📄'
      default:
        return '📝'
    }
  }

  const getActionColor = (action: string): string => {
    switch (action.toLowerCase()) {
      case 'applied':
        return 'rgba(76,154,255,0.1)'
      case 'interview':
        return 'rgba(244,114,182,0.1)'
      case 'offer':
        return 'rgba(52,211,153,0.1)'
      case 'rejected':
        return 'rgba(248,113,113,0.1)'
      case 'saved':
        return 'rgba(167,139,250,0.1)'
      default:
        return 'rgba(255,255,255,0.05)'
    }
  }

  const getActionTextColor = (action: string): string => {
    switch (action.toLowerCase()) {
      case 'applied':
        return '#74b9ff'
      case 'interview':
        return '#f472b6'
      case 'offer':
        return '#34d399'
      case 'rejected':
        return '#f87171'
      case 'saved':
        return '#a78bfa'
      default:
        return '#6a6a7a'
    }
  }

  return (
    <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#0d0d15] p-6">
      <h3 className="text-[14px] font-bold text-white mb-4">Activity Feed</h3>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 rounded-full border-2 border-[rgba(116,185,255,0.2)] border-t-[#74b9ff] animate-spin" />
        </div>
      ) : activities.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-[#4a4a5a]">
          <p className="text-[13px] font-medium">No activity yet</p>
          <p className="text-[11px] mt-1">Your activities will appear here</p>
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {activities.map((activity, idx) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="p-3 rounded-xl transition-all hover:bg-[rgba(255,255,255,0.02)]"
                style={{ backgroundColor: getActionColor(activity.action) }}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className="text-xl flex-shrink-0 mt-0.5">
                    {getActionIcon(activity.action)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-white">
                      {activity.action.replace(/_/g, ' ').charAt(0).toUpperCase() + activity.action.replace(/_/g, ' ').slice(1)}
                    </p>
                    {activity.details && (
                      <p className="text-[11px] text-[#8a8a9a] mt-0.5 line-clamp-2">
                        {activity.details}
                      </p>
                    )}
                    <p className="text-[10px] text-[#5a5a6a] mt-1">
                      {timeAgo(activity.created_at)}
                    </p>
                  </div>

                  {/* Status dot */}
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0 mt-1"
                    style={{ backgroundColor: getActionTextColor(activity.action) }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  )
}
