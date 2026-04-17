'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase-browser'
import { staggerContainer, fadeInUp } from '@/lib/animations'

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
}

interface GraphNode {
  id: string
  label: string
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  color: string
  type: 'you' | 'direct' | 'secondary' | 'target'
  connections: string[]
  source?: string
  role?: string
}

/* ─── SVG Icons ─── */
const icons = {
  search: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  ),
  sparkle: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3z" />
    </svg>
  ),
  gmail: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z" stroke="currentColor" strokeWidth="1.5" />
      <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="1.5" fill="none" />
    </svg>
  ),
  linkedin: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452z" />
    </svg>
  ),
  calendar: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  twitter: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  instagram: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  ),
  people: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  connect: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
    </svg>
  ),
  refer: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 2L11 13" />
      <polygon points="22,2 15,22 11,13 2,9" />
    </svg>
  ),
  check: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20,6 9,17 4,12" />
    </svg>
  ),
  graph: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="6" r="2.5" />
      <circle cx="18" cy="6" r="2.5" />
      <circle cx="6" cy="18" r="2.5" />
      <circle cx="18" cy="18" r="2.5" />
      <circle cx="12" cy="12" r="3" />
      <line x1="8" y1="7.5" x2="10" y2="10" />
      <line x1="16" y1="7.5" x2="14" y2="10" />
      <line x1="8" y1="16.5" x2="10" y2="14" />
      <line x1="16" y1="16.5" x2="14" y2="14" />
    </svg>
  ),
  arrow: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12,5 19,12 12,19" />
    </svg>
  ),
}

/* ─── Simulated network sources ─── */
const NETWORK_SOURCES: NetworkSource[] = [
  { id: 'gmail', name: 'Gmail', icon: icons.gmail, count: 847, connected: false, color: '#ea4335' },
  { id: 'linkedin', name: 'LinkedIn', icon: icons.linkedin, count: 2340, connected: false, color: '#0a66c2' },
  { id: 'calendar', name: 'Calendar', icon: icons.calendar, count: 1520, connected: false, color: '#4285f4' },
  { id: 'twitter', name: 'X / Twitter', icon: icons.twitter, count: 12800, connected: false, color: '#ffffff' },
  { id: 'instagram', name: 'Instagram', icon: icons.instagram, count: 3200, connected: false, color: '#e1306c' },
]

/* ─── Sample results (would come from API) ─── */
const SAMPLE_RESULTS: NetworkPerson[] = [
  { id: '1', name: 'Priya Sharma', role: 'Senior Engineering Manager', company: 'Google', avatar: 'PS', mutualCount: 3, mutualNames: ['Rahul Mehta', 'Anita Desai', 'James Chen'], source: 'linkedin', relevance: 97, canRefer: true, connectionPath: ['You', 'Rahul Mehta', 'Priya Sharma'] },
  { id: '2', name: 'Alex Rivera', role: 'Staff Software Engineer', company: 'Meta', avatar: 'AR', mutualCount: 2, mutualNames: ['Sarah Kim', 'David Liu'], source: 'gmail', relevance: 94, canRefer: true, connectionPath: ['You', 'Sarah Kim', 'Alex Rivera'] },
  { id: '3', name: 'Emily Zhang', role: 'Technical Recruiter', company: 'Stripe', avatar: 'EZ', mutualCount: 5, mutualNames: ['Mark Johnson', 'Lisa Wang', 'Tom Brown', 'Amy Lee', 'Chris Park'], source: 'linkedin', relevance: 91, canRefer: false, connectionPath: ['You', 'Mark Johnson', 'Emily Zhang'] },
  { id: '4', name: 'Michael O\'Brien', role: 'VP of Engineering', company: 'Amazon', avatar: 'MO', mutualCount: 1, mutualNames: ['Neha Patel'], source: 'calendar', relevance: 88, canRefer: true, connectionPath: ['You', 'Neha Patel', 'Michael O\'Brien'] },
  { id: '5', name: 'Sakura Tanaka', role: 'Lead Product Manager', company: 'Apple', avatar: 'ST', mutualCount: 4, mutualNames: ['Kevin Wu', 'Rachel Adams', 'Omar Hassan', 'Julia Morales'], source: 'linkedin', relevance: 85, canRefer: true, connectionPath: ['You', 'Kevin Wu', 'Sakura Tanaka'] },
  { id: '6', name: 'Daniel Kim', role: 'Senior Data Scientist', company: 'Netflix', avatar: 'DK', mutualCount: 2, mutualNames: ['Andrew Lee', 'Maria Garcia'], source: 'twitter', relevance: 82, canRefer: true, connectionPath: ['You', 'Andrew Lee', 'Daniel Kim'] },
]

