'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion'
import { createClient } from '@/lib/supabase-browser'

/* ─── Types ─── */
interface NetworkPerson {
  id: string
  name: string
  role: string
  company: string
  avatar: string
  mutualCount: number
  mutualNames: string[]
  source: string
  relevance: number
  canRefer: boolean
  connectionPath: string[]
}

interface NetworkSource {
  id: string
  name: string
  icon: JSX.Element
  count: number
  connected: boolean
  color: string
  gradient: string
}

/* ─── Icons ─── */
const icons = {
  search: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>,
  sparkle: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3z"/></svg>,
  gmail: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z" stroke="currentColor" strokeWidth="1.5"/><polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="1.5" fill="none"/></svg>,
  linkedin: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452z"/></svg>,
  calendar: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  twitter: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
  instagram: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none"/></svg>,
  arrow: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9,18 15,12 9,6"/></svg>,
  check: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20,6 9,17 4,12"/></svg>,
  send: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13"/><polygon points="22,2 15,22 11,13 2,9"/></svg>,
  link: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>,
  lock: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>,
  people: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
  zap: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13,2 3,14 12,14 11,22 21,10 12,10"/></svg>,
  globe: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>,
}

/* ─── Data ─── */
const NETWORK_SOURCES: NetworkSource[] = [
  { id: 'linkedin', name: 'LinkedIn', icon: icons.linkedin, count: 2340, connected: false, color: '#0a66c2', gradient: 'linear-gradient(135deg, #0a66c2, #004182)' },
  { id: 'gmail', name: 'Gmail', icon: icons.gmail, count: 847, connected: false, color: '#ea4335', gradient: 'linear-gradient(135deg, #ea4335, #c5221f)' },
  { id: 'calendar', name: 'Google Calendar', icon: icons.calendar, count: 1520, connected: false, color: '#4285f4', gradient: 'linear-gradient(135deg, #4285f4, #1a73e8)' },
  { id: 'twitter', name: 'X (Twitter)', icon: icons.twitter, count: 12800, connected: false, color: '#1d9bf0', gradient: 'linear-gradient(135deg, #1d9bf0, #0c7abf)' },
  { id: 'instagram', name: 'Instagram', icon: icons.instagram, count: 3200, connected: false, color: '#e1306c', gradient: 'linear-gradient(135deg, #e1306c, #c13584)' },
]

const SAMPLE_RESULTS: NetworkPerson[] = [
  { id: '1', name: 'Priya Sharma', role: 'Senior Engineering Manager', company: 'Google', avatar: 'PS', mutualCount: 3, mutualNames: ['Rahul Mehta', 'Anita Desai', 'James Chen'], source: 'linkedin', relevance: 97, canRefer: true, connectionPath: ['You', 'Rahul Mehta', 'Priya Sharma'] },
  { id: '2', name: 'Alex Rivera', role: 'Staff Software Engineer', company: 'Meta', avatar: 'AR', mutualCount: 2, mutualNames: ['Sarah Kim', 'David Liu'], source: 'gmail', relevance: 94, canRefer: true, connectionPath: ['You', 'Sarah Kim', 'Alex Rivera'] },
  { id: '3', name: 'Emily Zhang', role: 'Technical Recruiter', company: 'Stripe', avatar: 'EZ', mutualCount: 5, mutualNames: ['Mark Johnson', 'Lisa Wang', 'Tom Brown', 'Amy Lee', 'Chris Park'], source: 'linkedin', relevance: 91, canRefer: false, connectionPath: ['You', 'Mark Johnson', 'Emily Zhang'] },
  { id: '4', name: 'Michael O\'Brien', role: 'VP of Engineering', company: 'Amazon', avatar: 'MO', mutualCount: 1, mutualNames: ['Neha Patel'], source: 'calendar', relevance: 88, canRefer: true, connectionPath: ['You', 'Neha Patel', 'Michael O\'Brien'] },
  { id: '5', name: 'Sakura Tanaka', role: 'Lead Product Manager', company: 'Apple', avatar: 'ST', mutualCount: 4, mutualNames: ['Kevin Wu', 'Rachel Adams', 'Omar Hassan', 'Julia Morales'], source: 'linkedin', relevance: 85, canRefer: true, connectionPath: ['You', 'Kevin Wu', 'Sakura Tanaka'] },
]

