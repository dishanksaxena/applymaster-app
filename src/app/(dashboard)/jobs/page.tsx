'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase-browser'
import { PremiumCard, PremiumButton } from '@/components/premium'
import { staggerContainer, fadeInUp } from '@/lib/animations'
import dynamic from 'next/dynamic'

const JobsMap = dynamic(() => import('@/components/JobsMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-[#0a0a1a]">
      <div className="animate-spin w-8 h-8 border-2 border-[#a29bfe] border-t-transparent rounded-full" />
      <p className="text-[#5a5a6a] text-sm">Loading map...</p>
    </div>
  ),
})

interface Job { id: string; title: string; company: string; location: string; remote_type: string | null; salary_min: number | null; salary_max: number | null; source: string; url: string; posted_at?: string; salary_currency?: string }

const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'IN', name: 'India' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'SG', name: 'Singapore' },
  { code: 'AE', name: 'UAE' },
]

const SALARY_RANGES: Record<string, { label: string; min: number; max: number }[]> = {
  USD: [
    { label: 'Any salary', min: 0, max: 0 },
    { label: '$30K - $50K', min: 30000, max: 50000 },
    { label: '$50K - $80K', min: 50000, max: 80000 },
    { label: '$80K - $100K', min: 80000, max: 100000 },
    { label: '$100K - $120K', min: 100000, max: 120000 },
    { label: '$120K - $150K', min: 120000, max: 150000 },
    { label: '$150K+', min: 150000, max: 0 },
  ],
  INR: [
    { label: 'Any salary', min: 0, max: 0 },
    { label: '₹3L - ₹5L', min: 300000, max: 500000 },
    { label: '₹5L - ₹8L', min: 500000, max: 800000 },
    { label: '₹8L - ₹12L', min: 800000, max: 1200000 },
    { label: '₹12L - ₹20L', min: 1200000, max: 2000000 },
    { label: '₹20L - ₹30L', min: 2000000, max: 3000000 },
    { label: '₹30L+', min: 3000000, max: 0 },
  ],
}

