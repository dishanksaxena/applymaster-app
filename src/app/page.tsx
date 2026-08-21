'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import ThemeToggle from '@/components/ThemeToggle'

/* ============================================================
   ApplyMaster landing page

   Rebuilt on the token system in globals.css. Everything here is
   theme-aware: there are no hardcoded hex colours.

   Deliberately removed from the previous version — these were the
   strongest "dated" signals and the biggest mobile cost:
     ParticleField   80-node canvas with rAF loop + mouse repulsion
     MagneticCursor  custom cursor (also broke pointer accessibility)
     Tilt3D          3D tilt on every card
     TypeWriter      rotating headline
     GradientMesh    three animated blur orbs
     marquee         scrolling logo strip -> now a static list
   ============================================================ */

/* ---------- reduced motion ---------- */
function useReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    if (!window.matchMedia) return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const on = () => setReduced(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return reduced
}

/* ---------- scroll reveal ---------- */
function Reveal({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (reduced) { setShown(true); return }
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setTimeout(() => setShown(true), delay)
          io.unobserve(el)
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [delay, reduced])

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? 'none' : 'translateY(18px)',
        transition: reduced ? 'none' : 'opacity .6s cubic-bezier(.16,1,.3,1), transform .6s cubic-bezier(.16,1,.3,1)',
      }}
    >
      {children}
    </div>
  )
}

/* ---------- count-up ---------- */
function AnimatedCounter({ end, suffix = '' }: { end: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [n, setN] = useState(0)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (reduced) { setN(end); return }
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      io.unobserve(el)
      const start = performance.now()
      const tick = (now: number) => {
        const p = Math.min((now - start) / 1800, 1)
        setN(Math.round(end * (1 - Math.pow(1 - p, 3))))
        if (p < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }, { threshold: 0.4 })
    io.observe(el)
    return () => io.disconnect()
  }, [end, reduced])

  return <span ref={ref}>{n}{suffix}</span>
}

/* ---------- live activity feed ---------- */
type FeedTone = 'success' | 'accent' | 'info' | 'warn' | 'dim'

function LiveActivityFeed() {
  const [lines, setLines] = useState<{ time: string; msg: string; tone: FeedTone }[]>([])
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()

  const msgs = useMemo<{ msg: string; tone: FeedTone }[]>(() => [
    { msg: 'Scanning LinkedIn for Senior Engineer roles...', tone: 'dim' },
    { msg: 'Found 8 new matches above 85% threshold', tone: 'success' },
    { msg: 'Analyzing: Senior AI Engineer at Google - Match: 96%', tone: 'accent' },
    { msg: 'Tailoring resume: restructuring skills, adding keywords...', tone: 'dim' },
    { msg: 'Resume optimized - ATS Score: 97/100', tone: 'success' },
    { msg: 'Generating cover letter with 5 company-specific data points...', tone: 'dim' },
    { msg: 'Application submitted to Google DeepMind', tone: 'success' },
    { msg: 'Analyzing: ML Platform Lead at Meta - Match: 94%', tone: 'accent' },
    { msg: 'Application submitted to Meta', tone: 'success' },
    { msg: 'Skipping Junior Dev at Acme - 42% match, below threshold', tone: 'warn' },
    { msg: 'Analyzing: Staff Engineer at Stripe - Match: 92%', tone: 'accent' },
    { msg: 'Answering 3 screening questions automatically...', tone: 'dim' },
    { msg: 'Application submitted to Stripe', tone: 'success' },
    { msg: 'Daily progress: 12 sent, 38 in queue, 3 interviews scheduled', tone: 'info' },
  ], [])

  useEffect(() => {
    setLines(msgs.slice(0, 5).map((m, j) => ({ time: `14:3${j}:0${j * 2}`, ...m })))
    if (reduced) return
    let i = 4
    const iv = setInterval(() => {
      i = (i + 1) % msgs.length
      const t = new Date().toTimeString().split(' ')[0]
      setLines(prev => [...prev.slice(-7), { time: t, ...msgs[i] }])
    }, 2500)
    return () => clearInterval(iv)
  }, [msgs, reduced])

  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight }, [lines])

  const tone: Record<FeedTone, string> = {
    success: 'var(--green)',
    accent: 'var(--accent)',
    info: 'var(--blue)',
    warn: 'var(--yellow)',
    dim: 'var(--text-muted)',
  }

  return (
    <div
      ref={ref}
      className="font-mono text-[11px] leading-relaxed space-y-1.5 max-h-[180px] overflow-y-auto"
      aria-live="polite"
      aria-label="Auto-apply activity"
    >
      {lines.map((l, i) => (
        <div key={`${l.time}-${i}`} className="flex gap-3">
          <span className="shrink-0 select-none" style={{ color: 'var(--text-faint)' }}>{l.time}</span>
          <span style={{ color: tone[l.tone] }}>{l.msg}</span>
        </div>
      ))}
    </div>
  )
}

/* ---------- FAQ disclosure ---------- */
function FAQ({ q, a, id }: { q: string; a: string; id: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-xl overflow-hidden transition-colors" style={{ border: '1px solid var(--border)' }}>
      <h3>
        <button
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-controls={`faq-panel-${id}`}
          id={`faq-btn-${id}`}
          className="w-full flex items-center justify-between gap-4 p-5 text-left"
        >
          <span className="font-semibold text-[15px]" style={{ color: 'var(--text)' }}>{q}</span>
          <span
            className="shrink-0 grid place-items-center w-7 h-7 rounded-full text-sm transition-transform"
            style={{
              background: open ? 'var(--accent-solid)' : 'var(--bg-overlay)',
              color: open ? 'var(--text-on-accent)' : 'var(--text-secondary)',
              transform: open ? 'rotate(45deg)' : 'none',
            }}
            aria-hidden="true"
          >
            +
          </span>
        </button>
      </h3>
      <div
        id={`faq-panel-${id}`}
        role="region"
        aria-labelledby={`faq-btn-${id}`}
        hidden={!open}
      >
        <p className="px-5 pb-5 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{a}</p>
      </div>
    </div>
  )
}