const SAMPLE_QUERIES = [
  'Find someone who can refer me at Google for a senior engineer role',
  'Who in my network knows people at Stripe or Figma?',
  'Connect me with hiring managers in AI/ML at top startups',
  'Find recruiters at FAANG companies in my 2nd-degree network',
]

/* ─── Animated Counter ─── */
function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const count = useMotionValue(0)
  const rounded = useTransform(count, v => Math.round(v).toLocaleString())
  const [display, setDisplay] = useState('0')

  useEffect(() => {
    const controls = animate(count, value, { duration: 1.5, ease: [0.16, 1, 0.3, 1] })
    const unsub = rounded.on('change', v => setDisplay(v))
    return () => { controls.stop(); unsub() }
  }, [value, count, rounded])

  return <span>{display}{suffix}</span>
}

/* ─── Network Graph (Canvas) ─── */
function NetworkGraph({ results, searching }: { results: NetworkPerson[]; searching: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef(0)
  const timeRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    let W = 0, H = 0

    const resize = () => {
      const r = canvas.getBoundingClientRect()
      W = r.width; H = r.height
      canvas.width = W * dpr; canvas.height = H * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    // Build nodes
    const directSet = new Set<string>()
    results.forEach(p => { if (p.connectionPath.length > 1) directSet.add(p.connectionPath[1]) })
    const directArr = Array.from(directSet)

    const animate = () => {
      timeRef.current += 0.016
      const t = timeRef.current
      ctx.clearRect(0, 0, W, H)
      const cx = W / 2, cy = H / 2

      const isDark = document.documentElement.classList.contains('dark-theme')
      const lineColor = isDark ? 'rgba(255,255,255,' : 'rgba(0,0,0,'
      const textColor = isDark ? '#e0e0f0' : '#1a1a2e'
      const subtextColor = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)'

      // YOU node
      const youR = 32
      const youGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, youR)
      youGrad.addColorStop(0, '#e84393')
      youGrad.addColorStop(1, '#d63384')
      ctx.beginPath(); ctx.arc(cx, cy, youR, 0, Math.PI * 2); ctx.fillStyle = youGrad; ctx.fill()

      // Pulse ring
      const pulseR = youR + 8 + Math.sin(t * 2) * 4
      ctx.beginPath(); ctx.arc(cx, cy, pulseR, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(232,67,147,0.2)'; ctx.lineWidth = 2; ctx.stroke()

      // Outer ring
      ctx.beginPath(); ctx.arc(cx, cy, youR + 20 + Math.sin(t * 1.5) * 3, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(232,67,147,0.06)'; ctx.lineWidth = 1; ctx.stroke()

      ctx.font = 'bold 13px Inter, system-ui'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText('YOU', cx, cy)

      if (results.length === 0) {
        // Idle state — show placeholder nodes
        const placeholders = ['Contacts', 'Colleagues', 'Alumni', 'Friends']
        placeholders.forEach((label, i) => {
          const a = (i / placeholders.length) * Math.PI * 2 - Math.PI / 2
          const d = 120
          const x = cx + Math.cos(a + Math.sin(t * 0.3) * 0.03) * d
          const y = cy + Math.sin(a + Math.sin(t * 0.3) * 0.03) * d + Math.sin(t * 0.5 + i) * 3

          // Line
          ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x, y)
          ctx.strokeStyle = lineColor + '0.08)'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]); ctx.stroke(); ctx.setLineDash([])

          // Circle
          ctx.beginPath(); ctx.arc(x, y, 20, 0, Math.PI * 2)
          ctx.fillStyle = isDark ? 'rgba(108,92,231,0.15)' : 'rgba(108,92,231,0.08)'; ctx.fill()
          ctx.strokeStyle = isDark ? 'rgba(108,92,231,0.3)' : 'rgba(108,92,231,0.2)'; ctx.lineWidth = 1.5; ctx.stroke()

          ctx.font = '10px Inter, system-ui'; ctx.fillStyle = subtextColor; ctx.textAlign = 'center'
          ctx.fillText(label, x, y + 30)
        })
        animRef.current = requestAnimationFrame(animate)
        return
      }

      // Direct connections
      const directR = Math.min(W, H) * 0.22
      directArr.forEach((name, i) => {
        const a = (i / directArr.length) * Math.PI * 2 - Math.PI / 2
        const x = cx + Math.cos(a) * directR + Math.sin(t * 0.4 + i) * 2
        const y = cy + Math.sin(a) * directR + Math.cos(t * 0.3 + i) * 2

        // Connection line
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x, y)
        const lineGrad = ctx.createLinearGradient(cx, cy, x, y)
        lineGrad.addColorStop(0, 'rgba(232,67,147,0.3)')
        lineGrad.addColorStop(1, 'rgba(108,92,231,0.3)')
        ctx.strokeStyle = lineGrad; ctx.lineWidth = 2; ctx.stroke()

        // Traveling dot
        const dt = (t * 0.4 + i * 0.3) % 1
        const dx = cx + (x - cx) * dt, dy = cy + (y - cy) * dt
        ctx.beginPath(); ctx.arc(dx, dy, 3, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(232,67,147,0.6)'; ctx.fill()

        // Node
        const nGrad = ctx.createRadialGradient(x, y, 0, x, y, 22)
        nGrad.addColorStop(0, isDark ? '#7c6cf0' : '#6c5ce7')
        nGrad.addColorStop(1, isDark ? '#5a4dcf' : '#4834d4')
        ctx.beginPath(); ctx.arc(x, y, 22, 0, Math.PI * 2); ctx.fillStyle = nGrad; ctx.fill()

        // Shadow
        ctx.shadowColor = 'rgba(108,92,231,0.3)'; ctx.shadowBlur = 12
        ctx.beginPath(); ctx.arc(x, y, 22, 0, Math.PI * 2); ctx.fillStyle = 'transparent'; ctx.fill()
        ctx.shadowBlur = 0

        const firstName = name.split(' ')[0]
        ctx.font = 'bold 10px Inter, system-ui'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillText(firstName, x, y)
      })

      // Target people
      const targetR = Math.min(W, H) * 0.4
      results.forEach((p, i) => {
        const a = (i / results.length) * Math.PI * 2 - Math.PI / 2 + 0.2
        const x = cx + Math.cos(a) * targetR + Math.sin(t * 0.3 + i * 1.5) * 3
        const y = cy + Math.sin(a) * targetR + Math.cos(t * 0.25 + i * 1.2) * 3

        // Find connected direct node
        if (p.connectionPath.length > 1) {
          const dIdx = directArr.indexOf(p.connectionPath[1])
          if (dIdx >= 0) {
            const da = (dIdx / directArr.length) * Math.PI * 2 - Math.PI / 2
            const dx2 = cx + Math.cos(da) * directR + Math.sin(t * 0.4 + dIdx) * 2
            const dy2 = cy + Math.sin(da) * directR + Math.cos(t * 0.3 + dIdx) * 2

            ctx.beginPath(); ctx.moveTo(dx2, dy2); ctx.lineTo(x, y)
            ctx.strokeStyle = lineColor + '0.1)'; ctx.lineWidth = 1; ctx.setLineDash([3, 3]); ctx.stroke(); ctx.setLineDash([])
          }
        }

        // Node
        const col = p.canRefer ? '#00b894' : '#0984e3'
        const nGrad = ctx.createRadialGradient(x, y, 0, x, y, 18)
        nGrad.addColorStop(0, col)
        nGrad.addColorStop(1, p.canRefer ? '#00a381' : '#0773c5')
        ctx.beginPath(); ctx.arc(x, y, 18, 0, Math.PI * 2); ctx.fillStyle = nGrad; ctx.fill()

        ctx.shadowColor = col + '40'; ctx.shadowBlur = 10
        ctx.beginPath(); ctx.arc(x, y, 18, 0, Math.PI * 2); ctx.fill()
        ctx.shadowBlur = 0

        const fn = p.name.split(' ')[0]
        ctx.font = 'bold 9px Inter, system-ui'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillText(fn, x, y)

        ctx.font = '8px Inter, system-ui'; ctx.fillStyle = subtextColor
        ctx.fillText(p.company, x, y + 26)
      })

      // Scan line if searching
      if (searching) {
        const sy = (Math.sin(t * 1.8) * 0.5 + 0.5) * H
        const sg = ctx.createLinearGradient(0, sy - 40, 0, sy + 40)
        sg.addColorStop(0, 'rgba(232,67,147,0)')
        sg.addColorStop(0.5, 'rgba(232,67,147,0.06)')
        sg.addColorStop(1, 'rgba(232,67,147,0)')
        ctx.fillStyle = sg; ctx.fillRect(0, sy - 40, W, 80)
      }

      animRef.current = requestAnimationFrame(animate)
    }
    animate()

    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener('resize', resize) }
  }, [results, searching])

  return <canvas ref={canvasRef} className="w-full h-full block" />
}