const SAMPLE_QUERIES = [
  'Find someone who can refer me at Google for a senior engineer role',
  'Who in my network knows people at Stripe or Figma?',
  'Connect me with hiring managers in AI/ML at top startups',
  'Find recruiters at FAANG companies through my 2nd-degree network',
]

/* ─── Animation keyframes ─── */
const animationStyles = `
@keyframes network-pulse {
  0%, 100% { transform: scale(1); opacity: 0.6; }
  50% { transform: scale(1.15); opacity: 1; }
}
@keyframes glow-ring {
  0% { box-shadow: 0 0 0 0 rgba(253,121,168,0.4); }
  70% { box-shadow: 0 0 0 12px rgba(253,121,168,0); }
  100% { box-shadow: 0 0 0 0 rgba(253,121,168,0); }
}
@keyframes float-particle {
  0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; }
  25% { transform: translateY(-15px) translateX(5px); opacity: 0.7; }
  50% { transform: translateY(-5px) translateX(-5px); opacity: 0.5; }
  75% { transform: translateY(-20px) translateX(3px); opacity: 0.6; }
}
@keyframes draw-line {
  from { stroke-dashoffset: 100; }
  to { stroke-dashoffset: 0; }
}
@keyframes typing-cursor {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
@keyframes scan-line {
  0% { transform: translateY(-100%); opacity: 0; }
  50% { opacity: 0.6; }
  100% { transform: translateY(100%); opacity: 0; }
}
`

