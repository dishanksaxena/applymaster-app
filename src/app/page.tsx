'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'

// ===== PARTICLE CANVAS BACKGROUND =====
function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    let mouse = { x: -1000, y: -1000 }
    const particles: { x: number; y: number; vx: number; vy: number; size: number; opacity: number; color: string }[] = []
    const colors = ['#fd79a8', '#a29bfe', '#74b9ff', '#00b894', '#fdcb6e']

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // Create particles
    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.5 + 0.1,
        color: colors[Math.floor(Math.random() * colors.length)],
      })
    }

    const handleMouse = (e: MouseEvent) => { mouse = { x: e.clientX, y: e.clientY } }
    window.addEventListener('mousemove', handleMouse)

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particles.forEach((p, i) => {
        // Mouse repulsion
        const dx = p.x - mouse.x
        const dy = p.y - mouse.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 150) {
          const force = (150 - dist) / 150
          p.vx += (dx / dist) * force * 0.2
          p.vy += (dy / dist) * force * 0.2
        }

        p.x += p.vx
        p.y += p.vy
        p.vx *= 0.99
        p.vy *= 0.99

        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.globalAlpha = p.opacity
        ctx.fill()

        // Draw connections
        particles.forEach((p2, j) => {
          if (j <= i) return
          const d = Math.sqrt((p.x - p2.x) ** 2 + (p.y - p2.y) ** 2)
          if (d < 120) {
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.strokeStyle = p.color
            ctx.globalAlpha = (1 - d / 120) * 0.08
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        })
      })
      ctx.globalAlpha = 1
      animId = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', handleMouse)
    }
  }, [])

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" />
}

// ===== MAGNETIC CURSOR =====
function MagneticCursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const pos = useRef({ x: 0, y: 0 })
  const target = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const move = (e: MouseEvent) => { target.current = { x: e.clientX, y: e.clientY } }
    window.addEventListener('mousemove', move)

    const animate = () => {
      pos.current.x += (target.current.x - pos.current.x) * 0.12
      pos.current.y += (target.current.y - pos.current.y) * 0.12
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${target.current.x - 4}px, ${target.current.y - 4}px)`
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${pos.current.x - 20}px, ${pos.current.y - 20}px)`
      }
      requestAnimationFrame(animate)
    }
    animate()

    return () => window.removeEventListener('mousemove', move)
  }, [])

  return (
    <>
      <div ref={dotRef} className="fixed top-0 left-0 w-2 h-2 rounded-full bg-accent-pink z-[9999] pointer-events-none mix-blend-difference hidden md:block" />
      <div ref={ringRef} className="fixed top-0 left-0 w-10 h-10 rounded-full border border-accent-pink/30 z-[9998] pointer-events-none mix-blend-difference hidden md:block transition-[width,height] duration-300" />
    </>
  )
}

// ===== 3D TILT CARD =====
function Tilt3D({ children, className = '', intensity = 15 }: { children: React.ReactNode; className?: string; intensity?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [style, setStyle] = useState({})

  const handleMove = (e: React.MouseEvent) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    setStyle({
      transform: `perspective(1000px) rotateY(${x * intensity}deg) rotateX(${-y * intensity}deg) scale3d(1.02,1.02,1.02)`,
      transition: 'transform 0.1s ease',
    })
  }

  const handleLeave = () => {
    setStyle({ transform: 'perspective(1000px) rotateY(0deg) rotateX(0deg) scale3d(1,1,1)', transition: 'transform 0.5s ease' })
  }

  return (
    <div ref={ref} onMouseMove={handleMove} onMouseLeave={handleLeave} style={style} className={className}>
      {children}
    </div>
  )
}

// ===== SCROLL-TRIGGERED COUNTER =====
function AnimatedCounter({ end, suffix = '', prefix = '', duration = 2500 }: { end: number; suffix?: string; prefix?: string; duration?: number }) {
  const [value, setValue] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)

  useEffect(() => {
    if (!ref.current) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true
        const start = performance.now()
        const step = (now: number) => {
          const p = Math.min((now - start) / duration, 1)
          const eased = 1 - Math.pow(1 - p, 4)
          setValue(Math.floor(eased * end))
          if (p < 1) requestAnimationFrame(step)
        }
        requestAnimationFrame(step)
      }
    }, { threshold: 0.5 })
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [end, duration])

  return <span ref={ref}>{prefix}{value.toLocaleString()}{suffix}</span>
}

// ===== TYPING HERO TEXT =====
function TypeWriter({ words }: { words: string[] }) {
  const [idx, setIdx] = useState(0)
  const [text, setText] = useState('')
  const [del, setDel] = useState(false)

  useEffect(() => {
    const word = words[idx]
    const speed = del ? 35 : 70
    const timer = setTimeout(() => {
      if (!del) {
        setText(word.slice(0, text.length + 1))
        if (text === word) setTimeout(() => setDel(true), 2000)
      } else {
        setText(word.slice(0, text.length - 1))
        if (text === '') { setDel(false); setIdx((i) => (i + 1) % words.length) }
      }
    }, speed)
    return () => clearTimeout(timer)
  }, [text, del, idx, words])

  // Find the longest word to use as invisible spacer
  const longest = words.reduce((a, b) => a.length > b.length ? a : b, '')

  return (
    <span className="relative inline-block">
      {/* Invisible ghost text reserves space for the longest word */}
      <span className="invisible" aria-hidden="true">{longest}</span>
      {/* Actual animated text overlaid on top — force gradient text visible */}
      <span className="absolute left-0 top-0 bg-gradient-to-r from-[#fd79a8] via-[#e84393] to-[#d63031] bg-clip-text text-transparent">{text}<span className="animate-pulse text-[#fd79a8]" style={{ WebkitTextFillColor: '#fd79a8' }}>|</span></span>
    </span>
  )
}

