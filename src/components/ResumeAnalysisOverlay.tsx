'use client'

import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion'
import { useState, useEffect, useMemo, useRef } from 'react'

interface ResumeAnalysisOverlayProps {
  isVisible: boolean
  currentStep: 'uploading' | 'extracting' | 'analyzing' | 'saving' | 'done'
  fileName: string
  error?: string | null
  onComplete?: () => void
}

const STEPS = [
  { key: 'uploading', label: 'Uploading Resume', sublabel: 'Sending to secure servers', icon: 'upload' },
  { key: 'extracting', label: 'Reading Document', sublabel: 'Parsing text & structure', icon: 'scan' },
  { key: 'analyzing', label: 'AI Analyzing Experience', sublabel: 'Understanding your career', icon: 'brain' },
  { key: 'saving', label: 'Building Your Profile', sublabel: 'Mapping skills & experience', icon: 'check' },
] as const

function getStepIndex(step: ResumeAnalysisOverlayProps['currentStep']): number {
  if (step === 'done') return STEPS.length
  return STEPS.findIndex((s) => s.key === step)
}

// 3D Perspective wrapper
function Scene3D({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ perspective: '1200px', perspectiveOrigin: '50% 50%' }}>
      {children}
    </div>
  )
}

// Floating 3D particle with depth
function FloatingParticle3D({ index }: { index: number }) {
  const colors = ['#fd79a8', '#a29bfe', '#74b9ff', '#ffeaa7', '#55efc4']
  const size = 3 + Math.random() * 10
  const color = colors[index % colors.length]
  const startX = Math.random() * 100
  const startY = Math.random() * 100
  const depth = Math.random() * 400 - 200
  const duration = 10 + Math.random() * 20

  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color}, transparent)`,
        boxShadow: `0 0 ${size * 4}px ${color}60`,
        left: `${startX}%`,
        top: `${startY}%`,
        transform: `translateZ(${depth}px)`,
      }}
      animate={{
        x: [0, 100 * Math.sin(index * 0.7), -80 * Math.cos(index * 0.5), 0],
        y: [0, -90 * Math.cos(index * 0.6), 60 * Math.sin(index * 0.4), 0],
        opacity: [0.15, 0.8, 0.3, 0.15],
        scale: [1, 1.8, 0.6, 1],
      }}
      transition={{ duration, repeat: Infinity, ease: 'easeInOut' }}
    />
  )
}

// DNA-like double helix
function DoubleHelix() {
  const points = 20
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{ width: 200, height: 400, left: '50%', top: '50%', marginLeft: -100, marginTop: -200 }}
      animate={{ rotateY: 360 }}
      transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
    >
      {Array.from({ length: points }).map((_, i) => {
        const t = (i / points) * Math.PI * 4
        const x1 = Math.cos(t) * 80 + 100
        const y = (i / points) * 400
        const x2 = Math.cos(t + Math.PI) * 80 + 100
        return (
          <div key={i}>
            <motion.div
              className="absolute rounded-full"
              style={{ width: 5, height: 5, left: x1, top: y, background: '#fd79a8', boxShadow: '0 0 15px #fd79a880' }}
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.3, 0.8] }}
              transition={{ duration: 2, delay: i * 0.1, repeat: Infinity }}
            />
            <motion.div
              className="absolute rounded-full"
              style={{ width: 5, height: 5, left: x2, top: y, background: '#a29bfe', boxShadow: '0 0 15px #a29bfe80' }}
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.3, 0.8] }}
              transition={{ duration: 2, delay: i * 0.1 + 0.5, repeat: Infinity }}
            />
            {i % 3 === 0 && (
              <motion.div
                className="absolute"
                style={{ left: Math.min(x1, x2), top: y + 2, width: Math.abs(x2 - x1), height: 1, background: `linear-gradient(90deg, #fd79a840, #a29bfe40)` }}
                animate={{ opacity: [0.1, 0.4, 0.1] }}
                transition={{ duration: 1.5, delay: i * 0.05, repeat: Infinity }}
              />
            )}
          </div>
        )
      })}
    </motion.div>
  )
}