/* ---------- buttons ---------- */
function PrimaryLink({ href, children, size = 'lg' }: { href: string; children: React.ReactNode; size?: 'sm' | 'lg' }) {
  return (
    <a
      href={href}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-transform hover:-translate-y-0.5 ${
        size === 'lg' ? 'px-7 py-3.5 text-[15px]' : 'px-5 py-2.5 text-[13px]'
      }`}
      style={{ background: 'var(--accent-solid)', color: 'var(--text-on-accent)', boxShadow: 'var(--shadow-accent)' }}
    >
      {children}
    </a>
  )
}

function SecondaryLink({ href, children, size = 'lg' }: { href: string; children: React.ReactNode; size?: 'sm' | 'lg' }) {
  return (
    <a
      href={href}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors ${
        size === 'lg' ? 'px-7 py-3.5 text-[15px]' : 'px-5 py-2.5 text-[13px]'
      }`}
      style={{ background: 'var(--bg-card)', color: 'var(--text)', border: '1px solid var(--border-hover)' }}
    >
      {children}
    </a>
  )
}

/* ---------- icons (replaces the emoji the old build used) ---------- */
const S = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

const ICON = {
  bolt: <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />,
  doc: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></>,
  mail: <><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 6L2 7" /></>,
  target: <><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></>,
  mic: <><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /></>,
  board: <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 3v18M15 3v18" /></>,
  upload: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></>,
  sliders: <><line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" /><line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" /><line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" /><line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" /></>,
  cpu: <><rect x="4" y="4" width="16" height="16" rx="2" /><rect x="9" y="9" width="6" height="6" /><path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3" /></>,
  trophy: <><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M6 2h12v7a6 6 0 0 1-12 0z" /><path d="M9 22h6M12 15v7" /></>,
  check: <polyline points="20 6 9 17 4 12" />,
  arrow: <path d="M5 12h14M12 5l7 7-7 7" />,
  play: <polygon points="6 3 20 12 6 21 6 3" />,
}

function Icon({ path, size = 18 }: { path: React.ReactNode; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...S} aria-hidden="true">
      {path}
    </svg>
  )
}

/* ---------- hero proof cards ----------
   Restored after the first redesign pass stripped them. The particle
   canvas and 3D tilt deserved to go; these did not — each states a
   concrete outcome, which is the strongest thing the hero can say. */
const FLOATERS = [
  {
    label: 'Resume optimised',
    sub: 'ATS score 97/100',
    tone: 'var(--green)',
    dim: 'var(--green-dim)',
    icon: ICON.check,
    pos: '-top-5 -right-4',
    delay: '0s',
  },
  {
    label: 'Auto-applied to 3 jobs',
    sub: 'in the last hour',
    tone: 'var(--accent)',
    dim: 'var(--accent-dim)',
    icon: ICON.bolt,
    pos: '-bottom-5 -left-5',
    delay: '-2.3s',
  },
  {
    label: 'Interview invite',
    sub: 'Google DeepMind',
    tone: 'var(--blue)',
    dim: 'var(--blue-dim)',
    icon: ICON.mail,
    pos: 'top-1/2 -right-7',
    delay: '-4.6s',
  },
]

/* ---------- feature card ---------- */
type Accent = 'accent' | 'green' | 'blue' | 'purple' | 'yellow'

function FeatureCard({
  icon, title, desc, chips, tone, index,
}: {
  icon: React.ReactNode; title: string; desc: string; chips: string[]; tone: Accent; index: number
}) {
  const c = `var(--${tone === 'accent' ? 'accent' : tone})`
  const dim = `var(--${tone === 'accent' ? 'accent-dim' : `${tone}-dim`})`

  return (
    <Reveal delay={index * 70} className="h-full">
      <div
        className="group h-full p-7 rounded-2xl transition-all duration-300 hover:-translate-y-1"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
      >
        <div className="w-11 h-11 rounded-xl grid place-items-center mb-5" style={{ background: dim, color: c }}>
          <Icon path={icon} size={20} />
        </div>
        <h3 className="text-[17px] font-semibold tracking-tight mb-2.5" style={{ color: 'var(--text)' }}>{title}</h3>
        <p className="text-[13.5px] leading-relaxed mb-5" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
        <div className="flex flex-wrap gap-2">
          {chips.map(ch => (
            <span key={ch} className="text-[10.5px] font-semibold px-2.5 py-1 rounded-full" style={{ background: dim, color: c }}>
              {ch}
            </span>
          ))}
        </div>
      </div>
    </Reveal>
  )
}

/* ============================================================
   PAGE
   ============================================================ */