// ===== SCROLL REVEAL =====
function Reveal({ children, className = '', delay = 0, direction = 'up' }: { children: React.ReactNode; className?: string; delay?: number; direction?: 'up' | 'left' | 'right' | 'scale' }) {
  const ref = useRef<HTMLDivElement>(null)
  const [vis, setVis] = useState(false)

  useEffect(() => {
    if (!ref.current) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true) }, { threshold: 0.1, rootMargin: '-30px' })
    obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  const base = 'transition-all duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)]'
  const hidden = direction === 'up' ? 'opacity-0 translate-y-16' : direction === 'left' ? 'opacity-0 -translate-x-16' : direction === 'right' ? 'opacity-0 translate-x-16' : 'opacity-0 scale-90'
  const shown = 'opacity-100 translate-y-0 translate-x-0 scale-100'

  return (
    <div ref={ref} className={`${base} ${vis ? shown : hidden} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  )
}

// ===== LIVE FEED =====
function LiveActivityFeed() {
  const [lines, setLines] = useState<{ time: string; msg: string; type: string }[]>([])
  const ref = useRef<HTMLDivElement>(null)

  const msgs = useMemo(() => [
    { msg: '→ Scanning LinkedIn for Senior Engineer roles...', type: 'dim' },
    { msg: '✦ Found 8 new matches above 85% threshold', type: 'success' },
    { msg: '◈ Analyzing: Senior AI Engineer at Google — Match: 96%', type: 'pink' },
    { msg: '→ Tailoring resume: restructuring skills, adding keywords...', type: 'dim' },
    { msg: '✓ Resume optimized — ATS Score: 97/100', type: 'success' },
    { msg: '→ Generating cover letter with 5 company-specific data points...', type: 'dim' },
    { msg: '✦ Application submitted to Google DeepMind', type: 'success' },
    { msg: '◈ Analyzing: ML Platform Lead at Meta — Match: 94%', type: 'pink' },
    { msg: '✓ Application submitted to Meta', type: 'success' },
    { msg: '✗ Skipping Junior Dev at Acme — 42% match, below threshold', type: 'warn' },
    { msg: '◈ Analyzing: Staff Engineer at Stripe — Match: 92%', type: 'pink' },
    { msg: '→ Answering 3 screening questions automatically...', type: 'dim' },
    { msg: '✦ Application submitted to Stripe', type: 'success' },
    { msg: '◆ Daily progress: 12 sent, 38 in queue, 3 interviews scheduled', type: 'blue' },
  ], [])

  useEffect(() => {
    let i = 0
    setLines(msgs.slice(0, 4).map((m, j) => ({ time: `14:3${j}:0${j * 2}`, ...m })))
    const iv = setInterval(() => {
      i = (i + 1) % msgs.length
      const t = new Date().toTimeString().split(' ')[0]
      setLines(prev => [...prev.slice(-7), { time: t, ...msgs[i] }])
    }, 2500)
    return () => clearInterval(iv)
  }, [msgs])

  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight }, [lines])

  const colorMap: Record<string, string> = { success: 'text-[#00b894]', pink: 'text-[#fd79a8]', blue: 'text-[#74b9ff]', warn: 'text-[#fdcb6e]', dim: 'text-[#5a5a6a]' }

  return (
    <div ref={ref} className="font-mono text-[11px] leading-relaxed space-y-1 max-h-[180px] overflow-y-auto scrollbar-hide">
      {lines.map((l, i) => (
        <div key={i} className="flex gap-3 animate-fade-in">
          <span className="text-[#3a3a4a] shrink-0 select-none">{l.time}</span>
          <span className={colorMap[l.type] || 'text-[#8a8a9a]'}>{l.msg}</span>
        </div>
      ))}
    </div>
  )
}

// ===== FAQ =====
function FAQ({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="group border border-[rgba(255,255,255,0.06)] rounded-xl overflow-hidden hover:border-[rgba(253,121,168,0.2)] transition-colors duration-300">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-6 text-left">
        <span className="font-semibold text-[15px] pr-4">{q}</span>
        <span className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all duration-300 ${open ? 'bg-[#fd79a8] text-white rotate-45' : 'bg-[rgba(255,255,255,0.04)] text-[#8a8a9a]'}`}>+</span>
      </button>
      <div className={`overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${open ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <p className="px-6 pb-6 text-sm text-[#8a8a9a] leading-relaxed">{a}</p>
      </div>
    </div>
  )
}

// ===== GLOWING BUTTON =====
function GlowButton({ children, href = '#', size = 'lg', variant = 'primary' }: { children: React.ReactNode; href?: string; size?: 'sm' | 'lg'; variant?: 'primary' | 'glass' }) {
  const ref = useRef<HTMLAnchorElement>(null)
  const [glow, setGlow] = useState({ x: 0, y: 0 })

  const handleMove = (e: React.MouseEvent) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    setGlow({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }

  const base = size === 'lg' ? 'px-8 py-4 text-[15px]' : 'px-6 py-3 text-sm'

  if (variant === 'glass') {
    return (
      <a href={href} className={`relative inline-flex items-center gap-2 ${base} rounded-full font-bold border border-[rgba(255,255,255,0.1)] text-white/80 overflow-hidden group transition-all hover:border-[rgba(255,255,255,0.2)] hover:translate-y-[-2px]`}>
        <span className="absolute inset-0 bg-white/[0.02] group-hover:bg-white/[0.05] transition-colors" />
        <span className="relative z-10 flex items-center gap-2">{children}</span>
      </a>
    )
  }

  return (
    <a ref={ref} href={href} onMouseMove={handleMove} className={`relative inline-flex items-center gap-2 ${base} rounded-full font-bold text-white overflow-hidden group transition-all hover:translate-y-[-2px] hover:shadow-[0_8px_40px_rgba(253,121,168,0.4)]`}>
      <span className="absolute inset-0 bg-gradient-to-r from-[#fd79a8] to-[#e84393]" />
      <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: `radial-gradient(circle 80px at ${glow.x}px ${glow.y}px, rgba(255,255,255,0.25), transparent)` }} />
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </a>
  )
}

// ===== GRADIENT MESH BG =====
function GradientMesh() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      <div className="absolute -top-[40%] -right-[20%] w-[800px] h-[800px] rounded-full opacity-[0.07]" style={{ background: 'radial-gradient(circle, #fd79a8, transparent 70%)', animation: 'float 20s ease-in-out infinite' }} />
      <div className="absolute -bottom-[30%] -left-[15%] w-[700px] h-[700px] rounded-full opacity-[0.05]" style={{ background: 'radial-gradient(circle, #a29bfe, transparent 70%)', animation: 'float 25s ease-in-out infinite reverse' }} />
      <div className="absolute top-[30%] left-[40%] w-[600px] h-[600px] rounded-full opacity-[0.04]" style={{ background: 'radial-gradient(circle, #74b9ff, transparent 70%)', animation: 'float 18s ease-in-out infinite', animationDelay: '-5s' }} />
    </div>
  )
}

// ===== FEATURE CARD =====
function FeatureCard({ icon, title, desc, color, chips, index }: { icon: string; title: string; desc: string; color: string; chips: string[]; index: number }) {
  const colorMap: Record<string, { border: string; bg: string; text: string; glow: string }> = {
    pink: { border: 'hover:border-[rgba(253,121,168,0.3)]', bg: 'bg-[rgba(253,121,168,0.08)]', text: 'text-[#fd79a8]', glow: 'group-hover:shadow-[0_0_60px_rgba(253,121,168,0.08)]' },
    green: { border: 'hover:border-[rgba(0,184,148,0.3)]', bg: 'bg-[rgba(0,184,148,0.08)]', text: 'text-[#00b894]', glow: 'group-hover:shadow-[0_0_60px_rgba(0,184,148,0.08)]' },
    blue: { border: 'hover:border-[rgba(116,185,255,0.3)]', bg: 'bg-[rgba(116,185,255,0.08)]', text: 'text-[#74b9ff]', glow: 'group-hover:shadow-[0_0_60px_rgba(116,185,255,0.08)]' },
    purple: { border: 'hover:border-[rgba(162,155,254,0.3)]', bg: 'bg-[rgba(162,155,254,0.08)]', text: 'text-[#a29bfe]', glow: 'group-hover:shadow-[0_0_60px_rgba(162,155,254,0.08)]' },
    yellow: { border: 'hover:border-[rgba(253,203,110,0.3)]', bg: 'bg-[rgba(253,203,110,0.08)]', text: 'text-[#fdcb6e]', glow: 'group-hover:shadow-[0_0_60px_rgba(253,203,110,0.08)]' },
  }
  const c = colorMap[color] || colorMap.pink

  return (
    <Reveal delay={index * 80}>
      <Tilt3D intensity={8}>
        <div className={`group relative h-full p-7 rounded-2xl bg-[#12121a] border border-[rgba(255,255,255,0.06)] ${c.border} ${c.glow} transition-all duration-500 hover:translate-y-[-6px] overflow-hidden`}>
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-[60px]" style={{ background: color === 'pink' ? '#fd79a8' : color === 'green' ? '#00b894' : color === 'blue' ? '#74b9ff' : color === 'purple' ? '#a29bfe' : '#fdcb6e' }} />
          <div className={`relative z-10 w-12 h-12 rounded-xl ${c.bg} flex items-center justify-center text-2xl mb-5`}>{icon}</div>
          <h3 className="relative z-10 text-[17px] font-bold tracking-tight mb-3">{title}</h3>
          <p className="relative z-10 text-[13px] text-[#8a8a9a] leading-relaxed mb-5">{desc}</p>
          <div className="relative z-10 flex flex-wrap gap-2">
            {chips.map(ch => (
              <span key={ch} className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${c.bg} ${c.text}`}>{ch}</span>
            ))}
          </div>
        </div>
      </Tilt3D>
    </Reveal>
  )
}

// ===== MAIN PAGE =====
export default function Home() {
  const [scrolled, setScrolled] = useState(false)
  const [scrollY, setScrollY] = useState(0)
  const [mobileMenu, setMobileMenu] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    // Check auth state
    const checkAuth = async () => {
      try {
        const { createClient } = await import('@/lib/supabase-browser')
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) setIsLoggedIn(true)
      } catch { /* ignore */ }
    }
    checkAuth()
  }, [])
  const [billing, setBilling] = useState<'mo' | 'yr'>('mo')
  const heroRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => { setScrolled(window.scrollY > 30); setScrollY(window.scrollY) }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="relative cursor-none md:cursor-none">
      <MagneticCursor />
      <ParticleField />
      <GradientMesh />

      {/* Grid overlay */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.025]" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)',
        backgroundSize: '80px 80px',
      }} />

      {/* ===== NAVBAR ===== */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-[#0a0a0f]/70 backdrop-blur-2xl border-b border-[rgba(255,255,255,0.04)] shadow-[0_4px_30px_rgba(0,0,0,0.3)]' : ''}`}>
        <div className="max-w-[1320px] mx-auto px-6 lg:px-8 flex items-center justify-between h-[76px]">
          <a href="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[#fd79a8] to-[#e84393] flex items-center justify-center text-white font-black text-[13px] overflow-hidden">
              AM
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </div>
            <span className="text-[19px] font-extrabold tracking-tight">Apply<span className="text-[#fd79a8]">Master</span></span>
          </a>

          <div className="hidden lg:flex items-center gap-10">
            {['Features', 'How It Works', 'Pricing', 'FAQ'].map(l => (
              <a key={l} href={`#${l.toLowerCase().replace(/ /g, '-')}`} className="relative text-[13px] font-medium text-[#8a8a9a] hover:text-white transition-colors duration-300 group">
                {l}
                <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-[#fd79a8] group-hover:w-full transition-all duration-300" />
              </a>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-4">
            {isLoggedIn ? (
              <GlowButton href="/dashboard" size="sm">Go to Dashboard →</GlowButton>
            ) : (
              <>
                <a href="/login" className="text-[13px] font-semibold text-[#8a8a9a] hover:text-white transition-colors px-4 py-2">Log In</a>
                <GlowButton href="/signup" size="sm">Start Free</GlowButton>
              </>
            )}
          </div>

          <button onClick={() => setMobileMenu(!mobileMenu)} className="lg:hidden p-2" aria-label="Menu">
            <div className="space-y-1.5">
              <span className={`block w-6 h-0.5 bg-white transition-all duration-300 ${mobileMenu ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`block w-6 h-0.5 bg-white transition-all duration-300 ${mobileMenu ? 'opacity-0' : ''}`} />
              <span className={`block w-6 h-0.5 bg-white transition-all duration-300 ${mobileMenu ? '-rotate-45 -translate-y-2' : ''}`} />
            </div>
          </button>
        </div>
        {mobileMenu && (
          <div className="lg:hidden bg-[#0e0e16]/95 backdrop-blur-2xl border-t border-[rgba(255,255,255,0.04)] p-8 space-y-6 animate-fade-in">
            {['Features', 'How It Works', 'Pricing', 'FAQ'].map(l => (
              <a key={l} href={`#${l.toLowerCase().replace(/ /g, '-')}`} onClick={() => setMobileMenu(false)} className="block text-lg font-semibold text-[#8a8a9a] hover:text-white">{l}</a>
            ))}
            {isLoggedIn ? (
              <a href="/dashboard" className="block text-center px-6 py-3.5 rounded-full bg-gradient-to-r from-[#fd79a8] to-[#e84393] text-white font-bold">Go to Dashboard →</a>
            ) : (
              <a href="/signup" className="block text-center px-6 py-3.5 rounded-full bg-gradient-to-r from-[#fd79a8] to-[#e84393] text-white font-bold">Start Free</a>
            )}
          </div>
        )}
      </nav>

      {/* ===== HERO ===== */}
      <section ref={heroRef} className="relative z-10 min-h-screen flex items-center pt-[76px]">
        <div className="max-w-[1320px] mx-auto px-6 lg:px-8 py-16 w-full">
          <div className="grid lg:grid-cols-[1fr_1.1fr] gap-12 lg:gap-20 items-center">
            {/* Left */}
            <div>
              <Reveal>
                <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-[rgba(253,121,168,0.15)] bg-[rgba(253,121,168,0.05)] text-[12px] font-semibold text-[#fd79a8] mb-8">
                  <span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full rounded-full bg-[#00b894] opacity-75 animate-ping" /><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00b894]" /></span>
                  Now in Public Beta — Free Forever Plan Available
                </div>
              </Reveal>

              <Reveal delay={100}>
                <h1 className="text-[clamp(2.8rem,6vw,5rem)] font-black leading-[1.02] tracking-[-3px] mb-7">
                  Stop Applying.<br />
                  Start <TypeWriter words={['Getting Hired.', 'Landing Offers.', 'Getting Interviews.', 'Winning Jobs.']} />
                </h1>
              </Reveal>

              <Reveal delay={200}>
                <p className="text-[17px] text-[#8a8a9a] leading-[1.7] mb-10 max-w-[500px]">
                  ApplyMaster&apos;s AI applies to jobs <span className="text-white font-semibold">24/7</span>, tailors your resume <span className="text-white font-semibold">per role</span>, writes cover letters, and coaches you through interviews — all on <span className="text-[#fd79a8] font-semibold">autopilot</span>.
                </p>
              </Reveal>

              <Reveal delay={300}>
                <div className="flex flex-wrap gap-4 mb-12">
                  <GlowButton href="/signup">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                    Start Free — No Card Required
                  </GlowButton>
                  <GlowButton href="#demo" variant="glass">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polygon points="5 3 19 12 5 21 5 3" /></svg>
                    See It In Action
                  </GlowButton>
                </div>
              </Reveal>

              <Reveal delay={400}>
                <div className="flex items-center gap-8 pt-4 border-t border-[rgba(255,255,255,0.04)]">
                  {[
                    { val: '847K+', label: 'Jobs Applied', color: '#fd79a8' },
                    { val: '94%', label: 'ATS Pass Rate', color: '#00b894' },
                    { val: '3.2x', label: 'More Interviews', color: '#a29bfe' },
                  ].map(s => (
                    <div key={s.label}>
                      <div className="text-xl font-black" style={{ color: s.color }}>{s.val}</div>
                      <div className="text-[11px] text-[#5a5a6a] font-medium mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>

            {/* Right — 3D Dashboard */}
            <Reveal delay={200} direction="right">
              <Tilt3D className="relative" intensity={6}>
                <div className="relative rounded-2xl overflow-hidden border border-[rgba(255,255,255,0.08)] bg-[#0e0e16] shadow-[0_40px_100px_rgba(253,121,168,0.08),0_0_0_1px_rgba(255,255,255,0.03)]">
                  {/* Browser chrome */}
                  <div className="flex items-center gap-2 px-5 py-3.5 border-b border-[rgba(255,255,255,0.04)] bg-[#0a0a0f]">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                      <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                      <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                    </div>
                    <div className="flex-1 mx-6 px-4 py-1.5 rounded-lg bg-[rgba(255,255,255,0.03)] text-[11px] text-[#5a5a6a] text-center font-mono flex items-center justify-center gap-2">
                      <svg className="w-3 h-3 text-[#00b894]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                      applymaster.ai/dashboard
                    </div>
                  </div>

                  {/* Dashboard */}
                  <div className="p-5 space-y-4">
                    {/* Stat cards */}
                    <div className="grid grid-cols-4 gap-3">
                      {[
                        { label: 'Applied', val: '847', delta: '+18%', color: '#fd79a8' },
                        { label: 'Views', val: '312', delta: '+24%', color: '#74b9ff' },
                        { label: 'Interviews', val: '48', delta: '+32%', color: '#00b894' },
                        { label: 'Match Rate', val: '94%', delta: '+12%', color: '#a29bfe' },
                      ].map(s => (
                        <div key={s.label} className="p-3 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)]">
                          <div className="flex items-center justify-between mb-2">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${s.color}15` }}>
                              <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                            </div>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[rgba(0,184,148,0.1)] text-[#00b894]">{s.delta}</span>
                          </div>
                          <div className="text-[18px] font-black" style={{ color: s.color }}>{s.val}</div>
                          <div className="text-[10px] text-[#5a5a6a] mt-0.5">{s.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Job cards */}
                    <div className="space-y-2">
                      {[
                        { title: 'Senior AI Engineer', co: 'Google DeepMind', match: 96, bg: '#4285F4', tag: 'Remote', salary: '$220k-350k' },
                        { title: 'ML Platform Lead', co: 'Meta', match: 94, bg: '#1877F2', tag: 'Remote', salary: '$250k-380k' },
                        { title: 'Staff Engineer — AI', co: 'Stripe', match: 92, bg: '#635BFF', tag: 'Hybrid', salary: '$230k-370k' },
                      ].map(j => (
                        <div key={j.title} className="flex items-center gap-3 p-3 rounded-xl bg-[rgba(255,255,255,0.015)] border border-[rgba(255,255,255,0.04)] hover:border-[rgba(255,255,255,0.08)] transition-all group">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-[11px] font-bold shrink-0" style={{ background: j.bg }}>{j.co[0]}</div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[12px] font-semibold truncate group-hover:text-[#fd79a8] transition-colors">{j.title}</div>
                            <div className="text-[10px] text-[#5a5a6a] flex items-center gap-2">{j.co} <span className="text-[#3a3a4a]">·</span> {j.salary}</div>
                          </div>
                          <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${j.tag === 'Remote' ? 'bg-[rgba(0,184,148,0.1)] text-[#00b894]' : 'bg-[rgba(116,185,255,0.1)] text-[#74b9ff]'}`}>{j.tag}</span>
                          <div className="w-9 h-9 rounded-full border-2 flex items-center justify-center text-[10px] font-black" style={{ borderColor: '#00b894', color: '#00b894' }}>{j.match}</div>
                        </div>
                      ))}
                    </div>

                    {/* Engine status */}
                    <div className="p-3 rounded-xl border border-[rgba(0,184,148,0.15)] bg-[rgba(0,184,148,0.03)]">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[11px] font-bold text-[#00b894]">
                          <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full rounded-full bg-[#00b894] opacity-75 animate-ping" /><span className="relative inline-flex rounded-full h-2 w-2 bg-[#00b894]" /></span>
                          Auto-Apply Engine Running
                        </div>
                        <span className="text-[10px] text-[#5a5a6a]">12 sent today · 3 interviews</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating elements */}
                <div className="absolute -top-6 -right-6 p-3 rounded-xl bg-[#12121a] border border-[rgba(255,255,255,0.06)] shadow-[0_20px_60px_rgba(0,0,0,0.5)] animate-float z-20">
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="text-[#00b894] text-base">✓</span>
                    <div>
                      <div className="font-bold text-[#00b894]">Resume Optimized</div>
                      <div className="text-[10px] text-[#5a5a6a]">ATS Score: 97/100</div>
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-5 -left-5 p-3 rounded-xl bg-[#12121a] border border-[rgba(255,255,255,0.06)] shadow-[0_20px_60px_rgba(0,0,0,0.5)] animate-float z-20" style={{ animationDelay: '-3s' }}>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="text-[#fd79a8] text-base">⚡</span>
                    <div>
                      <div className="font-bold text-[#fd79a8]">Auto-Applied to 3 Jobs</div>
                      <div className="text-[10px] text-[#5a5a6a]">In the last hour</div>
                    </div>
                  </div>
                </div>
                <div className="absolute top-1/2 -right-8 p-2.5 rounded-lg bg-[#12121a] border border-[rgba(255,255,255,0.06)] shadow-[0_20px_60px_rgba(0,0,0,0.5)] animate-float z-20" style={{ animationDelay: '-6s' }}>
                  <div className="text-[10px] font-bold text-[#74b9ff]">📨 Interview Invite</div>
                </div>
              </Tilt3D>
            </Reveal>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
          <span className="text-[10px] text-[#5a5a6a] uppercase tracking-widest font-semibold">Scroll</span>
          <div className="w-5 h-8 rounded-full border border-[rgba(255,255,255,0.1)] flex items-start justify-center p-1">
            <div className="w-1 h-2 rounded-full bg-[#fd79a8] animate-pulse" />
          </div>
        </div>
      </section>

      {/* ===== MARQUEE ===== */}
      <section className="relative z-10 py-6 border-y border-[rgba(255,255,255,0.04)] overflow-hidden bg-[rgba(0,0,0,0.3)]">
        <div className="flex animate-marquee whitespace-nowrap">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-center gap-16 mr-16">
              {['LinkedIn', 'Indeed', 'Glassdoor', 'ZipRecruiter', 'Greenhouse', 'Lever', 'Workday', 'Naukri', 'Instahyre', 'Dice', 'Wellfound', 'Monster', 'SEEK', 'Reed'].map(n => (
                <span key={n} className="text-[13px] font-semibold text-[rgba(255,255,255,0.12)] uppercase tracking-[3px]">{n}</span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section id="features" className="relative z-10 py-28">
        <div className="max-w-[1320px] mx-auto px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-20">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[rgba(253,121,168,0.15)] bg-[rgba(253,121,168,0.05)] text-[12px] font-semibold text-[#fd79a8] mb-5">
                Killer Features
              </div>
              <h2 className="text-[clamp(2.2rem,4.5vw,3.5rem)] font-black tracking-[-2px] mb-5 leading-[1.1]">
                Six AI Weapons That<br />
                <span className="bg-gradient-to-r from-[#fd79a8] via-[#e84393] to-[#d63031] bg-clip-text text-transparent">Work While You Sleep</span>
              </h2>
              <p className="text-[#8a8a9a] max-w-xl mx-auto text-[15px]">Every feature is designed to get you hired faster. No fluff, no gimmicks — just results.</p>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            <FeatureCard index={0} icon="⚡" title="Auto-Apply Engine" color="pink" desc="AI scans 50+ job portals, tailors your resume, writes cover letters, and applies automatically — in Autopilot or Copilot mode." chips={['Autopilot', 'Copilot', '50+ Portals', 'Smart Filters']} />
            <FeatureCard index={1} icon="📄" title="AI Resume Optimizer" color="green" desc="Don't just add keywords. AI restructures your entire resume per job — skills order, achievements, bullet points — for 95+ ATS scores." chips={['ATS Scoring', 'Per-Job Tailoring', 'A/B Testing', 'Keyword Gaps']} />
            <FeatureCard index={2} icon="✉️" title="Cover Letter Generator" color="blue" desc="Personalized letters that reference the company, team, and your unique story. Written in seconds, indistinguishable from hand-crafted." chips={['Personalized', 'Tone Control', 'Company Research']} />
            <FeatureCard index={3} icon="🎯" title="Smart Job Matching" color="purple" desc="AI scores every job against your profile. Only apply where you match 80%+. Built-in scam detection filters out ghost postings." chips={['Match Scoring', 'Scam Detection', 'Salary Intel']} />
            <FeatureCard index={4} icon="🎤" title="Live Interview Coach" color="yellow" desc="Real-time answer suggestions during video interviews. AI listens, understands the question, and shows you what to say — live." chips={['Real-Time', 'Mock Interviews', 'Question Prediction']} />
            <FeatureCard index={5} icon="📊" title="Application Tracker" color="pink" desc="Kanban board tracks every application from Applied → Interview → Offer. Follow-up reminders, analytics, and callback tracking." chips={['Kanban Pipeline', 'Reminders', 'Analytics']} />
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how-it-works" className="relative z-10 py-28">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[rgba(253,121,168,0.02)] to-transparent" />
        <div className="max-w-[1320px] mx-auto px-6 lg:px-8 relative">
          <Reveal>
            <div className="text-center mb-20">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[rgba(0,184,148,0.15)] bg-[rgba(0,184,148,0.05)] text-[12px] font-semibold text-[#00b894] mb-5">5 Minutes Setup</div>
              <h2 className="text-[clamp(2.2rem,4.5vw,3.5rem)] font-black tracking-[-2px] leading-[1.1]">
                From Zero to <span className="bg-gradient-to-r from-[#00b894] to-[#55efc4] bg-clip-text text-transparent">Auto-Applying</span><br />in 5 Minutes
              </h2>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-4 gap-6 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-16 left-[12.5%] right-[12.5%] h-[1px] bg-gradient-to-r from-[#fd79a8] via-[#a29bfe] to-[#00b894] opacity-20" />

            {[
              { step: '01', title: 'Upload Resume', desc: 'Drop your PDF or DOCX. AI parses, scores, and identifies every improvement area in seconds.', icon: '📤', color: '#fd79a8' },
              { step: '02', title: 'Set Preferences', desc: 'Choose target roles, locations, salary range, remote/hybrid. AI learns exactly what you want.', icon: '⚙️', color: '#a29bfe' },
              { step: '03', title: 'AI Takes Over', desc: 'Auto-apply engine scans 50+ portals, tailors resume per job, writes cover letters, and applies 24/7.', icon: '🤖', color: '#74b9ff' },
              { step: '04', title: 'Get Interviews', desc: 'Track applications on your Kanban board, prep with AI interview coach, and land your dream offer.', icon: '🎉', color: '#00b894' },
            ].map((item, i) => (
              <Reveal key={item.step} delay={i * 150}>
                <div className="relative text-center group">
                  <div className="relative mx-auto w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-6 border border-[rgba(255,255,255,0.06)] bg-[#12121a] group-hover:border-[rgba(253,121,168,0.2)] transition-all duration-500 group-hover:shadow-[0_0_40px_rgba(253,121,168,0.1)] group-hover:scale-110">
                    {item.icon}
                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full text-[10px] font-black flex items-center justify-center text-white" style={{ background: item.color }}>{item.step}</div>
                  </div>
                  <h3 className="text-[16px] font-bold mb-3">{item.title}</h3>
                  <p className="text-[13px] text-[#8a8a9a] leading-relaxed">{item.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== LIVE DEMO ===== */}
      <section id="demo" className="relative z-10 py-28">
        <div className="max-w-[1320px] mx-auto px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[rgba(116,185,255,0.15)] bg-[rgba(116,185,255,0.05)] text-[12px] font-semibold text-[#74b9ff] mb-5">See It In Action</div>
              <h2 className="text-[clamp(2.2rem,4.5vw,3.5rem)] font-black tracking-[-2px] leading-[1.1]">
                Watch the AI <span className="bg-gradient-to-r from-[#74b9ff] to-[#0984e3] bg-clip-text text-transparent">Work in Real-Time</span>
              </h2>
            </div>
          </Reveal>

          <Reveal>
            <Tilt3D intensity={3} className="max-w-4xl mx-auto">
              <div className="rounded-2xl overflow-hidden border border-[rgba(255,255,255,0.06)] bg-[#0e0e16] shadow-[0_60px_120px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.03)]">
                <div className="flex items-center gap-2 px-5 py-3.5 border-b border-[rgba(255,255,255,0.04)] bg-[#0a0a0f]">
                  <div className="flex gap-2"><div className="w-3 h-3 rounded-full bg-[#ff5f57]" /><div className="w-3 h-3 rounded-full bg-[#febc2e]" /><div className="w-3 h-3 rounded-full bg-[#28c840]" /></div>
                  <div className="flex-1 mx-6 px-4 py-1.5 rounded-lg bg-[rgba(255,255,255,0.03)] text-[11px] text-[#5a5a6a] text-center font-mono">applymaster.ai/auto-apply</div>
                </div>
                <div className="p-6 space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[rgba(0,184,148,0.08)] border border-[rgba(0,184,148,0.15)]">
                        <span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full rounded-full bg-[#00b894] opacity-75 animate-ping" /><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00b894]" /></span>
                        <span className="text-[12px] font-bold text-[#00b894]">Auto-Apply Running</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-[11px] text-[#5a5a6a]">
                      <span>Today: <span className="text-[#00b894] font-bold">12 applied</span></span>
                      <span>Queue: <span className="text-[#74b9ff] font-bold">38 jobs</span></span>
                      <span>Limit: <span className="text-white font-bold">27/50</span></span>
                    </div>
                  </div>

                  <div className="rounded-xl bg-[rgba(255,255,255,0.015)] border border-[rgba(255,255,255,0.04)] p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2 text-[11px] font-bold text-[#00b894]">
                        <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full rounded-full bg-[#00b894] opacity-75 animate-ping" /><span className="relative inline-flex rounded-full h-2 w-2 bg-[#00b894]" /></span>
                        Live Activity Feed
                      </div>
                      <span className="text-[10px] text-[#3a3a4a] font-mono">auto-refreshing</span>
                    </div>
                    <LiveActivityFeed />
                  </div>

                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: 'Avg Match', val: '96%', color: '#fd79a8' },
                      { label: 'ATS Score', val: '97', color: '#00b894' },
                      { label: 'Sources Active', val: '5', color: '#74b9ff' },
                      { label: 'Interviews', val: '3', color: '#a29bfe' },
                    ].map(s => (
                      <div key={s.label} className="p-3 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)] text-center">
                        <div className="text-[18px] font-black" style={{ color: s.color }}>{s.val}</div>
                        <div className="text-[10px] text-[#5a5a6a] mt-0.5">{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Tilt3D>
          </Reveal>
        </div>
      </section>

      {/* ===== STATS ===== */}
      <section className="relative z-10 py-24 border-y border-[rgba(255,255,255,0.04)]">
        <div className="absolute inset-0 bg-gradient-to-r from-[rgba(253,121,168,0.03)] via-transparent to-[rgba(162,155,254,0.03)]" />
        <div className="max-w-[1320px] mx-auto px-6 lg:px-8 relative">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { end: 847, suffix: 'K+', label: 'Applications Sent', color: 'from-[#fd79a8] to-[#e84393]' },
              { end: 94, suffix: '%', label: 'ATS Pass Rate', color: 'from-[#00b894] to-[#55efc4]' },
              { end: 48, suffix: '%', label: 'Interview Rate', color: 'from-[#74b9ff] to-[#0984e3]' },
              { end: 50, suffix: '+', label: 'Job Portals', color: 'from-[#a29bfe] to-[#6c5ce7]' },
            ].map(s => (
              <Reveal key={s.label}>
                <div>
                  <div className={`text-5xl md:text-6xl font-black bg-gradient-to-r ${s.color} bg-clip-text text-transparent`}>
                    <AnimatedCounter end={s.end} suffix={s.suffix} />
                  </div>
                  <div className="text-[13px] text-[#5a5a6a] mt-3 font-medium">{s.label}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section id="pricing" className="relative z-10 py-28">
        <div className="max-w-[1320px] mx-auto px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[rgba(253,121,168,0.15)] bg-[rgba(253,121,168,0.05)] text-[12px] font-semibold text-[#fd79a8] mb-5">Simple Pricing</div>
              <h2 className="text-[clamp(2.2rem,4.5vw,3.5rem)] font-black tracking-[-2px] leading-[1.1] mb-5">
                Start Free. <span className="bg-gradient-to-r from-[#fd79a8] to-[#e84393] bg-clip-text text-transparent">Scale When Ready.</span>
              </h2>
              <p className="text-[#8a8a9a] max-w-lg mx-auto mb-8">No hidden fees. No credit card required. Cancel anytime.</p>
              <div className="inline-flex items-center p-1 rounded-full bg-[#12121a] border border-[rgba(255,255,255,0.06)]">
                <button onClick={() => setBilling('mo')} className={`px-6 py-2.5 rounded-full text-[13px] font-semibold transition-all duration-300 ${billing === 'mo' ? 'bg-[#fd79a8] text-white shadow-[0_4px_15px_rgba(253,121,168,0.3)]' : 'text-[#8a8a9a]'}`}>Monthly</button>
                <button onClick={() => setBilling('yr')} className={`px-6 py-2.5 rounded-full text-[13px] font-semibold transition-all duration-300 flex items-center gap-2 ${billing === 'yr' ? 'bg-[#fd79a8] text-white shadow-[0_4px_15px_rgba(253,121,168,0.3)]' : 'text-[#8a8a9a]'}`}>Annual <span className="text-[10px] text-[#00b894] font-bold bg-[rgba(0,184,148,0.1)] px-2 py-0.5 rounded-full">-40%</span></button>
              </div>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-[1100px] mx-auto">
            {[
              { name: 'Free', price: 0, desc: 'Get started instantly', features: ['10 applications/month', 'Basic resume optimizer', 'Job search & tracking', 'Email support'], cta: 'Start Free', pop: false },
              { name: 'Pro', price: billing === 'mo' ? 29 : 17, desc: 'For serious job seekers', features: ['100 applications/month', 'AI resume tailoring', 'Cover letter generator', 'All 50+ job portals', 'Chrome extension', 'Scam detection', 'Priority support'], cta: 'Go Pro', pop: true },
              { name: 'Elite', price: billing === 'mo' ? 59 : 35, desc: 'Maximum firepower', features: ['Unlimited applications', 'Everything in Pro', 'Live interview coach', 'A/B resume testing', 'Recruiter outreach', 'Referral emails', 'Autopilot mode', 'Dedicated support'], cta: 'Go Elite', pop: false },
              { name: 'Lifetime', price: 199, desc: 'Pay once, use forever', features: ['Everything in Elite', 'Lifetime access', 'All future features', 'Priority everything', 'Early beta access', '1-on-1 onboarding'], cta: 'Get Lifetime', pop: false },
            ].map((plan, i) => (
              <Reveal key={plan.name} delay={i * 80}>
                <Tilt3D intensity={5}>
                  <div className={`relative h-full p-7 rounded-2xl bg-[#12121a] border transition-all duration-500 hover:translate-y-[-4px] ${plan.pop ? 'border-[rgba(253,121,168,0.3)] shadow-[0_0_60px_rgba(253,121,168,0.08)]' : 'border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.1)]'}`}>
                    {plan.pop && <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-[#fd79a8] to-[#e84393] text-white text-[10px] font-bold uppercase tracking-wider shadow-[0_4px_15px_rgba(253,121,168,0.3)]">Most Popular</div>}
                    <div className="mb-5">
                      <h3 className="text-[18px] font-bold mb-1">{plan.name}</h3>
                      <p className="text-[12px] text-[#5a5a6a]">{plan.desc}</p>
                    </div>
                    <div className="mb-7">
                      <span className="text-[42px] font-black">${plan.price}</span>
                      <span className="text-[13px] text-[#5a5a6a]">{plan.name === 'Lifetime' ? ' once' : '/mo'}</span>
                    </div>
                    <ul className="space-y-3 mb-8">
                      {plan.features.map(f => (
                        <li key={f} className="flex items-start gap-2.5 text-[13px] text-[#8a8a9a]">
                          <span className="text-[#00b894] mt-0.5 text-[11px]">✓</span>{f}
                        </li>
                      ))}
                    </ul>
                    <a href="/signup" className={`block text-center py-3.5 rounded-xl font-bold text-[13px] transition-all duration-300 ${plan.pop ? 'bg-gradient-to-r from-[#fd79a8] to-[#e84393] text-white hover:shadow-[0_8px_30px_rgba(253,121,168,0.3)] hover:translate-y-[-1px]' : 'bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] text-white hover:bg-[rgba(255,255,255,0.06)]'}`}>{plan.cta}</a>
                  </div>
                </Tilt3D>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS (TRUSTPILOT-STYLE) ===== */}
      <section className="relative z-10 py-28">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[rgba(162,155,254,0.02)] to-transparent" />
        <div className="max-w-[1320px] mx-auto px-6 lg:px-8 relative">
          <Reveal>
            <div className="text-center mb-20">
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => <span key={i} className="text-[#fdcb6e] text-[28px]">★</span>)}
                </div>
              </div>
              <h2 className="text-[clamp(2.2rem,4.5vw,3.5rem)] font-black tracking-[-2px] leading-[1.1] mb-4">
                Loved by <span className="bg-gradient-to-r from-[#fd79a8] to-[#e84393] bg-clip-text text-transparent">10,000+ Job Seekers</span>
              </h2>
              <p className="text-[16px] text-[#8a8a9a]">4.9 out of 5 stars based on 2,847 verified reviews</p>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { quote: "ApplyMaster got me 12 interviews in 2 weeks. I was manually applying for 3 months with zero callbacks. This literally changed my career.", name: 'Sarah Chen', role: 'Software Engineer at Google', avatar: 'SC', color: '#fd79a8', verified: true, date: '2 weeks ago' },
              { quote: "The resume optimizer alone is worth 10x the price. My ATS score went from 58 to 96. I went from ghosted to getting recruiter calls daily.", name: 'James Rodriguez', role: 'Data Scientist at Meta', avatar: 'JR', color: '#74b9ff', verified: true, date: '1 month ago' },
              { quote: "I was skeptical about AI applying for me. But Copilot mode lets me review everything before it goes out. Landed a $280K offer in 3 weeks.", name: 'Priya Sharma', role: 'ML Engineer at Stripe', avatar: 'PS', color: '#a29bfe', verified: true, date: '3 weeks ago' },
              { quote: "Finally a tool that actually works. I went from 0 to 23 interviews in a month. The auto-apply is insanely smart about matching jobs.", name: 'Marcus Johnson', role: 'Backend Engineer at Amazon', avatar: 'MJ', color: '#00b894', verified: true, date: '1 week ago' },
              { quote: "Game changer. I used to spend 3 hours a day applying. Now it takes 15 minutes to review and approve applications. Got my dream job!", name: 'Lisa Wong', role: 'Product Manager at TikTok', avatar: 'LW', color: '#fdcb6e', verified: true, date: '5 days ago' },
              { quote: "The cover letter generator saves so much time. Each one is personalized and actually reads like I wrote it. Accepted offer after 2 weeks!", name: 'David Patel', role: 'Full-stack Engineer at Microsoft', avatar: 'DP', color: '#00d4ff', verified: true, date: '3 days ago' },
            ].map((t, i) => (
              <Reveal key={t.name} delay={i * 80}>
                <Tilt3D intensity={5}>
                  <div className="h-full p-6 rounded-2xl bg-gradient-to-br from-[#1a1a24] to-[#12121a] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.15)] transition-all duration-500 group shadow-lg hover:shadow-[0_20px_40px_rgba(253,121,168,0.1)]">
                    {/* Header with rating and verification */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, j) => <span key={j} className="text-[#fdcb6e] text-[15px]">★</span>)}
                      </div>
                      {t.verified && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[rgba(0,184,148,0.1)] border border-[rgba(0,184,148,0.2)]">
                          <svg className="w-3 h-3 text-[#00b894]" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span className="text-[10px] font-bold text-[#00b894]">Verified</span>
                        </div>
                      )}
                    </div>

                    {/* Quote */}
                    <p className="text-[14px] text-[#a8a8b8] leading-[1.7] mb-6 italic">&ldquo;{t.quote}&rdquo;</p>

                    {/* Author */}
                    <div className="flex items-center gap-3 pt-6 border-t border-[rgba(255,255,255,0.06)]">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-[13px] font-bold shrink-0" style={{ background: `linear-gradient(135deg, ${t.color}, ${t.color}cc)` }}>{t.avatar}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-semibold text-white">{t.name}</div>
                        <div className="text-[11px] text-[#6a6a7a]">{t.role}</div>
                        <div className="text-[10px] text-[#5a5a6a] mt-0.5">{t.date}</div>
                      </div>
                    </div>
                  </div>
                </Tilt3D>
              </Reveal>
            ))}
          </div>

          {/* Trust badges */}
          <Reveal delay={500}>
            <div className="mt-16 pt-12 border-t border-[rgba(255,255,255,0.04)]">
              <p className="text-center text-[12px] text-[#5a5a6a] mb-8">Trusted by job seekers from leading companies</p>
              <div className="flex flex-wrap items-center justify-center gap-8 opacity-60">
                {['Google', 'Meta', 'Stripe', 'Amazon', 'Microsoft', 'Apple'].map(company => (
                  <div key={company} className="text-[13px] font-semibold text-[#6a6a7a]">{company}</div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section id="faq" className="relative z-10 py-28">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-16">
              <h2 className="text-[clamp(2.2rem,4.5vw,3.5rem)] font-black tracking-[-2px] leading-[1.1]">
                Frequently Asked <span className="bg-gradient-to-r from-[#fd79a8] to-[#e84393] bg-clip-text text-transparent">Questions</span>
              </h2>
            </div>
          </Reveal>
          <Reveal>
            <div className="space-y-3">
              <FAQ q="Is ApplyMaster actually free?" a="Yes. The Free plan gives you 10 applications/month, resume optimization, job search, and application tracking — forever. No credit card, no trial expiry. Upgrade only when you need more volume." />
              <FAQ q="Will employers know I used AI?" a="No. Every application is unique — your resume is restructured (not just keyword-stuffed) per job, cover letters reference specific company details, and screening questions are answered contextually. Applications are indistinguishable from hand-crafted ones." />
              <FAQ q="What's the difference between Copilot and Autopilot?" a="Copilot queues every application for your review — you see the tailored resume, cover letter, and answers before approving. Autopilot applies automatically to jobs above your match threshold. Most users start with Copilot, then switch to Autopilot once they trust the system." />
              <FAQ q="Which job portals are supported?" a="50+ globally: LinkedIn, Indeed, Glassdoor, ZipRecruiter, Greenhouse, Lever, Workday, Naukri, Instahyre, Dice, Wellfound, Monster, SEEK, Reed, and many more. We add new integrations weekly." />
              <FAQ q="How does the Live Interview Coach work?" a="Our Chrome extension captures interview audio during Google Meet, Zoom Web, or Teams calls, transcribes it in real-time using AI, and displays suggested answers on your screen. It pulls from your resume and the job description to generate personalized responses. One-click hide for screen sharing." />
              <FAQ q="Can I cancel anytime?" a="Yes. No contracts, no fees. Cancel with one click. Your data exports are always available. Lifetime plan never expires." />
              <FAQ q="Is my data secure?" a="AES-256 encryption, SOC 2 compliant infrastructure, GDPR ready. We never share your data with employers or third parties. One-click data deletion available anytime." />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="relative z-10 py-28">
        <div className="max-w-[1320px] mx-auto px-6 lg:px-8">
          <div className="relative rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[rgba(253,121,168,0.1)] via-[rgba(162,155,254,0.05)] to-[rgba(116,185,255,0.1)]" />
            <div className="absolute inset-0 bg-[#0e0e16]/60 backdrop-blur-sm" />
            <div className="absolute inset-[1px] rounded-3xl border border-[rgba(255,255,255,0.06)]" />

            {/* Animated orbs */}
            <div className="absolute top-[-20%] left-[-10%] w-[300px] h-[300px] rounded-full bg-[#fd79a8] opacity-[0.05] blur-[80px] animate-float" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[300px] h-[300px] rounded-full bg-[#a29bfe] opacity-[0.05] blur-[80px] animate-float" style={{ animationDelay: '-3s' }} />

            <div className="relative z-10 py-20 px-8 text-center">
              <Reveal>
                <h2 className="text-[clamp(2.5rem,5vw,4rem)] font-black tracking-[-2px] leading-[1.05] mb-6">
                  Ready to <span className="bg-gradient-to-r from-[#fd79a8] via-[#e84393] to-[#d63031] bg-clip-text text-transparent">10x Your Job Search?</span>
                </h2>
              </Reveal>
              <Reveal delay={100}>
                <p className="text-[17px] text-[#8a8a9a] max-w-lg mx-auto mb-10">
                  Join 10,000+ job seekers who stopped applying manually and started getting interviews on autopilot.
                </p>
              </Reveal>
              <Reveal delay={200}>
                <div className="flex flex-wrap justify-center gap-4">
                  <GlowButton href="/signup">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                    Start Free — No Credit Card
                  </GlowButton>
                </div>
              </Reveal>
              <Reveal delay={300}>
                <p className="text-[12px] text-[#5a5a6a] mt-6">Free forever plan available · No credit card · Cancel anytime</p>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="relative z-10 border-t border-[rgba(255,255,255,0.04)] py-16">
        <div className="max-w-[1320px] mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <a href="/" className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#fd79a8] to-[#e84393] flex items-center justify-center text-white font-black text-[12px]">AM</div>
                <span className="text-[17px] font-extrabold tracking-tight">Apply<span className="text-[#fd79a8]">Master</span></span>
              </a>
              <p className="text-[13px] text-[#5a5a6a] leading-relaxed mb-6">AI-powered job application automation.<br />A product by <a href="https://3gp.ai" className="text-[#fd79a8] hover:underline">3GP.AI</a></p>
            </div>
            <div>
              <h5 className="font-bold text-[13px] mb-5 text-[#8a8a9a]">Product</h5>
              <div className="space-y-3">
                <a href="/features" className="block text-[13px] text-[#5a5a6a] hover:text-white transition-colors">Features</a>
                <a href="/features/auto-apply" className="block text-[13px] text-[#5a5a6a] hover:text-white transition-colors">Auto Apply</a>
                <a href="/features/resume-optimizer" className="block text-[13px] text-[#5a5a6a] hover:text-white transition-colors">Resume Optimizer</a>
                <a href="/features/interview-coach" className="block text-[13px] text-[#5a5a6a] hover:text-white transition-colors">Interview Coach</a>
                <a href="/pricing" className="block text-[13px] text-[#5a5a6a] hover:text-white transition-colors">Pricing</a>
              </div>
            </div>
            <div>
              <h5 className="font-bold text-[13px] mb-5 text-[#8a8a9a]">Resources</h5>
              <div className="space-y-3">
                <a href="/blog" className="block text-[13px] text-[#5a5a6a] hover:text-white transition-colors">Blog</a>
                <a href="/blog/ai-job-application-guide" className="block text-[13px] text-[#5a5a6a] hover:text-white transition-colors">AI Job Application Guide</a>
                <a href="/blog/ats-resume-optimization" className="block text-[13px] text-[#5a5a6a] hover:text-white transition-colors">ATS Resume Guide</a>
                <a href="/blog/linkedin-auto-apply-guide" className="block text-[13px] text-[#5a5a6a] hover:text-white transition-colors">LinkedIn Auto Apply Guide</a>
                <a href="https://3gp.ai" className="block text-[13px] text-[#5a5a6a] hover:text-white transition-colors">About 3GP.AI</a>
              </div>
            </div>
            <div>
              <h5 className="font-bold text-[13px] mb-5 text-[#8a8a9a]">Legal</h5>
              <div className="space-y-3">
                <a href="/privacy" className="block text-[13px] text-[#5a5a6a] hover:text-white transition-colors">Privacy Policy</a>
                <a href="/terms" className="block text-[13px] text-[#5a5a6a] hover:text-white transition-colors">Terms of Service</a>
              </div>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-[rgba(255,255,255,0.04)]">
            <span className="text-[12px] text-[#3a3a4a]">&copy; 2026 ApplyMaster by 3GP.AI. All rights reserved.</span>
            <div className="flex items-center gap-6 mt-4 md:mt-0">
              <a href="https://twitter.com/applymaster_ai" target="_blank" rel="noopener noreferrer" className="text-[12px] text-[#5a5a6a] hover:text-[#fd79a8] transition-colors">Twitter</a>
              <a href="https://linkedin.com/company/applymaster" target="_blank" rel="noopener noreferrer" className="text-[12px] text-[#5a5a6a] hover:text-[#fd79a8] transition-colors">LinkedIn</a>
              <a href="https://instagram.com/applymaster.ai" target="_blank" rel="noopener noreferrer" className="text-[12px] text-[#5a5a6a] hover:text-[#fd79a8] transition-colors">Instagram</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