// Orbital Ring with 3D rotation
function OrbitalRing3D({ radius, duration, color, dotCount, tiltX = 0, tiltY = 0, reverse }: {
  radius: number; duration: number; color: string; dotCount: number; tiltX?: number; tiltY?: number; reverse?: boolean
}) {
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        width: radius * 2, height: radius * 2, left: '50%', top: '50%',
        marginLeft: -radius, marginTop: -radius,
        transformStyle: 'preserve-3d',
        transform: `rotateX(${tiltX}deg) rotateY(${tiltY}deg)`,
      }}
      animate={{ rotate: reverse ? -360 : 360 }}
      transition={{ duration, repeat: Infinity, ease: 'linear' }}
    >
      {Array.from({ length: dotCount }).map((_, i) => {
        const angle = (360 / dotCount) * i
        const rad = (angle * Math.PI) / 180
        const x = radius + Math.cos(rad) * radius - 4
        const y = radius + Math.sin(rad) * radius - 4
        return (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{ width: 8, height: 8, left: x, top: y, background: color, boxShadow: `0 0 20px ${color}, 0 0 40px ${color}40` }}
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.7, 1.4, 0.7] }}
            transition={{ duration: 2, delay: i * (duration / dotCount / 5), repeat: Infinity, ease: 'easeInOut' }}
          />
        )
      })}
      {/* Ring path */}
      <div className="absolute inset-0 rounded-full" style={{ border: `1px solid ${color}20` }} />
    </motion.div>
  )
}

// Hexagonal grid background
function HexGrid() {
  const hexes = useMemo(() => Array.from({ length: 30 }, (_, i) => ({
    x: (i % 6) * 120 + (Math.floor(i / 6) % 2 === 0 ? 0 : 60),
    y: Math.floor(i / 6) * 104,
    delay: Math.random() * 3,
  })), [])

  return (
    <svg className="absolute inset-0 w-full h-full opacity-[0.04] pointer-events-none">
      {hexes.map((h, i) => (
        <motion.polygon
          key={i}
          points={hexPoints(h.x + 60, h.y + 60, 50)}
          fill="none"
          stroke="#a29bfe"
          strokeWidth={0.5}
          animate={{ opacity: [0.2, 0.8, 0.2], stroke: ['#a29bfe', '#fd79a8', '#a29bfe'] }}
          transition={{ duration: 4, delay: h.delay, repeat: Infinity }}
        />
      ))}
    </svg>
  )
}