/* ─── Main Page ─── */
export default function NetworkPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<NetworkPerson[]>([])
  const [sources, setSources] = useState(NETWORK_SOURCES)
  const [showResults, setShowResults] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [typingText, setTypingText] = useState('')
  const [exampleIdx, setExampleIdx] = useState(0)

  // Typing animation
  useEffect(() => {
    const example = SAMPLE_QUERIES[exampleIdx]
    let ci = 0, dir: 'f' | 'p' | 'b' = 'f', pc = 0
    const iv = setInterval(() => {
      if (dir === 'f') { ci++; setTypingText(example.slice(0, ci)); if (ci >= example.length) dir = 'p' }
      else if (dir === 'p') { pc++; if (pc > 40) { dir = 'b'; pc = 0 } }
      else { ci--; setTypingText(example.slice(0, ci)); if (ci <= 0) { dir = 'f'; setExampleIdx(p => (p + 1) % SAMPLE_QUERIES.length) } }
    }, 45)
    return () => clearInterval(iv)
  }, [exampleIdx])

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setSearching(true); setShowResults(false)
    await new Promise(r => setTimeout(r, 2200))
    setResults(SAMPLE_RESULTS); setShowResults(true); setSearching(false)
  }

  const handleConnect = (id: string) => {
    setSources(prev => prev.map(s => s.id === id ? { ...s, connected: true } : s))
  }

  const connectedCount = sources.filter(s => s.connected).reduce((a, s) => a + s.count, 0)

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="max-w-[1400px] mx-auto space-y-8">

      {/* ─── Hero Section ─── */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative rounded-3xl overflow-hidden p-8 md:p-12"
        style={{ background: 'linear-gradient(135deg, #fdf2f8, #f5f3ff, #eff6ff)', border: '1px solid var(--border)' }}
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-30" style={{ background: 'radial-gradient(circle, rgba(232,67,147,0.15), transparent 70%)', filter: 'blur(40px)' }} />
        <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, rgba(108,92,231,0.15), transparent 70%)', filter: 'blur(40px)' }} />

        <div className="relative grid lg:grid-cols-2 gap-8 items-center">
          <div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold mb-4"
              style={{ background: 'rgba(232,67,147,0.08)', color: '#e84393', border: '1px solid rgba(232,67,147,0.15)' }}
            >
              {icons.zap}
              AI-Powered Referral Engine
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl md:text-4xl font-black leading-tight mb-3"
              style={{ color: 'var(--text)' }}
            >
              Find anyone in your
              <span className="bg-gradient-to-r from-[#e84393] to-[#6c5ce7] bg-clip-text text-transparent"> network </span>
              who can refer you
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-[15px] leading-relaxed mb-6 max-w-lg"
              style={{ color: 'var(--text-secondary)' }}
            >
              Describe who you&apos;re looking for in plain English. Our AI searches across your connected networks to find the best matches with mutual connections who can make introductions.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap gap-6"
            >
              {[
                { value: '20K+', label: 'Network reach' },
                { value: '2nd°', label: 'Connection depth' },
                { value: '94%', label: 'Intro success rate' },
              ].map((stat, i) => (
                <div key={i}>
                  <div className="text-xl font-black" style={{ color: 'var(--text)' }}>{stat.value}</div>
                  <div className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Mini graph preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="hidden lg:block h-[280px] rounded-2xl overflow-hidden"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}
          >
            <NetworkGraph results={[]} searching={false} />
          </motion.div>
        </div>
      </motion.div>

      {/* ─── Search Section ─── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="rounded-2xl p-6 md:p-8" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>
              {icons.sparkle}
            </div>
            <div>
              <h2 className="text-[15px] font-bold" style={{ color: 'var(--text)' }}>AI People Search</h2>
              <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>Describe who you need in natural language</p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder={typingText}
                className="w-full h-12 pl-12 pr-4 rounded-xl text-[14px] theme-input"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-faint)' }}>{icons.search}</span>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSearch}
              disabled={searching || !searchQuery.trim()}
              className="h-12 px-6 rounded-xl font-bold text-[13px] text-white flex items-center gap-2 disabled:opacity-40 shrink-0"
              style={{ background: 'linear-gradient(135deg, #e84393, #d63384)', boxShadow: '0 4px 14px rgba(232,67,147,0.25)' }}
            >
              {searching ? (
                <><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />Searching...</>
              ) : (
                <>{icons.sparkle} Find People</>
              )}
            </motion.button>
          </div>

          {/* Quick queries */}
          <div className="flex flex-wrap gap-2 mt-4">
            {SAMPLE_QUERIES.map((q, i) => (
              <button key={i} onClick={() => setSearchQuery(q)} className="px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200" style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                {q}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ─── Searching Animation ─── */}
      <AnimatePresence>
        {searching && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="rounded-2xl p-10 text-center"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}
          >
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl flex items-center justify-center" style={{ background: 'var(--accent-dim)' }}>
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }} style={{ color: 'var(--accent)' }}>{icons.globe}</motion.div>
            </div>
            <h3 className="text-[16px] font-bold mb-2" style={{ color: 'var(--text)' }}>Scanning your network...</h3>
            <p className="text-[13px] mb-6" style={{ color: 'var(--text-muted)' }}>Finding the best matches across all connected sources</p>
            <div className="flex justify-center gap-8">
              {sources.slice(0, 4).map((s, i) => (
                <motion.div key={s.id} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.25 }} className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${s.color}10`, color: s.color }}>{s.icon}</div>
                  <span className="text-[10px] font-medium" style={{ color: 'var(--text-faint)' }}>{s.name}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Results ─── */}
      <AnimatePresence>
        {showResults && results.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[16px] font-bold" style={{ color: 'var(--text)' }}>{results.length} people found</h2>
                <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>Ranked by relevance and referral potential</p>
              </div>
              <span className="px-3 py-1 rounded-full text-[11px] font-semibold" style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>AI-ranked</span>
            </div>

            {/* Network graph with results */}
            <div className="rounded-2xl overflow-hidden" style={{ height: '340px', background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}>
              <NetworkGraph results={results} searching={false} />
            </div>

            {/* Result cards */}
            <div className="grid gap-3">
              {results.map((person, i) => (
                <motion.div
                  key={person.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                  onClick={() => setExpandedId(expandedId === person.id ? null : person.id)}
                  className="group rounded-2xl p-5 cursor-pointer transition-all duration-300"
                  style={{
                    background: 'var(--bg-card)',
                    border: expandedId === person.id ? '1px solid var(--border-accent)' : '1px solid var(--border)',
                    boxShadow: expandedId === person.id ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
                  }}
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-[14px] font-bold text-white" style={{ background: person.canRefer ? 'linear-gradient(135deg, #00b894, #00a381)' : 'linear-gradient(135deg, #0984e3, #0773c5)' }}>
                        {person.avatar}
                      </div>
                      {person.canRefer && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#00b894] flex items-center justify-center" style={{ border: '2px solid var(--bg-card)', boxShadow: '0 0 6px rgba(0,184,148,0.3)' }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20,6 9,17 4,12"/></svg>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-[14px] font-bold" style={{ color: 'var(--text)' }}>{person.name}</h3>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{
                          background: person.relevance > 90 ? 'rgba(0,184,148,0.08)' : 'rgba(9,132,227,0.08)',
                          color: person.relevance > 90 ? '#00b894' : '#0984e3',
                        }}>
                          {person.relevance}% match
                        </span>
                        {person.canRefer && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: 'rgba(0,184,148,0.08)', color: '#00b894' }}>Can Refer</span>
                        )}
                      </div>
                      <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>{person.role} at <span className="font-semibold" style={{ color: 'var(--purple)' }}>{person.company}</span></p>

                      {/* Connection path */}
                      <div className="flex items-center gap-1.5 mt-3">
                        {person.connectionPath.map((step, j) => (
                          <span key={j} className="flex items-center gap-1.5">
                            <span className="text-[11px] px-2.5 py-1 rounded-lg font-medium" style={{
                              background: j === 0 ? 'var(--accent-dim)' : j === person.connectionPath.length - 1 ? 'var(--green-dim)' : 'var(--purple-dim)',
                              color: j === 0 ? 'var(--accent)' : j === person.connectionPath.length - 1 ? 'var(--green)' : 'var(--purple)',
                            }}>
                              {step}
                            </span>
                            {j < person.connectionPath.length - 1 && (
                              <span style={{ color: 'var(--text-faint)' }}>{icons.arrow}</span>
                            )}
                          </span>
                        ))}
                      </div>

                      <div className="mt-2 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                        <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>{person.mutualCount} mutual</span> — {person.mutualNames.slice(0, 3).join(', ')}{person.mutualNames.length > 3 && ` +${person.mutualNames.length - 3}`}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 shrink-0">
                      {person.canRefer && (
                        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="h-9 px-4 rounded-xl text-[11px] font-bold text-white flex items-center gap-1.5" style={{ background: 'linear-gradient(135deg, #00b894, #00a381)', boxShadow: '0 3px 10px rgba(0,184,148,0.2)' }}>
                          {icons.send} Ask for Referral
                        </motion.button>
                      )}
                      <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="h-9 px-4 rounded-xl text-[11px] font-semibold flex items-center gap-1.5" style={{ background: 'var(--purple-dim)', color: 'var(--purple)', border: '1px solid rgba(108,92,231,0.15)' }}>
                        {icons.link} Get Intro
                      </motion.button>
                    </div>
                  </div>

                  {/* Expanded detail */}
                  <AnimatePresence>
                    {expandedId === person.id && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="pt-4 mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3" style={{ borderTop: '1px solid var(--border)' }}>
                          <div className="rounded-xl p-3" style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border)' }}>
                            <div className="text-[10px] font-medium mb-1" style={{ color: 'var(--text-faint)' }}>Source</div>
                            <div className="text-[13px] font-semibold capitalize flex items-center gap-2" style={{ color: 'var(--text)' }}>
                              <span style={{ color: NETWORK_SOURCES.find(s => s.id === person.source)?.color }}>{NETWORK_SOURCES.find(s => s.id === person.source)?.icon}</span>
                              {person.source}
                            </div>
                          </div>
                          <div className="rounded-xl p-3" style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border)' }}>
                            <div className="text-[10px] font-medium mb-1" style={{ color: 'var(--text-faint)' }}>Relevance</div>
                            <div className="text-[13px] font-bold" style={{ color: 'var(--text)' }}>{person.relevance}%</div>
                            <div className="h-1.5 rounded-full mt-1.5 overflow-hidden" style={{ background: 'var(--border)' }}>
                              <motion.div initial={{ width: 0 }} animate={{ width: `${person.relevance}%` }} transition={{ duration: 0.8 }} className="h-full rounded-full" style={{ background: person.relevance > 90 ? 'linear-gradient(90deg, #00b894, #00a381)' : 'linear-gradient(90deg, #0984e3, #0773c5)' }} />
                            </div>
                          </div>
                          <div className="rounded-xl p-3" style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border)' }}>
                            <div className="text-[10px] font-medium mb-1" style={{ color: 'var(--text-faint)' }}>Depth</div>
                            <div className="text-[13px] font-bold" style={{ color: 'var(--text)' }}>{person.connectionPath.length - 1} degree{person.connectionPath.length - 1 > 1 ? 's' : ''}</div>
                          </div>
                        </div>
                        <div className="mt-3 rounded-xl p-3" style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border)' }}>
                          <div className="text-[10px] font-medium mb-2" style={{ color: 'var(--text-faint)' }}>All Mutual Connections</div>
                          <div className="flex flex-wrap gap-2">
                            {person.mutualNames.map((n, j) => (
                              <span key={j} className="px-2.5 py-1 rounded-lg text-[11px] font-medium" style={{ background: 'var(--purple-dim)', color: 'var(--purple)' }}>{n}</span>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Connect Sources ─── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[16px] font-bold" style={{ color: 'var(--text)' }}>Connect Your Networks</h2>
            <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>More sources = better referral matches</p>
          </div>
          <div className="text-right">
            <div className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>{sources.filter(s => s.connected).length}/{sources.length} connected</div>
            <div className="h-1.5 w-20 rounded-full mt-1 overflow-hidden" style={{ background: 'var(--border)' }}>
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(sources.filter(s => s.connected).length / sources.length) * 100}%`, background: 'linear-gradient(90deg, #e84393, #d63384)' }} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sources.map((source, i) => (
            <motion.div
              key={source.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.06 }}
              className="group rounded-2xl p-5 transition-all duration-300"
              style={{
                background: 'var(--bg-card)',
                border: source.connected ? '1px solid rgba(0,184,148,0.2)' : '1px solid var(--border)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `${source.color}10`, color: source.color }}>
                  {source.icon}
                </div>
                {source.connected && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-[#00b894]" style={{ background: 'rgba(0,184,148,0.08)' }}>
                    {icons.check} Connected
                  </span>
                )}
              </div>

              <h3 className="text-[14px] font-bold mb-0.5" style={{ color: 'var(--text)' }}>{source.name}</h3>
              <p className="text-[12px] mb-4" style={{ color: 'var(--text-muted)' }}>{source.count.toLocaleString()} contacts</p>

              {!source.connected ? (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleConnect(source.id)}
                  className="w-full h-10 rounded-xl text-[12px] font-bold flex items-center justify-center gap-2 text-white transition-all"
                  style={{ background: source.gradient, boxShadow: `0 3px 10px ${source.color}25` }}
                >
                  {icons.link} Connect
                </motion.button>
              ) : (
                <div className="w-full h-10 rounded-xl text-[12px] font-semibold flex items-center justify-center gap-2 text-[#00b894]" style={{ background: 'rgba(0,184,148,0.06)', border: '1px solid rgba(0,184,148,0.1)' }}>
                  {icons.check} Synced {source.count.toLocaleString()} contacts
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Privacy */}
        <div className="mt-4 rounded-xl p-4 flex items-start gap-3" style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border)' }}>
          <span style={{ color: 'var(--text-muted)' }}>{icons.lock}</span>
          <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
            <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>Your data is private.</span> We never share your contacts. Connections are analyzed securely to find referral paths, and you always control who gets contacted.
          </p>
        </div>
      </motion.div>

      {/* ─── How It Works ─── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="rounded-2xl p-8"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
      >
        <div className="text-center mb-8">
          <h2 className="text-xl font-black mb-2" style={{ color: 'var(--text)' }}>How Referral Network Works</h2>
          <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>Four simple steps to land referrals at any company</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { step: '01', title: 'Connect Sources', desc: 'Link your Gmail, LinkedIn, Calendar, and social accounts to build your network map.', color: '#e84393', icon: icons.link },
            { step: '02', title: 'Search in Plain English', desc: 'Type naturally — "Find someone at Google who can refer me for a PM role."', color: '#6c5ce7', icon: icons.search },
            { step: '03', title: 'Discover Paths', desc: 'See exactly who connects you to your target person, with mutual connections highlighted.', color: '#0984e3', icon: icons.people },
            { step: '04', title: 'Get Referred', desc: 'Request warm introductions through mutual connections and track referral status.', color: '#00b894', icon: icons.send },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + i * 0.1 }}
              className="text-center"
            >
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ background: `${item.color}10`, color: item.color }}>
                {item.icon}
              </div>
              <div className="text-[10px] font-black tracking-wider mb-1" style={{ color: item.color }}>{item.step}</div>
              <h3 className="text-[14px] font-bold mb-1.5" style={{ color: 'var(--text)' }}>{item.title}</h3>
              <p className="text-[12px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
