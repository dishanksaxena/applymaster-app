'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'

function Particles() {
  const [particles] = useState(() =>
    Array.from({ length: 40 }, (_, i) => ({
      id: i, x: Math.random() * 100, y: Math.random() * 100, size: Math.random() * 2.5 + 0.5,
      duration: Math.random() * 20 + 15, delay: Math.random() * 10, opacity: Math.random() * 0.3 + 0.05,
    }))
  )
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map(p => (
        <motion.div key={p.id} className="absolute rounded-full"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, background: `rgba(253,121,168,${p.opacity})` }}
          animate={{ y: [0, -30, 10, -20, 0], x: [0, 15, -10, 20, 0], opacity: [p.opacity, p.opacity * 2, p.opacity * 0.5, p.opacity * 1.5, p.opacity] }}
          transition={{ duration: p.duration, repeat: Infinity, ease: 'linear', delay: p.delay }} />
      ))}
    </div>
  )
}

function GlowCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const mouseX = useMotionValue(0), mouseY = useMotionValue(0)
  const spotlightX = useTransform(mouseX, v => `${v}px`), spotlightY = useTransform(mouseY, v => `${v}px`)

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    mouseX.set(e.clientX - rect.left); mouseY.set(e.clientY - rect.top)
  }, [mouseX, mouseY])

  return (
    <div className={`relative group ${className}`} onMouseMove={handleMouseMove}>
      <div className="absolute -inset-[1px] rounded-[28px] overflow-hidden">
        <motion.div className="absolute inset-0" animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          style={{ background: 'conic-gradient(from 0deg, transparent 0%, rgba(253,121,168,0.4) 10%, transparent 20%, rgba(162,155,254,0.3) 30%, transparent 40%, rgba(116,185,255,0.3) 50%, transparent 60%, rgba(253,121,168,0.4) 70%, transparent 80%, rgba(253,203,94,0.2) 90%, transparent 100%)' }} />
      </div>
      <div className="relative rounded-[27px] overflow-hidden" style={{ background: 'linear-gradient(170deg, #111120 0%, #0a0a15 50%, #0d0d1a 100%)' }}>
        <motion.div className="absolute w-[400px] h-[400px] rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ left: spotlightX, top: spotlightY, x: '-50%', y: '-50%', background: 'radial-gradient(circle, rgba(253,121,168,0.06) 0%, transparent 60%)' }} />
        <motion.div className="absolute top-0 left-0 right-0 h-[1px]"
          animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(253,121,168,0.5), rgba(162,155,254,0.5), transparent)', backgroundSize: '200% 100%' }} />
        <div className="relative z-10">{children}</div>
      </div>
    </div>
  )
}

function MagneticButton({ children, onClick, disabled = false, variant = 'primary', className = '' }: any) {
  const ref = useRef<HTMLButtonElement>(null), x = useMotionValue(0), y = useMotionValue(0)
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    x.set((e.clientX - rect.left - rect.width / 2) * 0.15); y.set((e.clientY - rect.top - rect.height / 2) * 0.15)
  }
  return (
    <motion.button ref={ref} style={{ x, y }} onClick={onClick} disabled={disabled} onMouseMove={handleMouseMove} onMouseLeave={() => { x.set(0); y.set(0) }} whileTap={{ scale: 0.95 }}
      className={`relative overflow-hidden font-bold text-[13px] tracking-wide transition-all disabled:opacity-40 disabled:pointer-events-none ${className}`}>
      {variant === 'primary' ? (
        <>
          <motion.div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #fd79a8, #e84393, #d63384)' }} />
          <motion.div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity" animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
            transition={{ duration: 3, repeat: Infinity }} style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)', backgroundSize: '200% 100%' }} />
        </>
      ) : (
        <div className="absolute inset-0" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }} />
      )}
      <span className={`relative z-10 flex items-center justify-center gap-2 ${variant === 'primary' ? 'text-white' : 'text-[#8a8a9a]'}`}>{children}</span>
    </motion.button>
  )
}

