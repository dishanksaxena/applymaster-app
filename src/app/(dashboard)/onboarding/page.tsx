'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'

const fadeUp = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } } }
const fadeIn = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.4 } } }

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } },
  exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0, transition: { duration: 0.3 } }),
}

const ROLES = ['Software Engineer', 'Product Manager', 'Data Scientist', 'Designer', 'DevOps', 'Full Stack', 'Frontend', 'Backend', 'ML Engineer', 'QA Engineer']
const LOCATIONS = ['Remote', 'San Francisco', 'New York', 'Seattle', 'Austin', 'Boston', 'Los Angeles', 'Chicago', 'London', 'Berlin']

const plans = [
  {
    name: 'free', label: 'Free', price: '$0', period: '/mo', color: '#8a8a9a',
    features: ['10 applications/month', 'Basic job search', 'Resume upload', 'Manual apply'],
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
  },
  {
    name: 'pro', label: 'Pro', price: '$29', period: '/mo', color: '#fd79a8', popular: false,
    features: ['100 applications/month', 'AI resume optimizer', 'Cover letter gen', 'Email support'],
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="13,2 3,14 12,14 11,22 21,10 12,10"/></svg>
  },
  {
    name: 'elite', label: 'Elite', price: '$59', period: '/mo', color: '#a29bfe', popular: true,
    features: ['Unlimited applications', 'Auto-apply engine', 'Interview coaching', 'Priority support'],
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
  },
]

