'use client'

import { motion } from 'framer-motion'

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } } }

export default function NotificationsPage() {
  return (
    <motion.div initial="hidden" animate="show" variants={fadeUp} className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl p-8" style={{
        background: 'linear-gradient(135deg, rgba(253,121,168,0.08) 0%, rgba(116,185,255,0.06) 100%)',
        border: '1px solid rgba(253,121,168,0.1)',
      }}>
        <div className="absolute top-[-50%] right-[-10%] w-[300px] h-[300px] rounded-full opacity-[0.07]" style={{ background: 'radial-gradient(circle, #74b9ff, transparent 70%)' }} />
        <div className="relative z-10">
          <h1 className="text-2xl lg:text-3xl font-black tracking-tight mb-2">Notifications</h1>
          <p className="text-[14px] text-[#8a8a9a]">Stay updated on your job applications and interview schedules</p>
        </div>
      </div>

      {/* Empty State */}
      <div className="text-center py-16">
        <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity }} className="inline-block mb-4">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#3a3a4a" strokeWidth="1.5"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></svg>
        </motion.div>
        <p className="text-[15px] font-semibold text-[#5a5a6a]">No notifications yet</p>
        <p className="text-[12px] text-[#3a3a4a] mt-1">We'll notify you when you get interview invites and job matches</p>
      </div>
    </motion.div>
  )
}
