'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

// ===== ANIMATED COUNTER HOOK =====
function useCounter(end: number, duration = 2000, suffix = '', startOnView = true) {
  const [value, setValue] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const started = useRef(false)

  useEffect(() => {
    if (!startOnView || !ref.current) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true
          const start = performance.now()
          const animate = (now: number) => {
            const progress = Math.min((now - start) / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 4)
            setValue(Math.floor(eased * end))
            if (progress < 1) requestAnimationFrame(animate)
          }
          requestAnimationFrame(animate)
        }
      },
      { threshold: 0.3 }
    )
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [end, duration, startOnView])

  return { value: `${value}${suffix}`, ref }
}

// ===== TYPING EFFECT =====
function TypingText({ words }: { words: string[] }) {
  const [currentWord, setCurrentWord] = useState(0)
  const [text, setText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const word = words[currentWord]
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        setText(word.substring(0, text.length + 1))
        if (text === word) setTimeout(() => setIsDeleting(true), 1500)
      } else {
        setText(word.substring(0, text.length - 1))
        if (text === '') {
          setIsDeleting(false)
          setCurrentWord((prev) => (prev + 1) % words.length)
        }
      }
    }, isDeleting ? 40 : 80)
    return () => clearTimeout(timeout)
  }, [text, isDeleting, currentWord, words])

  return (
    <span className="gradient-text">
      {text}
      <span className="animate-pulse text-accent-pink">|</span>
    </span>
  )
}

// ===== SCROLL REVEAL =====
function Reveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!ref.current) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.1, rootMargin: '-50px' }
    )
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

