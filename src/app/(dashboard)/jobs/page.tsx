'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase-browser'

interface Job { id: string; title: string; company: string; location: string; remote_type: string | null; salary_min: number | null; salary_max: number | null; source: string; url: string }

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } }
const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } } }

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set())
  const [filters, setFilters] = useState({ location: '', remote: 'any', minSalary: '' })
  const supabase = createClient()

  const searchJobs = async () => {
    if (!searchTerm) return
    setLoading(true)
    try {
      const response = await fetch('/api/search-jobs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: searchTerm, location: filters.location || 'United States', remote: filters.remote, min_salary: filters.minSalary ? parseInt(filters.minSalary) : null }) })
      const data = await response.json()
      setJobs(data.jobs || [])
    } catch { alert('Failed to search') }
    setLoading(false)
  }

  const saveJob = async (job: Job) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('jobs').upsert({ external_id: `${job.source}-${job.id}`, source: job.source, title: job.title, company: job.company, location: job.location, remote_type: job.remote_type, salary_min: job.salary_min, salary_max: job.salary_max, url: job.url })
    await supabase.from('applications').upsert({ user_id: user.id, job_id: job.id, status: 'saved' })
    setSavedJobs(new Set(Array.from(savedJobs).concat(job.id)))
  }

  const remoteIcons: Record<string, string> = { remote: '🌐', hybrid: '🏢', onsite: '📍' }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8 max-w-[1200px] mx-auto">

      {/* Header */}
      <motion.div variants={fadeUp} className="relative overflow-hidden rounded-2xl p-8" style={{
        background: 'linear-gradient(135deg, rgba(253,121,168,0.08) 0%, rgba(116,185,255,0.06) 100%)',
        border: '1px solid rgba(253,121,168,0.1)',
      }}>
        <div className="absolute top-[-50%] right-[-10%] w-[300px] h-[300px] rounded-full opacity-[0.07]" style={{ background: 'radial-gradient(circle, #74b9ff, transparent 70%)' }} />
        <div className="relative z-10">
          <h1 className="text-2xl lg:text-3xl font-black tracking-tight mb-2">Job Search</h1>
          <p className="text-[14px] text-[#8a8a9a]">Search across 50+ job portals with AI-powered matching</p>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div variants={fadeUp} className="p-6 rounded-2xl" style={{ background: 'linear-gradient(135deg, #12121a 0%, #0e0e16 100%)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="space-y-4">
          <div className="relative">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5a5a6a" strokeWidth="1.8" className="absolute left-4 top-1/2 -translate-y-1/2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>
            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchJobs()}
              placeholder="Job title, skill, or keyword..."
              className="w-full pl-12 pr-4 py-4 rounded-xl bg-[#16161f] border border-white/[0.06] text-white text-[15px] placeholder-[#3a3a4a] focus:outline-none focus:border-[rgba(253,121,168,0.3)] transition-all" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <input value={filters.location} onChange={e => setFilters({ ...filters, location: e.target.value })} placeholder="Location"
              className="px-4 py-3 rounded-xl bg-[#16161f] border border-white/[0.06] text-white text-[13px] placeholder-[#3a3a4a] focus:outline-none focus:border-[rgba(253,121,168,0.3)] transition-all" />
            <select value={filters.remote} onChange={e => setFilters({ ...filters, remote: e.target.value })}
              className="px-4 py-3 rounded-xl bg-[#16161f] border border-white/[0.06] text-white text-[13px] focus:outline-none focus:border-[rgba(253,121,168,0.3)] transition-all">
              <option value="any">Any Work Type</option>
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
              <option value="onsite">On-site</option>
            </select>
            <input type="number" value={filters.minSalary} onChange={e => setFilters({ ...filters, minSalary: e.target.value })} placeholder="Min Salary"
              className="px-4 py-3 rounded-xl bg-[#16161f] border border-white/[0.06] text-white text-[13px] placeholder-[#3a3a4a] focus:outline-none focus:border-[rgba(253,121,168,0.3)] transition-all" />
          </div>
          <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={searchJobs} disabled={loading || !searchTerm}
            className="w-full py-4 rounded-xl font-bold text-[14px] text-white disabled:opacity-30 transition-all"
            style={{ background: 'linear-gradient(135deg, #fd79a8, #e84393)' }}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white" />
                Searching...
              </span>
            ) : 'Search Jobs'}
          </motion.button>
        </div>
      </motion.div>

      {/* Results */}
      <AnimatePresence>
        {jobs.length === 0 && !loading ? (
          <motion.div variants={fadeUp} className="text-center py-16">
            <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity }} className="inline-block mb-4">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#3a3a4a" strokeWidth="1.5"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>
            </motion.div>
            <p className="text-[15px] font-semibold text-[#5a5a6a]">Search for your dream job</p>
            <p className="text-[12px] text-[#3a3a4a] mt-1">We aggregate results from LinkedIn, Indeed, Glassdoor, and 50+ more</p>
          </motion.div>
        ) : (
          <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold text-[#5a5a6a]">{jobs.length} jobs found</span>
            </div>
            {jobs.map((job) => (
              <motion.div key={job.id} variants={fadeUp} whileHover={{ y: -2, transition: { duration: 0.2 } }}
                className="p-5 rounded-2xl group transition-all"
                style={{ background: 'linear-gradient(135deg, #12121a 0%, #0e0e16 100%)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-4 flex-1">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-[14px] font-bold"
                      style={{ background: 'linear-gradient(135deg, rgba(253,121,168,0.1), rgba(162,155,254,0.1))', color: '#fd79a8' }}>
                      {job.company[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <a href={job.url} target="_blank" rel="noopener noreferrer" className="text-[15px] font-bold text-white hover:text-[#fd79a8] transition-colors">{job.title}</a>
                      <div className="text-[13px] text-[#6a6a7a] mt-0.5">{job.company} · {job.location}</div>
                      {job.salary_min && (
                        <div className="text-[13px] font-semibold text-[#00b894] mt-1">${job.salary_min.toLocaleString()} - ${job.salary_max?.toLocaleString()}</div>
                      )}
                      <div className="flex gap-2 mt-3">
                        {job.remote_type && (
                          <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg" style={{ background: 'rgba(0,184,148,0.08)', color: '#00b894' }}>
                            {remoteIcons[job.remote_type] || ''} {job.remote_type}
                          </span>
                        )}
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg" style={{ background: 'rgba(116,185,255,0.08)', color: '#74b9ff' }}>{job.source}</span>
                      </div>
                    </div>
                  </div>
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => saveJob(job)} disabled={savedJobs.has(job.id)}
                    className="shrink-0 py-2.5 px-5 rounded-xl text-[12px] font-bold transition-all"
                    style={savedJobs.has(job.id) ? { background: 'rgba(0,184,148,0.1)', color: '#00b894', border: '1px solid rgba(0,184,148,0.2)' } : { background: 'rgba(253,121,168,0.1)', color: '#fd79a8', border: '1px solid rgba(253,121,168,0.2)' }}>
                    {savedJobs.has(job.id) ? '✓ Saved' : 'Save'}
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
