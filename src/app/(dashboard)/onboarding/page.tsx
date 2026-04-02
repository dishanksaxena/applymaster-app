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
      {/* Animated rotating border */}
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
      {/* Card body */}
      <div className="relative rounded-[27px] overflow-hidden" style={{ background: 'linear-gradient(170deg, #111120 0%, #0a0a15 50%, #0d0d1a 100%)' }}>
        {/* Mouse spotlight */}
        <motion.div className="absolute w-[400px] h-[400px] rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            left: spotlightX, top: spotlightY,
            x: '-50%', y: '-50%',
            background: 'radial-gradient(circle, rgba(253,121,168,0.06) 0%, transparent 60%)',
          }}
        />
        {/* Top edge shimmer */}
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

/* ─── Step data ─── */
const ROLES = ['Software Engineer', 'Product Manager', 'Data Scientist', 'Designer', 'DevOps Engineer', 'Full Stack Dev', 'Frontend Dev', 'Backend Dev', 'ML Engineer', 'Mobile Dev']
const LOCATIONS = ['Remote', 'San Francisco', 'New York', 'Seattle', 'Austin', 'London', 'Berlin', 'Singapore', 'Toronto', 'Bangalore']

const plans = [
  { name: 'free', label: 'Free', price: '$0', period: 'forever', color: '#8a8a9a', gradient: 'from-[#3a3a4a] to-[#2a2a3a]',
    features: ['10 applications/month', 'Basic job matching', 'Resume upload'],
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><path d="M8 12l2 2 4-4"/></svg> },
  { name: 'pro', label: 'Pro', price: '$29', period: '/month', color: '#fd79a8', gradient: 'from-[#fd79a8] to-[#e84393]', popular: true,
    features: ['100 applications/month', 'AI resume optimizer', 'Cover letter generation', 'Priority support'],
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="13,2 3,14 12,14 11,22 21,10 12,10"/></svg> },
  { name: 'elite', label: 'Elite', price: '$59', period: '/month', color: '#a29bfe', gradient: 'from-[#a29bfe] to-[#6c5ce7]',
    features: ['Unlimited applications', 'Auto-apply engine', 'AI interview coach', 'Dedicated manager'],
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> },
]