const DATE_OPTIONS = [
  { label: 'Job Posted - Any time', value: 0 },
  { label: 'Job Posted - Last 24 hours', value: 1 },
  { label: 'Job Posted - Last 3 days', value: 3 },
  { label: 'Job Posted - Last 7 days', value: 7 },
  { label: 'Job Posted - Last 15 days', value: 15 },
  { label: 'Job Posted - Last 30 days', value: 30 },
]

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set())
  const [appliedJobs, setAppliedJobs] = useState<Set<string>>(new Set())
  const [mounted, setMounted] = useState(false)
  const [country, setCountry] = useState('US')
  const [city, setCity] = useState('')
  const [citySuggestions, setCitySuggestions] = useState<string[]>([])
  const [showCitySuggestions, setShowCitySuggestions] = useState(false)
  const [remote, setRemote] = useState('any')
  const [salaryIdx, setSalaryIdx] = useState(0)
  const [daysOld, setDaysOld] = useState(0)
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')
  const cityRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const CITY_DATA: Record<string, string[]> = {
    US: ['New York', 'San Francisco', 'Seattle', 'Austin', 'Boston', 'Chicago', 'Los Angeles', 'Denver', 'Atlanta', 'Miami', 'Dallas', 'Washington DC', 'Portland'],
    IN: ['Bangalore', 'Mumbai', 'Delhi', 'Hyderabad', 'Pune', 'Chennai', 'Kolkata', 'Ahmedabad', 'Noida', 'Gurgaon', 'Kochi', 'Jaipur'],
    GB: ['London', 'Manchester', 'Birmingham', 'Edinburgh', 'Bristol', 'Leeds', 'Glasgow'],
    CA: ['Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Ottawa', 'Edmonton'],
    AU: ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide'],
    DE: ['Berlin', 'Munich', 'Hamburg', 'Frankfurt', 'Cologne'],
    SG: ['Singapore'],
    AE: ['Dubai', 'Abu Dhabi', 'Sharjah'],
  }

  useEffect(() => { setMounted(true) }, [])

  // Load saved and applied jobs from database
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      // Join applications with jobs to get external_id for proper matching
      const { data } = await supabase
        .from('applications')
        .select('job_id, status, jobs(external_id)')
        .eq('user_id', user.id)

      if (data) {
        const saved = new Set(
          data
            .filter(a => a.status === 'saved')
            .map((a: any) => a.jobs?.external_id || a.job_id)
            .filter(Boolean)
        )
        const applied = new Set(
          data
            .filter(a => a.status === 'applied')
            .map((a: any) => a.jobs?.external_id || a.job_id)
            .filter(Boolean)
        )
        setSavedJobs(saved)
        setAppliedJobs(applied)
      }
    }
    load()
  }, [supabase])

  useEffect(() => {
    // Reset city when country changes
    setCity('')
    setSalaryIdx(0)
  }, [country])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (cityRef.current && !cityRef.current.contains(e.target as Node)) {
        setShowCitySuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleCityInput = (val: string) => {
    setCity(val)
    if (val.length > 0) {
      const cities = CITY_DATA[country] || []
      const matches = cities.filter(c => c.toLowerCase().startsWith(val.toLowerCase()))
      setCitySuggestions(matches)
      setShowCitySuggestions(matches.length > 0)
    } else {
      setShowCitySuggestions(false)
    }
  }

  const currencyKey = country === 'IN' ? 'INR' : 'USD'
  const salaryRanges = SALARY_RANGES[currencyKey]

  const searchJobs = async () => {
    if (!searchTerm) return
    setLoading(true)
    try {
      const selectedSalary = salaryRanges[salaryIdx]
      const response = await fetch('/api/search-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchTerm,
          location: city || '',
          remote,
          country,
          minSalary: selectedSalary?.min || 0,
          maxDaysOld: daysOld || 30,
        })
      })
      const data = await response.json()
      let results = data.jobs || []

      // Client-side date filter
      if (daysOld > 0) {
        const cutoff = Date.now() - daysOld * 24 * 60 * 60 * 1000
        results = results.filter((j: Job) => {
          if (!j.posted_at) return true
          return new Date(j.posted_at).getTime() >= cutoff
        })
      }

      // Client-side salary filter - check range overlap
      if (selectedSalary?.min && selectedSalary.min > 0) {
        results = results.filter((j: Job) => {
          if (!j.salary_min) return true // Include jobs with no salary info
          const jobSalaryMax = j.salary_max || j.salary_min
          const selectedMax = selectedSalary.max || selectedSalary.min
          // Check if ranges overlap: job_max >= selected_min AND job_min <= selected_max
          return jobSalaryMax >= selectedSalary.min && j.salary_min <= selectedMax
        })
      }

      setJobs(results)
    } catch { alert('Failed to search') }
    setLoading(false)
  }

  const saveJob = async (job: Job) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return alert('Please log in first')
    try {
      // Save job with proper upsert conflict handling
      const externalId = `${job.source}-${job.id}`
      const jobData = {
        external_id: externalId,
        source: job.source,
        title: job.title,
        company: job.company,
        location: job.location,
        remote_type: job.remote_type || null,
        salary_min: job.salary_min ? Math.round(job.salary_min) : null,
        salary_max: job.salary_max ? Math.round(job.salary_max) : null,
        url: job.url,
      }

      // First try to find existing job
      const { data: existingJobs, error: selectError } = await supabase
        .from('jobs')
        .select('id')
        .eq('external_id', externalId)
        .eq('source', job.source)

      if (selectError) throw new Error(`Job lookup failed: ${selectError.message}`)

      let jobId: string

      if (existingJobs && existingJobs.length > 0) {
        // Update existing job
        jobId = existingJobs[0].id
        const { error: updateError } = await supabase
          .from('jobs')
          .update(jobData)
          .eq('id', jobId)
        if (updateError) throw new Error(`Job update failed: ${updateError.message}`)
      } else {
        // Insert new job
        const { data: newJob, error: insertError } = await supabase
          .from('jobs')
          .insert([jobData])
          .select()

        if (insertError) throw new Error(`Job insert failed: ${insertError.message}`)
        if (!newJob || newJob.length === 0) throw new Error('Job insert succeeded but no data returned')
        jobId = newJob[0].id
      }

      // Create or update application with status 'saved'
      const { error: appError } = await supabase.from('applications').upsert({
        user_id: user.id,
        job_id: jobId,
        status: 'saved',
      }, { onConflict: 'user_id,job_id' })

      if (appError) {
        throw new Error(`Application save failed: ${appError.message}`)
      }

      setSavedJobs(new Set(Array.from(savedJobs).concat(job.id)))
      alert('✓ Job saved!')
    } catch (err: any) {
      console.error('Save job error:', err)
      alert(`Failed to save job: ${err?.message || 'Please try again.'}`)
    }
  }

  const applyJob = async (job: Job) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return alert('Please log in first')
    try {
      // Save job first
      const externalId = `${job.source}-${job.id}`
      const jobData = {
        external_id: externalId,
        source: job.source,
        title: job.title,
        company: job.company,
        location: job.location,
        remote_type: job.remote_type || null,
        salary_min: job.salary_min ? Math.round(job.salary_min) : null,
        salary_max: job.salary_max ? Math.round(job.salary_max) : null,
        url: job.url,
      }

      // First try to find existing job
      const { data: existingJobs, error: selectError } = await supabase
        .from('jobs')
        .select('id')
        .eq('external_id', externalId)
        .eq('source', job.source)

      if (selectError) throw new Error(`Job lookup failed: ${selectError.message}`)

      let jobId: string

      if (existingJobs && existingJobs.length > 0) {
        // Update existing job
        jobId = existingJobs[0].id
        const { error: updateError } = await supabase
          .from('jobs')
          .update(jobData)
          .eq('id', jobId)
        if (updateError) throw new Error(`Job update failed: ${updateError.message}`)
      } else {
        // Insert new job
        const { data: newJob, error: insertError } = await supabase
          .from('jobs')
          .insert([jobData])
          .select()

        if (insertError) throw new Error(`Job insert failed: ${insertError.message}`)
        if (!newJob || newJob.length === 0) throw new Error('Job insert succeeded but no data returned')
        jobId = newJob[0].id
      }

      // Create/update application with "applied" status
      const { error: appError } = await supabase.from('applications').upsert({
        user_id: user.id,
        job_id: jobId,
        status: 'applied',
      }, { onConflict: 'user_id,job_id' })

      if (appError) throw new Error(`Application save failed: ${appError.message}`)

      setAppliedJobs(new Set(Array.from(appliedJobs).concat(job.id)))
      alert(`✓ Applied to ${job.title} at ${job.company}!`)
    } catch (err: any) {
      console.error('Apply error:', err)
      alert(`Failed to apply: ${err?.message || 'Please try again.'}`)
    }
  }

  const formatPosted = (dateStr?: string) => {
    if (!dateStr) return ''
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60))
    if (diff < 24) return `${diff}h ago`
    const days = Math.floor(diff / 24)
    if (days === 1) return '1d ago'
    if (days < 30) return `${days}d ago`
    return `${Math.floor(days / 30)}mo ago`
  }

  const formatSalary = (job: Job) => {
    if (!job.salary_min) return null
    const fmt = (n: number) => {
      if (job.salary_currency === 'INR') return `₹${(n / 100000).toFixed(1)}L`
      return `$${Math.round(n / 1000)}K`
    }
    if (!job.salary_max || job.salary_max === 0) return `${fmt(job.salary_min)}+`
    return `${fmt(job.salary_min)} – ${fmt(job.salary_max)}`
  }

  if (!mounted) return <div className="p-8" />

  const inputCls = "px-4 py-3 rounded-xl bg-[#16161f] border border-white/[0.06] text-white text-[13px] placeholder-[#3a3a4a] focus:outline-none focus:border-[rgba(253,121,168,0.3)] transition-all"
  const selectCls = `${inputCls} cursor-pointer`

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-8 max-w-[1200px] mx-auto">

      {/* Header */}
      <motion.div variants={fadeInUp} className="relative overflow-hidden rounded-2xl p-8" style={{
        background: 'linear-gradient(135deg, rgba(253,121,168,0.08) 0%, rgba(116,185,255,0.06) 100%)',
        border: '1px solid rgba(253,121,168,0.1)',
      }}>
        <div className="absolute top-[-50%] right-[-10%] w-[300px] h-[300px] rounded-full opacity-[0.07]" style={{ background: 'radial-gradient(circle, #74b9ff, transparent 70%)' }} />
        <div className="relative z-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-black tracking-tight mb-2 text-white">Job Search</h1>
              <p className="text-[14px] text-[#8a8a9a]">Search across 50+ job portals with AI-powered matching</p>
            </div>
            {/* View Toggle */}
            <div className="flex items-center gap-1 p-1 rounded-xl flex-shrink-0" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => setViewMode('list')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-semibold transition-all"
                style={viewMode === 'list'
                  ? { background: 'linear-gradient(135deg, #fd79a8, #e84393)', color: '#fff', boxShadow: '0 0 20px rgba(253,121,168,0.3)' }
                  : { color: '#6a6a7a' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                List
              </motion.button>
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => setViewMode('map')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-semibold transition-all"
                style={viewMode === 'map'
                  ? { background: 'linear-gradient(135deg, #a29bfe, #6c5ce7)', color: '#fff', boxShadow: '0 0 20px rgba(162,155,254,0.3)' }
                  : { color: '#6a6a7a' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                Map View
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div variants={fadeInUp}>
        <PremiumCard accent="blue" hover={false}>
          <div className="p-6 space-y-4">
          {/* Keyword */}
          <div className="relative">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5a5a6a" strokeWidth="1.8" className="absolute left-4 top-1/2 -translate-y-1/2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>
            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchJobs()}
              placeholder="Job title, skill, or keyword..."
              className="w-full pl-12 pr-4 py-4 rounded-xl bg-[#16161f] border border-white/[0.06] text-white text-[15px] placeholder-[#3a3a4a] focus:outline-none focus:border-[rgba(253,121,168,0.3)] transition-all" />
          </div>

          {/* Row 1: Country + City */}
          <div className="grid grid-cols-2 gap-3">
            <select value={country} onChange={e => setCountry(e.target.value)} className={selectCls}>
              {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
            </select>
            <div ref={cityRef} className="relative">
              <input
                value={city}
                onChange={e => handleCityInput(e.target.value)}
                onFocus={() => city && setShowCitySuggestions(citySuggestions.length > 0)}
                placeholder="City (optional)"
                className={`w-full ${inputCls}`}
              />
              <AnimatePresence>
                {showCitySuggestions && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden z-50"
                    style={{ background: '#1e1e3a', border: '1px solid rgba(255,255,255,0.1)' }}>
                    {citySuggestions.map(s => (
                      <button key={s} onClick={() => { setCity(s); setShowCitySuggestions(false) }}
                        className="w-full text-left px-4 py-2.5 text-[13px] text-white hover:bg-white/5 transition-colors">
                        {s}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Row 2: Work Type + Date Posted + Salary */}
          <div className="grid grid-cols-3 gap-3">
            <select value={remote} onChange={e => setRemote(e.target.value)} className={selectCls}>
              <option value="any">Any Work Type</option>
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
              <option value="onsite">On-site</option>
            </select>
            <select value={daysOld} onChange={e => setDaysOld(Number(e.target.value))} className={selectCls}>
              {DATE_OPTIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
            <select value={salaryIdx} onChange={e => setSalaryIdx(Number(e.target.value))} className={selectCls}>
              {salaryRanges.map((r, i) => <option key={i} value={i}>{r.label}</option>)}
            </select>
          </div>

            <PremiumButton variant="primary" size="lg" onClick={searchJobs} disabled={loading || !searchTerm} fullWidth loading={loading}>
              {loading ? 'Searching...' : 'Search Jobs'}
            </PremiumButton>
          </div>
        </PremiumCard>
      </motion.div>

      {/* Map View */}
      <AnimatePresence>
        {viewMode === 'map' && (
          <motion.div
            key="map"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-2xl overflow-hidden"
            style={{ height: '75vh', border: '1px solid rgba(162,155,254,0.15)', boxShadow: '0 0 80px rgba(162,155,254,0.08)' }}>
            <JobsMap
              jobs={jobs}
              onSave={(job) => saveJob(job)}
              onApply={(job) => applyJob(job)}
              savedJobs={savedJobs}
              appliedJobs={appliedJobs}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence>
        {viewMode === 'list' && jobs.length === 0 && !loading ? (
          <motion.div variants={fadeInUp} className="text-center py-16">
            <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity }} className="inline-block mb-4">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#3a3a4a" strokeWidth="1.5"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>
            </motion.div>
            <p className="text-[15px] font-semibold text-[#5a5a6a]">Search for your dream job</p>
            <p className="text-[12px] text-[#3a3a4a] mt-1">Supports US, India, UK, Canada and more</p>
          </motion.div>
        ) : viewMode === 'list' ? (
          <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold text-[#5a5a6a]">{jobs.length} jobs found</span>
            </div>
            {jobs.map((job, i) => (
              <motion.div key={job.id} variants={fadeInUp}>
                <PremiumCard accent="purple" glowEffect={true} animationDelay={Math.min(i * 0.05, 0.4)}>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex gap-4 flex-1">
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-[14px] font-bold"
                          style={{ background: 'linear-gradient(135deg, rgba(253,121,168,0.1), rgba(162,155,254,0.1))', color: '#fd79a8' }}>
                          {job.company[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <a href={job.url} target="_blank" rel="noopener noreferrer" className="text-[15px] font-bold text-white hover:text-[#fd79a8] transition-colors">{job.title}</a>
                          <div className="text-[13px] text-[#6a6a7a] mt-0.5">{job.company} · {job.location}</div>
                          {formatSalary(job) && (
                            <div className="text-[13px] font-semibold text-[#00b894] mt-1">{formatSalary(job)}</div>
                          )}
                          <div className="flex flex-wrap gap-2 mt-3">
                            {job.remote_type && (
                              <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg" style={{ background: 'rgba(0,184,148,0.08)', color: '#00b894' }}>
                                {job.remote_type}
                              </span>
                            )}
                            <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg" style={{ background: 'rgba(116,185,255,0.08)', color: '#74b9ff' }}>{job.source}</span>
                            {job.posted_at && (
                              <span className="text-[11px] text-[#5a5a6a]">{formatPosted(job.posted_at)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <PremiumButton
                          variant={savedJobs.has(job.id) ? 'success' : 'secondary'}
                          size="sm"
                          onClick={() => saveJob(job)}
                          disabled={savedJobs.has(job.id)}>
                          {savedJobs.has(job.id) ? '✓ Saved' : 'Save'}
                        </PremiumButton>
                        <PremiumButton
                          variant={appliedJobs.has(job.id) ? 'secondary' : 'primary'}
                          size="sm"
                          onClick={() => applyJob(job)}
                          disabled={appliedJobs.has(job.id)}>
                          {appliedJobs.has(job.id) ? '✓ Applied' : 'Apply Now'}
                        </PremiumButton>
                      </div>
                    </div>
                  </div>
                </PremiumCard>
              </motion.div>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  )
}