/* ─── Network Graph Component (Canvas) ─── */
function NetworkGraph({ results, searching }: { results: NetworkPerson[]; searching: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animFrameRef = useRef<number>(0)
  const nodesRef = useRef<GraphNode[]>([])
  const timeRef = useRef(0)

  const buildGraph = useCallback((people: NetworkPerson[]) => {
    const nodes: GraphNode[] = []
    const cx = 0, cy = 0

    // Center node = You
    nodes.push({
      id: 'you', label: 'You', x: cx, y: cy, vx: 0, vy: 0,
      radius: 28, color: '#fd79a8', type: 'you', connections: [],
    })

    // Direct connections (1st degree) — extract from connectionPath[1]
    const directSet = new Set<string>()
    people.forEach(p => {
      if (p.connectionPath.length > 1) directSet.add(p.connectionPath[1])
    })

    const directArr = Array.from(directSet)
    directArr.forEach((name, i) => {
      const angle = (i / directArr.length) * Math.PI * 2 - Math.PI / 2
      const dist = 130
      nodes.push({
        id: `d-${name}`, label: name, x: cx + Math.cos(angle) * dist, y: cy + Math.sin(angle) * dist,
        vx: 0, vy: 0, radius: 18, color: '#a29bfe', type: 'direct',
        connections: ['you'], source: 'mutual',
      })
      nodes[0].connections.push(`d-${name}`)
    })

    // Target people (2nd degree)
    people.forEach((p, i) => {
      const angle = (i / people.length) * Math.PI * 2 - Math.PI / 2 + 0.3
      const dist = 260
      const node: GraphNode = {
        id: `t-${p.id}`, label: p.name, x: cx + Math.cos(angle) * dist, y: cy + Math.sin(angle) * dist,
        vx: 0, vy: 0, radius: 15, color: p.canRefer ? '#00b894' : '#74b9ff', type: 'target',
        connections: [], role: p.role, source: p.company,
      }

      // Connect to their mutual (direct) connection
      if (p.connectionPath.length > 1) {
        const directId = `d-${p.connectionPath[1]}`
        node.connections.push(directId)
        const directNode = nodes.find(n => n.id === directId)
        if (directNode) directNode.connections.push(node.id)
      }

      nodes.push(node)
    })

    return nodes
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const W = rect.width
    const H = rect.height

    if (results.length > 0) {
      nodesRef.current = buildGraph(results)
    } else {
      // Default idle graph
      nodesRef.current = [
        { id: 'you', label: 'You', x: 0, y: 0, vx: 0, vy: 0, radius: 28, color: '#fd79a8', type: 'you', connections: ['d1', 'd2', 'd3', 'd4'] },
        { id: 'd1', label: 'Your contacts', x: -110, y: -80, vx: 0, vy: 0, radius: 16, color: '#a29bfe', type: 'direct', connections: ['you'] },
        { id: 'd2', label: 'Colleagues', x: 110, y: -60, vx: 0, vy: 0, radius: 16, color: '#a29bfe', type: 'direct', connections: ['you'] },
        { id: 'd3', label: 'Friends', x: -90, y: 90, vx: 0, vy: 0, radius: 16, color: '#a29bfe', type: 'direct', connections: ['you'] },
        { id: 'd4', label: 'Alumni', x: 120, y: 80, vx: 0, vy: 0, radius: 16, color: '#a29bfe', type: 'direct', connections: ['you'] },
      ]
    }

    const animate = () => {
      timeRef.current += 0.016
      const t = timeRef.current
      ctx.clearRect(0, 0, W, H)

      const nodes = nodesRef.current
      const offsetX = W / 2
      const offsetY = H / 2

      // Subtle floating for nodes
      nodes.forEach((node, i) => {
        if (node.type !== 'you') {
          node.x += Math.sin(t * 0.5 + i * 1.2) * 0.15
          node.y += Math.cos(t * 0.4 + i * 0.9) * 0.12
        }
      })

      // Draw connections
      nodes.forEach(node => {
        node.connections.forEach(targetId => {
          const target = nodes.find(n => n.id === targetId)
          if (!target) return

          const x1 = node.x + offsetX
          const y1 = node.y + offsetY
          const x2 = target.x + offsetX
          const y2 = target.y + offsetY

          // Animated gradient line
          const grad = ctx.createLinearGradient(x1, y1, x2, y2)
          const alpha = 0.15 + Math.sin(t * 2 + nodes.indexOf(node)) * 0.05
          grad.addColorStop(0, node.color + Math.round(alpha * 255).toString(16).padStart(2, '0'))
          grad.addColorStop(1, target.color + Math.round(alpha * 255).toString(16).padStart(2, '0'))

          ctx.beginPath()
          ctx.moveTo(x1, y1)
          ctx.lineTo(x2, y2)
          ctx.strokeStyle = grad
          ctx.lineWidth = 1.5
          ctx.stroke()

          // Traveling particle along the edge
          const particleT = (t * 0.3 + nodes.indexOf(node) * 0.2) % 1
          const px = x1 + (x2 - x1) * particleT
          const py = y1 + (y2 - y1) * particleT
          ctx.beginPath()
          ctx.arc(px, py, 2, 0, Math.PI * 2)
          ctx.fillStyle = node.color + '80'
          ctx.fill()
        })
      })

      // Draw nodes
      nodes.forEach(node => {
        const x = node.x + offsetX
        const y = node.y + offsetY
        const r = node.radius

        // Outer glow
        const glowGrad = ctx.createRadialGradient(x, y, r * 0.5, x, y, r * 2.5)
        glowGrad.addColorStop(0, node.color + '25')
        glowGrad.addColorStop(1, node.color + '00')
        ctx.beginPath()
        ctx.arc(x, y, r * 2.5, 0, Math.PI * 2)
        ctx.fillStyle = glowGrad
        ctx.fill()

        // Pulsing ring for "you" node
        if (node.type === 'you') {
          const pulseR = r + 6 + Math.sin(t * 2) * 4
          ctx.beginPath()
          ctx.arc(x, y, pulseR, 0, Math.PI * 2)
          ctx.strokeStyle = node.color + '40'
          ctx.lineWidth = 2
          ctx.stroke()
        }

        // Node circle
        const nodeGrad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r)
        nodeGrad.addColorStop(0, node.color)
        nodeGrad.addColorStop(1, node.color + 'cc')
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fillStyle = nodeGrad
        ctx.fill()

        // Inner ring
        ctx.beginPath()
        ctx.arc(x, y, r - 2, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(255,255,255,0.2)'
        ctx.lineWidth = 1
        ctx.stroke()

        // Label
        ctx.font = node.type === 'you' ? 'bold 11px Inter, system-ui, sans-serif' : '10px Inter, system-ui, sans-serif'
        ctx.fillStyle = '#ffffff'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'

        if (node.type === 'you') {
          ctx.fillText('YOU', x, y)
        } else if (node.type === 'target') {
          // Name inside, company below
          const firstName = node.label.split(' ')[0]
          ctx.font = 'bold 9px Inter, system-ui, sans-serif'
          ctx.fillText(firstName, x, y - 1)
          if (node.source) {
            ctx.font = '7px Inter, system-ui, sans-serif'
            ctx.fillStyle = 'rgba(255,255,255,0.6)'
            ctx.fillText(node.source, x, y + r + 12)
          }
        } else {
          // Label below node
          ctx.font = '9px Inter, system-ui, sans-serif'
          ctx.fillStyle = 'rgba(255,255,255,0.7)'
          ctx.fillText(node.label, x, y + r + 12)
        }
      })

      // Scanning effect when searching
      if (searching) {
        const scanY = (Math.sin(t * 1.5) * 0.5 + 0.5) * H
        const scanGrad = ctx.createLinearGradient(0, scanY - 30, 0, scanY + 30)
        scanGrad.addColorStop(0, 'rgba(253,121,168,0)')
        scanGrad.addColorStop(0.5, 'rgba(253,121,168,0.08)')
        scanGrad.addColorStop(1, 'rgba(253,121,168,0)')
        ctx.fillStyle = scanGrad
        ctx.fillRect(0, scanY - 30, W, 60)
      }

      animFrameRef.current = requestAnimationFrame(animate)
    }

    animate()

    const handleResize = () => {
      const r = canvas.getBoundingClientRect()
      canvas.width = r.width * dpr
      canvas.height = r.height * dpr
      ctx.scale(dpr, dpr)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(animFrameRef.current)
      window.removeEventListener('resize', handleResize)
    }
  }, [results, searching, buildGraph])

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ display: 'block' }}
    />
  )
}