// ===== LIVE FEED SIMULATION =====
function LiveFeed() {
  const [lines, setLines] = useState<{ time: string; msg: string; type: string }[]>([])
  const feedRef = useRef<HTMLDivElement>(null)

  const messages = [
    { msg: 'Scanning LinkedIn for new matches...', type: 'info' },
    { msg: 'Found 8 new jobs matching your profile', type: 'success' },
    { msg: 'Analyzing: Senior AI Engineer at Google — Match: 96%', type: 'highlight' },
    { msg: 'Tailoring resume for Google DeepMind role...', type: 'info' },
    { msg: 'Cover letter generated with 5 company-specific points', type: 'success' },
    { msg: 'Application submitted to Google DeepMind ✓', type: 'success' },
    { msg: 'Analyzing: ML Platform Lead at Meta — Match: 94%', type: 'highlight' },
    { msg: 'Resume optimized — ATS score: 97/100', type: 'success' },
    { msg: 'Application submitted to Meta ✓', type: 'success' },
    { msg: 'Skipping Junior Developer at Acme Corp — below 80% threshold', type: 'info' },
    { msg: 'Analyzing: Staff Engineer at Stripe — Match: 92%', type: 'highlight' },
    { msg: 'Answering 3 screening questions automatically...', type: 'info' },
    { msg: 'Application submitted to Stripe ✓', type: 'success' },
    { msg: 'Daily progress: 12 applications sent, 38 remaining', type: 'info' },
  ]

  useEffect(() => {
    let idx = 0
    // Add initial lines
    const initial = messages.slice(0, 5).map((m, i) => ({
      time: `14:3${i}:0${i}`,
      ...m,
    }))
    setLines(initial)

    const interval = setInterval(() => {
      idx = (idx + 1) % messages.length
      const now = new Date()
      const time = now.toTimeString().split(' ')[0]
      setLines((prev) => [...prev.slice(-8), { time, ...messages[idx] }])
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight
  }, [lines])

  return (
    <div ref={feedRef} className="font-mono text-xs space-y-1 max-h-[200px] overflow-y-auto">
      {lines.map((line, i) => (
        <div key={i} className="flex gap-3 py-0.5">
          <span className="text-text-muted shrink-0">{line.time}</span>
          <span className={
            line.type === 'success' ? 'text-accent-green' :
            line.type === 'highlight' ? 'text-accent-pink' :
            'text-text-secondary'
          }>{line.msg}</span>
        </div>
      ))}
    </div>
  )
}

// ===== FAQ ACCORDION =====
function FAQ({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-border rounded-md overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-bg-card-hover transition-colors"
      >
        <span className="font-semibold text-[15px]">{question}</span>
        <span className={`text-accent-pink text-xl transition-transform duration-300 ${open ? 'rotate-45' : ''}`}>+</span>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${open ? 'max-h-[300px]' : 'max-h-0'}`}>
        <p className="px-5 pb-5 text-sm text-text-secondary leading-relaxed">{answer}</p>
      </div>
    </div>
  )
}

// ===== MAIN PAGE =====
export default function Home() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenu, setMobileMenu] = useState(false)
  const [activePricing, setActivePricing] = useState<'monthly' | 'annual'>('monthly')

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const stat1 = useCounter(847, 2500, 'K+')
  const stat2 = useCounter(94, 2000, '%')
  const stat3 = useCounter(48, 2000, '%')
  const stat4 = useCounter(50, 2000, '+')

  return (
    <div className="relative">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-accent-pink/5 blur-[150px] animate-float" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-accent-purple/5 blur-[150px] animate-float" style={{ animationDelay: '-3s' }} />
        <div className="absolute top-[40%] left-[50%] w-[400px] h-[400px] rounded-full bg-accent-blue/3 blur-[120px] animate-float" style={{ animationDelay: '-5s' }} />
      </div>

      {/* ===== NAVBAR ===== */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-bg-primary/80 backdrop-blur-xl border-b border-border' : ''}`}>
        <div className="max-w-[1280px] mx-auto px-6 flex items-center justify-between h-[72px]">
          <a href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent-pink to-[#e84393] flex items-center justify-center text-white font-black text-sm">AM</div>
            <span className="text-lg font-extrabold tracking-tight">Apply<span className="text-accent-pink">Master</span></span>
          </a>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-text-secondary hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm text-text-secondary hover:text-white transition-colors">How It Works</a>
            <a href="#pricing" className="text-sm text-text-secondary hover:text-white transition-colors">Pricing</a>
            <a href="#faq" className="text-sm text-text-secondary hover:text-white transition-colors">FAQ</a>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <a href="/login" className="text-sm font-semibold text-text-secondary hover:text-white transition-colors px-4 py-2">Log In</a>
            <a href="/signup" className="text-sm font-bold px-5 py-2.5 rounded-full bg-gradient-to-r from-accent-pink to-[#e84393] text-white glow-pink-strong hover:translate-y-[-1px] transition-all">
              Start Free
            </a>
          </div>

          <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden flex flex-col gap-1.5 p-2" aria-label="Menu">
            <span className={`w-5 h-0.5 bg-white transition-all ${mobileMenu ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`w-5 h-0.5 bg-white transition-all ${mobileMenu ? 'opacity-0' : ''}`} />
            <span className={`w-5 h-0.5 bg-white transition-all ${mobileMenu ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenu && (
          <div className="md:hidden bg-bg-secondary border-t border-border p-6 space-y-4">
            <a href="#features" onClick={() => setMobileMenu(false)} className="block text-sm text-text-secondary">Features</a>
            <a href="#how-it-works" onClick={() => setMobileMenu(false)} className="block text-sm text-text-secondary">How It Works</a>
            <a href="#pricing" onClick={() => setMobileMenu(false)} className="block text-sm text-text-secondary">Pricing</a>
            <a href="/signup" className="block text-center text-sm font-bold px-5 py-3 rounded-full bg-gradient-to-r from-accent-pink to-[#e84393] text-white">Start Free</a>
          </div>
        )}
      </nav>

      {/* ===== HERO SECTION ===== */}
      <section className="relative z-10 min-h-screen flex items-center pt-[72px]">
        <div className="max-w-[1280px] mx-auto px-6 py-20 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left — Copy */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-xs font-semibold text-accent-pink mb-6 animate-fade-in">
                <span className="w-2 h-2 rounded-full bg-accent-green animate-pulse-glow" />
                Now in Public Beta — Join 10,000+ Job Seekers
              </div>

              <h1 className="text-[clamp(2.5rem,5.5vw,4.5rem)] font-black leading-[1.05] tracking-[-2px] mb-6 animate-fade-up">
                Never Apply to<br />a Job <TypingText words={['Manually', 'Again', 'Solo', 'Slowly']} /><br />
                <span className="text-text-secondary text-[0.6em] font-bold">Ever Again.</span>
              </h1>

              <p className="text-lg text-text-secondary leading-relaxed mb-8 max-w-lg animate-fade-up" style={{ animationDelay: '200ms' }}>
                ApplyMaster&apos;s AI applies to jobs 24/7, tailors your resume per role, writes cover letters, and coaches you through interviews — all on autopilot.
              </p>

              <div className="flex flex-wrap gap-4 mb-10 animate-fade-up" style={{ animationDelay: '400ms' }}>
                <a href="/signup" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-gradient-to-r from-accent-pink to-[#e84393] text-white font-bold text-[15px] glow-pink-strong hover:translate-y-[-2px] transition-all">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                  Start Free — No Credit Card
                </a>
                <a href="#demo" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full glass text-white/80 font-semibold text-[15px] hover:bg-white/5 transition-all">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polygon points="5 3 19 12 5 21 5 3" /></svg>
                  Watch Demo
                </a>
              </div>

              {/* Hero Stats */}
              <div className="grid grid-cols-3 gap-6 animate-fade-up" style={{ animationDelay: '600ms' }}>
                <div>
                  <div className="text-2xl font-black text-accent-pink">847K+</div>
                  <div className="text-xs text-text-muted font-medium">Jobs Applied</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-accent-green">94%</div>
                  <div className="text-xs text-text-muted font-medium">ATS Pass Rate</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-accent-purple">3.2x</div>
                  <div className="text-xs text-text-muted font-medium">More Interviews</div>
                </div>
              </div>
            </div>

            {/* Right — Dashboard Mockup */}
            <div className="relative animate-fade-in" style={{ animationDelay: '300ms' }}>
              <div className="relative rounded-xl overflow-hidden border border-border bg-bg-card shadow-2xl shadow-accent-pink/5">
                {/* Browser chrome */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-bg-secondary">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                    <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                    <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                  </div>
                  <div className="flex-1 mx-4 px-3 py-1 rounded-md bg-bg-input text-xs text-text-muted text-center font-mono">
                    applymaster.ai/dashboard
                  </div>
                </div>

                {/* Dashboard content */}
                <div className="p-4">
                  {/* Stats row */}
                  <div className="grid grid-cols-4 gap-3 mb-4">
                    {[
                      { label: 'Applied', value: '847', change: '+18%', color: 'text-accent-pink', bg: 'bg-accent-pink/10' },
                      { label: 'Views', value: '312', change: '+24%', color: 'text-accent-blue', bg: 'bg-accent-blue/10' },
                      { label: 'Interviews', value: '48', change: '+32%', color: 'text-accent-green', bg: 'bg-accent-green/10' },
                      { label: 'Match Rate', value: '94%', change: '+12%', color: 'text-accent-purple', bg: 'bg-accent-purple/10' },
                    ].map((stat) => (
                      <div key={stat.label} className="p-3 rounded-lg bg-bg-input border border-border">
                        <div className="flex items-center justify-between mb-1">
                          <div className={`w-6 h-6 rounded-md ${stat.bg} flex items-center justify-center`}>
                            <div className={`w-2 h-2 rounded-full ${stat.color.replace('text-', 'bg-')}`} />
                          </div>
                          <span className="text-[9px] font-bold text-accent-green bg-accent-green/10 px-1.5 py-0.5 rounded-full">{stat.change}</span>
                        </div>
                        <div className={`text-lg font-black ${stat.color}`}>{stat.value}</div>
                        <div className="text-[10px] text-text-muted">{stat.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Job cards */}
                  <div className="space-y-2">
                    {[
                      { title: 'Senior AI Engineer', company: 'Google DeepMind', match: 96, color: '#4285F4', tag: 'Remote' },
                      { title: 'ML Platform Lead', company: 'Meta', match: 94, color: '#1877F2', tag: 'Hybrid' },
                      { title: 'Staff Engineer', company: 'Stripe', match: 92, color: '#635BFF', tag: 'Remote' },
                    ].map((job) => (
                      <div key={job.title} className="flex items-center gap-3 p-3 rounded-lg bg-bg-input border border-border hover:border-border-hover transition-colors">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[10px] font-bold" style={{ background: job.color }}>
                          {job.company[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold truncate">{job.title}</div>
                          <div className="text-[10px] text-text-muted">{job.company}</div>
                        </div>
                        <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-accent-green/10 text-accent-green">{job.tag}</span>
                        <div className="text-xs font-black text-accent-green">{job.match}%</div>
                      </div>
                    ))}
                  </div>

                  {/* Auto-apply status */}
                  <div className="mt-3 p-3 rounded-lg bg-accent-green/5 border border-accent-green/20">
                    <div className="flex items-center gap-2 text-xs font-bold text-accent-green">
                      <span className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
                      Auto-Apply Engine Running — 12 applications sent today
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating badges */}
              <div className="absolute -top-4 -right-4 px-3 py-2 rounded-lg bg-bg-card border border-border shadow-xl animate-float text-xs">
                <span className="text-accent-green font-bold">✓ Resume Optimized</span>
                <div className="text-[10px] text-text-muted">ATS Score: 97/100</div>
              </div>
              <div className="absolute -bottom-4 -left-4 px-3 py-2 rounded-lg bg-bg-card border border-border shadow-xl animate-float text-xs" style={{ animationDelay: '-2s' }}>
                <span className="text-accent-pink font-bold">⚡ Auto-Applied</span>
                <div className="text-[10px] text-text-muted">3 jobs in last hour</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SOCIAL PROOF MARQUEE ===== */}
      <section className="relative z-10 py-8 border-y border-border overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-center gap-12 mr-12">
              {['LinkedIn', 'Indeed', 'Glassdoor', 'ZipRecruiter', 'Greenhouse', 'Lever', 'Workday', 'Naukri', 'Instahyre', 'Dice', 'Wellfound', 'Monster'].map((name) => (
                <span key={name} className="text-sm font-semibold text-text-muted/40 uppercase tracking-widest">{name}</span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ===== FEATURES SECTION ===== */}
      <section id="features" className="relative z-10 py-24">
        <div className="max-w-[1280px] mx-auto px-6">
          <Reveal>
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-xs font-semibold text-accent-pink mb-4">
                Killer Features
              </div>
              <h2 className="text-[clamp(2rem,4vw,3.2rem)] font-black tracking-[-1.5px] mb-4">
                Everything You Need to<br /><span className="gradient-text">Land Your Dream Job</span>
              </h2>
              <p className="text-text-secondary max-w-xl mx-auto">Six AI-powered weapons that work 24/7 so you don&apos;t have to.</p>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: '⚡', title: 'Auto-Apply Engine', color: 'accent-pink',
                desc: 'AI scans 50+ job portals, tailors your resume, writes cover letters, and applies — all while you sleep.',
                chips: ['Autopilot Mode', 'Copilot Mode', '50+ Job Portals', 'Smart Filters'],
              },
              {
                icon: '📄', title: 'AI Resume Optimizer', color: 'accent-green',
                desc: 'Get a 95+ ATS score. AI rewrites your resume for each job, not just keywords — full restructuring.',
                chips: ['ATS Scoring', 'Per-Job Tailoring', 'Keyword Gaps', 'A/B Testing'],
              },
              {
                icon: '✉️', title: 'Cover Letter Generator', color: 'accent-blue',
                desc: 'Personalized cover letters that reference the company, role, and your unique experience. Generated in seconds.',
                chips: ['Per-Job Personalization', 'Tone Control', 'Company Research', 'One-Click'],
              },
              {
                icon: '🎯', title: 'Smart Job Matching', color: 'accent-purple',
                desc: 'AI scores every job against your profile. Only apply to roles where you have 80%+ match — no spray and pray.',
                chips: ['Match Scoring', 'Scam Detection', 'Salary Intelligence', 'Skill Gaps'],
              },
              {
                icon: '🎤', title: 'Live Interview Coach', color: 'accent-yellow',
                desc: 'Real-time answer suggestions during video interviews. Like having a career coach whispering in your ear.',
                chips: ['Real-Time Coaching', 'Mock Interviews', 'Question Prediction', 'Confidence Score'],
              },
              {
                icon: '📊', title: 'Application Tracker', color: 'accent-pink',
                desc: 'Kanban board tracks every application from Applied → Interview → Offer. Never lose track of where you stand.',
                chips: ['Kanban Pipeline', 'Status Updates', 'Follow-up Reminders', 'Analytics'],
              },
            ].map((feature, i) => (
              <Reveal key={feature.title} delay={i * 100}>
                <div className="group h-full p-6 rounded-xl bg-bg-card border border-border hover:border-border-hover transition-all duration-300 hover:translate-y-[-4px] hover:shadow-xl hover:shadow-accent-pink/5">
                  <div className="text-3xl mb-4">{feature.icon}</div>
                  <h3 className="text-lg font-bold tracking-tight mb-2">{feature.title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed mb-4">{feature.desc}</p>
                  <div className="flex flex-wrap gap-2">
                    {feature.chips.map((chip) => (
                      <span key={chip} className={`text-[10px] font-semibold px-2.5 py-1 rounded-full bg-${feature.color}/10 text-${feature.color}`}>
                        {chip}
                      </span>
                    ))}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how-it-works" className="relative z-10 py-24 bg-bg-secondary/50">
        <div className="max-w-[1280px] mx-auto px-6">
          <Reveal>
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-xs font-semibold text-accent-green mb-4">
                Simple Setup
              </div>
              <h2 className="text-[clamp(2rem,4vw,3.2rem)] font-black tracking-[-1.5px] mb-4">
                From Zero to <span className="gradient-text-green">Auto-Applying</span> in 5 Minutes
              </h2>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Upload Resume', desc: 'Drop your PDF/DOCX. AI parses, scores, and identifies improvement areas instantly.', icon: '📤' },
              { step: '02', title: 'Set Preferences', desc: 'Choose roles, locations, salary, remote/hybrid. AI learns exactly what you want.', icon: '⚙️' },
              { step: '03', title: 'AI Takes Over', desc: 'Auto-apply engine scans 50+ portals, tailors resume per job, and applies 24/7.', icon: '🤖' },
              { step: '04', title: 'Get Interviews', desc: 'Track applications, prep with AI interview coach, and land your dream job.', icon: '🎉' },
            ].map((item, i) => (
              <Reveal key={item.step} delay={i * 150}>
                <div className="relative text-center">
                  <div className="text-4xl mb-4">{item.icon}</div>
                  <div className="text-xs font-bold text-accent-pink mb-2">STEP {item.step}</div>
                  <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{item.desc}</p>
                  {i < 3 && (
                    <div className="hidden md:block absolute top-8 -right-4 text-text-muted/20 text-2xl">→</div>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== INTERACTIVE DEMO ===== */}
      <section id="demo" className="relative z-10 py-24">
        <div className="max-w-[1280px] mx-auto px-6">
          <Reveal>
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-xs font-semibold text-accent-blue mb-4">
                See It In Action
              </div>
              <h2 className="text-[clamp(2rem,4vw,3.2rem)] font-black tracking-[-1.5px] mb-4">
                Watch ApplyMaster <span className="gradient-text-blue">Work in Real-Time</span>
              </h2>
            </div>
          </Reveal>

          <Reveal>
            <div className="max-w-4xl mx-auto rounded-xl overflow-hidden border border-border bg-bg-card shadow-2xl">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-bg-secondary">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                  <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                  <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                </div>
                <div className="flex-1 mx-4 px-3 py-1.5 rounded-md bg-bg-input text-xs text-text-muted text-center font-mono">
                  applymaster.ai/auto-apply
                </div>
              </div>

              <div className="p-6">
                {/* Status */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-accent-green/10 border border-accent-green/20">
                      <span className="w-2.5 h-2.5 rounded-full bg-accent-green animate-pulse" />
                      <span className="text-sm font-bold text-accent-green">Auto-Apply Running</span>
                    </div>
                    <span className="text-xs text-text-muted">Today: 12 applied, 3 interviews</span>
                  </div>
                  <div className="text-xs text-text-muted">Daily Limit: 27/50</div>
                </div>

                {/* Live Feed */}
                <div className="rounded-lg bg-bg-input border border-border p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-accent-green">
                      <span className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
                      Live Activity Feed
                    </div>
                    <span className="text-[10px] text-text-muted">Auto-refreshing</span>
                  </div>
                  <LiveFeed />
                </div>

                {/* Quick stats */}
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="p-3 rounded-lg bg-bg-input border border-border text-center">
                    <div className="text-lg font-black text-accent-pink">96%</div>
                    <div className="text-[10px] text-text-muted">Avg Match Score</div>
                  </div>
                  <div className="p-3 rounded-lg bg-bg-input border border-border text-center">
                    <div className="text-lg font-black text-accent-green">97</div>
                    <div className="text-[10px] text-text-muted">ATS Score</div>
                  </div>
                  <div className="p-3 rounded-lg bg-bg-input border border-border text-center">
                    <div className="text-lg font-black text-accent-blue">5</div>
                    <div className="text-[10px] text-text-muted">Sources Active</div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== STATS SECTION ===== */}
      <section className="relative z-10 py-20 border-y border-border bg-bg-secondary/30">
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div ref={stat1.ref}>
              <div className="text-4xl md:text-5xl font-black gradient-text">{stat1.value}</div>
              <div className="text-sm text-text-muted mt-2 font-medium">Applications Sent</div>
            </div>
            <div ref={stat2.ref}>
              <div className="text-4xl md:text-5xl font-black gradient-text-green">{stat2.value}</div>
              <div className="text-sm text-text-muted mt-2 font-medium">ATS Pass Rate</div>
            </div>
            <div ref={stat3.ref}>
              <div className="text-4xl md:text-5xl font-black gradient-text-blue">{stat3.value}</div>
              <div className="text-sm text-text-muted mt-2 font-medium">Interview Rate</div>
            </div>
            <div ref={stat4.ref}>
              <div className="text-4xl md:text-5xl font-black gradient-text-purple">{stat4.value}</div>
              <div className="text-sm text-text-muted mt-2 font-medium">Job Portal Connectors</div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== RESUME OPTIMIZER SHOWCASE ===== */}
      <section className="relative z-10 py-24">
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <Reveal>
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-xs font-semibold text-accent-green mb-4">
                  Resume Intelligence
                </div>
                <h2 className="text-[clamp(2rem,4vw,3rem)] font-black tracking-[-1.5px] mb-4">
                  Your Resume, <span className="gradient-text-green">Perfected</span> for Every Job
                </h2>
                <p className="text-text-secondary leading-relaxed mb-8">
                  ApplyMaster doesn&apos;t just add keywords. It restructures your entire resume to match each job description — skills order, bullet points, achievements — everything optimized for maximum ATS compatibility.
                </p>

                <div className="space-y-4">
                  {[
                    { label: 'ATS Format Compliance', score: 98, color: 'bg-accent-green' },
                    { label: 'Keyword Match', score: 96, color: 'bg-accent-pink' },
                    { label: 'Skills Alignment', score: 94, color: 'bg-accent-blue' },
                    { label: 'Experience Relevance', score: 91, color: 'bg-accent-purple' },
                  ].map((bar) => (
                    <div key={bar.label} className="flex items-center gap-3">
                      <span className="text-xs text-text-secondary w-40 shrink-0">{bar.label}</span>
                      <div className="flex-1 h-2 rounded-full bg-bg-input overflow-hidden">
                        <div className={`h-full rounded-full ${bar.color} transition-all duration-1000`} style={{ width: `${bar.score}%` }} />
                      </div>
                      <span className="text-xs font-bold w-10 text-right" style={{ color: `var(--${bar.color.replace('bg-', '')})` }}>{bar.score}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            <Reveal delay={200}>
              <div className="relative">
                {/* Before/After */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-bg-card border border-accent-red/20">
                    <div className="text-xs font-bold text-accent-red mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-accent-red" /> BEFORE
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 rounded bg-white/5 w-full" />
                      <div className="h-3 rounded bg-white/5 w-3/4" />
                      <div className="h-3 rounded bg-accent-red/10 w-full border border-accent-red/20 relative">
                        <span className="absolute -right-1 -top-1 w-3 h-3 rounded-full bg-accent-red text-[6px] flex items-center justify-center text-white font-bold">!</span>
                      </div>
                      <div className="h-3 rounded bg-white/5 w-5/6" />
                      <div className="h-3 rounded bg-accent-red/10 w-2/3 border border-accent-red/20 relative">
                        <span className="absolute -right-1 -top-1 w-3 h-3 rounded-full bg-accent-red text-[6px] flex items-center justify-center text-white font-bold">!</span>
                      </div>
                    </div>
                    <div className="mt-4 text-center">
                      <div className="text-2xl font-black text-accent-red">62</div>
                      <div className="text-[10px] text-text-muted">ATS Score</div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-bg-card border border-accent-green/20">
                    <div className="text-xs font-bold text-accent-green mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-accent-green" /> AFTER
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 rounded bg-accent-green/10 w-full border border-accent-green/20" />
                      <div className="h-3 rounded bg-accent-green/10 w-3/4 border border-accent-green/20" />
                      <div className="h-3 rounded bg-accent-green/10 w-full border border-accent-green/20 relative">
                        <span className="absolute -right-1 -top-1 w-3 h-3 rounded-full bg-accent-green text-[6px] flex items-center justify-center text-white font-bold">✓</span>
                      </div>
                      <div className="h-3 rounded bg-accent-green/10 w-5/6 border border-accent-green/20" />
                      <div className="h-3 rounded bg-accent-green/10 w-2/3 border border-accent-green/20 relative">
                        <span className="absolute -right-1 -top-1 w-3 h-3 rounded-full bg-accent-green text-[6px] flex items-center justify-center text-white font-bold">✓</span>
                      </div>
                    </div>
                    <div className="mt-4 text-center">
                      <div className="text-2xl font-black text-accent-green">97</div>
                      <div className="text-[10px] text-text-muted">ATS Score</div>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ===== JOB PORTALS ===== */}
      <section className="relative z-10 py-20 bg-bg-secondary/30">
        <div className="max-w-[1280px] mx-auto px-6">
          <Reveal>
            <div className="text-center mb-12">
              <h2 className="text-[clamp(1.8rem,3.5vw,2.8rem)] font-black tracking-[-1px] mb-4">
                Connected to <span className="gradient-text">50+ Job Portals</span> Worldwide
              </h2>
              <p className="text-text-secondary max-w-xl mx-auto text-sm">From LinkedIn to Naukri, Greenhouse to Workday — one platform to rule them all.</p>
            </div>
          </Reveal>

          <Reveal delay={200}>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {['LinkedIn', 'Indeed', 'Glassdoor', 'ZipRecruiter', 'Greenhouse', 'Lever', 'Workday', 'Naukri', 'Instahyre', 'Dice', 'Wellfound', 'Monster', 'CareerBuilder', 'SimplyHired', 'Hirect', 'iCIMS', 'SmartRecruiters', 'Taleo', 'SEEK', 'Reed', 'StepStone', 'Bayt', 'Foundit', 'Hired'].map((portal) => (
                <div key={portal} className="p-3 rounded-lg bg-bg-card border border-border text-center hover:border-accent-pink/30 hover:bg-bg-card-hover transition-all cursor-default">
                  <span className="text-xs font-semibold text-text-secondary">{portal}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section id="pricing" className="relative z-10 py-24">
        <div className="max-w-[1280px] mx-auto px-6">
          <Reveal>
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-xs font-semibold text-accent-pink mb-4">
                Simple Pricing
              </div>
              <h2 className="text-[clamp(2rem,4vw,3.2rem)] font-black tracking-[-1.5px] mb-4">
                Start Free, <span className="gradient-text">Scale When Ready</span>
              </h2>
              <p className="text-text-secondary max-w-lg mx-auto mb-8">No hidden fees. No credit card required. Cancel anytime.</p>

              {/* Toggle */}
              <div className="inline-flex items-center gap-3 p-1 rounded-full bg-bg-card border border-border">
                <button onClick={() => setActivePricing('monthly')} className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${activePricing === 'monthly' ? 'bg-accent-pink text-white' : 'text-text-secondary'}`}>Monthly</button>
                <button onClick={() => setActivePricing('annual')} className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${activePricing === 'annual' ? 'bg-accent-pink text-white' : 'text-text-secondary'}`}>
                  Annual <span className="text-[10px] text-accent-green font-bold ml-1">Save 40%</span>
                </button>
              </div>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto">
            {[
              {
                name: 'Free', price: '$0', annual: '$0', desc: 'Get started instantly',
                features: ['10 applications/month', 'Basic resume optimizer', 'Job search', 'Application tracker', 'Email support'],
                cta: 'Start Free', popular: false, ctaStyle: 'glass',
              },
              {
                name: 'Pro', price: '$29', annual: '$17', desc: 'For serious job seekers',
                features: ['100 applications/month', 'AI resume tailoring', 'Cover letter generator', 'All 50+ job portals', 'Chrome extension', 'Scam detection', 'Priority support'],
                cta: 'Go Pro', popular: true, ctaStyle: 'primary',
              },
              {
                name: 'Elite', price: '$59', annual: '$35', desc: 'Maximum firepower',
                features: ['Unlimited applications', 'Everything in Pro', 'Live interview coach', 'A/B resume testing', 'Recruiter outreach', 'Referral emails', 'Auto-apply autopilot', 'Dedicated support'],
                cta: 'Go Elite', popular: false, ctaStyle: 'primary',
              },
              {
                name: 'Lifetime', price: '$199', annual: '$199', desc: 'Pay once, use forever',
                features: ['Everything in Elite', 'Lifetime access', 'All future features', 'Priority everything', 'Early beta access', '1-on-1 onboarding'],
                cta: 'Get Lifetime', popular: false, ctaStyle: 'glass',
              },
            ].map((plan) => (
              <Reveal key={plan.name}>
                <div className={`relative h-full p-6 rounded-xl bg-bg-card border transition-all duration-300 hover:translate-y-[-4px] ${plan.popular ? 'border-accent-pink glow-pink' : 'border-border hover:border-border-hover'}`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-accent-pink to-[#e84393] text-white text-[10px] font-bold uppercase tracking-wider">
                      Most Popular
                    </div>
                  )}
                  <div className="mb-4">
                    <h3 className="text-lg font-bold mb-1">{plan.name}</h3>
                    <p className="text-xs text-text-muted">{plan.desc}</p>
                  </div>
                  <div className="mb-6">
                    <span className="text-4xl font-black">{activePricing === 'monthly' ? plan.price : plan.annual}</span>
                    {plan.name !== 'Lifetime' && <span className="text-sm text-text-muted">/mo</span>}
                    {plan.name === 'Lifetime' && <span className="text-sm text-text-muted"> once</span>}
                  </div>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-text-secondary">
                        <span className="text-accent-green mt-0.5 text-xs">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <a href="/signup" className={`block text-center py-3 rounded-lg font-bold text-sm transition-all ${
                    plan.ctaStyle === 'primary'
                      ? 'bg-gradient-to-r from-accent-pink to-[#e84393] text-white hover:translate-y-[-1px] glow-pink-strong'
                      : 'glass text-white hover:bg-white/5'
                  }`}>
                    {plan.cta}
                  </a>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="relative z-10 py-24 bg-bg-secondary/30">
        <div className="max-w-[1280px] mx-auto px-6">
          <Reveal>
            <div className="text-center mb-12">
              <h2 className="text-[clamp(2rem,4vw,3.2rem)] font-black tracking-[-1.5px] mb-4">
                Loved by <span className="gradient-text">Job Seekers</span> Worldwide
              </h2>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                quote: "ApplyMaster got me 12 interviews in 2 weeks. I was manually applying for 3 months with zero callbacks. This changed everything.",
                name: 'Sarah Chen', role: 'Software Engineer → Google', avatar: 'SC',
              },
              {
                quote: "The resume optimizer alone is worth the subscription. My ATS score went from 58 to 96. The auto-apply is just a bonus at this point.",
                name: 'James Rodriguez', role: 'Data Scientist → Meta', avatar: 'JR',
              },
              {
                quote: "I was skeptical about AI applying for me. But the Copilot mode lets me review everything before it goes out. Landed a $280K offer.",
                name: 'Priya Sharma', role: 'ML Engineer → Stripe', avatar: 'PS',
              },
            ].map((t, i) => (
              <Reveal key={t.name} delay={i * 100}>
                <div className="p-6 rounded-xl bg-bg-card border border-border hover:border-border-hover transition-all">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, j) => (
                      <span key={j} className="text-accent-yellow text-sm">★</span>
                    ))}
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed mb-6 italic">&ldquo;{t.quote}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-pink to-accent-purple flex items-center justify-center text-white text-xs font-bold">
                      {t.avatar}
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{t.name}</div>
                      <div className="text-xs text-text-muted">{t.role}</div>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section id="faq" className="relative z-10 py-24">
        <div className="max-w-3xl mx-auto px-6">
          <Reveal>
            <div className="text-center mb-12">
              <h2 className="text-[clamp(2rem,4vw,3.2rem)] font-black tracking-[-1.5px] mb-4">
                Frequently Asked <span className="gradient-text">Questions</span>
              </h2>
            </div>
          </Reveal>

          <Reveal>
            <div className="space-y-3">
              <FAQ question="Is ApplyMaster free to use?" answer="Yes! Our Free plan gives you 10 applications per month, basic resume optimization, and full access to the job search and application tracker. No credit card required." />
              <FAQ question="Will employers know I used AI to apply?" answer="No. Every application is indistinguishable from a hand-crafted one. Your resume is uniquely tailored per job, cover letters reference specific company details, and screening questions are answered contextually." />
              <FAQ question="Which job portals do you support?" answer="We support 50+ job portals globally including LinkedIn, Indeed, Glassdoor, ZipRecruiter, Greenhouse, Lever, Workday, Naukri, Instahyre, Dice, Wellfound, Monster, SEEK, Reed, and many more. We add new integrations every week." />
              <FAQ question="What is Copilot vs Autopilot mode?" answer="Copilot mode queues every application for your review before submission — you see the tailored resume, cover letter, and answers, then approve with one click. Autopilot mode applies automatically to jobs above your match threshold. Most users start with Copilot and switch to Autopilot once they trust the system." />
              <FAQ question="How does the Live Interview Coach work?" answer="Our Chrome extension captures the interviewer's audio during video calls (Google Meet, Zoom Web, Teams), transcribes it in real-time, and displays AI-generated answer suggestions on your screen. It's like having a career coach whispering in your ear." />
              <FAQ question="Can I cancel anytime?" answer="Absolutely. No contracts, no cancellation fees. Cancel with one click from your dashboard. Your data is yours — export everything anytime." />
              <FAQ question="Is my data safe?" answer="Yes. We use AES-256 encryption, your resume data is stored in SOC 2 compliant infrastructure, and we never share your information with employers or third parties. You can delete all your data with one click." />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="relative z-10 py-24">
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="relative rounded-2xl overflow-hidden p-16 text-center">
            {/* BG gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-accent-pink/10 via-accent-purple/5 to-accent-blue/10 border border-border rounded-2xl" />
            <div className="absolute inset-0 bg-bg-card/50 rounded-2xl" />
            <div className="relative z-10">
              <h2 className="text-[clamp(2rem,4.5vw,3.5rem)] font-black tracking-[-2px] mb-4">
                Ready to <span className="gradient-text">10x Your Job Search?</span>
              </h2>
              <p className="text-text-secondary max-w-lg mx-auto mb-8 text-lg">
                Join 10,000+ job seekers who stopped applying manually and started getting interviews.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <a href="/signup" className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-accent-pink to-[#e84393] text-white font-bold text-lg glow-pink-strong hover:translate-y-[-2px] transition-all">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                  Start Free — No Credit Card
                </a>
              </div>
              <p className="text-xs text-text-muted mt-4">Free forever plan available. Upgrade when you&apos;re ready.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="relative z-10 border-t border-border py-16 bg-bg-secondary/30">
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <a href="/" className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent-pink to-[#e84393] flex items-center justify-center text-white font-black text-sm">AM</div>
                <span className="text-lg font-extrabold tracking-tight">Apply<span className="text-accent-pink">Master</span></span>
              </a>
              <p className="text-sm text-text-muted leading-relaxed">AI-powered job application automation. A product by 3GP.AI.</p>
            </div>
            <div>
              <h5 className="font-bold text-sm mb-4">Product</h5>
              <div className="space-y-3">
                <a href="#features" className="block text-sm text-text-secondary hover:text-white transition-colors">Features</a>
                <a href="#pricing" className="block text-sm text-text-secondary hover:text-white transition-colors">Pricing</a>
                <a href="#demo" className="block text-sm text-text-secondary hover:text-white transition-colors">Demo</a>
                <a href="#" className="block text-sm text-text-secondary hover:text-white transition-colors">Chrome Extension</a>
              </div>
            </div>
            <div>
              <h5 className="font-bold text-sm mb-4">Company</h5>
              <div className="space-y-3">
                <a href="https://3gp.ai/about" className="block text-sm text-text-secondary hover:text-white transition-colors">About 3GP.AI</a>
                <a href="https://3gp.ai" className="block text-sm text-text-secondary hover:text-white transition-colors">All Products</a>
                <a href="#" className="block text-sm text-text-secondary hover:text-white transition-colors">Blog</a>
                <a href="#" className="block text-sm text-text-secondary hover:text-white transition-colors">Careers</a>
              </div>
            </div>
            <div>
              <h5 className="font-bold text-sm mb-4">Legal</h5>
              <div className="space-y-3">
                <a href="/privacy" className="block text-sm text-text-secondary hover:text-white transition-colors">Privacy Policy</a>
                <a href="/terms" className="block text-sm text-text-secondary hover:text-white transition-colors">Terms of Service</a>
                <a href="#" className="block text-sm text-text-secondary hover:text-white transition-colors">Security</a>
              </div>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-border">
            <span className="text-xs text-text-muted">&copy; 2026 ApplyMaster by 3GP.AI — All rights reserved.</span>
            <div className="flex items-center gap-4 mt-4 md:mt-0">
              <a href="#" className="text-text-muted hover:text-white transition-colors text-sm">Twitter</a>
              <a href="#" className="text-text-muted hover:text-white transition-colors text-sm">LinkedIn</a>
              <a href="#" className="text-text-muted hover:text-white transition-colors text-sm">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
