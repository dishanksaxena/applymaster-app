'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'

/* ─── Cinematic text reveal ─── */
function RevealText({ children, delay = 0, className = '' }: { children: string; delay?: number; className?: string }) {
  return (
    <span className={`inline-block overflow-hidden ${className}`}>
      <motion.span className="inline-block"
        initial={{ y: '110%', rotateX: -40, opacity: 0, filter: 'blur(8px)' }}
        animate={{ y: '0%', rotateX: 0, opacity: 1, filter: 'blur(0px)' }}
        transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] as const }}>
        {children}
      </motion.span>
    </span>
  )
}

/* ─── Floating Particles ─── */
function Particles() {
  const [particles] = useState(() =>
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2.5 + 0.5,
      duration: Math.random() * 20 + 15,
      delay: Math.random() * 10,
      opacity: Math.random() * 0.3 + 0.05,
    }))
  )
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map(p => (
        <motion.div key={p.id}
          className="absolute rounded-full"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, background: `rgba(253,121,168,${p.opacity})` }}
          animate={{
            y: [0, -30, 10, -20, 0],
            x: [0, 15, -10, 20, 0],
            opacity: [p.opacity, p.opacity * 2, p.opacity * 0.5, p.opacity * 1.5, p.opacity],
          }}
          transition={{ duration: p.duration, repeat: Infinity, ease: 'linear', delay: p.delay }}
        />
      ))}
    </div>
  )
}

/* ─── Animated Gradient Border Card ─── */
function GlowCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const spotlightX = useTransform(mouseX, v => `${v}px`)
  const spotlightY = useTransform(mouseY, v => `${v}px`)

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    mouseX.set(e.clientX - rect.left)
    mouseY.set(e.clientY - rect.top)
  }, [mouseX, mouseY])

  return (
    <div className={`relative group ${className}`} onMouseMove={handleMouseMove}>
      <div className="absolute -inset-[1px] rounded-[28px] overflow-hidden">
        <motion.div
          className="absolute inset-0"
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          style={{
            background: 'conic-gradient(from 0deg, transparent 0%, rgba(253,121,168,0.4) 10%, transparent 20%, rgba(162,155,254,0.3) 30%, transparent 40%, rgba(116,185,255,0.3) 50%, transparent 60%, rgba(253,121,168,0.4) 70%, transparent 80%, rgba(253,203,94,0.2) 90%, transparent 100%)',
          }}
        />
      </div>
      <div className="relative rounded-[27px] overflow-hidden" style={{ background: 'linear-gradient(170deg, #111120 0%, #0a0a15 50%, #0d0d1a 100%)' }}>
        <motion.div className="absolute w-[400px] h-[400px] rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            left: spotlightX, top: spotlightY,
            x: '-50%', y: '-50%',
            background: 'radial-gradient(circle, rgba(253,121,168,0.06) 0%, transparent 60%)',
          }}
        />
        <motion.div className="absolute top-0 left-0 right-0 h-[1px]"
          animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(253,121,168,0.5), rgba(162,155,254,0.5), transparent)', backgroundSize: '200% 100%' }}
        />
        <div className="relative z-10">{children}</div>
      </div>
    </div>
  )
}

/* ─── Magnetic Button ─── */
function MagneticButton({ children, onClick, disabled = false, variant = 'primary', className = '', style }: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean; variant?: 'primary' | 'secondary'; className?: string; style?: React.CSSProperties
}) {
  const ref = useRef<HTMLButtonElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    x.set((e.clientX - cx) * 0.15)
    y.set((e.clientY - cy) * 0.15)
  }

  const handleMouseLeave = () => { x.set(0); y.set(0) }

  return (
    <motion.button ref={ref} style={{ x, y, ...style }} onClick={onClick} disabled={disabled}
      onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}
      whileTap={{ scale: 0.95 }}
      className={`relative overflow-hidden font-bold text-[13px] tracking-wide transition-all disabled:opacity-40 disabled:pointer-events-none ${className}`}
    >
      {variant === 'primary' && (
        <>
          <motion.div className="absolute inset-0"
            style={{ background: 'linear-gradient(135deg, #fd79a8, #e84393, #d63384)' }} />
          <motion.div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity"
            animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
            transition={{ duration: 3, repeat: Infinity }}
            style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)', backgroundSize: '200% 100%' }} />
        </>
      )}
      {variant === 'secondary' && (
        <div className="absolute inset-0" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }} />
      )}
      <span className={`relative z-10 flex items-center justify-center gap-2 ${variant === 'primary' ? 'text-white' : 'text-[#8a8a9a]'}`}>
        {children}
      </span>
    </motion.button>
  )
}