export default function OnboardingPage() {
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [uploading, setUploading] = useState(false)
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [selectedLocations, setSelectedLocations] = useState<string[]>([])
  const [customRole, setCustomRole] = useState('')
  const [preferences, setPreferences] = useState({ remote_preference: 'any', experience_level: 'mid', min_salary: '' })
  const [selectedPlan, setSelectedPlan] = useState('free')
  const [saving, setSaving] = useState(false)
  const [completing, setCompleting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  const goTo = (next: number) => {
    setDirection(next > step ? 1 : -1)
    setStep(next)
  }

  const toggleChip = (arr: string[], setArr: (v: string[]) => void, val: string) => {
    setArr(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val])
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && (file.name.endsWith('.pdf') || file.name.endsWith('.docx'))) setResumeFile(file)
  }, [])

  const handleResumeUpload = async () => {
    if (!resumeFile) { goTo(1); return }
    setUploading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const ext = resumeFile.name.split('.').pop()
      const path = `${user.id}/${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('resumes').upload(path, resumeFile)
      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from('resumes').getPublicUrl(path)
        await supabase.from('resumes').insert({ user_id: user.id, name: resumeFile.name, file_url: publicUrl, is_primary: true })
      }
    } catch { /* continue */ }
    setUploading(false)
    goTo(1)
  }

  const handlePreferences = async () => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await supabase.from('job_preferences').upsert({
        user_id: user.id,
        target_roles: selectedRoles,
        target_locations: selectedLocations,
        remote_preference: preferences.remote_preference,
        experience_level: preferences.experience_level,
        min_salary: preferences.min_salary ? parseInt(preferences.min_salary) : null,
      })
    } catch { /* continue */ }
    setSaving(false)
    goTo(2)
  }

  const handleComplete = async () => {
    setCompleting(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('profiles').update({ onboarding_complete: true }).eq('id', user.id)
    router.push('/dashboard')
    router.refresh()
  }

  const stepLabels = ['Resume', 'Preferences', 'Launch']
  const stepIcons = [
    <svg key="r" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>,
    <svg key="p" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>,
    <svg key="l" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="13,2 3,14 12,14 11,22 21,10 12,10"/></svg>,
  ]

  return (
    <div className="min-h-screen bg-[#07070f] flex items-center justify-center relative overflow-hidden py-10 px-4">

      {/* Animated Background Orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.06, 0.1, 0.06] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-[-20%] right-[-10%] w-[700px] h-[700px] rounded-full"
          style={{ background: 'radial-gradient(circle, #fd79a8, transparent 65%)' }} />
        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.04, 0.08, 0.04] }} transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, #a29bfe, transparent 65%)' }} />
        <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.03, 0.06, 0.03] }} transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
          className="absolute top-[40%] left-[30%] w-[400px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle, #74b9ff, transparent 65%)' }} />
      </div>

      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

      <div className="relative z-10 w-full max-w-[560px]">

        {/* Logo */}
        <motion.div variants={fadeIn} initial="hidden" animate="show" className="flex items-center justify-center gap-2.5 mb-10">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #fd79a8, #e84393)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polygon points="13,2 3,14 12,14 11,22 21,10 12,10"/></svg>
          </div>
          <span className="text-[18px] font-black tracking-tight text-white">ApplyMaster<span className="text-[#fd79a8]">.ai</span></span>
        </motion.div>

        {/* Step Progress */}
        <motion.div variants={fadeUp} initial="hidden" animate="show" className="flex items-center justify-center mb-10">
          {stepLabels.map((label, i) => (
            <div key={label} className="flex items-center">
              <div className="flex flex-col items-center gap-2">
                <motion.div
                  animate={i <= step ? { scale: [1, 1.15, 1] } : {}}
                  transition={{ duration: 0.4 }}
                  className="relative w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-bold transition-all duration-500"
                  style={i < step
                    ? { background: 'linear-gradient(135deg, #fd79a8, #e84393)', boxShadow: '0 0 20px rgba(253,121,168,0.4)' }
                    : i === step
                      ? { background: 'linear-gradient(135deg, rgba(253,121,168,0.2), rgba(253,121,168,0.05))', border: '2px solid rgba(253,121,168,0.5)' }
                      : { background: 'rgba(255,255,255,0.03)', border: '2px solid rgba(255,255,255,0.07)' }}>
                  {i < step
                    ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M20 6L9 17L4 12"/></svg>
                    : <span style={{ color: i === step ? '#fd79a8' : '#4a4a5a' }}>{stepIcons[i]}</span>
                  }
                  {i === step && (
                    <motion.div animate={{ scale: [1, 1.6, 1], opacity: [0.5, 0, 0.5] }} transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 rounded-full" style={{ border: '1px solid rgba(253,121,168,0.4)' }} />
                  )}
                </motion.div>
                <span className="text-[11px] font-semibold" style={{ color: i <= step ? '#fd79a8' : '#3a3a4a' }}>{label}</span>
              </div>
              {i < stepLabels.length - 1 && (
                <div className="w-20 h-[2px] mx-2 mb-5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <motion.div animate={{ width: i < step ? '100%' : '0%' }} transition={{ duration: 0.5, delay: 0.1 }}
                    className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, #fd79a8, #e84393)' }} />
                </div>
              )}
            </div>
          ))}
        </motion.div>

        {/* Card */}
        <div className="relative">
          <div className="absolute inset-0 rounded-3xl opacity-20" style={{ background: 'linear-gradient(135deg, rgba(253,121,168,0.15), rgba(162,155,254,0.05))', filter: 'blur(20px)' }} />
          <div className="relative rounded-3xl overflow-hidden" style={{ background: 'linear-gradient(160deg, #12121e 0%, #0d0d18 100%)', border: '1px solid rgba(255,255,255,0.07)', boxShadow: '0 40px 100px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)' }}>

            {/* Inner glow line */}
            <div className="absolute top-0 left-[10%] right-[10%] h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(253,121,168,0.3), transparent)' }} />

            <div className="p-8 sm:p-10">
              <AnimatePresence custom={direction} mode="wait">

                {/* ── STEP 0: RESUME ── */}
                {step === 0 && (
                  <motion.div key="step0" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit">
                    <div className="text-center mb-8">
                      <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                        className="inline-flex w-16 h-16 rounded-2xl items-center justify-center mb-5"
                        style={{ background: 'linear-gradient(135deg, rgba(253,121,168,0.15), rgba(253,121,168,0.05))', border: '1px solid rgba(253,121,168,0.15)' }}>
                        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fd79a8" strokeWidth="1.6"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10,9 9,9 8,9"/></svg>
                      </motion.div>
                      <h2 className="text-2xl font-black tracking-tight mb-2">Upload Your Resume</h2>
                      <p className="text-[13px] text-[#6a6a7a] leading-relaxed">Our AI will parse it instantly and optimize for<br/>maximum ATS score across all job boards.</p>
                    </div>

                    {/* Drop Zone */}
                    <motion.div
                      onClick={() => fileRef.current?.click()}
                      onDragOver={e => { e.preventDefault(); setDragging(true) }}
                      onDragLeave={() => setDragging(false)}
                      onDrop={onDrop}
                      animate={dragging ? { scale: 1.02, borderColor: 'rgba(253,121,168,0.5)' } : {}}
                      whileHover={{ borderColor: 'rgba(253,121,168,0.25)' }}
                      className="relative cursor-pointer rounded-2xl p-10 text-center transition-all overflow-hidden"
                      style={{ border: '2px dashed rgba(255,255,255,0.08)', background: dragging ? 'rgba(253,121,168,0.04)' : 'rgba(255,255,255,0.01)' }}>

                      <input ref={fileRef} type="file" accept=".pdf,.docx" className="hidden"
                        onChange={e => setResumeFile(e.target.files?.[0] || null)} />

                      <AnimatePresence mode="wait">
                        {resumeFile ? (
                          <motion.div key="file" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                            <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 0.5 }}
                              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                              style={{ background: 'linear-gradient(135deg, rgba(0,184,148,0.15), rgba(0,184,148,0.05))', border: '1px solid rgba(0,184,148,0.2)' }}>
                              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#00b894" strokeWidth="2"><path d="M20 6L9 17L4 12"/></svg>
                            </motion.div>
                            <div className="text-[15px] font-bold text-white mb-1">{resumeFile.name}</div>
                            <div className="text-[12px] text-[#00b894] font-semibold">{(resumeFile.size / 1024).toFixed(0)} KB · Ready to upload</div>
                            <button onClick={e => { e.stopPropagation(); setResumeFile(null) }}
                              className="mt-4 text-[11px] text-[#5a5a6a] hover:text-[#fd79a8] transition-colors">
                              Remove file
                            </button>
                          </motion.div>
                        ) : (
                          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#4a4a5a" strokeWidth="1.6"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17,8 12,3 7,8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                            </motion.div>
                            <div className="text-[14px] font-bold text-white mb-1">Drop your resume here</div>
                            <div className="text-[12px] text-[#4a4a5a] mb-4">or click to browse files</div>
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-bold" style={{ background: 'rgba(253,121,168,0.06)', color: '#fd79a8', border: '1px solid rgba(253,121,168,0.12)' }}>
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v20M2 12h20"/></svg>
                              PDF or DOCX · Max 10MB
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>

                    {/* AI badge */}
                    <div className="flex items-center justify-center gap-2 mt-4 mb-8">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#00b894] animate-pulse" />
                      <span className="text-[11px] text-[#4a4a5a]">AI parses your resume in under 3 seconds · ATS-optimized instantly</span>
                    </div>

                    <div className="flex gap-3">
                      <button onClick={() => goTo(1)}
                        className="flex-1 py-3.5 rounded-xl text-[13px] font-semibold text-[#5a5a6a] hover:text-white transition-all"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        Skip for now
                      </button>
                      <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.97 }} onClick={handleResumeUpload} disabled={uploading}
                        className="flex-1 py-3.5 rounded-xl text-white font-bold text-[13px] disabled:opacity-50 transition-all"
                        style={{ background: 'linear-gradient(135deg, #fd79a8, #e84393)', boxShadow: '0 8px 30px rgba(253,121,168,0.3)' }}>
                        {uploading ? (
                          <span className="flex items-center justify-center gap-2">
                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                              className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white" />
                            Uploading...
                          </span>
                        ) : 'Continue →'}
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                {/* ── STEP 1: PREFERENCES ── */}
                {step === 1 && (
                  <motion.div key="step1" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit">
                    <div className="text-center mb-8">
                      <motion.div initial={{ scale: 0, rotate: 20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                        className="inline-flex w-16 h-16 rounded-2xl items-center justify-center mb-5"
                        style={{ background: 'linear-gradient(135deg, rgba(162,155,254,0.15), rgba(162,155,254,0.05))', border: '1px solid rgba(162,155,254,0.15)' }}>
                        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#a29bfe" strokeWidth="1.6"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
                      </motion.div>
                      <h2 className="text-2xl font-black tracking-tight mb-2">Set Your Preferences</h2>
                      <p className="text-[13px] text-[#6a6a7a]">Tell the AI what you want — it will hunt down<br/>perfect-match jobs automatically.</p>
                    </div>

                    <div className="space-y-6">
                      {/* Roles */}
                      <div>
                        <label className="block text-[12px] font-bold text-[#6a6a7a] mb-3 uppercase tracking-widest">Target Roles</label>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {ROLES.map((role, i) => (
                            <motion.button key={role} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                              onClick={() => toggleChip(selectedRoles, setSelectedRoles, role)} whileTap={{ scale: 0.95 }}
                              className="px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all"
                              style={selectedRoles.includes(role)
                                ? { background: 'rgba(253,121,168,0.12)', color: '#fd79a8', border: '1px solid rgba(253,121,168,0.3)', boxShadow: '0 0 12px rgba(253,121,168,0.1)' }
                                : { background: 'rgba(255,255,255,0.03)', color: '#6a6a7a', border: '1px solid rgba(255,255,255,0.06)' }}>
                              {role}
                            </motion.button>
                          ))}
                        </div>
                        <input value={customRole} onChange={e => setCustomRole(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter' && customRole.trim()) { setSelectedRoles([...selectedRoles, customRole.trim()]); setCustomRole('') } }}
                          placeholder="+ Add custom role & press Enter"
                          className="w-full px-4 py-2.5 rounded-xl bg-[#16161f] border border-white/[0.06] text-white text-[13px] placeholder-[#3a3a4a] focus:outline-none focus:border-[rgba(253,121,168,0.3)] transition-all" />
                      </div>

                      {/* Locations */}
                      <div>
                        <label className="block text-[12px] font-bold text-[#6a6a7a] mb-3 uppercase tracking-widest">Preferred Locations</label>
                        <div className="flex flex-wrap gap-2">
                          {LOCATIONS.map((loc, i) => (
                            <motion.button key={loc} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                              onClick={() => toggleChip(selectedLocations, setSelectedLocations, loc)} whileTap={{ scale: 0.95 }}
                              className="px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all"
                              style={selectedLocations.includes(loc)
                                ? { background: 'rgba(116,185,255,0.12)', color: '#74b9ff', border: '1px solid rgba(116,185,255,0.3)', boxShadow: '0 0 12px rgba(116,185,255,0.08)' }
                                : { background: 'rgba(255,255,255,0.03)', color: '#6a6a7a', border: '1px solid rgba(255,255,255,0.06)' }}>
                              {loc}
                            </motion.button>
                          ))}
                        </div>
                      </div>

                      {/* Work Type + Experience */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[12px] font-bold text-[#6a6a7a] mb-2 uppercase tracking-widest">Work Type</label>
                          <select value={preferences.remote_preference} onChange={e => setPreferences({ ...preferences, remote_preference: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl text-white text-[13px] focus:outline-none focus:border-[rgba(253,121,168,0.3)] transition-all appearance-none"
                            style={{ background: '#16161f', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <option value="any">Any</option>
                            <option value="remote">Remote</option>
                            <option value="hybrid">Hybrid</option>
                            <option value="onsite">On-site</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[12px] font-bold text-[#6a6a7a] mb-2 uppercase tracking-widest">Experience</label>
                          <select value={preferences.experience_level} onChange={e => setPreferences({ ...preferences, experience_level: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl text-white text-[13px] focus:outline-none focus:border-[rgba(253,121,168,0.3)] transition-all appearance-none"
                            style={{ background: '#16161f', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <option value="entry">Entry Level</option>
                            <option value="mid">Mid Level</option>
                            <option value="senior">Senior</option>
                            <option value="lead">Lead / Staff</option>
                            <option value="executive">Executive</option>
                          </select>
                        </div>
                      </div>

                      {/* Min Salary */}
                      <div>
                        <label className="block text-[12px] font-bold text-[#6a6a7a] mb-2 uppercase tracking-widest">Minimum Salary <span className="normal-case text-[#3a3a4a]">(optional)</span></label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5a5a6a] text-[14px] font-bold">$</span>
                          <input type="number" value={preferences.min_salary} onChange={e => setPreferences({ ...preferences, min_salary: e.target.value })} placeholder="80,000"
                            className="w-full pl-8 pr-4 py-3 rounded-xl bg-[#16161f] border border-white/[0.06] text-white text-[13px] placeholder-[#3a3a4a] focus:outline-none focus:border-[rgba(253,121,168,0.3)] transition-all" />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#4a4a5a] text-[11px]">/year</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 mt-8">
                      <motion.button whileTap={{ scale: 0.97 }} onClick={() => goTo(0)}
                        className="py-3.5 px-6 rounded-xl text-[13px] font-semibold text-[#5a5a6a] hover:text-white transition-all"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        ← Back
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.97 }} onClick={handlePreferences} disabled={saving}
                        className="flex-1 py-3.5 rounded-xl text-white font-bold text-[13px] disabled:opacity-50 transition-all"
                        style={{ background: 'linear-gradient(135deg, #a29bfe, #6c5ce7)', boxShadow: '0 8px 30px rgba(162,155,254,0.3)' }}>
                        {saving ? (
                          <span className="flex items-center justify-center gap-2">
                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                              className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white" />
                            Saving...
                          </span>
                        ) : 'Continue →'}
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                {/* ── STEP 2: PLAN ── */}
                {step === 2 && (
                  <motion.div key="step2" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit">
                    <div className="text-center mb-8">
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 12 }}
                        className="inline-flex w-16 h-16 rounded-2xl items-center justify-center mb-5 relative"
                        style={{ background: 'linear-gradient(135deg, rgba(253,203,94,0.15), rgba(253,203,94,0.05))', border: '1px solid rgba(253,203,94,0.15)' }}>
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                          className="absolute inset-0 rounded-2xl" style={{ border: '1px solid transparent', backgroundImage: 'linear-gradient(#12121e, #12121e), linear-gradient(135deg, rgba(253,203,94,0.4), transparent)', backgroundOrigin: 'border-box', backgroundClip: 'padding-box, border-box' }} />
                        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fdcb6e" strokeWidth="1.6"><polygon points="13,2 3,14 12,14 11,22 21,10 12,10"/></svg>
                      </motion.div>
                      <h2 className="text-2xl font-black tracking-tight mb-2">Ready to Launch 🚀</h2>
                      <p className="text-[13px] text-[#6a6a7a]">Start free and upgrade anytime.<br/>No credit card required.</p>
                    </div>

                    <div className="space-y-3 mb-8">
                      {plans.map((plan, i) => (
                        <motion.div key={plan.name} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                          onClick={() => setSelectedPlan(plan.name)}
                          className="relative flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all"
                          style={selectedPlan === plan.name
                            ? { background: `${plan.color}08`, border: `1.5px solid ${plan.color}30`, boxShadow: `0 0 20px ${plan.color}10` }
                            : { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>

                          {plan.popular && (
                            <div className="absolute -top-3 right-4 text-[9px] font-black px-2.5 py-0.5 rounded-full text-white"
                              style={{ background: 'linear-gradient(135deg, #a29bfe, #6c5ce7)' }}>MOST POPULAR</div>
                          )}

                          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: `${plan.color}12`, color: plan.color }}>
                            {plan.icon}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[14px] font-bold text-white">{plan.label}</span>
                              <span className="text-[13px] font-black" style={{ color: plan.color }}>{plan.price}</span>
                              <span className="text-[11px] text-[#4a4a5a]">{plan.period}</span>
                            </div>
                            <div className="text-[11px] text-[#5a5a6a] leading-relaxed">{plan.features[0]} · {plan.features[1]}</div>
                          </div>

                          <motion.div animate={selectedPlan === plan.name ? { scale: 1 } : { scale: 0 }}
                            className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                            style={{ background: `linear-gradient(135deg, ${plan.color}, ${plan.color}aa)` }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M20 6L9 17L4 12"/></svg>
                          </motion.div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Stats bar */}
                    <div className="flex items-center justify-around py-4 mb-8 rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                      {[['847K+', 'Apps Sent'], ['94%', 'ATS Pass Rate'], ['48%', 'Interview Rate']].map(([val, label]) => (
                        <div key={label} className="text-center">
                          <div className="text-[16px] font-black text-white">{val}</div>
                          <div className="text-[10px] text-[#4a4a5a] mt-0.5">{label}</div>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-3">
                      <motion.button whileTap={{ scale: 0.97 }} onClick={() => goTo(1)}
                        className="py-3.5 px-6 rounded-xl text-[13px] font-semibold text-[#5a5a6a] hover:text-white transition-all"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        ← Back
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.01, boxShadow: '0 12px 40px rgba(253,121,168,0.4)' }} whileTap={{ scale: 0.97 }}
                        onClick={handleComplete} disabled={completing}
                        className="flex-1 py-3.5 rounded-xl text-white font-black text-[14px] disabled:opacity-50 transition-all"
                        style={{ background: 'linear-gradient(135deg, #fd79a8, #e84393)', boxShadow: '0 8px 30px rgba(253,121,168,0.35)' }}>
                        {completing ? (
                          <span className="flex items-center justify-center gap-2">
                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                              className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white" />
                            Launching...
                          </span>
                        ) : '⚡ Start Applying on Autopilot'}
                      </motion.button>
                    </div>

                    <p className="text-center text-[11px] text-[#3a3a4a] mt-4">
                      Free plan starts immediately · Upgrade anytime from Settings
                    </p>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Footer */}
        <motion.div variants={fadeIn} initial="hidden" animate="show" transition={{ delay: 0.5 }} className="text-center mt-8">
          <p className="text-[11px] text-[#3a3a4a]">
            By continuing you agree to our{' '}
            <span className="text-[#5a5a6a] hover:text-[#fd79a8] cursor-pointer transition-colors">Terms</span>
            {' '}and{' '}
            <span className="text-[#5a5a6a] hover:text-[#fd79a8] cursor-pointer transition-colors">Privacy Policy</span>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