const ROLES = ['Software Engineer', 'Product Manager', 'Data Scientist', 'Designer', 'DevOps Engineer', 'Full Stack Dev', 'Frontend Dev', 'Backend Dev', 'ML Engineer', 'Mobile Dev']
const INDUSTRIES = ['Technology/IT', 'Finance', 'Healthcare', 'E-commerce', 'SaaS', 'Consulting', 'Manufacturing', 'Real Estate', 'Education', 'Media & Entertainment', 'Telecommunications', 'Automotive', 'Food & Beverage', 'Travel & Tourism', 'Logistics', 'Retail', 'Banking', 'Insurance', 'Government', 'Energy', 'Agriculture', 'Construction', 'Nonprofits', 'Legal Services', 'Recruiting', 'Marketing', 'Biotech/Pharma', 'Gaming', 'Fintech', 'Sustainability']
const WORK_AUTH = ['Citizen', 'Permanent Resident', 'Work Visa (Can Work)', 'Need Sponsorship', 'No Restrictions']
const EMPLOYMENT = ['Employed (Actively Looking)', 'Employed (Passive)', 'Unemployed', 'Student', 'Recently Laid Off', 'Self-Employed']
const START_DATES = ['Immediately', 'Within 2 Weeks', 'Within 1 Month', 'Within 2 Months', 'Within 3 Months', '3–6 Months', 'More than 6 Months', 'Flexible / Not Sure']
const ETHNICITIES = ['Prefer not to say', 'Asian or Pacific Islander', 'Black or African American', 'Hispanic or Latino', 'Middle Eastern or North African', 'Native American or Alaska Native', 'White or Caucasian', 'Two or more races', 'Other']
const CITIES_BY_COUNTRY: Record<string, string[]> = {
  'United States': ['New York', 'San Francisco', 'Los Angeles', 'Seattle', 'Austin', 'Boston', 'Chicago', 'Denver', 'Miami', 'Portland', 'Atlanta', 'Dallas', 'Washington DC'],
  'Canada': ['Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Ottawa', 'Edmonton'],
  'United Kingdom': ['London', 'Manchester', 'Edinburgh', 'Birmingham', 'Bristol', 'Leeds'],
  'Australia': ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide'],
  'India': ['Bangalore', 'Mumbai', 'Delhi', 'Hyderabad', 'Chennai', 'Pune', 'Ahmedabad'],
  'Germany': ['Berlin', 'Munich', 'Hamburg', 'Frankfurt', 'Cologne'],
  'Netherlands': ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht'],
  'France': ['Paris', 'Lyon', 'Marseille', 'Bordeaux'],
  'Spain': ['Madrid', 'Barcelona', 'Valencia', 'Seville'],
  'Japan': ['Tokyo', 'Osaka', 'Yokohama', 'Kyoto'],
  'Singapore': ['Singapore'],
  'UAE': ['Dubai', 'Abu Dhabi', 'Sharjah'],
  'Hong Kong': ['Hong Kong'],
  'Ireland': ['Dublin', 'Cork', 'Galway'],
  'Sweden': ['Stockholm', 'Gothenburg', 'Malmö'],
  'Remote / Any': ['Open to Any Location'],
}
const SKILLS = ['Python', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'SQL', 'AWS', 'GCP', 'Docker', 'Kubernetes', 'Machine Learning', 'Data Analysis', 'UI/UX Design', 'Product Strategy', 'Leadership', 'Communication', 'Problem Solving', 'Project Management']
const COMPANY_SIZES = ['Startup (<50)', 'Small (50-200)', 'Medium (200-1000)', 'Large (1000+)', 'No preference']
const JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'No preference']
const INTERVIEW_STYLES = ['Behavioral', 'Technical/Coding', 'Case Studies', 'System Design', 'No preference']

const plans = [
  { name: 'free', label: 'Free', price: '$0', period: 'forever', features: ['10 applications/month', 'Basic job matching', 'Resume upload'] },
  { name: 'pro', label: 'Pro', price: '$29', period: '/month', popular: true, features: ['100 applications/month', 'AI resume optimizer', 'Cover letter generation'] },
  { name: 'elite', label: 'Elite', price: '$59', period: '/month', features: ['Unlimited applications', 'Auto-apply engine', 'AI interview coach'] },
]

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0, scale: 0.96, filter: 'blur(6px)' }),
  center: { x: 0, opacity: 1, scale: 1, filter: 'blur(0px)', transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } },
  exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0, scale: 0.96, filter: 'blur(6px)', transition: { duration: 0.4 } }),
}

