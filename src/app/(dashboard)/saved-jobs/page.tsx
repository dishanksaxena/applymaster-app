'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase-browser'
import Link from 'next/link'

interface SavedJob {
  id: string
  external_id: string
  title: string
  company: string
  location: string
  remote_type?: string
  salary_min?: number
  salary_max?: number
  source: string
  url: string
  created_at: string
}

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } } }

export default function SavedJobsPage() {
  const [jobs, setJobs] = useState<SavedJob[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const supabase = createClient()

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    const load = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          console.log('No user')
          setLoading(false)
          return
        }

        // Load applications with status 'saved'
        const { data: apps, error: appsError } = await supabase
          .from('applications')
          .select('job_id')
          .eq('user_id', user.id)
          .eq('status', 'saved')
          .order('created_at', { ascending: false })

        console.log('Apps found:', apps?.length, 'Error:', appsError)

        if (apps && apps.length > 0) {
          const jobIds = apps.map(a => a.job_id).filter(Boolean)
          console.log('Job IDs:', jobIds)

          if (jobIds.length > 0) {
            const { data: jobsData, error: jobsError } = await supabase
              .from('jobs')
              .select('*')
              .in('id', jobIds)

            console.log('Jobs found:', jobsData?.length, 'Error:', jobsError)

            if (jobsData && jobsData.length > 0) {
              console.log('Setting jobs:', jobsData)
              setJobs(jobsData as SavedJob[])
            }
          }
        }
      } catch (err) {
        console.error('Error loading saved jobs:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const removeJob = async (jobId: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from('applications')
      .delete()
      .eq('user_id', user.id)
      .eq('job_id', jobId)
      .eq('status', 'saved')

    setJobs(prev => prev.filter(j => j.id !== jobId))
  }

  const applyToJob = async (job: SavedJob) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    try {
      await supabase
        .from('applications')
        .update({ status: 'applied' })
        .eq('user_id', user.id)
        .eq('job_id', job.id)

      alert(`Applied to ${job.title} at ${job.company}!`)
      setJobs(prev => prev.filter(j => j.id !== job.id))
    } catch (err) {
      console.error('Apply error:', err)
      alert('Failed to apply')
    }
  }

  const formatSalary = (job: SavedJob) => {
    if (!job.salary_min) return null
    const fmt = (n: number) => `$${Math.round(n / 1000)}K`
    if (!job.salary_max || job.salary_max === 0) return `${fmt(job.salary_min)}+`
    return `${fmt(job.salary_min)} – ${fmt(job.salary_max)}`
  }

  const filteredJobs = jobs.filter(
    j => j.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
         j.company.toLowerCase().includes(searchTerm.toLowerCase())
  )

  useEffect(() => {
    console.log('Jobs state updated:', jobs.length, 'Filtered:', filteredJobs.length, 'Loading:', loading)
  }, [jobs, filteredJobs, loading])

  if (!mounted) return <div className="p-8" />

  return (
    <motion.div initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }} className="space-y-6 max-w-[1200px] mx-auto">

      {/* Header */}
      <motion.div variants={fadeUp} className="relative overflow-hidden rounded-2xl p-8" style={{
        background: 'linear-gradient(135deg, rgba(253,121,168,0.08) 0%, rgba(162,155,254,0.06) 100%)',
        border: '1px solid rgba(253,121,168,0.1)',
      }}>
        <div className="absolute top-[-50%] right-[-10%] w-[300px] h-[300px] rounded-full opacity-[0.07]" style={{ background: 'radial-gradient(circle, #fd79a8, transparent 70%)' }} />
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(253,121,168,0.15)' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fd79a8" strokeWidth="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight">Saved Jobs</h1>
            <p className="text-[14px] text-[#8a8a9a] mt-1">View and manage all your saved job opportunities</p>
          </div>
          <div className="ml-auto">
            <span className="text-2xl font-black" style={{ color: '#fd79a8' }}>{jobs.length}</span>
            <p className="text-[12px] text-[#5a5a6a] text-right">saved jobs</p>
          </div>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div variants={fadeUp}>
        <input
          type="text"
          placeholder="Search by job title or company..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3.5 rounded-xl bg-[#16161f] border border-white/[0.06] text-white text-[14px] placeholder-[#3a3a4a] focus:outline-none focus:border-[rgba(253,121,168,0.3)] transition-all"
        />
      </motion.div>

      {/* Jobs List */}
      {loading ? (
        <motion.div variants={fadeUp} className="flex items-center justify-center py-20">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-8 h-8 rounded-full" style={{ border: '2px solid rgba(253,121,168,0.1)', borderTopColor: '#fd79a8' }} />
        </motion.div>
      ) : filteredJobs.length === 0 ? (
        <motion.div variants={fadeUp} className="text-center py-20">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#3a3a4a" strokeWidth="1.5" className="mx-auto mb-4"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
          <p className="text-[15px] font-semibold text-[#5a5a6a]">No saved jobs yet</p>
          <p className="text-[12px] text-[#3a3a4a] mt-1">Start searching to find and save jobs</p>
          <Link href="/jobs" className="inline-block mt-4 px-6 py-3 rounded-xl text-[13px] font-bold text-white" style={{ background: 'linear-gradient(135deg, #fd79a8, #e84393)' }}>
            Browse Jobs →
          </Link>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {filteredJobs.map((job, idx) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="p-5 rounded-xl border transition-all hover:border-opacity-100"
              style={{
                background: 'linear-gradient(135deg, #1c1c2e 0%, #16162a 100%)',
                border: '1px solid rgba(253,121,168,0.1)',
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-[15px] font-bold text-white truncate">{job.title}</h3>
                  <p className="text-[13px] text-[#fd79a8] mt-0.5">{job.company}</p>

                  <div className="flex flex-wrap gap-2 mt-3 text-[11px]">
                    {job.location && (
                      <span className="px-2.5 py-1 rounded-lg" style={{ background: 'rgba(116,185,255,0.1)', color: '#74b9ff' }}>
                        📍 {job.location}
                      </span>
                    )}
                    {job.remote_type && (
                      <span className="px-2.5 py-1 rounded-lg" style={{ background: 'rgba(0,184,148,0.1)', color: '#00b894' }}>
                        🌐 {job.remote_type}
                      </span>
                    )}
                    {formatSalary(job) && (
                      <span className="px-2.5 py-1 rounded-lg" style={{ background: 'rgba(253,203,110,0.1)', color: '#fdcb6e' }}>
                        💰 {formatSalary(job)}
                      </span>
                    )}
                    <span className="px-2.5 py-1 rounded-lg" style={{ background: 'rgba(162,155,254,0.1)', color: '#a29bfe' }}>
                      {job.source}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => applyToJob(job)}
                    className="px-4 py-2.5 rounded-xl text-[12px] font-bold transition-all"
                    style={{ background: 'rgba(0,184,148,0.1)', color: '#00b894', border: '1px solid rgba(0,184,148,0.2)' }}
                  >
                    Apply Now
                  </button>
                  <button
                    onClick={() => removeJob(job.id)}
                    className="px-4 py-2.5 rounded-xl text-[12px] font-bold transition-all"
                    style={{ background: 'rgba(255,107,107,0.1)', color: '#ff6b6b', border: '1px solid rgba(255,107,107,0.2)' }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