/* ─── Main Page ─── */
export default function NetworkPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<NetworkPerson[]>([])
  const [sources, setSources] = useState<NetworkSource[]>(NETWORK_SOURCES)
  const [showResults, setShowResults] = useState(false)
  const [selectedPerson, setSelectedPerson] = useState<NetworkPerson | null>(null)
  const [activeTab, setActiveTab] = useState<'search' | 'graph' | 'sources'>('search')
  const [typingExample, setTypingExample] = useState('')
  const [exampleIdx, setExampleIdx] = useState(0)
  const supabase = createClient()

  // Typing animation for placeholder examples
  useEffect(() => {
    const example = SAMPLE_QUERIES[exampleIdx]
    let charIdx = 0
    let direction: 'forward' | 'pause' | 'backward' = 'forward'
    let pauseCount = 0

    const interval = setInterval(() => {
      if (direction === 'forward') {
        charIdx++
        setTypingExample(example.slice(0, charIdx))
        if (charIdx >= example.length) direction = 'pause'
      } else if (direction === 'pause') {
        pauseCount++
        if (pauseCount > 40) { // ~2 seconds
          direction = 'backward'
          pauseCount = 0
        }
      } else {
        charIdx--
        setTypingExample(example.slice(0, charIdx))
        if (charIdx <= 0) {
          direction = 'forward'
          setExampleIdx(prev => (prev + 1) % SAMPLE_QUERIES.length)
        }
      }
    }, 50)

    return () => clearInterval(interval)
  }, [exampleIdx])

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setSearching(true)
    setShowResults(false)

    // Simulate AI search delay
    await new Promise(r => setTimeout(r, 2500))

    setResults(SAMPLE_RESULTS)
    setShowResults(true)
    setSearching(false)
  }

  const handleConnect = (sourceId: string) => {
    setSources(prev => prev.map(s =>
      s.id === sourceId ? { ...s, connected: true } : s
    ))
  }

  const connectedCount = sources.filter(s => s.connected).reduce((sum, s) => sum + s.count, 0)
  const totalPeople = sources.reduce((sum, s) => sum + s.count, 0)

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: animationStyles }} />

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="max-w-[1400px] mx-auto space-y-6"
      >
        {/* ─── Header ─── */}
        <motion.div variants={fadeInUp} className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <span className="p-2 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(253,121,168,0.15), rgba(162,155,254,0.15))' }}>
                {icons.graph}
              </span>
              Referral Network
            </h1>
            <p className="text-[#5a5a6a] text-sm mt-1">
              AI-powered people search — find who in your network can refer you to your dream job
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[11px] text-[#5a5a6a]">Network Size</div>
              <div className="text-lg font-bold text-white">
                {connectedCount > 0 ? connectedCount.toLocaleString() : '—'}
                <span className="text-[11px] text-[#4a4a5a] ml-1">/ {totalPeople.toLocaleString()}</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: connectedCount > 0 ? 'linear-gradient(135deg, rgba(0,184,148,0.15), rgba(0,184,148,0.05))' : 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              {icons.people}
            </div>
          </div>
        </motion.div>

        {/* ─── Tab Switcher ─── */}
        <motion.div variants={fadeInUp} className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          {(['search', 'graph', 'sources'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex-1 py-2.5 px-4 rounded-lg text-[13px] font-medium transition-all duration-200 capitalize"
              style={activeTab === tab ? {
                background: 'linear-gradient(135deg, rgba(253,121,168,0.12), rgba(162,155,254,0.08))',
                color: '#fd79a8',
                boxShadow: '0 0 20px rgba(253,121,168,0.08)',
              } : {
                color: '#5a5a6a',
              }}
            >
              {tab === 'search' ? 'AI People Search' : tab === 'graph' ? 'Network Graph' : 'Connected Sources'}
            </button>
          ))}
        </motion.div>

        {/* ─── AI Search Tab ─── */}
        {activeTab === 'search' && (
          <motion.div variants={fadeInUp} className="space-y-6">
            {/* Search Box */}
            <div
              className="relative rounded-2xl overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #1a1a2e 0%, #141428 100%)',
                border: '1px solid rgba(253,121,168,0.12)',
                boxShadow: '0 0 40px rgba(253,121,168,0.04), 0 20px 60px rgba(0,0,0,0.3)',
              }}
            >
              {/* Animated border glow */}
              <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{
                background: 'linear-gradient(135deg, rgba(253,121,168,0.04), transparent, rgba(162,155,254,0.04))',
              }} />

              <div className="relative p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-[#fd79a8]">{icons.sparkle}</span>
                  <span className="text-[13px] font-semibold text-white/80">Describe who you&apos;re looking for in plain English</span>
                </div>

                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSearch()}
                      placeholder={typingExample}
                      className="w-full h-12 pl-12 pr-4 rounded-xl text-[14px] text-white placeholder-[#3a3a4a] outline-none transition-all duration-200 focus:ring-2 focus:ring-[#fd79a8]/30"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                      }}
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4a4a5a]">{icons.search}</span>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSearch}
                    disabled={searching || !searchQuery.trim()}
                    className="h-12 px-6 rounded-xl font-bold text-[13px] text-white flex items-center gap-2 transition-all duration-200 disabled:opacity-40"
                    style={{
                      background: 'linear-gradient(135deg, #fd79a8, #e84393)',
                      boxShadow: '0 4px 20px rgba(253,121,168,0.3)',
                    }}
                  >
                    {searching ? (
                      <>
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                        Searching...
                      </>
                    ) : (
                      <>
                        {icons.sparkle}
                        Find People
                      </>
                    )}
                  </motion.button>
                </div>

                {/* Quick search chips */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {SAMPLE_QUERIES.slice(0, 3).map((q, i) => (
                    <button
                      key={i}
                      onClick={() => { setSearchQuery(q); }}
                      className="px-3 py-1.5 rounded-lg text-[11px] text-[#6a6a7a] hover:text-[#fd79a8] transition-all duration-200 hover:bg-[rgba(253,121,168,0.06)]"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Searching state */}
            <AnimatePresence>
              {searching && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="rounded-2xl p-8 text-center"
                  style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #141428 100%)', border: '1px solid rgba(253,121,168,0.08)' }}
                >
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: 'rgba(253,121,168,0.1)', animation: 'glow-ring 1.5s ease-in-out infinite' }}>
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} className="text-[#fd79a8]">{icons.graph}</motion.div>
                  </div>
                  <h3 className="text-white font-semibold mb-1">Scanning your network...</h3>
                  <p className="text-[#5a5a6a] text-sm">Searching across connected sources for the best matches</p>
                  <div className="flex justify-center gap-6 mt-4">
                    {sources.filter(s => s.connected || true).slice(0, 4).map((s, i) => (
                      <motion.div
                        key={s.id}
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
                        className="flex flex-col items-center gap-1"
                      >
                        <span style={{ color: s.color }}>{s.icon}</span>
                        <span className="text-[10px] text-[#4a4a5a]">{s.name}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Results */}
            <AnimatePresence>
              {showResults && results.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-[15px] font-semibold text-white">
                      {results.length} matches found
                      <span className="text-[#5a5a6a] font-normal ml-2">across your network</span>
                    </h2>
                    <span className="text-[11px] px-2.5 py-1 rounded-full text-[#fd79a8]" style={{ background: 'rgba(253,121,168,0.1)' }}>
                      AI-ranked by relevance
                    </span>
                  </div>

                  <div className="grid gap-3">
                    {results.map((person, i) => (
                      <motion.div
                        key={person.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                        onClick={() => setSelectedPerson(selectedPerson?.id === person.id ? null : person)}
                        className="group relative rounded-xl p-4 cursor-pointer transition-all duration-300 hover:translate-y-[-2px]"
                        style={{
                          background: selectedPerson?.id === person.id
                            ? 'linear-gradient(135deg, rgba(253,121,168,0.08), rgba(162,155,254,0.05))'
                            : 'linear-gradient(135deg, #1c1c2e 0%, #16162a 100%)',
                          border: selectedPerson?.id === person.id
                            ? '1px solid rgba(253,121,168,0.2)'
                            : '1px solid rgba(255,255,255,0.06)',
                          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                        }}
                      >
                        <div className="flex items-start gap-4">
                          {/* Avatar */}
                          <div className="relative shrink-0">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center text-[14px] font-bold text-white" style={{
                              background: `linear-gradient(135deg, ${person.canRefer ? '#00b894' : '#74b9ff'}, ${person.canRefer ? '#00a381' : '#0984e3'})`,
                            }}>
                              {person.avatar}
                            </div>
                            {person.canRefer && (
                              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#00b894] flex items-center justify-center" style={{ boxShadow: '0 0 8px rgba(0,184,148,0.5)', border: '2px solid #16162a' }}>
                                {icons.check}
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-[14px] font-semibold text-white">{person.name}</h3>
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{
                                background: `rgba(${person.relevance > 90 ? '0,184,148' : person.relevance > 80 ? '116,185,255' : '162,155,254'},0.12)`,
                                color: person.relevance > 90 ? '#00b894' : person.relevance > 80 ? '#74b9ff' : '#a29bfe',
                              }}>
                                {person.relevance}% match
                              </span>
                              {person.canRefer && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[rgba(0,184,148,0.1)] text-[#00b894] font-semibold">
                                  Can Refer
                                </span>
                              )}
                            </div>
                            <p className="text-[12px] text-[#6a6a7a] mt-0.5">{person.role} at <span className="text-[#a29bfe]">{person.company}</span></p>

                            {/* Connection Path */}
                            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                              {person.connectionPath.map((step, j) => (
                                <span key={j} className="flex items-center gap-1.5">
                                  <span className="text-[11px] px-2 py-0.5 rounded-md" style={{
                                    background: j === 0 ? 'rgba(253,121,168,0.12)' : j === person.connectionPath.length - 1 ? 'rgba(0,184,148,0.12)' : 'rgba(162,155,254,0.12)',
                                    color: j === 0 ? '#fd79a8' : j === person.connectionPath.length - 1 ? '#00b894' : '#a29bfe',
                                  }}>
                                    {step}
                                  </span>
                                  {j < person.connectionPath.length - 1 && (
                                    <span className="text-[#3a3a4a]">{icons.arrow}</span>
                                  )}
                                </span>
                              ))}
                            </div>

                            {/* Mutual connections */}
                            <div className="mt-2 text-[11px] text-[#4a4a5a]">
                              <span className="text-[#6a6a7a]">{person.mutualCount} mutual</span> — {person.mutualNames.slice(0, 3).join(', ')}{person.mutualNames.length > 3 && ` +${person.mutualNames.length - 3} more`}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex flex-col gap-2 shrink-0">
                            {person.canRefer && (
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="h-8 px-3 rounded-lg text-[11px] font-bold text-white flex items-center gap-1.5"
                                style={{ background: 'linear-gradient(135deg, #00b894, #00a381)', boxShadow: '0 4px 12px rgba(0,184,148,0.2)' }}
                              >
                                {icons.refer}
                                Ask for Referral
                              </motion.button>
                            )}
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="h-8 px-3 rounded-lg text-[11px] font-semibold text-[#a29bfe] flex items-center gap-1.5 hover:bg-[rgba(162,155,254,0.08)] transition-colors"
                              style={{ border: '1px solid rgba(162,155,254,0.15)' }}
                            >
                              {icons.connect}
                              Get Intro
                            </motion.button>
                          </div>
                        </div>

                        {/* Expanded detail */}
                        <AnimatePresence>
                          {selectedPerson?.id === person.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="pt-4 mt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                  <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                                    <div className="text-[10px] text-[#4a4a5a] mb-1">Source</div>
                                    <div className="text-[13px] text-white capitalize flex items-center gap-2">
                                      <span style={{ color: NETWORK_SOURCES.find(s => s.id === person.source)?.color }}>{NETWORK_SOURCES.find(s => s.id === person.source)?.icon}</span>
                                      {person.source}
                                    </div>
                                  </div>
                                  <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                                    <div className="text-[10px] text-[#4a4a5a] mb-1">Relevance Score</div>
                                    <div className="text-[13px] text-white font-semibold">{person.relevance}%</div>
                                    <div className="h-1.5 rounded-full mt-1.5 overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                                      <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${person.relevance}%` }}
                                        transition={{ duration: 0.8 }}
                                        className="h-full rounded-full"
                                        style={{ background: person.relevance > 90 ? 'linear-gradient(90deg, #00b894, #00a381)' : 'linear-gradient(90deg, #74b9ff, #0984e3)' }}
                                      />
                                    </div>
                                  </div>
                                  <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                                    <div className="text-[10px] text-[#4a4a5a] mb-1">Connection Depth</div>
                                    <div className="text-[13px] text-white">{person.connectionPath.length - 1} degree{person.connectionPath.length - 1 > 1 ? 's' : ''}</div>
                                  </div>
                                </div>

                                <div className="mt-3 rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                                  <div className="text-[10px] text-[#4a4a5a] mb-2">All Mutual Connections</div>
                                  <div className="flex flex-wrap gap-2">
                                    {person.mutualNames.map((name, j) => (
                                      <span key={j} className="px-2 py-1 rounded-md text-[11px] text-[#a29bfe]" style={{ background: 'rgba(162,155,254,0.08)', border: '1px solid rgba(162,155,254,0.1)' }}>
                                        {name}
                                      </span>
                                    ))}
                                  </div>
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

            {/* Empty state when no search */}
            {!showResults && !searching && (
              <motion.div
                variants={fadeInUp}
                className="rounded-2xl p-8 text-center"
                style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #141428 100%)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: 'rgba(253,121,168,0.08)' }}>
                  <span className="text-[#fd79a8] opacity-60" style={{ transform: 'scale(2)' }}>{icons.people}</span>
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">Your Referral Network Awaits</h3>
                <p className="text-[#5a5a6a] text-sm max-w-md mx-auto">
                  Connect your accounts and describe who you&apos;re looking for. Our AI will search across your entire network to find the best people who can refer you to your dream job.
                </p>
                <div className="flex flex-wrap justify-center gap-4 mt-6">
                  {sources.slice(0, 4).map(s => (
                    <div key={s.id} className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <span style={{ color: s.color }}>{s.icon}</span>
                      <span className="text-[12px] text-[#5a5a6a]">{s.count.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ─── Network Graph Tab ─── */}
        {activeTab === 'graph' && (
          <motion.div variants={fadeInUp}>
            <div
              className="rounded-2xl overflow-hidden relative"
              style={{
                background: 'linear-gradient(135deg, #0c0c1e 0%, #080818 100%)',
                border: '1px solid rgba(253,121,168,0.08)',
                height: '520px',
              }}
            >
              {/* Graph legend */}
              <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                {[
                  { color: '#fd79a8', label: 'You' },
                  { color: '#a29bfe', label: '1st Degree' },
                  { color: '#00b894', label: 'Can Refer' },
                  { color: '#74b9ff', label: '2nd Degree' },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2 px-2 py-1 rounded-md" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}>
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color, boxShadow: `0 0 6px ${item.color}60` }} />
                    <span className="text-[10px] text-[#6a6a7a]">{item.label}</span>
                  </div>
                ))}
              </div>

              {/* Stats overlay */}
              <div className="absolute top-4 right-4 z-10 text-right">
                <div className="px-3 py-2 rounded-lg" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="text-[10px] text-[#5a5a6a]">Network Nodes</div>
                  <div className="text-[16px] font-bold text-white">
                    {results.length > 0 ? nodesCount(results) : 9}
                  </div>
                </div>
              </div>

              <NetworkGraph results={results} searching={searching} />

              {/* Instruction overlay when no results */}
              {results.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center" style={{ marginTop: '160px' }}>
                    <p className="text-[12px] text-[#3a3a4a]">Search for people to see your network graph expand</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ─── Sources Tab ─── */}
        {activeTab === 'sources' && (
          <motion.div variants={fadeInUp} className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[15px] font-semibold text-white">Connect Your Networks</h2>
                <p className="text-[12px] text-[#5a5a6a] mt-0.5">The more sources you connect, the better referrals we can find</p>
              </div>
              <div className="text-right">
                <div className="text-[11px] text-[#5a5a6a]">{sources.filter(s => s.connected).length} of {sources.length} connected</div>
                <div className="h-1.5 w-24 rounded-full mt-1 overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div className="h-full rounded-full transition-all duration-500" style={{
                    width: `${(sources.filter(s => s.connected).length / sources.length) * 100}%`,
                    background: 'linear-gradient(90deg, #fd79a8, #e84393)',
                  }} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sources.map((source, i) => (
                <motion.div
                  key={source.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="group rounded-xl p-5 transition-all duration-300"
                  style={{
                    background: source.connected
                      ? 'linear-gradient(135deg, rgba(0,184,148,0.06), rgba(0,184,148,0.02))'
                      : 'linear-gradient(135deg, #1c1c2e 0%, #16162a 100%)',
                    border: source.connected
                      ? '1px solid rgba(0,184,148,0.15)'
                      : '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{
                      background: `${source.color}15`,
                      color: source.color,
                    }}>
                      {source.icon}
                    </div>
                    {source.connected && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold text-[#00b894]" style={{ background: 'rgba(0,184,148,0.1)' }}>
                        {icons.check} Connected
                      </span>
                    )}
                  </div>

                  <h3 className="text-[14px] font-semibold text-white mb-1">{source.name}</h3>
                  <p className="text-[12px] text-[#5a5a6a] mb-4">
                    {source.count.toLocaleString()} contacts available
                  </p>

                  {!source.connected ? (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleConnect(source.id)}
                      className="w-full h-9 rounded-lg text-[12px] font-bold flex items-center justify-center gap-2 transition-all duration-200"
                      style={{
                        background: `${source.color}20`,
                        color: source.color,
                        border: `1px solid ${source.color}30`,
                      }}
                    >
                      {icons.connect}
                      Connect {source.name}
                    </motion.button>
                  ) : (
                    <div className="w-full h-9 rounded-lg text-[12px] font-semibold flex items-center justify-center gap-2 text-[#00b894]" style={{ background: 'rgba(0,184,148,0.06)' }}>
                      {icons.check}
                      Synced {source.count.toLocaleString()} contacts
                    </div>
                  )}
                </motion.div>
              ))}

              {/* More sources coming soon */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: sources.length * 0.08 }}
                className="rounded-xl p-5 flex flex-col items-center justify-center text-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.02), transparent)',
                  border: '1px dashed rgba(255,255,255,0.08)',
                  minHeight: '180px',
                }}
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center mb-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <span className="text-[#3a3a4a] text-xl">+</span>
                </div>
                <span className="text-[13px] text-[#4a4a5a] font-medium">More sources</span>
                <span className="text-[11px] text-[#3a3a4a] mt-1">Coming soon</span>
              </motion.div>
            </div>

            {/* Privacy notice */}
            <div className="rounded-xl p-4 flex items-start gap-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#6a6a7a] shrink-0 mt-0.5">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
              <div>
                <p className="text-[12px] text-[#6a6a7a]">
                  <span className="font-semibold text-[#8a8a9a]">Your data is private.</span> We never share your contacts or network data with anyone. Connections are analyzed securely to find referral paths, and you always control who gets contacted.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ─── How It Works Section (always visible at bottom) ─── */}
        <motion.div variants={fadeInUp}>
          <div className="rounded-2xl p-6" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #141428 100%)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <h3 className="text-[14px] font-semibold text-white mb-4">How Referral Network Works</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { step: '01', title: 'Connect Sources', desc: 'Link your Gmail, LinkedIn, Calendar and social accounts', color: '#fd79a8' },
                { step: '02', title: 'Search in Plain English', desc: 'Describe who you need — AI understands context and intent', color: '#a29bfe' },
                { step: '03', title: 'Discover Paths', desc: 'See exactly who connects you to your target person', color: '#74b9ff' },
                { step: '04', title: 'Get Referred', desc: 'Request introductions through mutual connections', color: '#00b894' },
              ].map((item, i) => (
                <div key={i} className="flex gap-3">
                  <div className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold" style={{ background: `${item.color}15`, color: item.color }}>
                    {item.step}
                  </div>
                  <div>
                    <h4 className="text-[12px] font-semibold text-white">{item.title}</h4>
                    <p className="text-[11px] text-[#4a4a5a] mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </>
  )
}

function nodesCount(results: NetworkPerson[]): number {
  const directs = new Set<string>()
  results.forEach(p => {
    if (p.connectionPath.length > 1) directs.add(p.connectionPath[1])
  })
  return 1 + directs.size + results.length // you + directs + targets
}
