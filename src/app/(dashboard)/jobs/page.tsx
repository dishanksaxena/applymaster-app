'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'

interface Job {
  id: string
  title: string
  company: string
  location: string
  remote_type: string | null
  salary_min: number | null
  salary_max: number | null
  source: string
  url: string
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    location: '',
    remote: 'any',
    minSalary: '',
  })
  const supabase = createClient()

  const searchJobs = async () => {
    if (!searchTerm) {
      alert('Enter a job title to search')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/search-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: searchTerm,
          location: filters.location || 'United States',
          remote: filters.remote,
          min_salary: filters.minSalary ? parseInt(filters.minSalary) : null,
        }),
      })
      const data = await response.json()
      setJobs(data.jobs || [])
    } catch (err) {
      console.error(err)
      alert('Failed to search jobs')
    }
    setLoading(false)
  }

  const saveJob = async (job: Job) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Insert job if not exists
    await supabase.from('jobs').upsert({
      external_id: `${job.source}-${job.id}`,
      source: job.source,
      title: job.title,
      company: job.company,
      location: job.location,
      remote_type: job.remote_type,
      salary_min: job.salary_min,
      salary_max: job.salary_max,
      url: job.url,
    })

    // Create application in 'saved' status
    await supabase.from('applications').upsert({
      user_id: user.id,
      job_id: job.id,
      status: 'saved',
    })

    alert('Job saved!')
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black tracking-tight mb-1">Job Search</h2>
        <p className="text-[14px] text-[#8a8a9a]">Search across 50+ job portals in one place.</p>
      </div>

      {/* Search Bar */}
      <div className="p-6 rounded-2xl bg-[#12121a] border border-[rgba(255,255,255,0.06)]">
        <div className="space-y-4">
          <div>
            <label className="block text-[12px] font-semibold text-[#8a8a9a] mb-2">Job Title or Keywords</label>
            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="e.g., Senior Full Stack Engineer" className="w-full px-4 py-3 rounded-xl bg-[#16161f] border border-[rgba(255,255,255,0.06)] text-white text-[14px] placeholder-[#5a5a6a] focus:outline-none focus:border-[rgba(253,121,168,0.3)] transition-all" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-[12px] font-semibold text-[#8a8a9a] mb-2">Location</label>
              <input value={filters.location} onChange={e => setFilters({ ...filters, location: e.target.value })} placeholder="e.g., San Francisco" className="w-full px-4 py-3 rounded-xl bg-[#16161f] border border-[rgba(255,255,255,0.06)] text-white text-[14px] placeholder-[#5a5a6a] focus:outline-none focus:border-[rgba(253,121,168,0.3)] transition-all" />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-[#8a8a9a] mb-2">Work Type</label>
              <select value={filters.remote} onChange={e => setFilters({ ...filters, remote: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-[#16161f] border border-[rgba(255,255,255,0.06)] text-white text-[14px] focus:outline-none focus:border-[rgba(253,121,168,0.3)] transition-all">
                <option value="any">Any</option>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-[#8a8a9a] mb-2">Min Salary</label>
              <input type="number" value={filters.minSalary} onChange={e => setFilters({ ...filters, minSalary: e.target.value })} placeholder="e.g., 100000" className="w-full px-4 py-3 rounded-xl bg-[#16161f] border border-[rgba(255,255,255,0.06)] text-white text-[14px] placeholder-[#5a5a6a] focus:outline-none focus:border-[rgba(253,121,168,0.3)] transition-all" />
            </div>
          </div>

          <button onClick={searchJobs} disabled={loading} className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#fd79a8] to-[#e84393] text-white font-bold text-[14px] hover:shadow-[0_8px_30px_rgba(253,121,168,0.3)] transition-all disabled:opacity-50">
            {loading ? 'Searching...' : '🔍 Search Jobs'}
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-3">
        {jobs.length === 0 && !loading ? (
          <div className="text-center py-12">
            <div className="text-3xl mb-3">🔍</div>
            <p className="text-[13px] text-[#5a5a6a]">Search for jobs to get started</p>
          </div>
        ) : (
          jobs.map(job => (
            <div key={job.id} className="p-5 rounded-2xl bg-[#12121a] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.1)] transition-all group">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <a href={job.url} target="_blank" rel="noopener noreferrer" className="text-[14px] font-bold text-white hover:text-[#fd79a8] transition-colors">
                    {job.title}
                  </a>
                  <div className="text-[12px] text-[#8a8a9a] mt-1">{job.company} • {job.location}</div>
                  {job.salary_min && (
                    <div className="text-[12px] text-[#00b894] mt-2">
                      ${job.salary_min.toLocaleString()} - ${job.salary_max?.toLocaleString()}
                    </div>
                  )}
                  <div className="flex gap-2 mt-3">
                    {job.remote_type && (
                      <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-[rgba(0,184,148,0.1)] text-[#00b894]">
                        {job.remote_type === 'remote' ? '🌐 Remote' : job.remote_type === 'hybrid' ? '🏢 Hybrid' : '📍 On-site'}
                      </span>
                    )}
                    <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-[rgba(116,185,255,0.1)] text-[#74b9ff]">{job.source}</span>
                  </div>
                </div>
                <button onClick={() => saveJob(job)} className="shrink-0 py-2 px-4 rounded-xl bg-[rgba(253,121,168,0.1)] border border-[rgba(253,121,168,0.2)] text-[12px] font-bold text-[#fd79a8] hover:bg-[rgba(253,121,168,0.2)] transition-all">
                  Save
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
