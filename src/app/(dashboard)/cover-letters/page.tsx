'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase-browser'

interface CoverLetter {
  id: string
  title: string
  content: string
  tone: string
  job_title: string
  company: string
  created_at: string
  job_id?: string | null
}

interface Job {
  id: string
  title: string
  company: string
  description: string
}

const tones = [
  { id: 'professional', label: 'Professional', icon: '🎯', desc: 'Formal and polished', color: '#74b9ff' },
  { id: 'casual', label: 'Casual', icon: '😊', desc: 'Friendly and warm', color: '#00b894' },
  { id: 'enthusiastic', label: 'Enthusiastic', icon: '🔥', desc: 'Energetic and passionate', color: '#fdcb6e' },
  { id: 'confident', label: 'Confident', icon: '💪', desc: 'Bold and assertive', color: '#fd79a8' },
]

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } } }

export default function CoverLettersPage() {
  const [coverLetters, setCoverLetters] = useState<CoverLetter[]>([])
  const [savedJobs, setSavedJobs] = useState<Job[]>([])
  const [generating, setGenerating] = useState(false)
  const [selectedLetter, setSelectedLetter] = useState<CoverLetter | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)
  const [mode, setMode] = useState<'from-job' | 'custom'>('from-job')

  // Form state for custom letter
  const [jobTitle, setJobTitle] = useState('')
  const [company, setCompany] = useState('')
  const [jobDesc, setJobDesc] = useState('')
  const [tone, setTone] = useState('professional')

  // Selected job from saved jobs
  const [selectedJobId, setSelectedJobId] = useState('')

  const supabase = createClient()

  useEffect(() => { setMounted(true) }, [])

  // Load cover letters and saved jobs
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Load cover letters
      const { data: letters } = await supabase
        .from('cover_letters')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)
      if (letters && letters.length > 0) {
        setCoverLetters(letters)
        setSelectedLetter(letters[0])
      }

      // Load saved jobs (from applications or job_searches table)
      const { data: jobs } = await supabase
        .from('applications')
        .select('id, job_title as title, company, job_description as description')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)
      if (jobs && jobs.length > 0) {
        setSavedJobs(jobs as any[])
      }
    }
    load()
  }, [supabase])

  const generateCoverLetter = async () => {
    let finalJobTitle = jobTitle
    let finalCompany = company
    let finalJobDesc = jobDesc
    let finalJobId = null

    // If using saved job mode, extract details from selected job
    if (mode === 'from-job' && selectedJobId) {
      const job = savedJobs.find(j => j.id === selectedJobId)
      if (!job) { setError('Please select a job'); return }
      finalJobTitle = job.title
      finalCompany = job.company
      finalJobDesc = job.description || ''
      finalJobId = job.id
    } else if (mode === 'custom') {
      if (!finalJobTitle || !finalCompany) {
        setError('Please enter job title and company')
        return
      }
    }

    setError('')
    setGenerating(true)

    try {
      const response = await fetch('/api/generate-cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_title: finalJobTitle,
          company: finalCompany,
          job_description: finalJobDesc || undefined,
          tone,
          job_id: finalJobId,
        })
      })
      const data = await response.json()

      if (data.error) {
        setError(data.error)
        setGenerating(false)
        return
      }

      if (!data.cover_letter) {
        setError('Failed to generate cover letter. Please try again.')
        setGenerating(false)
        return
      }

      // Create a new letter object and add to state immediately
      const newLetter: CoverLetter = {
        id: data.cover_letter_id || `temp-${Date.now()}`,
        title: `${finalJobTitle} at ${finalCompany}`,
        content: data.cover_letter,
        tone,
        job_title: finalJobTitle,
        company: finalCompany,
        created_at: new Date().toISOString(),
        job_id: finalJobId,
      }

      setCoverLetters(prev => [newLetter, ...prev])
      setSelectedLetter(newLetter)

      // Reset form
      if (mode === 'custom') {
        setJobTitle('')
        setCompany('')
        setJobDesc('')
        setTone('professional')
      }
    } catch (e) {
      setError('Network error. Please try again.')
      console.error('Generate error:', e)
    }

    setGenerating(false)
  }

  const copyToClipboard = () => {
    if (selectedLetter) {
      navigator.clipboard.writeText(selectedLetter.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const downloadPDF = async () => {
    if (!selectedLetter) return
    // For now, just copy to clipboard with hint
    copyToClipboard()
    alert('Copy to clipboard successful! Paste into Word/Google Docs and export as PDF.')
  }

  if (!mounted) return <div className="p-8" />

  return (
    <motion.div initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }} className="space-y-8 max-w-[1400px] mx-auto">

      {/* Header */}
      <motion.div variants={fadeUp} className="relative overflow-hidden rounded-2xl p-8" style={{
        background: 'linear-gradient(135deg, rgba(162,155,254,0.12), rgba(253,121,168,0.08))',
        border: '1px solid rgba(162,155,254,0.15)',
      }}>
        <div className="absolute top-[-50%] right-[-10%] w-[300px] h-[300px] rounded-full opacity-[0.07]" style={{ background: 'radial-gradient(circle, #a29bfe, transparent 70%)' }} />
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(162,155,254,0.15)' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#a29bfe" strokeWidth="1.8"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight">Cover Letter Generator</h1>
            <p className="text-[14px] text-[#8a8a9a] mt-1">Create personalized, compelling cover letters in seconds with AI</p>
          </div>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        <div className="space-y-6">

          {/* Generator */}
          <motion.div variants={fadeUp} className="p-6 rounded-2xl" style={{ background: 'linear-gradient(135deg, #1c1c2e 0%, #16162a 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[16px] font-bold">Create New Letter</h3>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5" style={{ background: 'rgba(162,155,254,0.1)', color: '#a29bfe' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
                Powered by Claude AI
              </span>
            </div>

            {error && (
              <div className="mb-5 px-4 py-3 rounded-xl text-[13px] font-semibold" style={{ background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.2)', color: '#ff6b6b' }}>
                {error}
              </div>
            )}

            {/* Mode Toggle */}
            <div className="mb-6 p-1 rounded-xl flex gap-1" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <button
                onClick={() => { setMode('from-job'); setError('') }}
                className={`flex-1 py-2.5 rounded-lg text-[12px] font-bold transition-all ${mode === 'from-job' ? 'text-white' : 'text-[#6a6a7a]'}`}
                style={{ background: mode === 'from-job' ? 'rgba(162,155,254,0.15)' : 'transparent' }}
              >
                From Saved Job
              </button>
              <button
                onClick={() => { setMode('custom'); setError('') }}
                className={`flex-1 py-2.5 rounded-lg text-[12px] font-bold transition-all ${mode === 'custom' ? 'text-white' : 'text-[#6a6a7a]'}`}
                style={{ background: mode === 'custom' ? 'rgba(162,155,254,0.15)' : 'transparent' }}
              >
                Custom Input
              </button>
            </div>

            <div className="space-y-4">
              {/* From Saved Job Mode */}
              {mode === 'from-job' && (
                <div>
                  <label className="block text-[12px] font-semibold text-[#6a6a7a] mb-2">Select Job</label>
                  {savedJobs.length > 0 ? (
                    <select
                      value={selectedJobId}
                      onChange={e => setSelectedJobId(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-xl bg-[#16161f] border border-white/[0.06] text-white text-[14px] focus:outline-none focus:border-[rgba(162,155,254,0.3)] transition-all"
                    >
                      <option value="">Choose a saved job...</option>
                      {savedJobs.map(job => (
                        <option key={job.id} value={job.id}>
                          {job.title} at {job.company}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="px-4 py-3 rounded-xl bg-[#16161f] border border-white/[0.06] text-[#5a5a6a] text-[13px]">
                      No saved jobs yet. <a href="/jobs" className="text-[#a29bfe] font-semibold hover:underline">Find jobs →</a>
                    </div>
                  )}
                </div>
              )}

              {/* Custom Input Mode */}
              {mode === 'custom' && (
                <>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[12px] font-semibold text-[#6a6a7a] mb-2">Job Title</label>
                      <input
                        value={jobTitle}
                        onChange={e => setJobTitle(e.target.value)}
                        placeholder="e.g., Senior Product Manager"
                        className="w-full px-4 py-3.5 rounded-xl bg-[#16161f] border border-white/[0.06] text-white text-[14px] placeholder-[#3a3a4a] focus:outline-none focus:border-[rgba(162,155,254,0.3)] transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-semibold text-[#6a6a7a] mb-2">Company</label>
                      <input
                        value={company}
                        onChange={e => setCompany(e.target.value)}
                        placeholder="e.g., Google"
                        className="w-full px-4 py-3.5 rounded-xl bg-[#16161f] border border-white/[0.06] text-white text-[14px] placeholder-[#3a3a4a] focus:outline-none focus:border-[rgba(162,155,254,0.3)] transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-[#6a6a7a] mb-2">Job Description (Optional)</label>
                    <textarea
                      value={jobDesc}
                      onChange={e => setJobDesc(e.target.value)}
                      placeholder="Paste job description for more personalized letter..."
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl bg-[#16161f] border border-white/[0.06] text-white text-[13px] placeholder-[#3a3a4a] focus:outline-none focus:border-[rgba(162,155,254,0.3)] transition-all resize-none"
                    />
                  </div>
                </>
              )}

              {/* Tone Selection */}
              <div>
                <label className="block text-[12px] font-semibold text-[#6a6a7a] mb-3">Tone</label>
                <div className="grid grid-cols-4 gap-2">
                  {tones.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setTone(t.id)}
                      className="p-3 rounded-xl text-center transition-all duration-300"
                      style={tone === t.id ? { background: `${t.color}10`, border: `1px solid ${t.color}30`, boxShadow: `0 0 15px ${t.color}10` } : { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}
                    >
                      <div className="text-lg mb-1">{t.icon}</div>
                      <div className="text-[11px] font-bold" style={{ color: tone === t.id ? t.color : '#6a6a7a' }}>{t.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={generateCoverLetter}
                disabled={generating}
                className="w-full py-4 rounded-xl font-bold text-[14px] text-white disabled:opacity-30"
                style={{ background: 'linear-gradient(135deg, #a29bfe, #6c5ce7)' }}
              >
                {generating ? (
                  <span className="flex items-center justify-center gap-2">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white" />
                    Generating...
                  </span>
                ) : 'Generate Cover Letter'}
              </motion.button>
            </div>
          </motion.div>

          {/* Preview */}
          <AnimatePresence>
            {selectedLetter && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.04]" style={{ background: '#0d0d14' }}>
                  <div>
                    <div className="text-[13px] font-bold text-white">{selectedLetter.job_title} at {selectedLetter.company}</div>
                    <div className="text-[11px] text-[#5a5a6a] mt-0.5">{new Date(selectedLetter.created_at).toLocaleDateString()} • {selectedLetter.tone}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize" style={{ background: 'rgba(162,155,254,0.08)', color: '#a29bfe' }}>
                      {selectedLetter.tone}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[600px] overflow-y-auto" style={{ background: 'linear-gradient(180deg, #12121a, #0e0e16)' }}>
                  <p className="text-[14px] text-[#b0b0c0] leading-[1.8] whitespace-pre-wrap font-sans">{selectedLetter.content}</p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 p-4 border-t border-white/[0.04]" style={{ background: '#0d0d14' }}>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={copyToClipboard}
                    className="flex-1 py-2.5 rounded-xl text-[13px] font-bold transition-all"
                    style={copied ? { background: 'rgba(0,184,148,0.1)', color: '#00b894', border: '1px solid rgba(0,184,148,0.2)' } : { background: 'rgba(255,255,255,0.04)', color: '#8a8a9a', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    {copied ? '✓ Copied!' : '📋 Copy to Clipboard'}
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={downloadPDF}
                    className="flex-1 py-2.5 rounded-xl text-[13px] font-bold transition-all"
                    style={{ background: 'rgba(253,121,168,0.1)', color: '#fd79a8', border: '1px solid rgba(253,121,168,0.2)' }}
                  >
                    📥 Download PDF
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar */}
        <motion.div variants={fadeUp} className="h-fit p-6 rounded-2xl" style={{ background: 'linear-gradient(135deg, #1c1c2e 0%, #16162a 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <h3 className="text-[16px] font-bold mb-5">Generated Letters <span className="text-[12px] font-normal text-[#4a4a5a]">({coverLetters.length})</span></h3>
          {coverLetters.length === 0 ? (
            <div className="text-center py-10">
              <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#3a3a4a" strokeWidth="1.5" className="mx-auto"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              </motion.div>
              <p className="text-[13px] text-[#5a5a6a] mt-3">No letters generated yet</p>
              <p className="text-[11px] text-[#3a3a4a] mt-1">Create one above to get started</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[700px] overflow-y-auto">
              {coverLetters.map((letter, idx) => (
                <motion.button
                  key={`${letter.id}-${idx}`}
                  whileHover={{ x: 4 }}
                  onClick={() => setSelectedLetter(letter)}
                  className="w-full text-left p-3.5 rounded-xl transition-all"
                  style={selectedLetter?.id === letter.id ? { background: 'rgba(162,155,254,0.08)', border: '1px solid rgba(162,155,254,0.2)' } : { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
                >
                  <div className="text-[12px] font-semibold text-white truncate">{letter.job_title}</div>
                  <div className="text-[11px] text-[#a29bfe] truncate">{letter.company}</div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize" style={{ background: 'rgba(162,155,254,0.08)', color: '#a29bfe' }}>{letter.tone}</span>
                    <span className="text-[10px] text-[#3a3a4a]">{new Date(letter.created_at).toLocaleDateString()}</span>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}
