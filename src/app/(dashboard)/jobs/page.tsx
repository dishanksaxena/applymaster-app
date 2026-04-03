'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase-browser'

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
      const { data } = await supabase.from('applications').select('job_id, status').eq('user_id', user.id)
      if (data) {
        const saved = new Set(data.filter(a => a.status === 'saved').map((a: any) => a.job_id))
        const applied = new Set(data.filter(a => a.status === 'applied').map((a: any) => a.job_id))
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
      const salaryMin = salaryRanges[salaryIdx]?.min || 0
      const response = await fetch('/api/search-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchTerm,
          location: city || '',
          remote,
          country,
          minSalary: salaryMin,
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

      // Client-side salary filter
      if (salaryMin > 0) {
        results = results.filter((j: Job) => !j.salary_min || j.salary_min >= salaryMin)
      }

      setJobs(results)
    } catch { alert('Failed to search') }
    setLoading(false)
  }

  const saveJob = async (job: Job) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    try {
      // Save job with unique external_id
      const { error: jobError } = await supabase.from('jobs').upsert({
        external_id: `${job.source}-${job.id}`,
        source: job.source,
        title: job.title,
        company: job.company,
        location: job.location,
        remote_type: job.remote_type,
        salary_min: job.salary_min,
        salary_max: job.salary_max,
        url: job.url,
      }, { onConflict: 'external_id' })

      if (jobError) throw jobError

      // Create application with status 'saved'
      const { error: appError } = await supabase.from('applications').upsert({
        user_id: user.id,
        job_id: job.id,
        status: 'saved',
        job_title: job.title,
        company: job.company,
      }, { onConflict: 'user_id,job_id' })

      if (appError) throw appError

      setSavedJobs(new Set(Array.from(savedJobs).concat(job.id)))
    } catch (err) {
      console.error('Save job error:', err)
      alert('Failed to save job. Please try again.')
    }
  }

  const applyJob = async (job: Job) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    try {
      // Save job first
      const { error: jobError } = await supabase.from('jobs').upsert({
        external_id: `${job.source}-${job.id}`,
        source: job.source,
        title: job.title,
        company: job.company,
        location: job.location,
        remote_type: job.remote_type,
        salary_min: job.salary_min,
        salary_max: job.salary_max,
        url: job.url,
      }, { onConflict: 'external_id' })

      if (jobError) throw jobError

      // Create/update application with "applied" status
      const { error: appError } = await supabase.from('applications').upsert({
        user_id: user.id,
        job_id: job.id,
        status: 'applied',
        job_title: job.title,
        company: job.company,
      }, { onConflict: 'user_id,job_id' })

      if (appError) throw appError

      setAppliedJobs(new Set(Array.from(appliedJobs).concat(job.id)))
      alert(`✓ Applied to ${job.title} at ${job.company}!`)
    } catch (err) {
      console.error('Apply error:', err)
      alert('Failed to apply. Please try again.')
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
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-8 max-w-[1200px] mx-auto">

      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl p-8" style={{
        background: 'linear-gradient(135deg, rgba(253,121,168,0.08) 0%, rgba(116,185,255,0.06) 100%)',
        border: '1px solid rgba(253,121,168,0.1)',
      }}>
        <div className="absolute top-[-50%] right-[-10%] w-[300px] h-[300px] rounded-full opacity-[0.07]" style={{ background: 'radial-gradient(circle, #74b9ff, transparent 70%)' }} />
        <div className="relative z-10">
          <h1 className="text-2xl lg:text-3xl font-black tracking-tight mb-2">Job Search</h1>
          <p className="text-[14px] text-[#8a8a9a]">Search across 50+ job portals with AI-powered matching</p>
        </div>
      </div>

      {/* Search */}
      <div className="p-6 rounded-2xl" style={{ background: 'linear-gradient(135deg, #252545 0%, #1e1e3a 100%)', border: '1px solid rgba(255,255,255,0.15)' }}>
        <div className="space-y-4">
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
      </div>

      {/* Results */}
      <AnimatePresence>
        {jobs.length === 0 && !loading ? (
          <div className="text-center py-16">
            <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity }} className="inline-block mb-4">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#3a3a4a" strokeWidth="1.5"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>
            </motion.div>
            <p className="text-[15px] font-semibold text-[#5a5a6a]">Search for your dream job</p>
            <p className="text-[12px] text-[#3a3a4a] mt-1">Supports US, India, UK, Canada and more</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold text-[#5a5a6a]">{jobs.length} jobs found</span>
            </div>
            {jobs.map((job, i) => (
              <motion.div key={job.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: Math.min(i * 0.04, 0.6) }} whileHover={{ y: -2, transition: { duration: 0.2 } }}
                className="p-5 rounded-2xl group transition-all"
                style={{ background: 'linear-gradient(135deg, #252545 0%, #1e1e3a 100%)', border: '1px solid rgba(255,255,255,0.18)' }}>
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
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => saveJob(job)} disabled={savedJobs.has(job.id)}
                      className="py-2.5 px-4 rounded-xl text-[12px] font-bold transition-all"
                      style={savedJobs.has(job.id) ? { background: 'rgba(0,184,148,0.1)', color: '#00b894', border: '1px solid rgba(0,184,148,0.2)' } : { background: 'rgba(253,121,168,0.1)', color: '#fd79a8', border: '1px solid rgba(253,121,168,0.2)' }}>
                      {savedJobs.has(job.id) ? '✓ Saved' : 'Save'}
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => applyJob(job)} disabled={appliedJobs.has(job.id)}
                      className="py-2.5 px-4 rounded-xl text-[12px] font-bold transition-all"
                      style={appliedJobs.has(job.id) ? { background: 'rgba(116,185,255,0.1)', color: '#74b9ff', border: '1px solid rgba(116,185,255,0.2)' } : { background: 'rgba(0,184,148,0.1)', color: '#00b894', border: '1px solid rgba(0,184,148,0.2)' }}>
                      {appliedJobs.has(job.id) ? '✓ Applied' : 'Apply Now'}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