/* ─── Data Constants ─── */
const ROLES = ['Software Engineer', 'Product Manager', 'Data Scientist', 'Designer', 'DevOps Engineer', 'Full Stack Dev', 'Frontend Dev', 'Backend Dev', 'ML Engineer', 'Mobile Dev', 'QA Engineer', 'Systems Architect', 'Cloud Engineer', 'Security Engineer', 'Solutions Architect']

const INDUSTRIES = [
  'Technology/IT', 'Finance', 'Healthcare', 'E-commerce', 'SaaS',
  'Consulting', 'Manufacturing', 'Real Estate', 'Education', 'Media & Entertainment',
  'Telecommunications', 'Automotive', 'Food & Beverage', 'Travel & Tourism', 'Logistics',
  'Retail', 'Banking', 'Insurance', 'Government/Public Sector', 'Energy',
  'Agriculture', 'Construction', 'Nonprofits', 'Legal Services', 'Recruiting',
  'Marketing/Advertising', 'Biotech/Pharma', 'Gaming', 'Fintech', 'Sustainability'
]

const WORK_AUTH_OPTIONS = [
  'Citizen',
  'Permanent Resident',
  'Work Visa (can work)',
  'Need Sponsorship',
  'No Restrictions'
]

const EMPLOYMENT_STATUS = [
  'Employed (actively looking)',
  'Employed (passive)',
  'Unemployed',
  'Student',
  'Recently laid off',
  'Self-employed'
]

const START_DATE_OPTIONS = [
  'Immediately',
  '2 weeks',
  '1 month',
  '2 months',
  '3 months',
  'Flexible'
]

const COUNTRIES = [
  'United States', 'Canada', 'United Kingdom', 'Germany', 'France',
  'Australia', 'Singapore', 'India', 'Netherlands', 'Spain',
  'Other'
]

const US_CITIES = ['San Francisco', 'New York', 'Seattle', 'Austin', 'Boston', 'Denver', 'Chicago', 'Los Angeles', 'Miami', 'Portland']
const CANADA_CITIES = ['Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Ottawa', 'Waterloo', 'Halifax']
const UK_CITIES = ['London', 'Manchester', 'Edinburgh', 'Bristol', 'Leeds', 'Birmingham']
const OTHER_CITIES = ['Singapore', 'Sydney', 'Melbourne', 'Toronto', 'Amsterdam', 'Berlin', 'Paris', 'Madrid', 'Bangalore', 'Tokyo']

const SKILLS_OPTIONS = [
  'Python', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'SQL', 'AWS', 'GCP',
  'Docker', 'Kubernetes', 'Machine Learning', 'Data Analysis', 'UI/UX Design',
  'Product Strategy', 'Leadership', 'Communication', 'Problem Solving', 'Project Management'
]

const COMPANY_SIZES = ['Startup (<50)', 'Small (50-200)', 'Medium (200-1000)', 'Large (1000+)', 'No preference']
const JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'No preference']
const INTERVIEW_STYLES = ['Behavioral', 'Technical/Coding', 'Case Studies', 'System Design', 'No preference']

const plans = [
  { name: 'free', label: 'Free', price: '$0', period: 'forever', color: '#8a8a9a',
    features: ['10 applications/month', 'Basic job matching', 'Resume upload'],
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><path d="M8 12l2 2 4-4"/></svg> },
  { name: 'pro', label: 'Pro', price: '$29', period: '/month', color: '#fd79a8', popular: true,
    features: ['100 applications/month', 'AI resume optimizer', 'Cover letter generation'],
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="13,2 3,14 12,14 11,22 21,10 12,10"/></svg> },
  { name: 'elite', label: 'Elite', price: '$59', period: '/month', color: '#a29bfe',
    features: ['Unlimited applications', 'Auto-apply engine', 'AI interview coach'],
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> },
]

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0, scale: 0.96, filter: 'blur(6px)' }),
  center: { x: 0, opacity: 1, scale: 1, filter: 'blur(0px)', transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } },
  exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0, scale: 0.96, filter: 'blur(6px)', transition: { duration: 0.4 } }),
}