export default function OnboardingPage() {
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [uploading, setUploading] = useState(false)
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  // Step 2: Preferences
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [minSalary, setMinSalary] = useState(50000)
  const [maxSalary, setMaxSalary] = useState(150000)
  const [remotePreference, setRemotePreference] = useState('any')
  const [experienceLevel, setExperienceLevel] = useState('mid')
  const [workType, setWorkType] = useState('Full-time')

  // Step 3: Career Details
  const [workAuth, setWorkAuth] = useState('Citizen')
  const [employmentStatus, setEmploymentStatus] = useState('Employed (Actively Looking)')
  const [desiredJobTitle, setDesiredJobTitle] = useState('')
  const [availableStartDate, setAvailableStartDate] = useState('Immediately')
  const [willingToRelocate, setWillingToRelocate] = useState(true)
  const [selectedCountry, setSelectedCountry] = useState('')
  const [selectedCities, setSelectedCities] = useState<string[]>([])
  const [ethnicity, setEthnicity] = useState('Prefer not to say')

  // Step 4: Skills
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([])
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [companySize, setCompanySize] = useState('No preference')
  const [interviewStyle, setInterviewStyle] = useState('No preference')

  const [selectedPlan, setSelectedPlan] = useState('free')
  const [loadedResumeName, setLoadedResumeName] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
    // Load existing resume from profile
    const loadResume = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data } = await supabase.from('profiles').select('resume_name').eq('id', user.id).single()
        if (data?.resume_name) {
          setLoadedResumeName(data.resume_name)
        }
      } catch (err) { console.error('Error loading resume:', err) }
    }
    loadResume()
  }, [])

  const goTo = (next: number) => { setDirection(next > step ? 1 : -1); setStep(next) }

  const toggleChip = (arr: string[], setArr: (v: string[]) => void, val: string, max?: number) => {
    if (arr.includes(val)) setArr(arr.filter(x => x !== val))
    else if (!max || arr.length < max) setArr([...arr, val])
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
        // Also save to profile
        await supabase.from('profiles').update({ resume_url: publicUrl, resume_name: resumeFile.name }).eq('id', user.id)
      }
    } catch { }
    setUploading(false); goTo(1)
  }

  const canProceedStep2 = selectedRoles.length > 0 && minSalary > 0 && maxSalary > minSalary
  const canProceedStep3 = desiredJobTitle.trim().length > 0 && selectedCountry.length > 0 && selectedCities.length > 0
  const canProceedStep4 = selectedIndustries.length > 0 && selectedSkills.length > 0

  const saveStep2 = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await supabase.from('job_preferences').upsert({
        user_id: user.id,
        target_roles: selectedRoles,
        experience_level: experienceLevel,
        min_salary: minSalary,
        max_salary: maxSalary,
        remote_preference: remotePreference,
        employment_type: workType,
      })
    } catch (err) { console.error('saveStep2:', err) }
    goTo(2)
  }

  const saveStep3 = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await supabase.from('job_preferences').upsert({
        user_id: user.id,
        work_authorization: workAuth,
        current_employment_status: employmentStatus,
        desired_job_title: desiredJobTitle,
        available_start_date: availableStartDate,
        willing_to_relocate: willingToRelocate,
        country_preference: selectedCountry,
        city_preferences: selectedCities,
        ethnicity: ethnicity || null,
      })
    } catch (err) { console.error('saveStep3:', err) }
    goTo(3)
  }

  const handleSavePreferences = async () => {
    if (!canProceedStep4) return
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await supabase.from('job_preferences').upsert({
        user_id: user.id,
        target_roles: selectedRoles.length > 0 ? selectedRoles : ['Software Engineer'],
        experience_level: experienceLevel,
        min_salary: minSalary,
        max_salary: maxSalary,
        remote_preference: remotePreference,
        employment_type: workType,
        industries: selectedIndustries,
        work_authorization: workAuth,
        current_employment_status: employmentStatus,
        desired_job_title: desiredJobTitle,
        available_start_date: availableStartDate,
        willing_to_relocate: willingToRelocate,
        country_preference: selectedCountry,
        city_preferences: selectedCities,
        ethnicity: ethnicity || null,
        key_skills: selectedSkills,
        company_size_preference: companySize,
        interview_strength: interviewStyle,
      })
    } catch (err) {
      console.error('Error:', err)
    }
    setSaving(false); goTo(5)
  }

  const handleComplete = async () => {
    setCompleting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await supabase.from('profiles').update({ onboarding_complete: true }).eq('id', user.id)
      router.push('/dashboard'); router.refresh()
    } catch (err) {
      console.error('Error:', err)
    }
  }

  const stepLabels = ['Resume', 'Preferences', 'Details', 'Skills', 'Plan']

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-[#050510] flex items-center justify-center relative overflow-hidden py-10 px-4">
      <style jsx global>{`
        @keyframes mesh-shift { 0%, 100% { background-position: 0% 50%; } 25% { background-position: 100% 0%; } 50% { background-position: 100% 100%; } 75% { background-position: 0% 100%; } }
        @keyframes aurora { 0% { transform: rotate(0deg) scale(1.5); } 33% { transform: rotate(120deg) scale(1.2); } 66% { transform: rotate(240deg) scale(1.6); } 100% { transform: rotate(360deg) scale(1.5); } }
      `}</style>

      <div className="absolute inset-0">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(-45deg, rgba(253,121,168,0.08), rgba(10,10,20,1), rgba(162,155,254,0.06), rgba(10,10,20,1), rgba(116,185,255,0.05))', backgroundSize: '400% 400%', animation: 'mesh-shift 20s ease infinite' }} />
      </div>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-40%] right-[-20%] w-[800px] h-[800px] rounded-full opacity-[0.04]" style={{ background: 'radial-gradient(circle, #fd79a8, transparent 60%)', animation: 'aurora 25s ease-in-out infinite' }} />
      </div>

      <Particles />
      <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '80px 80px' }} />

      <div className="relative z-10 w-full max-w-[650px]">
        <motion.div className="flex items-center justify-center gap-3 mb-10" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}>
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #fd79a8, #e84393)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polygon points="13,2 3,14 12,14 11,22 21,10 12,10" /></svg>
          </div>
          <span className="text-[18px] font-black tracking-tight text-white">ApplyMaster</span>
        </motion.div>

        <motion.div className="flex items-center justify-center mb-10 gap-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.3 }}>
          {stepLabels.map((label, i) => (
            <div key={label} className="flex items-center gap-1">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold" style={i < step ? { background: 'linear-gradient(135deg, #fd79a8, #e84393)' } : i === step ? { background: 'rgba(253,121,168,0.2)', border: '1px solid rgba(253,121,168,0.4)', color: '#fd79a8' } : { background: 'rgba(255,255,255,0.05)', color: '#3a3a4a' }}>
                {i < step ? '✓' : i + 1}
              </div>
              {i < 4 && <div className="w-6 h-px" style={{ background: i < step ? 'linear-gradient(90deg, #fd79a8, #e84393)' : 'rgba(255,255,255,0.1)' }} />}
            </div>
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.8, delay: 0.4 }}>
          <GlowCard>
            <div className="p-8 sm:p-10 max-h-[720px] overflow-y-auto">
              <AnimatePresence custom={direction} mode="wait">

                {/* STEP 0: RESUME */}
                {step === 0 && (
                  <motion.div key="step-0" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-black text-white mb-2">Upload Your Resume</h2>
                      <p className="text-[13px] text-[#8a8a9a]">We'll analyze your experience to find better matches</p>
                    </div>
                    <div onDrop={onDrop} onDragOver={e => { e.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)}
                      onClick={() => fileRef.current?.click()}
                      className="border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer select-none"
                      style={{ borderColor: dragging ? 'rgba(253,121,168,0.5)' : 'rgba(255,255,255,0.1)', background: dragging ? 'rgba(253,121,168,0.05)' : 'rgba(255,255,255,0.01)' }}>
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-3 text-[#fd79a8]">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      <p className="text-white font-semibold mb-1">Drag & drop your resume</p>
                      <p className="text-[12px] text-[#5a5a6a] mb-3">PDF or DOCX</p>
                      <input type="file" ref={fileRef} onChange={e => e.target.files && setResumeFile(e.target.files[0])} className="hidden" accept=".pdf,.docx" onClick={e => e.stopPropagation()} />
                      <span className="text-[12px] px-3 py-1.5 rounded-lg bg-[rgba(253,121,168,0.1)] text-[#fd79a8] pointer-events-none inline-block">
                        Or browse
                      </span>
                    </div>
                    {resumeFile && <p className="text-[12px] text-[#00b894]">✓ {resumeFile.name} selected (new)</p>}
                    {!resumeFile && loadedResumeName && <p className="text-[12px] text-[#00b894]">✓ {loadedResumeName} (uploaded)</p>}
                    <div className="flex gap-3 pt-4">
                      <MagneticButton onClick={() => goTo(1)} className="flex-1 h-11">Skip</MagneticButton>
                      <MagneticButton onClick={handleResumeUpload} disabled={uploading} className="flex-1 h-11" variant="primary">
                        {uploading ? 'Uploading...' : 'Continue'}
                      </MagneticButton>
                    </div>
                  </motion.div>
                )}

                {/* STEP 1: PREFERENCES */}
                {step === 1 && (
                  <motion.div key="step-1" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-black text-white mb-2">Job Preferences</h2>
                      <p className="text-[13px] text-[#8a8a9a]">What are you looking for?</p>
                    </div>

                    {/* Target Roles */}
                    <div>
                      <label className="block text-[12px] font-bold text-[#fd79a8] mb-3">TARGET ROLES (Select up to 5) *</label>
                      <div className="grid grid-cols-2 gap-2">
                        {ROLES.map(role => (
                          <button key={role} onClick={() => toggleChip(selectedRoles, setSelectedRoles, role, 5)}
                            className={`px-3 py-2 rounded-lg text-[12px] font-medium transition-all ${selectedRoles.includes(role) ? 'bg-[rgba(253,121,168,0.15)] text-[#fd79a8] border border-[rgba(253,121,168,0.3)]' : 'bg-[rgba(255,255,255,0.04)] text-[#8a8a9a] hover:bg-[rgba(255,255,255,0.08)]'}`}>
                            {role}
                          </button>
                        ))}
                      </div>
                      {selectedRoles.length === 0 && <p className="text-[11px] text-[#ff6b6b] mt-2">❌ Required</p>}
                    </div>

                    {/* Experience Level */}
                    <div>
                      <label className="block text-[12px] font-bold text-[#fd79a8] mb-3">EXPERIENCE LEVEL *</label>
                      <div className="grid grid-cols-3 gap-2">
                        {['entry', 'mid', 'senior', 'lead', 'executive'].map(level => (
                          <button key={level} onClick={() => setExperienceLevel(level)}
                            className={`px-3 py-2 rounded-lg text-[12px] font-medium transition-all ${experienceLevel === level ? 'bg-gradient-to-r from-[#fd79a8] to-[#e84393] text-white' : 'bg-[rgba(255,255,255,0.04)] text-[#8a8a9a] hover:bg-[rgba(255,255,255,0.08)]'}`}>
                            {level.charAt(0).toUpperCase() + level.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Salary Range */}
                    <div>
                      <label className="block text-[12px] font-bold text-[#fd79a8] mb-3">ANNUAL SALARY RANGE *</label>
                      <div className="space-y-3">
                        <div className="flex justify-between text-[12px] text-[#8a8a9a] font-semibold">
                          <span>Min: ${(minSalary / 1000).toFixed(0)}k</span>
                          <span>Max: ${(maxSalary / 1000).toFixed(0)}k</span>
                        </div>
                        <input type="range" min="30000" max="500000" step="5000" value={minSalary}
                          onChange={e => setMinSalary(Math.min(parseInt(e.target.value), maxSalary - 5000))}
                          className="w-full h-2 bg-[rgba(253,121,168,0.3)] rounded-lg appearance-none cursor-pointer accent-[#fd79a8]" />
                        <input type="range" min="30000" max="500000" step="5000" value={maxSalary}
                          onChange={e => setMaxSalary(Math.max(parseInt(e.target.value), minSalary + 5000))}
                          className="w-full h-2 bg-[rgba(253,121,168,0.3)] rounded-lg appearance-none cursor-pointer accent-[#fd79a8]" />
                      </div>
                    </div>

                    {/* Remote Preference */}
                    <div>
                      <label className="block text-[12px] font-bold text-[#fd79a8] mb-3">REMOTE PREFERENCE *</label>
                      <div className="grid grid-cols-2 gap-2">
                        {['remote', 'hybrid', 'onsite', 'any'].map(pref => (
                          <button key={pref} onClick={() => setRemotePreference(pref)}
                            className={`px-3 py-2 rounded-lg text-[12px] font-medium transition-all ${remotePreference === pref ? 'bg-gradient-to-r from-[#fd79a8] to-[#e84393] text-white' : 'bg-[rgba(255,255,255,0.04)] text-[#8a8a9a] hover:bg-[rgba(255,255,255,0.08)]'}`}>
                            {pref.charAt(0).toUpperCase() + pref.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Work Type */}
                    <div>
                      <label className="block text-[12px] font-bold text-[#fd79a8] mb-3">WORK TYPE *</label>
                      <div className="grid grid-cols-2 gap-2">
                        {JOB_TYPES.map(type => (
                          <button key={type} onClick={() => setWorkType(type)}
                            className={`px-3 py-2 rounded-lg text-[12px] font-medium transition-all ${workType === type ? 'bg-gradient-to-r from-[#fd79a8] to-[#e84393] text-white' : 'bg-[rgba(255,255,255,0.04)] text-[#8a8a9a] hover:bg-[rgba(255,255,255,0.08)]'}`}>
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <MagneticButton onClick={() => goTo(0)} variant="secondary" className="flex-1 h-11">Back</MagneticButton>
                      <MagneticButton onClick={saveStep2} disabled={!canProceedStep2} className="flex-1 h-11" variant="primary">
                        Next {!canProceedStep2 && '(Select roles & salary)'}
                      </MagneticButton>
                    </div>
                  </motion.div>
                )}

                {/* STEP 2: CAREER DETAILS */}
                {step === 2 && (
                  <motion.div key="step-2" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-black text-white mb-2">Career Details</h2>
                      <p className="text-[13px] text-[#8a8a9a]">Help us understand your situation</p>
                    </div>

                    {/* Employment Status */}
                    <div>
                      <label className="block text-[12px] font-bold text-[#fd79a8] mb-2">EMPLOYMENT STATUS *</label>
                      <select value={employmentStatus} onChange={e => setEmploymentStatus(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-[rgba(255,255,255,0.08)] text-white text-[13px] focus:border-[rgba(253,121,168,0.3)] focus:outline-none transition-all cursor-pointer"
                        style={{ background: '#13131f' }}>
                        {EMPLOYMENT.map(e => <option key={e} value={e} style={{ background: '#13131f', color: 'white' }}>{e}</option>)}
                      </select>
                    </div>

                    {/* Work Authorization */}
                    <div>
                      <label className="block text-[12px] font-bold text-[#fd79a8] mb-2">WORK AUTHORIZATION *</label>
                      <select value={workAuth} onChange={e => setWorkAuth(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-[rgba(255,255,255,0.08)] text-white text-[13px] focus:border-[rgba(253,121,168,0.3)] focus:outline-none transition-all cursor-pointer"
                        style={{ background: '#13131f' }}>
                        {WORK_AUTH.map(auth => <option key={auth} value={auth} style={{ background: '#13131f', color: 'white' }}>{auth}</option>)}
                      </select>
                    </div>

                    {/* Desired Job Title */}
                    <div>
                      <label className="block text-[12px] font-bold text-[#fd79a8] mb-2">DESIRED JOB TITLE *</label>
                      <input type="text" value={desiredJobTitle} onChange={e => setDesiredJobTitle(e.target.value)} placeholder="e.g., Senior Software Engineer"
                        className="w-full px-4 py-2.5 rounded-lg bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-white placeholder-[#3a3a4a] text-[13px] focus:border-[rgba(253,121,168,0.3)] focus:outline-none transition-all" />
                      {desiredJobTitle.trim().length === 0 && <p className="text-[11px] text-[#ff6b6b] mt-1">❌ Required</p>}
                    </div>

                    {/* Start Date */}
                    <div>
                      <label className="block text-[12px] font-bold text-[#fd79a8] mb-2">WHEN CAN YOU START? *</label>
                      <select value={availableStartDate} onChange={e => setAvailableStartDate(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-[rgba(255,255,255,0.08)] text-white text-[13px] focus:border-[rgba(253,121,168,0.3)] focus:outline-none transition-all cursor-pointer"
                        style={{ background: '#13131f' }}>
                        {START_DATES.map(date => <option key={date} value={date} style={{ background: '#13131f', color: 'white' }}>{date}</option>)}
                      </select>
                    </div>

                    {/* Willing to Relocate */}
                    <div>
                      <label className="block text-[12px] font-bold text-[#fd79a8] mb-2">WILLING TO RELOCATE? *</label>
                      <div className="flex gap-2">
                        <button onClick={() => setWillingToRelocate(true)}
                          className={`flex-1 px-4 py-2.5 rounded-lg border font-medium transition-all ${willingToRelocate ? 'bg-gradient-to-r from-[#fd79a8] to-[#e84393] text-white border-[#fd79a8]' : 'bg-[rgba(255,255,255,0.04)] text-[#8a8a9a] border-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.08)]'}`}>
                          Yes
                        </button>
                        <button onClick={() => setWillingToRelocate(false)}
                          className={`flex-1 px-4 py-2.5 rounded-lg border font-medium transition-all ${!willingToRelocate ? 'bg-gradient-to-r from-[#fd79a8] to-[#e84393] text-white border-[#fd79a8]' : 'bg-[rgba(255,255,255,0.04)] text-[#8a8a9a] border-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.08)]'}`}>
                          No
                        </button>
                      </div>
                    </div>

                    {/* Country Preference */}
                    <div>
                      <label className="block text-[12px] font-bold text-[#fd79a8] mb-2">PREFERRED COUNTRY *</label>
                      <select value={selectedCountry} onChange={e => { setSelectedCountry(e.target.value); setSelectedCities([]) }}
                        className="w-full px-4 py-2.5 rounded-lg border border-[rgba(255,255,255,0.08)] text-[13px] focus:border-[rgba(253,121,168,0.3)] focus:outline-none transition-all cursor-pointer"
                        style={{ background: '#13131f', color: selectedCountry ? 'white' : '#5a5a6a' }}>
                        <option value="" style={{ background: '#13131f', color: '#5a5a6a' }}>Select a country...</option>
                        {Object.keys(CITIES_BY_COUNTRY).map(c => <option key={c} value={c} style={{ background: '#13131f', color: 'white' }}>{c}</option>)}
                      </select>
                      {!selectedCountry && <p className="text-[11px] text-[#ff6b6b] mt-1">❌ Required</p>}
                    </div>

                    {/* Top 3 Cities — only shown once country is selected */}
                    {selectedCountry && (
                      <div>
                        <label className="block text-[12px] font-bold text-[#fd79a8] mb-2">TOP CITY PREFERENCES (up to 3) *</label>
                        <div className="grid grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-2">
                          {CITIES_BY_COUNTRY[selectedCountry].map(city => (
                            <button key={city} onClick={() => toggleChip(selectedCities, setSelectedCities, city, 3)}
                              className={`px-3 py-2 rounded-lg text-[12px] font-medium transition-all text-left ${selectedCities.includes(city) ? 'bg-[rgba(253,121,168,0.15)] text-[#fd79a8] border border-[rgba(253,121,168,0.3)]' : 'bg-[rgba(255,255,255,0.04)] text-[#8a8a9a] hover:bg-[rgba(255,255,255,0.08)]'}`}>
                              {city}
                            </button>
                          ))}
                        </div>
                        {selectedCities.length === 0 && <p className="text-[11px] text-[#ff6b6b] mt-2">❌ Select at least 1 city</p>}
                        {selectedCities.length > 0 && <p className="text-[11px] text-[#00b894] mt-2">✓ {selectedCities.join(', ')}</p>}
                      </div>
                    )}

                    {/* Ethnicity */}
                    <div>
                      <label className="block text-[12px] font-bold text-[#8a8a9a] mb-2">ETHNICITY (Optional)</label>
                      <select value={ethnicity} onChange={e => setEthnicity(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-[rgba(255,255,255,0.08)] text-white text-[13px] focus:border-[rgba(253,121,168,0.3)] focus:outline-none transition-all cursor-pointer"
                        style={{ background: '#13131f' }}>
                        {ETHNICITIES.map(e => <option key={e} value={e} style={{ background: '#13131f', color: 'white' }}>{e}</option>)}
                      </select>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <MagneticButton onClick={() => goTo(1)} variant="secondary" className="flex-1 h-11">Back</MagneticButton>
                      <MagneticButton onClick={saveStep3} disabled={!canProceedStep3} className="flex-1 h-11" variant="primary">
                        Next {!canProceedStep3 && '(Complete fields)'}
                      </MagneticButton>
                    </div>
                  </motion.div>
                )}

                {/* STEP 3: SKILLS & INDUSTRIES */}
                {step === 3 && (
                  <motion.div key="step-3" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-black text-white mb-2">Industries & Skills</h2>
                      <p className="text-[13px] text-[#8a8a9a]">What are your strengths?</p>
                    </div>

                    {/* Industries */}
                    <div>
                      <label className="block text-[12px] font-bold text-[#fd79a8] mb-2">INDUSTRY PREFERENCES (Select up to 5) *</label>
                      <div className="grid grid-cols-2 gap-2 max-h-[240px] overflow-y-auto pr-2">
                        {INDUSTRIES.map(ind => (
                          <button key={ind} onClick={() => toggleChip(selectedIndustries, setSelectedIndustries, ind, 5)}
                            className={`px-3 py-2 rounded-lg text-[12px] font-medium transition-all text-left ${selectedIndustries.includes(ind) ? 'bg-[rgba(253,121,168,0.15)] text-[#fd79a8] border border-[rgba(253,121,168,0.3)]' : 'bg-[rgba(255,255,255,0.04)] text-[#8a8a9a] hover:bg-[rgba(255,255,255,0.08)]'}`}>
                            {ind}
                          </button>
                        ))}
                      </div>
                      {selectedIndustries.length === 0 && <p className="text-[11px] text-[#ff6b6b] mt-2">❌ Select at least 1</p>}
                    </div>

                    {/* Skills */}
                    <div>
                      <label className="block text-[12px] font-bold text-[#fd79a8] mb-2">KEY SKILLS (Select up to 8) *</label>
                      <div className="grid grid-cols-2 gap-2">
                        {SKILLS.map(skill => (
                          <button key={skill} onClick={() => toggleChip(selectedSkills, setSelectedSkills, skill, 8)}
                            className={`px-3 py-2 rounded-lg text-[12px] font-medium transition-all ${selectedSkills.includes(skill) ? 'bg-[rgba(253,121,168,0.15)] text-[#fd79a8] border border-[rgba(253,121,168,0.3)]' : 'bg-[rgba(255,255,255,0.04)] text-[#8a8a9a] hover:bg-[rgba(255,255,255,0.08)]'}`}>
                            {skill}
                          </button>
                        ))}
                      </div>
                      {selectedSkills.length === 0 && <p className="text-[11px] text-[#ff6b6b] mt-2">❌ Select at least 1</p>}
                    </div>

                    {/* Company Size */}
                    <div>
                      <label className="block text-[12px] font-bold text-[#fd79a8] mb-2">PREFERRED COMPANY SIZE *</label>
                      <div className="grid grid-cols-2 gap-2">
                        {COMPANY_SIZES.map(size => (
                          <button key={size} onClick={() => setCompanySize(size)}
                            className={`px-3 py-2 rounded-lg text-[12px] font-medium transition-all ${companySize === size ? 'bg-gradient-to-r from-[#fd79a8] to-[#e84393] text-white' : 'bg-[rgba(255,255,255,0.04)] text-[#8a8a9a] hover:bg-[rgba(255,255,255,0.08)]'}`}>
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Interview Style */}
                    <div>
                      <label className="block text-[12px] font-bold text-[#fd79a8] mb-2">INTERVIEW STRENGTH *</label>
                      <div className="grid grid-cols-2 gap-2">
                        {INTERVIEW_STYLES.map(style => (
                          <button key={style} onClick={() => setInterviewStyle(style)}
                            className={`px-3 py-2 rounded-lg text-[12px] font-medium transition-all ${interviewStyle === style ? 'bg-gradient-to-r from-[#fd79a8] to-[#e84393] text-white' : 'bg-[rgba(255,255,255,0.04)] text-[#8a8a9a] hover:bg-[rgba(255,255,255,0.08)]'}`}>
                            {style}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <MagneticButton onClick={() => goTo(2)} variant="secondary" className="flex-1 h-11">Back</MagneticButton>
                      <MagneticButton onClick={handleSavePreferences} disabled={saving || !canProceedStep4} className="flex-1 h-11" variant="primary">
                        {saving ? 'Saving...' : 'Next'}
                      </MagneticButton>
                    </div>
                  </motion.div>
                )}

                {/* STEP 4: PLAN */}
                {step === 5 && (
                  <motion.div key="step-4" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-black text-white mb-2">Choose Your Plan</h2>
                      <p className="text-[13px] text-[#8a8a9a]">Start free, upgrade anytime</p>
                    </div>

                    <div className="grid gap-4">
                      {plans.map(plan => (
                        <motion.button key={plan.name} onClick={() => setSelectedPlan(plan.name)} whileHover={{ scale: 1.02 }}
                          className={`p-4 rounded-xl border-2 transition-all text-left ${selectedPlan === plan.name ? 'border-[#fd79a8] bg-[rgba(253,121,168,0.1)]' : 'border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)] hover:border-[rgba(253,121,168,0.3)]'}`}>
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="font-bold text-white">{plan.label}</h3>
                              <p className="text-[13px] font-bold text-[#fd79a8]">{plan.price}<span className="text-[11px] text-[#5a5a6a]">{plan.period}</span></p>
                            </div>
                            {selectedPlan === plan.name && <div className="w-5 h-5 rounded-full bg-[#fd79a8]" />}
                          </div>
                          <ul className="space-y-1">
                            {plan.features.map(feature => (
                              <li key={feature} className="text-[12px] text-[#8a8a9a]">✓ {feature}</li>
                            ))}
                          </ul>
                        </motion.button>
                      ))}
                    </div>

                    <div className="flex gap-3 pt-4">
                      <MagneticButton onClick={() => goTo(3)} variant="secondary" className="flex-1 h-11">Back</MagneticButton>
                      <MagneticButton onClick={handleComplete} disabled={completing} className="flex-1 h-11" variant="primary">
                        {completing ? 'Launching...' : '🚀 Let\'s Go!'}
                      </MagneticButton>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </GlowCard>
        </motion.div>
      </div>
    </div>
  )
}