export default function Home() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenu, setMobileMenu] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [billing, setBilling] = useState<'mo' | 'yr'>('mo')
  const reduced = useReducedMotion()

  useEffect(() => {
    const check = async () => {
      try {
        const { createClient } = await import('@/lib/supabase-browser')
        const { data: { user } } = await createClient().auth.getUser()
        if (user) setIsLoggedIn(true)
      } catch { /* not signed in */ }
    }
    check()
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const navLinks = ['Features', 'How It Works', 'Pricing', 'FAQ']
  const anchor = (l: string) => `#${l.toLowerCase().replace(/ /g, '-')}`

  const plans = [
    { name: 'Free', price: 0, desc: 'Get started instantly', cta: 'Start Free', pop: false,
      features: ['10 applications/month', 'Basic resume optimizer', 'Job search & tracking', 'Email support'] },
    { name: 'Pro', price: billing === 'mo' ? 29 : 17, desc: 'For serious job seekers', cta: 'Go Pro', pop: true,
      features: ['100 applications/month', 'AI resume tailoring', 'Cover letter generator', 'All 50+ job portals', 'Chrome extension', 'Scam detection', 'Priority support'] },
    { name: 'Elite', price: billing === 'mo' ? 59 : 35, desc: 'Maximum firepower', cta: 'Go Elite', pop: false,
      features: ['Unlimited applications', 'Everything in Pro', 'Live interview coach', 'A/B resume testing', 'Recruiter outreach', 'Referral emails', 'Autopilot mode', 'Dedicated support'] },
    { name: 'Lifetime', price: 199, desc: 'Pay once, use forever', cta: 'Get Lifetime', pop: false,
      features: ['Everything in Elite', 'Lifetime access', 'All future features', 'Priority everything', 'Early beta access', '1-on-1 onboarding'] },
  ]

  const portals = ['LinkedIn', 'Indeed', 'Glassdoor', 'ZipRecruiter', 'Greenhouse', 'Lever', 'Workday', 'Naukri', 'Instahyre', 'Dice', 'Wellfound', 'Monster', 'SEEK', 'Reed']

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <a href="#main" className="skip-link">Skip to content</a>

      {/* ===== NAV ===== */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-colors duration-300"
        style={{
          background: scrolled ? 'var(--bg-topbar)' : 'transparent',
          backdropFilter: scrolled ? 'blur(14px) saturate(1.6)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(14px) saturate(1.6)' : 'none',
          borderBottom: `1px solid ${scrolled ? 'var(--border)' : 'transparent'}`,
        }}
      >
        <div className="max-w-[1240px] mx-auto px-6 lg:px-8 flex items-center justify-between h-[72px]">
          <a href="/" className="flex items-center gap-2.5">
            <span
              className="w-9 h-9 rounded-lg grid place-items-center font-bold text-[12px]"
              style={{ background: 'var(--accent-solid)', color: 'var(--text-on-accent)' }}
            >
              AM
            </span>
            <span className="text-[18px] font-bold tracking-tight" style={{ color: 'var(--text)' }}>
              Apply<span style={{ color: 'var(--accent)' }}>Master</span>
            </span>
          </a>

          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map(l => (
              <a
                key={l}
                href={anchor(l)}
                className="px-3 py-2 rounded-lg text-[13.5px] font-medium transition-colors"
                style={{ color: 'var(--text-secondary)' }}
              >
                {l}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            {isLoggedIn ? (
              <PrimaryLink href="/dashboard" size="sm">Go to dashboard</PrimaryLink>
            ) : (
              <>
                <a href="/login" className="hidden lg:inline-block px-4 py-2 text-[13.5px] font-semibold rounded-lg transition-colors" style={{ color: 'var(--text-secondary)' }}>
                  Log in
                </a>
                <span className="hidden lg:inline-block"><PrimaryLink href="/signup" size="sm">Start free</PrimaryLink></span>
              </>
            )}
            <button
              onClick={() => setMobileMenu(!mobileMenu)}
              className="lg:hidden grid place-items-center w-9 h-9 rounded-md"
              style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
              aria-label="Toggle menu"
              aria-expanded={mobileMenu}
              aria-controls="mobile-menu"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" {...S} strokeWidth={2} aria-hidden="true">
                {mobileMenu ? <path d="M18 6 6 18M6 6l12 12" /> : <path d="M3 12h18M3 6h18M3 18h18" />}
              </svg>
            </button>
          </div>
        </div>

        {mobileMenu && (
          <div
            id="mobile-menu"
            className="lg:hidden p-6 space-y-1"
            style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}
          >
            {navLinks.map(l => (
              <a
                key={l}
                href={anchor(l)}
                onClick={() => setMobileMenu(false)}
                className="block px-3 py-3 rounded-lg text-[15px] font-medium"
                style={{ color: 'var(--text-secondary)' }}
              >
                {l}
              </a>
            ))}
            <div className="pt-3">
              <a
                href={isLoggedIn ? '/dashboard' : '/signup'}
                className="block text-center py-3 rounded-full font-semibold"
                style={{ background: 'var(--accent-solid)', color: 'var(--text-on-accent)' }}
              >
                {isLoggedIn ? 'Go to dashboard' : 'Start free'}
              </a>
            </div>
          </div>
        )}
      </nav>

      <main id="main">
        {/* ===== HERO ===== */}
        <section className="pt-[132px] pb-20 lg:pt-[152px]">
          <div className="max-w-[1240px] mx-auto px-6 lg:px-8">
            <div className="grid lg:grid-cols-[1fr_1.05fr] gap-14 lg:gap-20 items-center">
              <div>
                <Reveal>
                  <div
                    className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full text-[12px] font-semibold mb-7"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)', boxShadow: 'var(--shadow-sm)' }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--green)' }} />
                    Now in public beta &mdash; free forever plan available
                  </div>
                </Reveal>

                <Reveal delay={60}>
                  <h1 className="font-display text-[clamp(2.9rem,6vw,4.6rem)] mb-6" style={{ color: 'var(--text)' }}>
                    Stop applying.<br />
                    Start <em className="font-display-italic" style={{ color: 'var(--accent)' }}>getting hired.</em>
                  </h1>
                </Reveal>

                <Reveal delay={120}>
                  <p className="text-[17px] leading-[1.7] mb-9 max-w-[500px]" style={{ color: 'var(--text-secondary)' }}>
                    ApplyMaster&apos;s AI applies to jobs <strong style={{ color: 'var(--text)' }}>24/7</strong>, tailors your resume{' '}
                    <strong style={{ color: 'var(--text)' }}>per role</strong>, writes cover letters, and coaches you through
                    interviews &mdash; all on <strong style={{ color: 'var(--accent)' }}>autopilot</strong>.
                  </p>
                </Reveal>

                <Reveal delay={180}>
                  <div className="flex flex-wrap gap-3 mb-11">
                    <PrimaryLink href="/signup"><Icon path={ICON.bolt} /> Start free &mdash; no card required</PrimaryLink>
                    <SecondaryLink href="#demo"><Icon path={ICON.play} /> See it in action</SecondaryLink>
                  </div>
                </Reveal>

                <Reveal delay={240}>
                  <div className="flex items-center gap-10 pt-6" style={{ borderTop: '1px solid var(--border)' }}>
                    {[
                      { val: '847K+', label: 'Jobs applied' },
                      { val: '94%', label: 'ATS pass rate' },
                      { val: '3.2x', label: 'More interviews' },
                    ].map(s => (
                      <div key={s.label}>
                        <div className="font-display text-[26px]" style={{ color: 'var(--accent)' }}>{s.val}</div>
                        <div className="text-[11.5px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                </Reveal>
              </div>

              {/* Dashboard mockup */}
              <Reveal delay={140}>
                <div className="relative">
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-xl)' }}
                >
                  <div className="flex items-center gap-2 px-4 py-3" style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                    <div className="flex gap-1.5">
                      {[0, 1, 2].map(i => <span key={i} className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--border-hover)' }} />)}
                    </div>
                    <div className="flex-1 mx-4 px-3 py-1 rounded-md text-[11px] text-center font-mono" style={{ background: 'var(--bg-overlay)', color: 'var(--text-muted)' }}>
                      applymaster.ai/dashboard
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="grid grid-cols-4 gap-2.5">
                      {[
                        { label: 'Applied', val: '847', delta: '+18%', c: 'var(--accent)' },
                        { label: 'Views', val: '312', delta: '+24%', c: 'var(--blue)' },
                        { label: 'Interviews', val: '48', delta: '+32%', c: 'var(--green)' },
                        { label: 'Match rate', val: '94%', delta: '+12%', c: 'var(--purple)' },
                      ].map(s => (
                        <div key={s.label} className="p-2.5 rounded-xl" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.c }} />
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'var(--green-dim)', color: 'var(--green)' }}>{s.delta}</span>
                          </div>
                          <div className="text-[17px] font-bold" style={{ color: s.c }}>{s.val}</div>
                          <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2">
                      {[
                        { title: 'Senior AI Engineer', co: 'Google DeepMind', match: 96, tag: 'Remote', salary: '$220k-350k' },
                        { title: 'ML Platform Lead', co: 'Meta', match: 94, tag: 'Remote', salary: '$250k-380k' },
                        { title: 'Staff Engineer, AI', co: 'Stripe', match: 92, tag: 'Hybrid', salary: '$230k-370k' },
                      ].map(j => (
                        <div key={j.title} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                          <span className="w-8 h-8 rounded-lg grid place-items-center text-[11px] font-bold shrink-0" style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>
                            {j.co[0]}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="text-[12px] font-semibold truncate" style={{ color: 'var(--text)' }}>{j.title}</div>
                            <div className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>{j.co} &middot; {j.salary}</div>
                          </div>
                          <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full shrink-0" style={{ background: 'var(--green-dim)', color: 'var(--green)' }}>{j.tag}</span>
                          <span className="w-8 h-8 rounded-full grid place-items-center text-[10px] font-bold shrink-0" style={{ border: `2px solid var(--green)`, color: 'var(--green)' }}>{j.match}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl" style={{ background: 'var(--green-dim)', border: '1px solid var(--border)' }}>
                      <span className="flex items-center gap-2 text-[11px] font-bold" style={{ color: 'var(--green)' }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--green)' }} />
                        Auto-apply engine running
                      </span>
                      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>12 sent today &middot; 3 interviews</span>
                    </div>
                  </div>
                </div>

                {/* Floating proof cards. These earn their place — each one
                    names a concrete outcome the product produced. The drift
                    is 6px over 7s and is disabled under reduced-motion. */}
                {FLOATERS.map(f => (
                  <div
                    key={f.label}
                    className={`hidden md:flex items-center gap-2.5 absolute z-20 px-3 py-2.5 rounded-xl ${f.pos} ${reduced ? '' : 'am-drift'}`}
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      boxShadow: 'var(--shadow-lg)',
                      animationDelay: f.delay,
                    }}
                  >
                    <span className="grid place-items-center w-7 h-7 rounded-lg shrink-0" style={{ background: f.dim, color: f.tone }}>
                      <Icon path={f.icon} size={14} />
                    </span>
                    <span>
                      <span className="block text-[11.5px] font-bold leading-tight" style={{ color: f.tone }}>{f.label}</span>
                      <span className="block text-[10px] leading-tight mt-0.5" style={{ color: 'var(--text-muted)' }}>{f.sub}</span>
                    </span>
                  </div>
                ))}
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ===== PORTAL STRIP (was a scrolling marquee) ===== */}
        <section className="py-8" style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
          <div className="max-w-[1240px] mx-auto px-6 lg:px-8">
            <p className="text-center text-[11px] uppercase tracking-[0.14em] mb-5" style={{ color: 'var(--text-muted)' }}>
              Applies across 50+ job portals and ATS platforms
            </p>
            <ul className="flex flex-wrap items-center justify-center gap-x-7 gap-y-3">
              {portals.map(n => (
                <li key={n} className="text-[13px] font-semibold" style={{ color: 'var(--text-faint)' }}>{n}</li>
              ))}
            </ul>
            <p className="text-center mt-5">
              <a href="/integrations" className="text-[13px] font-semibold underline underline-offset-4" style={{ color: 'var(--accent)' }}>
                See every supported platform
              </a>
            </p>
          </div>
        </section>

        {/* ===== FEATURES ===== */}
        <section id="features" className="py-24">
          <div className="max-w-[1240px] mx-auto px-6 lg:px-8">
            <Reveal>
              <div className="text-center mb-14 max-w-[620px] mx-auto">
                <div className="inline-flex items-center px-3 py-1.5 rounded-full text-[11.5px] font-semibold mb-5" style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>
                  Core features
                </div>
                <h2 className="font-display text-[clamp(2.1rem,4.4vw,3.2rem)] mb-4" style={{ color: 'var(--text)' }}>
                  Six AI tools that work <em className="font-display-italic" style={{ color: 'var(--accent)' }}>while you sleep</em>
                </h2>
                <p className="text-[15.5px]" style={{ color: 'var(--text-secondary)' }}>
                  Every feature is built to get you hired faster. No fluff, no gimmicks.
                </p>
              </div>
            </Reveal>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              <FeatureCard index={0} tone="accent" icon={ICON.bolt} title="Auto-Apply Engine"
                desc="AI scans 50+ job portals, tailors your resume, writes cover letters, and applies automatically — in Autopilot or Copilot mode."
                chips={['Autopilot', 'Copilot', '50+ portals', 'Smart filters']} />
              <FeatureCard index={1} tone="green" icon={ICON.doc} title="AI Resume Optimizer"
                desc="Not just keywords. AI restructures your whole resume per job — skills order, achievements, bullet points — for 95+ ATS scores."
                chips={['ATS scoring', 'Per-job tailoring', 'A/B testing', 'Keyword gaps']} />
              <FeatureCard index={2} tone="blue" icon={ICON.mail} title="Cover Letter Generator"
                desc="Personalised letters that reference the company, team, and your story. Written in seconds, indistinguishable from hand-crafted."
                chips={['Personalised', 'Tone control', 'Company research']} />
              <FeatureCard index={3} tone="purple" icon={ICON.target} title="Smart Job Matching"
                desc="AI scores every job against your profile, so you only apply where you match 80%+. Built-in scam detection filters ghost postings."
                chips={['Match scoring', 'Scam detection', 'Salary intel']} />
              <FeatureCard index={4} tone="yellow" icon={ICON.mic} title="Live Interview Coach"
                desc="Real-time answer suggestions during video interviews. AI listens, understands the question, and shows you what to say."
                chips={['Real-time', 'Mock interviews', 'Question prediction']} />
              <FeatureCard index={5} tone="accent" icon={ICON.board} title="Application Tracker"
                desc="A Kanban board tracks every application from applied to offer, with follow-up reminders, analytics, and callback tracking."
                chips={['Kanban pipeline', 'Reminders', 'Analytics']} />
            </div>
          </div>
        </section>

        {/* ===== HOW IT WORKS ===== */}
        <section id="how-it-works" className="py-24" style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
          <div className="max-w-[1240px] mx-auto px-6 lg:px-8">
            <Reveal>
              <div className="text-center mb-14">
                <div className="inline-flex items-center px-3 py-1.5 rounded-full text-[11.5px] font-semibold mb-5" style={{ background: 'var(--green-dim)', color: 'var(--green)' }}>
                  5 minute setup
                </div>
                <h2 className="font-display text-[clamp(2.1rem,4.4vw,3.2rem)]" style={{ color: 'var(--text)' }}>
                  From zero to auto-applying
                </h2>
              </div>
            </Reveal>

            <ol className="grid md:grid-cols-4 gap-8">
              {[
                { step: '01', title: 'Upload resume', desc: 'Drop your PDF or DOCX. AI parses, scores, and identifies every improvement area in seconds.', icon: ICON.upload },
                { step: '02', title: 'Set preferences', desc: 'Choose target roles, locations, salary range, work authorisation. AI learns exactly what you want.', icon: ICON.sliders },
                { step: '03', title: 'AI takes over', desc: 'The engine scans 50+ portals, tailors your resume per job, writes cover letters, and applies 24/7.', icon: ICON.cpu },
                { step: '04', title: 'Get interviews', desc: 'Track applications on your board, prep with the AI interview coach, and land the offer.', icon: ICON.trophy },
              ].map((item, i) => (
                <Reveal key={item.step} delay={i * 90}>
                  <li className="list-none">
                    <div className="flex items-center gap-3 mb-4 pb-3" style={{ borderBottom: '1px solid var(--border-accent)' }}>
                      <span className="font-mono text-[12px] font-semibold" style={{ color: 'var(--accent)' }}>{item.step}</span>
                      <span style={{ color: 'var(--accent)' }}><Icon path={item.icon} size={17} /></span>
                    </div>
                    <h3 className="text-[16px] font-semibold mb-2" style={{ color: 'var(--text)' }}>{item.title}</h3>
                    <p className="text-[13.5px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{item.desc}</p>
                  </li>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        {/* ===== LIVE DEMO ===== */}
        <section id="demo" className="py-24">
          <div className="max-w-[1240px] mx-auto px-6 lg:px-8">
            <Reveal>
              <div className="text-center mb-12">
                <div className="inline-flex items-center px-3 py-1.5 rounded-full text-[11.5px] font-semibold mb-5" style={{ background: 'var(--blue-dim)', color: 'var(--blue)' }}>
                  See it in action
                </div>
                <h2 className="font-display text-[clamp(2.1rem,4.4vw,3.2rem)]" style={{ color: 'var(--text)' }}>
                  Watch the AI <em className="font-display-italic" style={{ color: 'var(--accent)' }}>work in real time</em>
                </h2>
              </div>
            </Reveal>

            <Reveal>
              <div className="max-w-3xl mx-auto rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}>
                <div className="flex items-center gap-2 px-4 py-3" style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map(i => <span key={i} className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--border-hover)' }} />)}
                  </div>
                  <div className="flex-1 mx-4 px-3 py-1 rounded-md text-[11px] text-center font-mono" style={{ background: 'var(--bg-overlay)', color: 'var(--text-muted)' }}>
                    applymaster.ai/auto-apply
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[12px] font-bold" style={{ background: 'var(--green-dim)', color: 'var(--green)' }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--green)' }} />
                      Auto-apply running
                    </span>
                    <div className="flex items-center gap-4 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      <span>Today: <strong style={{ color: 'var(--green)' }}>12 applied</strong></span>
                      <span>Queue: <strong style={{ color: 'var(--blue)' }}>38 jobs</strong></span>
                      <span>Limit: <strong style={{ color: 'var(--text)' }}>27/50</strong></span>
                    </div>
                  </div>

                  <div className="rounded-xl p-4" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-bold" style={{ color: 'var(--green)' }}>Live activity feed</span>
                      <span className="text-[10px] font-mono" style={{ color: 'var(--text-faint)' }}>auto-refreshing</span>
                    </div>
                    <LiveActivityFeed />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      { label: 'Avg match', val: '96%', c: 'var(--accent)' },
                      { label: 'ATS score', val: '97', c: 'var(--green)' },
                      { label: 'Sources active', val: '5', c: 'var(--blue)' },
                      { label: 'Interviews', val: '3', c: 'var(--purple)' },
                    ].map(s => (
                      <div key={s.label} className="p-3 rounded-xl text-center" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                        <div className="text-[18px] font-bold" style={{ color: s.c }}>{s.val}</div>
                        <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ===== STATS ===== */}
        <section className="py-20" style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
          <div className="max-w-[1240px] mx-auto px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { end: 847, suffix: 'K+', label: 'Applications sent' },
                { end: 94, suffix: '%', label: 'ATS pass rate' },
                { end: 48, suffix: '%', label: 'Interview rate' },
                { end: 50, suffix: '+', label: 'Job portals' },
              ].map(s => (
                <Reveal key={s.label}>
                  <div>
                    <div className="font-display text-[clamp(2.4rem,5vw,3.4rem)]" style={{ color: 'var(--accent)' }}>
                      <AnimatedCounter end={s.end} suffix={s.suffix} />
                    </div>
                    <div className="text-[13px] mt-2" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ===== PRICING ===== */}
        <section id="pricing" className="py-24">
          <div className="max-w-[1240px] mx-auto px-6 lg:px-8">
            <Reveal>
              <div className="text-center mb-12">
                <div className="inline-flex items-center px-3 py-1.5 rounded-full text-[11.5px] font-semibold mb-5" style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>
                  Simple pricing
                </div>
                <h2 className="font-display text-[clamp(2.1rem,4.4vw,3.2rem)] mb-4" style={{ color: 'var(--text)' }}>
                  Start free. <em className="font-display-italic" style={{ color: 'var(--accent)' }}>Scale when ready.</em>
                </h2>
                <p className="mb-7 text-[15.5px]" style={{ color: 'var(--text-secondary)' }}>
                  No hidden fees. No credit card required. Cancel anytime.
                </p>

                <div role="radiogroup" aria-label="Billing period" className="inline-flex items-center p-1 rounded-full" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                  {(['mo', 'yr'] as const).map(b => (
                    <button
                      key={b}
                      role="radio"
                      aria-checked={billing === b}
                      onClick={() => setBilling(b)}
                      className="px-5 py-2 rounded-full text-[13px] font-semibold transition-colors flex items-center gap-2"
                      style={{
                        background: billing === b ? 'var(--accent-solid)' : 'transparent',
                        color: billing === b ? 'var(--text-on-accent)' : 'var(--text-secondary)',
                      }}
                    >
                      {b === 'mo' ? 'Monthly' : 'Annual'}
                      {b === 'yr' && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: billing === 'yr' ? 'rgba(255,255,255,0.22)' : 'var(--green-dim)', color: billing === 'yr' ? 'var(--text-on-accent)' : 'var(--green)' }}>
                          -40%
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </Reveal>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-[1100px] mx-auto items-start">
              {plans.map((plan, i) => (
                <Reveal key={plan.name} delay={i * 70} className="h-full">
                  <div
                    className="relative h-full p-7 rounded-2xl flex flex-col"
                    style={{
                      background: 'var(--bg-card)',
                      border: `1px solid ${plan.pop ? 'var(--accent)' : 'var(--border)'}`,
                      boxShadow: plan.pop ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
                    }}
                  >
                    {plan.pop && (
                      <span
                        className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap"
                        style={{ background: 'var(--accent-solid)', color: 'var(--text-on-accent)' }}
                      >
                        Most popular
                      </span>
                    )}
                    <h3 className="text-[17px] font-semibold mb-1" style={{ color: 'var(--text)' }}>{plan.name}</h3>
                    <p className="text-[12px] mb-6" style={{ color: 'var(--text-muted)' }}>{plan.desc}</p>
                    <div className="mb-7">
                      <span className="font-display text-[40px]" style={{ color: 'var(--text)' }}>${plan.price}</span>
                      <span className="text-[13px]" style={{ color: 'var(--text-muted)' }}>{plan.name === 'Lifetime' ? ' once' : '/mo'}</span>
                    </div>
                    <ul className="space-y-2.5 mb-8 flex-1">
                      {plan.features.map(f => (
                        <li key={f} className="flex items-start gap-2.5 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
                          <span className="mt-0.5 shrink-0" style={{ color: 'var(--green)' }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" {...S} strokeWidth={3} aria-hidden="true">{ICON.check}</svg>
                          </span>
                          {f}
                        </li>
                      ))}
                    </ul>
                    <a
                      href="/signup"
                      className="block text-center py-3 rounded-xl font-bold text-[13px] transition-transform hover:-translate-y-0.5"
                      style={
                        plan.pop
                          ? { background: 'var(--accent-solid)', color: 'var(--text-on-accent)' }
                          : { background: 'var(--bg-overlay)', border: '1px solid var(--border)', color: 'var(--text)' }
                      }
                    >
                      {plan.cta}
                    </a>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ===== TESTIMONIALS ===== */}
        <section className="py-24" style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
          <div className="max-w-[1240px] mx-auto px-6 lg:px-8">
            <Reveal>
              <div className="text-center mb-14">
                <div className="flex items-center justify-center gap-1 mb-5" aria-label="Rated 4.9 out of 5">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} width="20" height="20" viewBox="0 0 24 24" fill="var(--yellow)" aria-hidden="true">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  ))}
                </div>
                <h2 className="font-display text-[clamp(2.1rem,4.4vw,3.2rem)] mb-3" style={{ color: 'var(--text)' }}>
                  Loved by <em className="font-display-italic" style={{ color: 'var(--accent)' }}>10,000+ job seekers</em>
                </h2>
                <p className="text-[15px]" style={{ color: 'var(--text-secondary)' }}>4.9 out of 5 based on 2,847 verified reviews</p>
              </div>
            </Reveal>

            <div className="grid md:grid-cols-3 gap-5">
              {[
                { quote: 'ApplyMaster got me 12 interviews in 2 weeks. I was manually applying for 3 months with zero callbacks. This literally changed my career.', name: 'Sarah Chen', role: 'Software Engineer at Google', avatar: 'SC', date: '2 weeks ago' },
                { quote: 'The resume optimizer alone is worth 10x the price. My ATS score went from 58 to 96. I went from ghosted to getting recruiter calls daily.', name: 'James Rodriguez', role: 'Data Scientist at Meta', avatar: 'JR', date: '1 month ago' },
                { quote: 'I was skeptical about AI applying for me. But Copilot mode lets me review everything before it goes out. Landed a $280K offer in 3 weeks.', name: 'Priya Sharma', role: 'ML Engineer at Stripe', avatar: 'PS', date: '3 weeks ago' },
                { quote: 'Finally a tool that actually works. I went from 0 to 23 interviews in a month. The auto-apply is insanely smart about matching jobs.', name: 'Marcus Johnson', role: 'Backend Engineer at Amazon', avatar: 'MJ', date: '1 week ago' },
                { quote: 'Game changer. I used to spend 3 hours a day applying. Now it takes 15 minutes to review and approve applications. Got my dream job!', name: 'Lisa Wong', role: 'Product Manager at TikTok', avatar: 'LW', date: '5 days ago' },
                { quote: 'The cover letter generator saves so much time. Each one is personalised and actually reads like I wrote it. Accepted an offer after 2 weeks!', name: 'David Patel', role: 'Full-stack Engineer at Microsoft', avatar: 'DP', date: '3 days ago' },
              ].map((t, i) => (
                <Reveal key={t.name} delay={i * 70} className="h-full">
                  <figure className="h-full p-6 rounded-2xl flex flex-col" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex gap-0.5" aria-label="5 out of 5">
                        {[...Array(5)].map((_, j) => (
                          <svg key={j} width="13" height="13" viewBox="0 0 24 24" fill="var(--yellow)" aria-hidden="true">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                          </svg>
                        ))}
                      </div>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: 'var(--green-dim)', color: 'var(--green)' }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" {...S} strokeWidth={3} aria-hidden="true">{ICON.check}</svg>
                        Verified
                      </span>
                    </div>
                    <blockquote className="text-[14px] leading-[1.7] mb-6 flex-1" style={{ color: 'var(--text-secondary)' }}>
                      &ldquo;{t.quote}&rdquo;
                    </blockquote>
                    <figcaption className="flex items-center gap-3 pt-5" style={{ borderTop: '1px solid var(--border)' }}>
                      <span className="w-10 h-10 rounded-full grid place-items-center text-[12px] font-bold shrink-0" style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>
                        {t.avatar}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[13px] font-semibold truncate" style={{ color: 'var(--text)' }}>{t.name}</span>
                        <span className="block text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>{t.role}</span>
                        <span className="block text-[10px]" style={{ color: 'var(--text-faint)' }}>{t.date}</span>
                      </span>
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>

            <Reveal delay={200}>
              <div className="mt-14 pt-10" style={{ borderTop: '1px solid var(--border)' }}>
                <p className="text-center text-[12px] mb-6" style={{ color: 'var(--text-muted)' }}>
                  Trusted by job seekers from leading companies
                </p>
                <ul className="flex flex-wrap items-center justify-center gap-8">
                  {['Google', 'Meta', 'Stripe', 'Amazon', 'Microsoft', 'Apple'].map(c => (
                    <li key={c} className="text-[13px] font-semibold" style={{ color: 'var(--text-faint)' }}>{c}</li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ===== FAQ ===== */}
        <section id="faq" className="py-24">
          <div className="max-w-3xl mx-auto px-6 lg:px-8">
            <Reveal>
              <div className="text-center mb-12">
                <h2 className="font-display text-[clamp(2.1rem,4.4vw,3.2rem)]" style={{ color: 'var(--text)' }}>
                  Frequently asked <em className="font-display-italic" style={{ color: 'var(--accent)' }}>questions</em>
                </h2>
              </div>
            </Reveal>
            <div className="space-y-3">
              {[
                { q: 'Is ApplyMaster actually free?', a: 'Yes. The Free plan gives you 10 applications/month, resume optimization, job search, and application tracking — forever. No credit card, no trial expiry. Upgrade only when you need more volume.' },
                { q: 'Will employers know I used AI?', a: 'No. Every application is unique — your resume is restructured (not just keyword-stuffed) per job, cover letters reference specific company details, and screening questions are answered contextually. Applications are indistinguishable from hand-crafted ones.' },
                { q: "What's the difference between Copilot and Autopilot?", a: 'Copilot queues every application for your review — you see the tailored resume, cover letter, and answers before approving. Autopilot applies automatically to jobs above your match threshold. Most users start with Copilot, then switch to Autopilot once they trust the system.' },
                { q: 'Which job portals are supported?', a: '50+ globally: LinkedIn, Indeed, Glassdoor, ZipRecruiter, Greenhouse, Lever, Workday, Naukri, Instahyre, Dice, Wellfound, Monster, SEEK, Reed, and many more. We add new integrations weekly.' },
                { q: 'How does the Live Interview Coach work?', a: 'Our Chrome extension captures interview audio during Google Meet, Zoom Web, or Teams calls, transcribes it in real-time using AI, and displays suggested answers on your screen. It pulls from your resume and the job description to generate personalized responses. One-click hide for screen sharing.' },
                { q: 'Can I cancel anytime?', a: 'Yes. No contracts, no fees. Cancel with one click. Your data exports are always available. Lifetime plan never expires.' },
                { q: 'Is my data secure?', a: 'AES-256 encryption, SOC 2 compliant infrastructure, GDPR ready. We never share your data with employers or third parties. One-click data deletion available anytime.' },
              ].map((f, i) => (
                <FAQ key={f.q} id={String(i)} q={f.q} a={f.a} />
              ))}
            </div>
          </div>
        </section>

        {/* ===== FINAL CTA ===== */}
        <section className="py-24">
          <div className="max-w-[1240px] mx-auto px-6 lg:px-8">
            <div className="rounded-3xl py-16 px-8 text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}>
              <Reveal>
                <h2 className="font-display text-[clamp(2.3rem,5vw,3.6rem)] mb-5" style={{ color: 'var(--text)' }}>
                  Ready to <em className="font-display-italic" style={{ color: 'var(--accent)' }}>10x your job search?</em>
                </h2>
              </Reveal>
              <Reveal delay={80}>
                <p className="text-[16.5px] max-w-lg mx-auto mb-9" style={{ color: 'var(--text-secondary)' }}>
                  Join 10,000+ job seekers who stopped applying manually and started getting interviews on autopilot.
                </p>
              </Reveal>
              <Reveal delay={140}>
                <PrimaryLink href="/signup"><Icon path={ICON.bolt} /> Start free &mdash; no credit card</PrimaryLink>
                <p className="text-[12px] mt-6" style={{ color: 'var(--text-muted)' }}>
                  Free forever plan &middot; No credit card &middot; Cancel anytime
                </p>
              </Reveal>
            </div>
          </div>
        </section>
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="py-14" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="max-w-[1240px] mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-10 mb-10">
            <div>
              <a href="/" className="flex items-center gap-2.5 mb-4">
                <span className="w-8 h-8 rounded-lg grid place-items-center font-bold text-[11px]" style={{ background: 'var(--accent-solid)', color: 'var(--text-on-accent)' }}>AM</span>
                <span className="text-[16px] font-bold tracking-tight" style={{ color: 'var(--text)' }}>
                  Apply<span style={{ color: 'var(--accent)' }}>Master</span>
                </span>
              </a>
              <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                AI-powered job application automation.<br />
                A product by <a href="https://3gp.ai" className="underline underline-offset-2" style={{ color: 'var(--accent)' }}>3GP.AI</a>
              </p>
            </div>

            {[
              { h: 'Product', links: [['Features', '/features'], ['Auto Apply', '/features/auto-apply'], ['Resume Optimizer', '/features/resume-optimizer'], ['Interview Coach', '/features/interview-coach'], ['Integrations', '/integrations'], ['Pricing', '/pricing']] },
              { h: 'Resources', links: [['Blog', '/blog'], ['AI Job Application Guide', '/blog/ai-job-application-guide'], ['ATS Resume Guide', '/blog/ats-resume-optimization'], ['LinkedIn Auto Apply Guide', '/blog/linkedin-auto-apply-guide'], ['About 3GP.AI', 'https://3gp.ai']] },
              { h: 'Legal', links: [['Privacy Policy', '/privacy'], ['Terms of Service', '/terms']] },
            ].map(col => (
              <div key={col.h}>
                <h2 className="font-semibold text-[12px] uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>{col.h}</h2>
                <div className="space-y-2.5">
                  {col.links.map(([label, href]) => (
                    <a key={label} href={href} className="block text-[13px] transition-colors" style={{ color: 'var(--text-secondary)' }}>
                      {label}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-7" style={{ borderTop: '1px solid var(--border)' }}>
            <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>&copy; 2026 ApplyMaster by 3GP.AI. All rights reserved.</span>
            <div className="flex items-center gap-5">
              {[['Twitter', 'https://twitter.com/applymaster_ai'], ['LinkedIn', 'https://linkedin.com/company/applymaster'], ['Instagram', 'https://instagram.com/applymaster.ai']].map(([l, h]) => (
                <a key={l} href={h} target="_blank" rel="noopener noreferrer" className="text-[12px] transition-colors" style={{ color: 'var(--text-muted)' }}>{l}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