/* ─────────────────────── MAIN COMPONENT ─────────────────────── */
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

  // ─── Step 2: Preferences State ───
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([])
  const [customRole, setCustomRole] = useState('')
  const [minSalary, setMinSalary] = useState(50000)
  const [maxSalary, setMaxSalary] = useState(150000)
  const [remotePreference, setRemotePreference] = useState('any')
  const [experienceLevel, setExperienceLevel] = useState('mid')
  const [workType, setWorkType] = useState('Full-time')

  // ─── Step 3: Career Details State ───
  const [workAuthorization, setWorkAuthorization] = useState('Citizen')
  const [employmentStatus, setEmploymentStatus] = useState('Employed (actively looking)')
  const [desiredJobTitle, setDesiredJobTitle] = useState('')
  const [availableStartDate, setAvailableStartDate] = useState('Immediately')
  const [willingToRelocate, setWillingToRelocate] = useState(false)
  const [countryPreference, setCountryPreference] = useState('United States')
  const [selectedCities, setSelectedCities] = useState<string[]>([])
  const [ethnicity, setEthnicity] = useState('')

  // ─── Step 4: Skills & Summary State ───
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [companySize, setCompanySize] = useState('No preference')
  const [interviewStyle, setInterviewStyle] = useState('No preference')

  const [selectedPlan, setSelectedPlan] = useState('free')

  useEffect(() => { setMounted(true) }, [])

  const goTo = (next: number) => { setDirection(next > step ? 1 : -1); setStep(next) }

  const toggleChip = (arr: string[], setArr: (v: string[]) => void, val: string, maxSelections?: number) => {
    if (arr.includes(val)) {
      setArr(arr.filter(x => x !== val))
    } else if (!maxSelections || arr.length < maxSelections) {
      setArr([...arr, val])
    }
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
    setUploading(false); goTo(1)
  }

  const handleSavePreferences = async () => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const finalRoles = customRole ? [...selectedRoles, customRole] : selectedRoles

      await supabase.from('job_preferences').upsert({
        user_id: user.id,
        target_roles: finalRoles.length > 0 ? finalRoles : ['Software Engineer'],
        experience_level: experienceLevel,
        min_salary: minSalary,
        max_salary: maxSalary,
        remote_preference: remotePreference,
        employment_type: workType,
        industries: selectedIndustries,
        work_authorization: workAuthorization,
        current_employment_status: employmentStatus,
        desired_job_title: desiredJobTitle,
        available_start_date: availableStartDate,
        willing_to_relocate: willingToRelocate,
        country_preference: countryPreference,
        city_preferences: selectedCities,
        ethnicity: ethnicity || null,
        key_skills: selectedSkills,
        company_size_preference: companySize,
        interview_strength: interviewStyle,
      })
    } catch (err) {
      console.error('Error saving preferences:', err)
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
      console.error('Error completing onboarding:', err)
    }
  }

  const getCitiesList = () => {
    switch (countryPreference) {
      case 'United States': return US_CITIES
      case 'Canada': return CANADA_CITIES
      case 'United Kingdom': return UK_CITIES
      default: return OTHER_CITIES
    }
  }

  const stepLabels = ['Resume', 'Preferences', 'Career', 'Skills', 'Plan']

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-[#050510] flex items-center justify-center relative overflow-hidden py-10 px-4">
      <style jsx global>{`
        @keyframes mesh-shift { 0%, 100% { background-position: 0% 50%; } 25% { background-position: 100% 0%; } 50% { background-position: 100% 100%; } 75% { background-position: 0% 100%; } }
        @keyframes aurora { 0% { transform: rotate(0deg) scale(1.5); } 33% { transform: rotate(120deg) scale(1.2); } 66% { transform: rotate(240deg) scale(1.6); } 100% { transform: rotate(360deg) scale(1.5); } }
      `}</style>

      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(-45deg, rgba(253,121,168,0.08), rgba(10,10,20,1), rgba(162,155,254,0.06), rgba(10,10,20,1), rgba(116,185,255,0.05))',
          backgroundSize: '400% 400%', animation: 'mesh-shift 20s ease infinite',
        }} />
      </div>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-40%] right-[-20%] w-[800px] h-[800px] rounded-full opacity-[0.04]"
          style={{ background: 'radial-gradient(circle, #fd79a8, transparent 60%)', animation: 'aurora 25s ease-in-out infinite' }} />
        <div className="absolute bottom-[-40%] left-[-20%] w-[700px] h-[700px] rounded-full opacity-[0.03]"
          style={{ background: 'radial-gradient(circle, #a29bfe, transparent 60%)', animation: 'aurora 30s ease-in-out infinite reverse' }} />
      </div>

      <Particles />
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
        backgroundSize: '80px 80px',
      }} />

      <div className="relative z-10 w-full max-w-[650px]">

        {/* Logo */}
        <motion.div className="flex items-center justify-center gap-3 mb-10"
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}>
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #fd79a8, #e84393)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polygon points="13,2 3,14 12,14 11,22 21,10 12,10"/></svg>
          </div>
          <span className="text-[18px] font-black tracking-tight text-white">ApplyMaster</span>
        </motion.div>

        {/* Progress */}
        <motion.div className="flex items-center justify-center mb-10 gap-1"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.3 }}>
          {stepLabels.map((label, i) => (
            <div key={label} className="flex items-center gap-1">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold"
                style={i < step
                  ? { background: 'linear-gradient(135deg, #fd79a8, #e84393)' }
                  : i === step
                    ? { background: 'rgba(253,121,168,0.2)', border: '1px solid rgba(253,121,168,0.4)', color: '#fd79a8' }
                    : { background: 'rgba(255,255,255,0.05)', color: '#3a3a4a' }
                }>
                {i < step ? '✓' : i + 1}
              </div>
              {i < 4 && <div className="w-6 h-px" style={{ background: i < step ? 'linear-gradient(90deg, #fd79a8, #e84393)' : 'rgba(255,255,255,0.1)' }} />}
            </div>
          ))}
        </motion.div>

        {/* Card */}
        <motion.div initial={{ opacity: 0, y: 30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}>
          <GlowCard>
            <div className="p-8 sm:p-10 max-h-[680px] overflow-y-auto">
              <AnimatePresence custom={direction} mode="wait">

                {/* ═════ STEP 0: RESUME ═════ */}
                {step === 0 && (
                  <motion.div key="step-0" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-black text-white mb-2">Upload Your Resume</h2>
                      <p className="text-[13px] text-[#8a8a9a]">We'll parse your experience to help match better jobs</p>
                    </div>
                    <div
                      onDrop={onDrop}
                      onDragOver={e => { e.preventDefault(); setDragging(true) }}
                      onDragLeave={() => setDragging(false)}
                      className="border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer"
                      style={{
                        borderColor: dragging ? 'rgba(253,121,168,0.5)' : 'rgba(255,255,255,0.1)',
                        background: dragging ? 'rgba(253,121,168,0.05)' : 'rgba(255,255,255,0.01)'
                      }}
                    >
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-3 text-[#fd79a8]">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                      <p className="text-white font-semibold mb-1">Drag & drop your resume</p>
                      <p className="text-[12px] text-[#5a5a6a] mb-3">PDF or DOCX format</p>
                      <input type="file" ref={fileRef} onChange={e => e.target.files && setResumeFile(e.target.files[0])} className="hidden" accept=".pdf,.docx" />
                      <button onClick={() => fileRef.current?.click()} className="text-[12px] px-3 py-1.5 rounded-lg bg-[rgba(253,121,168,0.1)] text-[#fd79a8] hover:bg-[rgba(253,121,168,0.2)] transition-all">
                        Or browse files
                      </button>
                    </div>
                    {resumeFile && <p className="text-[12px] text-[#00b894]">✓ {resumeFile.name} selected</p>}
                    <div className="flex gap-3 pt-4">
                      <MagneticButton onClick={() => goTo(1)} className="flex-1 h-11">Skip for now</MagneticButton>
                      <MagneticButton onClick={handleResumeUpload} disabled={uploading} className="flex-1 h-11" variant="primary">
                        {uploading ? 'Uploading...' : 'Continue'}
                      </MagneticButton>
                    </div>
                  </motion.div>
                )}

                {/* ═════ STEP 1: PREFERENCES ═════ */}
                {step === 1 && (
                  <motion.div key="step-1" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-black text-white mb-2">Job Preferences</h2>
                      <p className="text-[13px] text-[#8a8a9a]">What are you looking for?</p>
                    </div>

                    {/* Target Roles */}
                    <div>
                      <label className="block text-[12px] font-bold text-[#fd79a8] mb-3 uppercase tracking-wide">Target Roles (up to 5)</label>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {selectedRoles.map(role => (
                          <button key={role} onClick={() => toggleChip(selectedRoles, setSelectedRoles, role)}
                            className="px-3 py-1.5 rounded-lg text-[12px] font-semibold bg-gradient-to-r from-[#fd79a8] to-[#e84393] text-white flex items-center gap-1.5">
                            {role} <span>×</span>
                          </button>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {ROLES.map(role => (
                          <button key={role} onClick={() => toggleChip(selectedRoles, setSelectedRoles, role, 5)}
                            className={`px-3 py-2 rounded-lg text-[12px] font-medium transition-all ${selectedRoles.includes(role) ? 'bg-[rgba(253,121,168,0.15)] text-[#fd79a8] border border-[rgba(253,121,168,0.3)]' : 'bg-[rgba(255,255,255,0.04)] text-[#8a8a9a] hover:bg-[rgba(255,255,255,0.08)]'}`}>
                            {role}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Experience Level */}
                    <div>
                      <label className="block text-[12px] font-bold text-[#fd79a8] mb-3 uppercase tracking-wide">Experience Level</label>
                      <div className="grid grid-cols-3 gap-2">
                        {['entry', 'mid', 'senior', 'lead', 'executive'].map(level => (
                          <button key={level} onClick={() => setExperienceLevel(level)}
                            className={`px-3 py-2 rounded-lg text-[12px] font-medium transition-all ${experienceLevel === level ? 'bg-gradient-to-r from-[#fd79a8] to-[#e84393] text-white' : 'bg-[rgba(255,255,255,0.04)] text-[#8a8a9a] hover:bg-[rgba(255,255,255,0.08)]'}`}>
                            {level.charAt(0).toUpperCase() + level.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Salary Range with Slider */}
                    <div>
                      <label className="block text-[12px] font-bold text-[#fd79a8] mb-3 uppercase tracking-wide">Salary Range (Annual)</label>
                      <div className="space-y-3">
                        <div className="flex justify-between text-[12px] text-[#8a8a9a]">
                          <span>Min: ${(minSalary / 1000).toFixed(0)}k</span>
                          <span>Max: ${(maxSalary / 1000).toFixed(0)}k</span>
                        </div>
                        <div className="space-y-2">
                          <input type="range" min="30000" max="500000" step="5000" value={minSalary}
                            onChange={e => setMinSalary(Math.min(parseInt(e.target.value), maxSalary))}
                            className="w-full h-1 bg-[rgba(255,255,255,0.1)] rounded-lg appearance-none cursor-pointer" style={{
                              background: `linear-gradient(to right, #fd79a8 0%, #fd79a8 ${((minSalary - 30000) / 470000) * 100}%, rgba(255,255,255,0.1) ${((minSalary - 30000) / 470000) * 100}%, rgba(255,255,255,0.1) 100%)`
                            }}
                          />
                          <input type="range" min="30000" max="500000" step="5000" value={maxSalary}
                            onChange={e => setMaxSalary(Math.max(parseInt(e.target.value), minSalary))}
                            className="w-full h-1 bg-[rgba(255,255,255,0.1)] rounded-lg appearance-none cursor-pointer" style={{
                              background: `linear-gradient(to right, #e84393 0%, #e84393 ${((maxSalary - 30000) / 470000) * 100}%, rgba(255,255,255,0.1) ${((maxSalary - 30000) / 470000) * 100}%, rgba(255,255,255,0.1) 100%)`
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Remote Preference */}
                    <div>
                      <label className="block text-[12px] font-bold text-[#fd79a8] mb-3 uppercase tracking-wide">Remote Preference</label>
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
                      <label className="block text-[12px] font-bold text-[#fd79a8] mb-3 uppercase tracking-wide">Work Type</label>
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
                      <MagneticButton onClick={() => goTo(2)} className="flex-1 h-11" variant="primary">Next</MagneticButton>
                    </div>
                  </motion.div>
                )}

                {/* ═════ STEP 2: CAREER DETAILS ═════ */}
                {step === 2 && (
                  <motion.div key="step-2" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-black text-white mb-2">Career Details</h2>
                      <p className="text-[13px] text-[#8a8a9a]">Tell us more about your situation</p>
                    </div>

                    {/* Employment Status */}
                    <div>
                      <label className="block text-[12px] font-bold text-[#fd79a8] mb-2 uppercase tracking-wide">Current Employment Status</label>
                      <select value={employmentStatus} onChange={e => setEmploymentStatus(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-white text-[13px] focus:border-[rgba(253,121,168,0.3)] focus:outline-none transition-all">
                        {EMPLOYMENT_STATUS.map(status => <option key={status} value={status}>{status}</option>)}
                      </select>
                    </div>

                    {/* Work Authorization */}
                    <div>
                      <label className="block text-[12px] font-bold text-[#fd79a8] mb-2 uppercase tracking-wide">Work Authorization</label>
                      <select value={workAuthorization} onChange={e => setWorkAuthorization(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-white text-[13px] focus:border-[rgba(253,121,168,0.3)] focus:outline-none transition-all">
                        {WORK_AUTH_OPTIONS.map(auth => <option key={auth} value={auth}>{auth}</option>)}
                      </select>
                    </div>

                    {/* Desired Job Title */}
                    <div>
                      <label className="block text-[12px] font-bold text-[#fd79a8] mb-2 uppercase tracking-wide">Desired Job Title (optional)</label>
                      <input type="text" value={desiredJobTitle} onChange={e => setDesiredJobTitle(e.target.value)} placeholder="e.g., Senior Software Engineer"
                        className="w-full px-4 py-2.5 rounded-lg bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-white placeholder-[#3a3a4a] text-[13px] focus:border-[rgba(253,121,168,0.3)] focus:outline-none transition-all" />
                    </div>

                    {/* Available Start Date */}
                    <div>
                      <label className="block text-[12px] font-bold text-[#fd79a8] mb-2 uppercase tracking-wide">When Can You Start?</label>
                      <select value={availableStartDate} onChange={e => setAvailableStartDate(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-white text-[13px] focus:border-[rgba(253,121,168,0.3)] focus:outline-none transition-all">
                        {START_DATE_OPTIONS.map(date => <option key={date} value={date}>{date}</option>)}
                      </select>
                    </div>

                    {/* Willing to Relocate */}
                    <div>
                      <label className="block text-[12px] font-bold text-[#fd79a8] mb-3 uppercase tracking-wide">Willing to Relocate?</label>
                      <button onClick={() => setWillingToRelocate(!willingToRelocate)}
                        className={`w-full px-4 py-2.5 rounded-lg border transition-all ${willingToRelocate ? 'bg-[rgba(253,121,168,0.15)] border-[rgba(253,121,168,0.3)]' : 'bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)]'}`}>
                        <span className={willingToRelocate ? 'text-[#fd79a8]' : 'text-[#8a8a9a]'}>{willingToRelocate ? '✓ Yes' : 'No'}</span>
                      </button>
                    </div>

                    {/* Country Preference */}
                    <div>
                      <label className="block text-[12px] font-bold text-[#fd79a8] mb-2 uppercase tracking-wide">Country Preference</label>
                      <select value={countryPreference} onChange={e => { setCountryPreference(e.target.value); setSelectedCities([]) }}
                        className="w-full px-4 py-2.5 rounded-lg bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-white text-[13px] focus:border-[rgba(253,121,168,0.3)] focus:outline-none transition-all">
                        {COUNTRIES.map(country => <option key={country} value={country}>{country}</option>)}
                      </select>
                    </div>

                    {/* Top 3 Cities */}
                    <div>
                      <label className="block text-[12px] font-bold text-[#fd79a8] mb-2 uppercase tracking-wide">Top 3 City Preferences</label>
                      <div className="grid grid-cols-2 gap-2">
                        {getCitiesList().map(city => (
                          <button key={city} onClick={() => toggleChip(selectedCities, setSelectedCities, city, 3)}
                            className={`px-3 py-2 rounded-lg text-[12px] font-medium transition-all ${selectedCities.includes(city) ? 'bg-[rgba(253,121,168,0.15)] text-[#fd79a8] border border-[rgba(253,121,168,0.3)]' : 'bg-[rgba(255,255,255,0.04)] text-[#8a8a9a] hover:bg-[rgba(255,255,255,0.08)]'}`}>
                            {city}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Ethnicity (Optional) */}
                    <div>
                      <label className="block text-[12px] font-bold text-[#8a8a9a] mb-2 uppercase tracking-wide">Ethnicity <span className="text-[10px]">(optional)</span></label>
                      <input type="text" value={ethnicity} onChange={e => setEthnicity(e.target.value)} placeholder="Not required"
                        className="w-full px-4 py-2.5 rounded-lg bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-white placeholder-[#3a3a4a] text-[13px] focus:border-[rgba(253,121,168,0.3)] focus:outline-none transition-all" />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <MagneticButton onClick={() => goTo(1)} variant="secondary" className="flex-1 h-11">Back</MagneticButton>
                      <MagneticButton onClick={() => goTo(3)} className="flex-1 h-11" variant="primary">Next</MagneticButton>
                    </div>
                  </motion.div>
                )}

                {/* ═════ STEP 3: SKILLS & INDUSTRIES ═════ */}
                {step === 3 && (
                  <motion.div key="step-3" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-black text-white mb-2">Industries & Skills</h2>
                      <p className="text-[13px] text-[#8a8a9a]">What are your strengths and interests?</p>
                    </div>

                    {/* Industries */}
                    <div>
                      <label className="block text-[12px] font-bold text-[#fd79a8] mb-3 uppercase tracking-wide">Industry Preferences (select up to 5)</label>
                      <div className="grid grid-cols-2 gap-2 max-h-[240px] overflow-y-auto pr-2">
                        {INDUSTRIES.map(ind => (
                          <button key={ind} onClick={() => toggleChip(selectedIndustries, setSelectedIndustries, ind, 5)}
                            className={`px-3 py-2 rounded-lg text-[12px] font-medium transition-all text-left ${selectedIndustries.includes(ind) ? 'bg-[rgba(253,121,168,0.15)] text-[#fd79a8] border border-[rgba(253,121,168,0.3)]' : 'bg-[rgba(255,255,255,0.04)] text-[#8a8a9a] hover:bg-[rgba(255,255,255,0.08)]'}`}>
                            {ind}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Key Skills */}
                    <div>
                      <label className="block text-[12px] font-bold text-[#fd79a8] mb-3 uppercase tracking-wide">Key Technical Skills (up to 8)</label>
                      <div className="grid grid-cols-2 gap-2">
                        {SKILLS_OPTIONS.map(skill => (
                          <button key={skill} onClick={() => toggleChip(selectedSkills, setSelectedSkills, skill, 8)}
                            className={`px-3 py-2 rounded-lg text-[12px] font-medium transition-all ${selectedSkills.includes(skill) ? 'bg-[rgba(253,121,168,0.15)] text-[#fd79a8] border border-[rgba(253,121,168,0.3)]' : 'bg-[rgba(255,255,255,0.04)] text-[#8a8a9a] hover:bg-[rgba(255,255,255,0.08)]'}`}>
                            {skill}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Company Size */}
                    <div>
                      <label className="block text-[12px] font-bold text-[#fd79a8] mb-2 uppercase tracking-wide">Preferred Company Size</label>
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
                      <label className="block text-[12px] font-bold text-[#fd79a8] mb-2 uppercase tracking-wide">Strongest at Interview Type</label>
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
                      <MagneticButton onClick={handleSavePreferences} disabled={saving} className="flex-1 h-11" variant="primary">
                        {saving ? 'Saving...' : 'Next'}
                      </MagneticButton>
                    </div>
                  </motion.div>
                )}

                {/* ═════ STEP 4: PLAN & LAUNCH ═════ */}
                {step === 5 && (
                  <motion.div key="step-4" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-black text-white mb-2">Choose Your Plan</h2>
                      <p className="text-[13px] text-[#8a8a9a]">Start free, upgrade anytime</p>
                    </div>

                    <div className="grid gap-4">
                      {plans.map(plan => (
                        <motion.button key={plan.name} onClick={() => setSelectedPlan(plan.name)}
                          whileHover={{ scale: 1.02 }}
                          className={`p-4 rounded-xl border-2 transition-all text-left ${selectedPlan === plan.name ? 'border-[#fd79a8] bg-[rgba(253,121,168,0.1)]' : 'border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)] hover:border-[rgba(253,121,168,0.3)]'}`}>
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="font-bold text-white">{plan.label}</h3>
                              <p className="text-[13px] font-bold" style={{ color: plan.color }}>{plan.price}<span className="text-[11px] text-[#5a5a6a]">{plan.period}</span></p>
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
                        {completing ? 'Launching...' : 'Let\'s Go! 🚀'}
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