function hexPoints(cx: number, cy: number, r: number) {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (60 * i - 30) * Math.PI / 180
    return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`
  }).join(' ')
}

// Scanning beam effect
function ScanBeam() {
  return (
    <motion.div
      className="absolute left-0 right-0 pointer-events-none"
      style={{ height: 2, background: 'linear-gradient(90deg, transparent 0%, #fd79a8 30%, #a29bfe 50%, #74b9ff 70%, transparent 100%)', boxShadow: '0 0 30px #fd79a8, 0 0 60px #a29bfe40' }}
      animate={{ top: ['0%', '100%', '0%'] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
    />
  )
}

// Step Icons
function UploadIcon() {
  return (
    <motion.svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <motion.path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8 }} />
      <motion.polyline points="17 8 12 3 7 8" animate={{ y: [0, -3, 0] }} transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.line x1="12" y1="3" x2="12" y2="15" animate={{ y: [0, -3, 0] }} transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }} />
    </motion.svg>
  )
}

function ScanIcon() {
  return (
    <motion.svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <motion.line x1="3" y1="12" x2="21" y2="12" stroke="#fd79a8" strokeWidth={2}
        animate={{ y1: [4, 20, 4], y2: [4, 20, 4] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
      <line x1="7" y1="7" x2="17" y2="7" strokeOpacity={0.3} />
      <line x1="7" y1="10" x2="14" y2="10" strokeOpacity={0.3} />
      <line x1="7" y1="14" x2="17" y2="14" strokeOpacity={0.3} />
      <line x1="7" y1="17" x2="12" y2="17" strokeOpacity={0.3} />
    </motion.svg>
  )
}

function BrainIcon() {
  return (
    <motion.svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      {[[6,4],[18,4],[4,12],[12,10],[20,12],[6,20],[18,20],[12,16]].map(([cx,cy], i) => (
        <motion.circle key={i} cx={cx} cy={cy} r={1.8} fill="#a29bfe" stroke="#a29bfe"
          animate={{ r: [1.5, 2.2, 1.5], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.5, delay: i * 0.15, repeat: Infinity, ease: 'easeInOut' }} />
      ))}
      {[[6,4,12,10],[18,4,12,10],[4,12,12,10],[20,12,12,10],[12,10,12,16],[12,16,6,20],[12,16,18,20]].map(([x1,y1,x2,y2], i) => (
        <motion.line key={`l${i}`} x1={x1} y1={y1} x2={x2} y2={y2} strokeOpacity={0.4} stroke="#a29bfe"
          animate={{ strokeOpacity: [0.15, 0.6, 0.15] }} transition={{ duration: 1.2, delay: i * 0.1, repeat: Infinity, ease: 'easeInOut' }} />
      ))}
      <motion.circle cx={6} cy={4} r={1} fill="#fd79a8"
        animate={{ cx: [6, 12, 12, 18], cy: [4, 10, 16, 20], opacity: [1, 0.8, 0.8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
    </motion.svg>
  )
}

function CheckIcon() {
  return (
    <motion.svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <motion.circle cx="12" cy="12" r="10" stroke="#a29bfe" strokeWidth={1.5} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1 }} />
      <motion.path d="M8 12.5l2.5 3 5.5-6" stroke="#74b9ff" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6, delay: 0.4 }} />
    </motion.svg>
  )
}

const STEP_ICONS: Record<string, () => JSX.Element> = { upload: UploadIcon, scan: ScanIcon, brain: BrainIcon, check: CheckIcon }

function StepSpinner() {
  return (
    <motion.div className="relative flex items-center justify-center" style={{ width: 28, height: 28 }}>
      <motion.div className="absolute rounded-full"
        style={{ width: 28, height: 28, border: '2.5px solid transparent', borderTopColor: '#fd79a8', borderRightColor: '#a29bfe' }}
        animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} />
      <motion.div className="absolute rounded-full"
        style={{ width: 18, height: 18, border: '1.5px solid transparent', borderBottomColor: '#74b9ff', borderLeftColor: '#ffeaa7' }}
        animate={{ rotate: -360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }} />
    </motion.div>
  )
}

function StepCheckmark() {
  return (
    <motion.div className="flex items-center justify-center" style={{ width: 28, height: 28 }}
      initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 15 }}>
      <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'rgba(52,211,153,0.15)', boxShadow: '0 0 15px rgba(52,211,153,0.3)' }}>
        <motion.svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
          <motion.path d="M5 13l4 4L19 7" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4, ease: 'easeOut' }} />
        </motion.svg>
      </div>
    </motion.div>
  )
}

// Confetti Burst
function ConfettiBurst() {
  const particles = useMemo(() => {
    const colors = ['#fd79a8', '#a29bfe', '#74b9ff', '#ffeaa7', '#55efc4', '#e17055', '#fdcb6e', '#00cec9']
    return Array.from({ length: 80 }).map((_, i) => {
      const angle = (360 / 80) * i + Math.random() * 20
      const rad = (angle * Math.PI) / 180
      const distance = 100 + Math.random() * 300
      return { color: colors[i % colors.length], x: Math.cos(rad) * distance, y: Math.sin(rad) * distance - 100,
        size: 4 + Math.random() * 8, rotation: Math.random() * 720, delay: Math.random() * 0.5, shape: Math.random() > 0.5 ? 'circle' : 'rect' }
    })
  }, [])

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
      {particles.map((p, i) => (
        <motion.div key={i} className={`absolute ${p.shape === 'circle' ? 'rounded-full' : 'rounded-sm'}`}
          style={{ width: p.size, height: p.shape === 'circle' ? p.size : p.size * 0.5, background: p.color, boxShadow: `0 0 8px ${p.color}80` }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 1 }}
          animate={{ x: p.x, y: p.y, opacity: [1, 1, 0], rotate: p.rotation, scale: [1, 1.3, 0.3] }}
          transition={{ duration: 2, delay: p.delay, ease: 'easeOut' }} />
      ))}
    </div>
  )
}

// Success Icon with ripple effect
function SuccessIcon() {
  return (
    <motion.div className="relative flex items-center justify-center" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.1 }}>
      {/* Ripple rings */}
      {[0, 1, 2].map(i => (
        <motion.div key={i} className="absolute rounded-full" style={{ width: 80, height: 80 }}
          animate={{ scale: [1, 2.5, 3], opacity: [0.3, 0.1, 0], borderWidth: [2, 1, 0] }}
          transition={{ duration: 2, delay: i * 0.4, repeat: Infinity, ease: 'easeOut' }}
          initial={{ borderColor: '#34d399', borderWidth: 2, borderStyle: 'solid' }} />
      ))}
      <motion.div className="relative flex items-center justify-center rounded-full"
        style={{ width: 90, height: 90, background: 'linear-gradient(135deg, rgba(52,211,153,0.2), rgba(16,185,129,0.1))', boxShadow: '0 0 60px rgba(52,211,153,0.4), 0 0 120px rgba(52,211,153,0.2)' }}
        animate={{ boxShadow: ['0 0 60px rgba(52,211,153,0.4)', '0 0 80px rgba(52,211,153,0.6)', '0 0 60px rgba(52,211,153,0.4)'] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}>
        <motion.svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <motion.path d="M5 13l4 4L19 7" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }} />
        </motion.svg>
      </motion.div>
    </motion.div>
  )
}

function ErrorIcon() {
  return (
    <motion.div className="flex items-center justify-center" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 12 }}>
      <motion.div className="relative flex items-center justify-center rounded-full"
        style={{ width: 70, height: 70, background: 'rgba(239,68,68,0.15)', boxShadow: '0 0 40px rgba(239,68,68,0.2)' }}
        animate={{ boxShadow: ['0 0 30px rgba(239,68,68,0.2)', '0 0 50px rgba(239,68,68,0.35)', '0 0 30px rgba(239,68,68,0.2)'] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}>
        <motion.svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <motion.line x1="18" y1="6" x2="6" y2="18" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.3 }} />
          <motion.line x1="6" y1="6" x2="18" y2="18" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.3, delay: 0.15 }} />
        </motion.svg>
      </motion.div>
    </motion.div>
  )
}

// Glowing text with typing effect
function TypedText({ text, delay = 0 }: { text: string; delay?: number }) {
  const [shown, setShown] = useState(0)
  useEffect(() => {
    if (shown >= text.length) return
    const t = setTimeout(() => setShown(s => s + 1), 30)
    return () => clearTimeout(t)
  }, [shown, text])
  useEffect(() => {
    const t = setTimeout(() => setShown(1), delay * 1000)
    return () => clearTimeout(t)
  }, [delay])
  return <span>{text.slice(0, shown)}<motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.5, repeat: Infinity }}>|</motion.span></span>
}

// ===========================================================================
// Main Component
// ===========================================================================
export default function ResumeAnalysisOverlay({ isVisible, currentStep, fileName, error, onComplete }: ResumeAnalysisOverlayProps) {
  const [showConfetti, setShowConfetti] = useState(false)
  const [autoRedirectCountdown, setAutoRedirectCountdown] = useState(3)
  const activeIndex = getStepIndex(currentStep)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  useEffect(() => {
    if (currentStep === 'done' && !error) {
      setShowConfetti(true)
      const t = setTimeout(() => setShowConfetti(false), 3000)
      return () => clearTimeout(t)
    }
  }, [currentStep, error])

  // Auto-redirect countdown when done
  useEffect(() => {
    if (currentStep === 'done' && !error && isVisible) {
      setAutoRedirectCountdown(3)
      const interval = setInterval(() => {
        setAutoRedirectCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval)
            onComplete?.()
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [currentStep, error, isVisible, onComplete])

  const handleMouseMove = (e: React.MouseEvent) => {
    mouseX.set(e.clientX / window.innerWidth - 0.5)
    mouseY.set(e.clientY / window.innerHeight - 0.5)
  }

  const bgRotateX = useTransform(mouseY, [-0.5, 0.5], [5, -5])
  const bgRotateY = useTransform(mouseX, [-0.5, 0.5], [-5, 5])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
          style={{ background: 'rgba(2,2,12,0.96)', backdropFilter: 'blur(30px)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          onMouseMove={handleMouseMove}
        >
          {/* Background hex grid */}
          <HexGrid />

          {/* Scan beam */}
          {currentStep !== 'done' && !error && <ScanBeam />}

          {/* Background Particles with 3D depth */}
          <Scene3D>
            <motion.div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ transformStyle: 'preserve-3d', rotateX: bgRotateX, rotateY: bgRotateY }}>
              {Array.from({ length: 40 }).map((_, i) => (
                <FloatingParticle3D key={i} index={i} />
              ))}
            </motion.div>
          </Scene3D>

          {/* 3D Orbital Rings */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <OrbitalRing3D radius={200} duration={25} color="#fd79a8" dotCount={6} tiltX={60} />
            <OrbitalRing3D radius={260} duration={35} color="#a29bfe" dotCount={10} tiltX={75} tiltY={20} reverse />
            <OrbitalRing3D radius={320} duration={45} color="#74b9ff" dotCount={8} tiltX={45} tiltY={-15} />
            <OrbitalRing3D radius={380} duration={55} color="#ffeaa7" dotCount={5} tiltX={80} tiltY={40} reverse />
          </div>

          {/* DNA Helix (on analyzing step) */}
          {currentStep === 'analyzing' && (
            <motion.div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20"
              initial={{ opacity: 0 }} animate={{ opacity: 0.15 }} transition={{ duration: 1 }}>
              <DoubleHelix />
            </motion.div>
          )}

          {/* Central Card with 3D tilt */}
          <Scene3D>
            <motion.div
              className="relative z-10 w-full max-w-lg mx-4"
              initial={{ y: 50, opacity: 0, scale: 0.9, rotateX: 20 }}
              animate={{ y: 0, opacity: 1, scale: 1, rotateX: 0 }}
              exit={{ y: -30, opacity: 0, scale: 0.9, rotateX: -10 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              style={{ transformStyle: 'preserve-3d', rotateX: bgRotateX, rotateY: bgRotateY }}
            >
              {/* Glowing border */}
              <div className="relative rounded-3xl p-[1.5px]">
                <motion.div className="absolute inset-0 rounded-3xl overflow-hidden">
                  <motion.div className="absolute inset-0" animate={{ rotate: 360 }} transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                    style={{ background: 'conic-gradient(from 0deg, #fd79a8, #a29bfe, #74b9ff, #ffeaa7, #55efc4, #fd79a8)' }} />
                </motion.div>

                {/* Outer glow */}
                <motion.div className="absolute -inset-2 rounded-3xl pointer-events-none"
                  style={{ background: 'linear-gradient(135deg, rgba(253,121,168,0.2), rgba(162,155,254,0.2), rgba(116,185,255,0.2))', filter: 'blur(30px)' }}
                  animate={{ opacity: [0.4, 0.8, 0.4] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />

                {/* Card content */}
                <div className="relative rounded-3xl px-8 py-10 overflow-hidden" style={{ background: 'linear-gradient(170deg, #12122a 0%, #0a0a18 50%, #0e0e20 100%)' }}>
                  {/* Inner aurora */}
                  <motion.div className="absolute top-0 left-0 right-0 h-48 pointer-events-none"
                    style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(253,121,168,0.12) 0%, rgba(162,155,254,0.08) 40%, transparent 70%)' }}
                    animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} />

                  {/* Shimmer line at top */}
                  <motion.div className="absolute top-0 left-0 right-0 h-[1px]"
                    style={{ backgroundImage: 'linear-gradient(90deg, transparent, #fd79a8, #a29bfe, #74b9ff, transparent)', backgroundSize: '200% 100%' }}
                    animate={{ backgroundPosition: ['200% 0', '-200% 0'] }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }} />

                  {showConfetti && <ConfettiBurst />}

                  {/* Error State */}
                  {error ? (
                    <motion.div className="relative flex flex-col items-center gap-6 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
                      <ErrorIcon />
                      <div>
                        <h3 className="text-xl font-bold mb-2" style={{ color: '#ef4444' }}>Something went wrong</h3>
                        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{error}</p>
                      </div>
                      <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.3)' }}>{fileName}</p>
                      <motion.button
                        onClick={onComplete}
                        className="mt-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
                        style={{ background: 'linear-gradient(135deg, #fd79a8, #e84393)' }}
                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      >
                        Continue to Dashboard
                      </motion.button>
                    </motion.div>
                  ) : currentStep === 'done' ? (
                    /* Done State */
                    <motion.div className="relative flex flex-col items-center gap-6 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
                      <SuccessIcon />
                      <div>
                        <motion.h3 className="text-2xl font-bold mb-2"
                          style={{ background: 'linear-gradient(135deg, #34d399, #74b9ff, #a29bfe)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                          Profile Built Successfully
                        </motion.h3>
                        <motion.p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                          Your profile has been built from <span style={{ color: '#a29bfe' }}>{fileName}</span>
                        </motion.p>
                      </div>
                      <motion.div className="flex flex-col items-center gap-2 mt-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
                        <div className="flex items-center gap-3">
                          {['Skills Mapped', 'Experience Parsed', 'Profile Ready'].map((item, i) => (
                            <motion.div key={item} className="flex items-center gap-1.5 text-xs"
                              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1 + i * 0.2 }}>
                              <div className="w-1.5 h-1.5 rounded-full bg-[#34d399]" />
                              <span style={{ color: 'rgba(255,255,255,0.6)' }}>{item}</span>
                            </motion.div>
                          ))}
                        </div>
                        <motion.p className="text-xs mt-3" style={{ color: 'rgba(255,255,255,0.3)' }}
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}>
                          Redirecting in {autoRedirectCountdown}s...
                        </motion.p>
                      </motion.div>
                    </motion.div>
                  ) : (
                    /* Progress State */
                    <div className="relative flex flex-col gap-6">
                      <div className="text-center mb-2">
                        <motion.h2 className="text-2xl font-bold mb-2"
                          style={{ background: 'linear-gradient(135deg, #fd79a8, #a29bfe, #74b9ff)', backgroundSize: '200% 200%', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                          animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                          transition={{ duration: 5, repeat: Infinity }}>
                          Analyzing Your Resume
                        </motion.h2>
                        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                          <span style={{ color: '#a29bfe' }}>{fileName}</span>
                        </p>
                      </div>

                      {/* Progress bar */}
                      <div className="relative">
                        <div className="h-1.5 rounded-full w-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
                        <motion.div className="absolute top-0 left-0 h-1.5 rounded-full"
                          style={{ background: 'linear-gradient(90deg, #fd79a8, #a29bfe, #74b9ff)', boxShadow: '0 0 15px #fd79a840' }}
                          initial={{ width: '0%' }}
                          animate={{ width: `${Math.max(((activeIndex + 0.5) / STEPS.length) * 100, 10)}%` }}
                          transition={{ duration: 0.8, ease: 'easeInOut' }} />
                        <motion.div className="absolute top-0 left-0 h-1.5 rounded-full"
                          style={{ width: 80, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)' }}
                          animate={{ x: ['-80px', '500px'] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', repeatDelay: 0.5 }} />
                      </div>

                      {/* Step list */}
                      <div className="flex flex-col gap-3">
                        {STEPS.map((step, i) => {
                          const isActive = i === activeIndex
                          const isComplete = i < activeIndex
                          const isPending = i > activeIndex
                          const IconComponent = STEP_ICONS[step.icon]

                          return (
                            <motion.div key={step.key} className="relative flex items-center gap-4 px-4 py-3.5 rounded-xl"
                              style={{
                                background: isActive ? 'rgba(253,121,168,0.08)' : isComplete ? 'rgba(52,211,153,0.04)' : 'transparent',
                                borderWidth: 1, borderStyle: 'solid',
                                borderColor: isActive ? 'rgba(253,121,168,0.25)' : isComplete ? 'rgba(52,211,153,0.1)' : 'rgba(255,255,255,0.04)',
                              }}
                              initial={false}
                              animate={{ opacity: isPending ? 0.35 : 1, y: isActive ? -1 : 0 }}
                              transition={{ duration: 0.3 }}>
                              {isActive && (
                                <motion.div className="absolute inset-0 rounded-xl pointer-events-none"
                                  style={{ boxShadow: '0 0 30px rgba(253,121,168,0.1), inset 0 0 30px rgba(253,121,168,0.03)' }}
                                  animate={{ opacity: [0.5, 1, 0.5] }}
                                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
                              )}
                              <motion.div className="relative flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-xl"
                                style={{
                                  background: isComplete ? 'rgba(52,211,153,0.1)' : isActive ? 'rgba(253,121,168,0.12)' : 'rgba(255,255,255,0.03)',
                                  color: isComplete ? '#34d399' : isActive ? '#fd79a8' : 'rgba(255,255,255,0.25)',
                                  boxShadow: isActive ? '0 0 20px rgba(253,121,168,0.15)' : 'none',
                                }}>
                                <IconComponent />
                              </motion.div>
                              <div className="flex-1">
                                <span className="text-sm font-semibold block"
                                  style={{ color: isComplete ? '#34d399' : isActive ? '#ffffff' : 'rgba(255,255,255,0.3)' }}>
                                  {step.label}
                                </span>
                                <span className="text-[11px] block mt-0.5"
                                  style={{ color: isActive ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)' }}>
                                  {step.sublabel}
                                </span>
                              </div>
                              <div className="flex-shrink-0">
                                {isComplete ? <StepCheckmark /> : isActive ? <StepSpinner /> : (
                                  <div className="w-6 h-6 rounded-full" style={{ border: '1.5px solid rgba(255,255,255,0.08)' }} />
                                )}
                              </div>
                            </motion.div>
                          )
                        })}
                      </div>

                      {/* Animated dots */}
                      <div className="flex items-center justify-center gap-1.5 mt-1">
                        {[0, 1, 2].map((i) => (
                          <motion.div key={i} className="rounded-full"
                            style={{ width: 5, height: 5, background: '#a29bfe' }}
                            animate={{ opacity: [0.2, 0.9, 0.2], scale: [0.8, 1.3, 0.8] }}
                            transition={{ duration: 1.2, delay: i * 0.2, repeat: Infinity, ease: 'easeInOut' }} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </Scene3D>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