/* ─── Slide variants ─── */
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
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [selectedLocations, setSelectedLocations] = useState<string[]>([])
  const [customRole, setCustomRole] = useState('')
  const [preferences, setPreferences] = useState({ remote_preference: 'any', experience_level: 'mid', min_salary: '' })
  const [selectedPlan, setSelectedPlan] = useState('free')
  const [saving, setSaving] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [mounted, setMounted] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => { setMounted(true) }, [])

  const goTo = (next: number) => { setDirection(next > step ? 1 : -1); setStep(next) }

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
    setUploading(false); goTo(1)
  }

  const handlePreferences = async () => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await supabase.from('job_preferences').upsert({
        user_id: user.id, target_roles: selectedRoles, target_locations: selectedLocations,
        remote_preference: preferences.remote_preference, experience_level: preferences.experience_level,
        min_salary: preferences.min_salary ? parseInt(preferences.min_salary) : null,
      })
    } catch { /* continue */ }
    setSaving(false); goTo(2)
  }

  const handleComplete = async () => {
    setCompleting(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('profiles').update({ onboarding_complete: true }).eq('id', user.id)
    router.push('/dashboard'); router.refresh()
  }

  const stepLabels = ['Resume', 'Preferences', 'Launch']

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-[#050510] flex items-center justify-center relative overflow-hidden py-10 px-4">
      {/* ── CSS for animations ── */}
      <style jsx global>{`
        @keyframes mesh-shift {
          0%, 100% { background-position: 0% 50%; }
          25% { background-position: 100% 0%; }
          50% { background-position: 100% 100%; }
          75% { background-position: 0% 100%; }
        }
        @keyframes noise {
          0%, 100% { transform: translate(0, 0); }
          10% { transform: translate(-5%, -10%); }
          30% { transform: translate(3%, -15%); }
          50% { transform: translate(-15%, 5%); }
          70% { transform: translate(5%, 10%); }
          90% { transform: translate(-10%, 5%); }
        }
        .noise-overlay::after {
          content: '';
          position: absolute;
          inset: -50%;
          width: 200%;
          height: 200%;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
          opacity: 0.03;
          animation: noise 8s steps(10) infinite;
          pointer-events: none;
        }
        @keyframes aurora {
          0% { transform: rotate(0deg) scale(1.5); }
          33% { transform: rotate(120deg) scale(1.2); }
          66% { transform: rotate(240deg) scale(1.6); }
          100% { transform: rotate(360deg) scale(1.5); }
        }
      `}</style>

      {/* ── Animated Mesh Gradient Background ── */}
      <div className="absolute inset-0">
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(-45deg, rgba(253,121,168,0.08), rgba(10,10,20,1), rgba(162,155,254,0.06), rgba(10,10,20,1), rgba(116,185,255,0.05))',
          backgroundSize: '400% 400%', animation: 'mesh-shift 20s ease infinite',
        }} />
      </div>

      {/* Aurora blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-40%] right-[-20%] w-[800px] h-[800px] rounded-full opacity-[0.04]"
          style={{ background: 'radial-gradient(circle, #fd79a8, transparent 60%)', animation: 'aurora 25s ease-in-out infinite' }} />
        <div className="absolute bottom-[-40%] left-[-20%] w-[700px] h-[700px] rounded-full opacity-[0.03]"
          style={{ background: 'radial-gradient(circle, #a29bfe, transparent 60%)', animation: 'aurora 30s ease-in-out infinite reverse' }} />
        <div className="absolute top-[20%] left-[50%] w-[500px] h-[500px] rounded-full opacity-[0.02]"
          style={{ background: 'radial-gradient(circle, #74b9ff, transparent 60%)', animation: 'aurora 35s ease-in-out infinite 5s' }} />
      </div>

      {/* Particles */}
      <Particles />

      {/* Noise overlay */}
      <div className="absolute inset-0 noise-overlay pointer-events-none" />

      {/* Grid */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
        backgroundSize: '80px 80px',
      }} />

      <div className="relative z-10 w-full max-w-[580px]">

        {/* ── Logo ── */}
        <motion.div className="flex items-center justify-center gap-3 mb-12"
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}>
          <motion.div className="relative w-10 h-10 rounded-2xl flex items-center justify-center"
            animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            style={{ background: 'linear-gradient(135deg, #fd79a8, #e84393)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polygon points="13,2 3,14 12,14 11,22 21,10 12,10"/></svg>
            <div className="absolute -inset-1 rounded-2xl opacity-50" style={{ background: 'linear-gradient(135deg, #fd79a8, #e84393)', filter: 'blur(12px)', zIndex: -1 }} />
          </motion.div>
          <div>
            <span className="text-[20px] font-black tracking-tight text-white">ApplyMaster</span>
            <span className="text-[20px] font-black tracking-tight bg-gradient-to-r from-[#fd79a8] to-[#e84393] bg-clip-text text-transparent">.ai</span>
          </div>
        </motion.div>

        {/* ── Step Progress ── */}
        <motion.div className="flex items-center justify-center mb-12"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}>
          {stepLabels.map((label, i) => (
            <div key={label} className="flex items-center">
              <div className="flex flex-col items-center gap-2.5">
                <div className="relative">
                  {/* Outer glow ring for active */}
                  {i === step && (
                    <motion.div className="absolute -inset-2 rounded-full"
                      animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] }}
                      transition={{ duration: 2.5, repeat: Infinity }}
                      style={{ background: 'radial-gradient(circle, rgba(253,121,168,0.4), transparent 70%)' }} />
                  )}
                  <motion.div
                    animate={i === step ? { scale: [1, 1.08, 1] } : {}}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    className="relative w-12 h-12 rounded-full flex items-center justify-center"
                    style={i < step
                      ? { background: 'linear-gradient(135deg, #fd79a8, #e84393)', boxShadow: '0 0 24px rgba(253,121,168,0.5)' }
                      : i === step
                        ? { background: 'linear-gradient(135deg, rgba(253,121,168,0.15), rgba(253,121,168,0.05))', border: '2px solid rgba(253,121,168,0.5)', boxShadow: '0 0 30px rgba(253,121,168,0.15)' }
                        : { background: 'rgba(255,255,255,0.03)', border: '1.5px solid rgba(255,255,255,0.06)' }}>
                    {i < step
                      ? <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400 }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M20 6L9 17L4 12"/></svg>
                        </motion.div>
                      : <span className="text-[14px] font-black" style={{ color: i === step ? '#fd79a8' : '#3a3a4a' }}>{i + 1}</span>
                    }
                  </motion.div>
                </div>
                <span className="text-[11px] font-bold uppercase tracking-[0.15em]" style={{ color: i <= step ? '#fd79a8' : '#2a2a3a' }}>{label}</span>
              </div>
              {i < 2 && (
                <div className="w-24 h-[2px] mx-3 mb-6 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <motion.div className="h-full rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ width: i < step ? '100%' : '0%' }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }}
                    style={{ background: 'linear-gradient(90deg, #fd79a8, #e84393)' }} />
                </div>
              )}
            </div>
          ))}
        </motion.div>

        {/* ── Main Card ── */}
        <motion.div initial={{ opacity: 0, y: 30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] as const }}>
          <GlowCard>
            <div className="p-8 sm:p-10">
              <AnimatePresence custom={direction} mode="wait">

                {/* ═══════ STEP 0: RESUME ═══════ */}
                {step === 0 && (
                  <motion.div key="s0" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit">
                    <div className="text-center mb-8">
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.1 }}
                        className="inline-flex w-20 h-20 rounded-3xl items-center justify-center mb-6 relative">
                        <div className="absolute inset-0 rounded-3xl" style={{ background: 'linear-gradient(135deg, rgba(253,121,168,0.12), rgba(253,121,168,0.03))', border: '1px solid rgba(253,121,168,0.12)' }} />
                        <motion.div className="absolute -inset-3 rounded-3xl opacity-40"
                          animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.4, 0.2] }}
                          transition={{ duration: 3, repeat: Infinity }}
                          style={{ background: 'radial-gradient(circle, rgba(253,121,168,0.2), transparent 70%)' }} />
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fd79a8" strokeWidth="1.4">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                        </svg>
                      </motion.div>
                      <div className="overflow-hidden">
                        <RevealText delay={0.15} className="text-[28px] sm:text-[32px] font-black tracking-tight text-white block">
                          Upload Your Resume
                        </RevealText>
                      </div>
                      <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                        className="text-[14px] text-[#555570] mt-3 leading-relaxed">
                        Our AI analyzes it in seconds and optimizes<br/>for <span className="text-[#fd79a8] font-semibold">maximum ATS compatibility</span>
                      </motion.p>
                    </div>

                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                      <motion.div
                        onClick={() => fileRef.current?.click()}
                        onDragOver={e => { e.preventDefault(); setDragging(true) }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={onDrop}
                        whileHover={{ scale: 1.01, borderColor: 'rgba(253,121,168,0.3)' }}
                        animate={dragging ? { scale: 1.02, borderColor: 'rgba(253,121,168,0.6)', background: 'rgba(253,121,168,0.04)' } : {}}
                        className="relative cursor-pointer rounded-2xl p-10 text-center transition-all overflow-hidden group"
                        style={{ border: '2px dashed rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.01)' }}>

                        {/* Hover gradient */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                          style={{ background: 'radial-gradient(circle at 50% 50%, rgba(253,121,168,0.04), transparent 70%)' }} />

                        <input ref={fileRef} type="file" accept=".pdf,.docx" className="hidden"
                          onChange={e => setResumeFile(e.target.files?.[0] || null)} />

                        <AnimatePresence mode="wait">
                          {resumeFile ? (
                            <motion.div key="file" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                              transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
                              <motion.div
                                initial={{ scale: 0 }} animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                                style={{ background: 'linear-gradient(135deg, rgba(0,184,148,0.15), rgba(0,184,148,0.03))', border: '1px solid rgba(0,184,148,0.2)' }}>
                                <motion.svg initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, delay: 0.2 }}
                                  width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00b894" strokeWidth="2.5"><path d="M20 6L9 17L4 12"/></motion.svg>
                              </motion.div>
                              <div className="text-[15px] font-bold text-white mb-1">{resumeFile.name}</div>
                              <div className="text-[12px] font-semibold" style={{ color: '#00b894' }}>
                                {(resumeFile.size / 1024).toFixed(0)} KB · Ready to process
                              </div>
                              <button onClick={e => { e.stopPropagation(); setResumeFile(null) }}
                                className="mt-4 text-[11px] text-[#3a3a4a] hover:text-[#fd79a8] transition-colors font-medium">
                                Remove & choose another
                              </button>
                            </motion.div>
                          ) : (
                            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                              <motion.div
                                animate={{ y: [0, -8, 0] }}
                                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4a4a5a" strokeWidth="1.5">
                                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17,8 12,3 7,8"/><line x1="12" y1="3" x2="12" y2="15"/>
                                </svg>
                              </motion.div>
                              <div className="text-[15px] font-bold text-white mb-1">Drop your resume here</div>
                              <div className="text-[13px] text-[#3a3a4a] mb-5">or click to browse files</div>
                              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-bold"
                                style={{ background: 'rgba(253,121,168,0.05)', color: '#fd79a8', border: '1px solid rgba(253,121,168,0.1)' }}>
                                PDF or DOCX · Max 10MB
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    </motion.div>

                    {/* AI processing badge */}
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
                      className="flex items-center justify-center gap-3 mt-5 mb-8 py-3 px-5 rounded-2xl mx-auto w-fit"
                      style={{ background: 'rgba(253,121,168,0.03)', border: '1px solid rgba(253,121,168,0.06)' }}>
                      <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ duration: 2, repeat: Infinity }}
                        className="w-2 h-2 rounded-full bg-[#00b894]" />
                      <span className="text-[11px] text-[#555570] font-medium">AI-powered parsing · ATS optimization · Instant analysis</span>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                      className="flex gap-3">
                      <MagneticButton variant="secondary" onClick={() => goTo(1)} className="flex-1 py-4 rounded-2xl">
                        Skip for now
                      </MagneticButton>
                      <MagneticButton variant="primary" onClick={handleResumeUpload} disabled={uploading} className="flex-1 py-4 rounded-2xl"
                        style={{ boxShadow: '0 8px 40px rgba(253,121,168,0.3)' } as React.CSSProperties}>
                        {uploading ? (
                          <>
                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                              className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white" />
                            Processing...
                          </>
                        ) : 'Continue →'}
                      </MagneticButton>
                    </motion.div>
                  </motion.div>
                )}

                {/* ═══════ STEP 1: PREFERENCES ═══════ */}
                {step === 1 && (
                  <motion.div key="s1" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit">
                    <div className="text-center mb-8">
                      <motion.div
                        initial={{ scale: 0, rotate: 180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.1 }}
                        className="inline-flex w-20 h-20 rounded-3xl items-center justify-center mb-6 relative">
                        <div className="absolute inset-0 rounded-3xl" style={{ background: 'linear-gradient(135deg, rgba(162,155,254,0.12), rgba(162,155,254,0.03))', border: '1px solid rgba(162,155,254,0.12)' }} />
                        <motion.div className="absolute -inset-3 rounded-3xl opacity-40"
                          animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.4, 0.2] }}
                          transition={{ duration: 3, repeat: Infinity }}
                          style={{ background: 'radial-gradient(circle, rgba(162,155,254,0.2), transparent 70%)' }} />
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#a29bfe" strokeWidth="1.4">
                          <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                        </svg>
                      </motion.div>
                      <RevealText delay={0.15} className="text-[28px] sm:text-[32px] font-black tracking-tight text-white block">
                        Your Preferences
                      </RevealText>
                      <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                        className="text-[14px] text-[#555570] mt-3 leading-relaxed">
                        AI will hunt down <span className="text-[#a29bfe] font-semibold">perfect-match jobs</span> based on these
                      </motion.p>
                    </div>

                    <div className="space-y-7">
                      {/* Roles */}
                      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                        <label className="block text-[11px] font-black text-[#555570] mb-3 uppercase tracking-[0.2em]">
                          What roles are you targeting?
                        </label>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {ROLES.map((role, i) => {
                            const selected = selectedRoles.includes(role)
                            return (
                              <motion.button key={role}
                                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.35 + i * 0.03, type: 'spring', stiffness: 300 }}
                                onClick={() => toggleChip(selectedRoles, setSelectedRoles, role)}
                                whileHover={{ scale: 1.05, y: -1 }} whileTap={{ scale: 0.92 }}
                                className="px-3.5 py-2 rounded-xl text-[12px] font-semibold transition-all duration-300"
                                style={selected
                                  ? { background: 'rgba(253,121,168,0.12)', color: '#fd79a8', border: '1px solid rgba(253,121,168,0.35)', boxShadow: '0 0 16px rgba(253,121,168,0.15), inset 0 0 12px rgba(253,121,168,0.05)' }
                                  : { background: 'rgba(255,255,255,0.02)', color: '#555570', border: '1px solid rgba(255,255,255,0.06)' }}>
                                {selected && <span className="mr-1">✓</span>}{role}
                              </motion.button>
                            )
                          })}
                        </div>
                        <div className="relative">
                          <input value={customRole} onChange={e => setCustomRole(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter' && customRole.trim()) { setSelectedRoles([...selectedRoles, customRole.trim()]); setCustomRole('') } }}
                            placeholder="+ Add custom role & press Enter"
                            className="w-full px-4 py-3 rounded-xl text-[13px] text-white placeholder-[#2a2a3a] focus:outline-none transition-all duration-300"
                            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
                            onFocus={e => (e.target.style.borderColor = 'rgba(253,121,168,0.3)')}
                            onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.06)')} />
                        </div>
                      </motion.div>

                      {/* Locations */}
                      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
                        <label className="block text-[11px] font-black text-[#555570] mb-3 uppercase tracking-[0.2em]">
                          Where do you want to work?
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {LOCATIONS.map((loc, i) => {
                            const selected = selectedLocations.includes(loc)
                            return (
                              <motion.button key={loc}
                                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.5 + i * 0.03, type: 'spring', stiffness: 300 }}
                                onClick={() => toggleChip(selectedLocations, setSelectedLocations, loc)}
                                whileHover={{ scale: 1.05, y: -1 }} whileTap={{ scale: 0.92 }}
                                className="px-3.5 py-2 rounded-xl text-[12px] font-semibold transition-all duration-300"
                                style={selected
                                  ? { background: 'rgba(116,185,255,0.12)', color: '#74b9ff', border: '1px solid rgba(116,185,255,0.35)', boxShadow: '0 0 16px rgba(116,185,255,0.12), inset 0 0 12px rgba(116,185,255,0.05)' }
                                  : { background: 'rgba(255,255,255,0.02)', color: '#555570', border: '1px solid rgba(255,255,255,0.06)' }}>
                                {selected && <span className="mr-1">✓</span>}{loc}
                              </motion.button>
                            )
                          })}
                        </div>
                      </motion.div>

                      {/* Dropdowns Row */}
                      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                        className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-black text-[#555570] mb-2 uppercase tracking-[0.2em]">Work Type</label>
                          <select value={preferences.remote_preference} onChange={e => setPreferences({ ...preferences, remote_preference: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl text-white text-[13px] focus:outline-none appearance-none cursor-pointer transition-all duration-300"
                            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <option value="any">Any</option><option value="remote">Remote Only</option>
                            <option value="hybrid">Hybrid</option><option value="onsite">On-site</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-black text-[#555570] mb-2 uppercase tracking-[0.2em]">Experience</label>
                          <select value={preferences.experience_level} onChange={e => setPreferences({ ...preferences, experience_level: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl text-white text-[13px] focus:outline-none appearance-none cursor-pointer transition-all duration-300"
                            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <option value="entry">Entry Level</option><option value="mid">Mid Level</option>
                            <option value="senior">Senior</option><option value="lead">Lead / Staff</option>
                            <option value="executive">Executive</option>
                          </select>
                        </div>
                      </motion.div>

                      {/* Salary */}
                      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}>
                        <label className="block text-[11px] font-black text-[#555570] mb-2 uppercase tracking-[0.2em]">
                          Min Salary <span className="normal-case text-[#2a2a3a] tracking-normal">(optional)</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#555570] text-[15px] font-black">$</span>
                          <input type="number" value={preferences.min_salary} onChange={e => setPreferences({ ...preferences, min_salary: e.target.value })}
                            placeholder="80,000"
                            className="w-full pl-9 pr-16 py-3 rounded-xl text-white text-[13px] placeholder-[#2a2a3a] focus:outline-none transition-all duration-300"
                            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
                            onFocus={e => (e.target.style.borderColor = 'rgba(162,155,254,0.3)')}
                            onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.06)')} />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#2a2a3a] text-[11px] font-bold">/year</span>
                        </div>
                      </motion.div>
                    </div>

                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
                      className="flex gap-3 mt-8">
                      <MagneticButton variant="secondary" onClick={() => goTo(0)} className="py-4 px-6 rounded-2xl">
                        ← Back
                      </MagneticButton>
                      <MagneticButton variant="primary" onClick={handlePreferences} disabled={saving} className="flex-1 py-4 rounded-2xl"
                        style={{ background: 'linear-gradient(135deg, #a29bfe, #6c5ce7)', boxShadow: '0 8px 40px rgba(162,155,254,0.3)' } as React.CSSProperties}>
                        {saving ? (
                          <>
                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                              className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white" />
                            Saving...
                          </>
                        ) : 'Continue →'}
                      </MagneticButton>
                    </motion.div>
                  </motion.div>
                )}

                {/* ═══════ STEP 2: PLAN & LAUNCH ═══════ */}
                {step === 2 && (
                  <motion.div key="s2" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit">
                    <div className="text-center mb-8">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 10, delay: 0.1 }}
                        className="inline-flex w-20 h-20 rounded-3xl items-center justify-center mb-6 relative">
                        <div className="absolute inset-0 rounded-3xl" style={{ background: 'linear-gradient(135deg, rgba(253,203,94,0.12), rgba(253,203,94,0.03))', border: '1px solid rgba(253,203,94,0.12)' }} />
                        <motion.div className="absolute -inset-3 rounded-3xl"
                          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.5, 0.2] }}
                          transition={{ duration: 2.5, repeat: Infinity }}
                          style={{ background: 'radial-gradient(circle, rgba(253,203,94,0.2), transparent 70%)' }} />
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                          className="absolute inset-0 rounded-3xl"
                          style={{ background: 'conic-gradient(from 0deg, transparent 0%, rgba(253,203,94,0.2) 25%, transparent 50%)', }} />
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fdcb6e" strokeWidth="1.4">
                          <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
                          <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
                          <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 3 0 3 0M12 15v5s3.03-.55 4-2c1.08-1.62 0-3 0-3"/>
                        </svg>
                      </motion.div>
                      <RevealText delay={0.15} className="text-[28px] sm:text-[32px] font-black tracking-tight text-white block">
                        Ready to Launch
                      </RevealText>
                      <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                        className="text-[14px] text-[#555570] mt-3 leading-relaxed">
                        Choose a plan to get started. <span className="text-[#fdcb6e] font-semibold">No credit card required.</span>
                      </motion.p>
                    </div>

                    <div className="space-y-3 mb-6">
                      {plans.map((plan, i) => {
                        const isSelected = selectedPlan === plan.name
                        return (
                          <motion.div key={plan.name}
                            initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 + i * 0.1, type: 'spring', stiffness: 200 }}
                            onClick={() => setSelectedPlan(plan.name)}
                            whileHover={{ scale: 1.015, y: -1 }} whileTap={{ scale: 0.98 }}
                            className="relative flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all duration-400 overflow-hidden"
                            style={isSelected
                              ? { background: `${plan.color}08`, border: `1.5px solid ${plan.color}40`, boxShadow: `0 0 30px ${plan.color}12` }
                              : { background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.05)' }}>

                            {/* Selected glow */}
                            {isSelected && (
                              <motion.div layoutId="plan-glow" className="absolute inset-0 rounded-2xl"
                                style={{ background: `radial-gradient(circle at 20% 50%, ${plan.color}08, transparent 70%)` }}
                                transition={{ type: 'spring', stiffness: 200, damping: 25 }} />
                            )}

                            {plan.popular && (
                              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                                className="absolute -top-0 right-4 text-[9px] font-black px-3 py-1 rounded-b-lg text-white"
                                style={{ background: `linear-gradient(135deg, ${plan.color}, ${plan.color}cc)`, boxShadow: `0 4px 12px ${plan.color}40` }}>
                                POPULAR
                              </motion.div>
                            )}

                            {/* Icon */}
                            <motion.div
                              animate={isSelected ? { scale: [1, 1.1, 1] } : {}}
                              transition={{ duration: 2, repeat: Infinity }}
                              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                              style={{ background: `${plan.color}10`, color: plan.color, border: `1px solid ${plan.color}15` }}>
                              {plan.icon}
                            </motion.div>

                            {/* Info */}
                            <div className="flex-1 min-w-0 relative z-10">
                              <div className="flex items-baseline gap-2 mb-0.5">
                                <span className="text-[15px] font-black text-white">{plan.label}</span>
                                <span className="text-[18px] font-black" style={{ color: plan.color }}>{plan.price}</span>
                                <span className="text-[11px] text-[#3a3a4a]">{plan.period}</span>
                              </div>
                              <div className="text-[11px] text-[#3a3a4a] leading-relaxed">{plan.features.join(' · ')}</div>
                            </div>

                            {/* Check */}
                            <motion.div
                              animate={isSelected ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
                              transition={{ type: 'spring', stiffness: 400 }}
                              className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                              style={{ background: `linear-gradient(135deg, ${plan.color}, ${plan.color}aa)`, boxShadow: `0 0 12px ${plan.color}40` }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M20 6L9 17L4 12"/></svg>
                            </motion.div>
                          </motion.div>
                        )
                      })}
                    </div>

                    {/* Social Proof */}
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
                      className="flex items-center justify-around py-4 rounded-2xl mb-8 relative overflow-hidden"
                      style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.04)' }}>
                      <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(253,121,168,0.02), rgba(162,155,254,0.02), rgba(253,203,94,0.02))' }} />
                      {[
                        ['847K+', 'Apps Sent', '#fd79a8'],
                        ['94%', 'ATS Pass', '#a29bfe'],
                        ['48%', 'Interviews', '#fdcb6e'],
                      ].map(([val, label, color]) => (
                        <div key={label} className="text-center relative z-10">
                          <div className="text-[18px] font-black" style={{ color: color as string }}>{val}</div>
                          <div className="text-[10px] text-[#3a3a4a] font-bold mt-0.5 uppercase tracking-wider">{label}</div>
                        </div>
                      ))}
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
                      className="flex gap-3">
                      <MagneticButton variant="secondary" onClick={() => goTo(1)} className="py-4 px-6 rounded-2xl">
                        ← Back
                      </MagneticButton>
                      <MagneticButton variant="primary" onClick={handleComplete} disabled={completing}
                        className="flex-1 py-4 rounded-2xl text-[14px]"
                        style={{ boxShadow: '0 12px 50px rgba(253,121,168,0.4)' } as React.CSSProperties}>
                        {completing ? (
                          <>
                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                              className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white" />
                            Launching...
                          </>
                        ) : (
                          <>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="13,2 3,14 12,14 11,22 21,10 12,10"/></svg>
                            Start Applying on Autopilot
                          </>
                        )}
                      </MagneticButton>
                    </motion.div>

                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
                      className="text-center text-[11px] text-[#2a2a3a] mt-5 font-medium">
                      Free plan activates instantly · Upgrade anytime from Settings
                    </motion.p>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </GlowCard>
        </motion.div>

        {/* Footer */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
          className="text-center mt-8 text-[11px] text-[#2a2a3a] font-medium">
          By continuing you agree to our{' '}
          <span className="text-[#3a3a4a] hover:text-[#fd79a8] cursor-pointer transition-colors">Terms</span>
          {' '}&{' '}
          <span className="text-[#3a3a4a] hover:text-[#fd79a8] cursor-pointer transition-colors">Privacy</span>
        </motion.div>
      </div>
    </div>
  )
}
