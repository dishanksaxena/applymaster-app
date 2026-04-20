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
  initials: string
  mutualCount: number
  mutualNames: string[]
  source: string
  relevance: number
  canRefer: boolean
  connectionPath: string[]
  detail: string
}

interface NetworkSource {
  id: string
  name: string
  icon: JSX.Element
  count: number
  connected: boolean
  color: string
  gradient: string
  desc: string
}

/* ─── Icons ─── */
const icons = {
  search: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>,
  sparkle: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3z"/></svg>,
  gmail: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z" stroke="currentColor" strokeWidth="1.5"/><polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="1.5" fill="none"/></svg>,
  linkedin: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452z"/></svg>,
  calendar: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  twitter: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
  instagram: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none"/></svg>,
  check: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20,6 9,17 4,12"/></svg>,
  send: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13"/><polygon points="22,2 15,22 11,13 2,9"/></svg>,
  link: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>,
  lock: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>,
  people: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
  zap: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13,2 3,14 12,14 11,22 21,10 12,10"/></svg>,
  globe: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>,
  arrow: <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9,18 15,12 9,6"/></svg>,
}

/* ─── Data ─── */
const NETWORK_SOURCES: NetworkSource[] = [
  { id: 'linkedin', name: 'LinkedIn', icon: icons.linkedin, count: 2340, connected: false, color: '#0a66c2', gradient: 'linear-gradient(135deg, #0a66c2, #004182)', desc: 'Professional connections and colleagues' },
  { id: 'gmail', name: 'Gmail', icon: icons.gmail, count: 847, connected: false, color: '#ea4335', gradient: 'linear-gradient(135deg, #ea4335, #c5221f)', desc: 'Email contacts and conversations' },
  { id: 'calendar', name: 'Google Calendar', icon: icons.calendar, count: 1520, connected: false, color: '#4285f4', gradient: 'linear-gradient(135deg, #4285f4, #1a73e8)', desc: 'Meeting attendees and collaborators' },
  { id: 'twitter', name: 'X (Twitter)', icon: icons.twitter, count: 12800, connected: false, color: '#1d9bf0', gradient: 'linear-gradient(135deg, #1d9bf0, #0c7abf)', desc: 'Followers and social connections' },
  { id: 'instagram', name: 'Instagram', icon: icons.instagram, count: 3200, connected: false, color: '#e1306c', gradient: 'linear-gradient(135deg, #e1306c, #c13584)', desc: 'Social network and creators' },
]

const DIRECT_CONNECTIONS = [
  { id: 'dc1', name: 'Rahul Mehta', role: 'Engineering Lead', company: 'Uber', initials: 'RM', color: '#6c5ce7' },
  { id: 'dc2', name: 'Sarah Kim', role: 'Product Designer', company: 'Airbnb', initials: 'SK', color: '#0984e3' },
  { id: 'dc3', name: 'Mark Johnson', role: 'CTO', company: 'Notion', initials: 'MJ', color: '#e17055' },
  { id: 'dc4', name: 'Neha Patel', role: 'Data Scientist', company: 'Netflix', initials: 'NP', color: '#00b894' },
  { id: 'dc5', name: 'Kevin Wu', role: 'Senior SWE', company: 'Figma', initials: 'KW', color: '#fdcb6e' },
]

const ALL_REFERRALS: NetworkPerson[] = [
  { id: '1',  name: 'Priya Sharma',    role: 'Senior Engineering Manager', company: 'Google',    avatar: '', initials: 'PS', mutualCount: 3, mutualNames: ['Rahul Mehta', 'Anita Desai', 'James Chen'],        source: 'linkedin', relevance: 97, canRefer: true,  connectionPath: ['You', 'Rahul Mehta', 'Priya Sharma'],    detail: 'Manages Cloud Platform team, hiring senior engineers' },
  { id: '2',  name: 'Alex Rivera',     role: 'Staff Software Engineer',    company: 'Meta',      avatar: '', initials: 'AR', mutualCount: 2, mutualNames: ['Sarah Kim', 'David Liu'],                           source: 'gmail',    relevance: 94, canRefer: true,  connectionPath: ['You', 'Sarah Kim', 'Alex Rivera'],       detail: 'Works on Instagram Reels infrastructure' },
  { id: '3',  name: 'Emily Zhang',     role: 'Technical Recruiter',        company: 'Stripe',    avatar: '', initials: 'EZ', mutualCount: 5, mutualNames: ['Mark Johnson', 'Lisa Wang', 'Tom Brown'],           source: 'linkedin', relevance: 91, canRefer: false, connectionPath: ['You', 'Mark Johnson', 'Emily Zhang'],    detail: 'Recruits for payments infrastructure roles' },
  { id: '4',  name: "Michael O'Brien", role: 'VP of Engineering',          company: 'Amazon',    avatar: '', initials: 'MO', mutualCount: 1, mutualNames: ['Neha Patel'],                                      source: 'calendar', relevance: 88, canRefer: true,  connectionPath: ['You', 'Neha Patel', "Michael O'Brien"],  detail: 'Leads AWS Lambda team, 200+ reports' },
  { id: '5',  name: 'Sakura Tanaka',   role: 'Lead Product Manager',       company: 'Apple',     avatar: '', initials: 'ST', mutualCount: 4, mutualNames: ['Kevin Wu', 'Rachel Adams', 'Omar Hassan'],          source: 'linkedin', relevance: 85, canRefer: true,  connectionPath: ['You', 'Kevin Wu', 'Sakura Tanaka'],      detail: 'Leading Vision Pro developer experience' },
  { id: '6',  name: 'Jordan Lee',      role: 'Senior Software Engineer',   company: 'Zoom',      avatar: '', initials: 'JL', mutualCount: 2, mutualNames: ['Sarah Kim', 'Mark Johnson'],                        source: 'linkedin', relevance: 82, canRefer: true,  connectionPath: ['You', 'Sarah Kim', 'Jordan Lee'],        detail: 'Works on Zoom Apps platform team' },
  { id: '7',  name: 'Anika Patel',     role: 'Engineering Manager',        company: 'PayPal',    avatar: '', initials: 'AP', mutualCount: 3, mutualNames: ['Rahul Mehta', 'Kevin Wu', 'Neha Patel'],            source: 'gmail',    relevance: 80, canRefer: true,  connectionPath: ['You', 'Rahul Mehta', 'Anika Patel'],     detail: 'Manages checkout infrastructure team' },
  { id: '8',  name: 'Carlos Mendez',   role: 'Staff Engineer',             company: 'LinkedIn',  avatar: '', initials: 'CM', mutualCount: 6, mutualNames: ['Mark Johnson', 'Sarah Kim', 'Kevin Wu'],            source: 'linkedin', relevance: 89, canRefer: true,  connectionPath: ['You', 'Mark Johnson', 'Carlos Mendez'],  detail: 'Core Feed Ranking team, previously at Google' },
  { id: '9',  name: 'Rachel Kim',      role: 'Senior SWE',                 company: 'Microsoft', avatar: '', initials: 'RK', mutualCount: 2, mutualNames: ['Neha Patel', 'Kevin Wu'],                          source: 'calendar', relevance: 86, canRefer: true,  connectionPath: ['You', 'Neha Patel', 'Rachel Kim'],       detail: 'Azure AI team, hiring for multiple roles' },
  { id: '10', name: 'David Park',      role: 'Product Lead',               company: 'Airbnb',    avatar: '', initials: 'DP', mutualCount: 1, mutualNames: ['Sarah Kim'],                                       source: 'linkedin', relevance: 78, canRefer: true,  connectionPath: ['You', 'Sarah Kim', 'David Park'],        detail: 'Leading Experiences product at Airbnb' },
  { id: '11', name: 'Lena Fischer',    role: 'Engineering Manager',        company: 'Spotify',   avatar: '', initials: 'LF', mutualCount: 3, mutualNames: ['Mark Johnson', 'Rahul Mehta', 'Kevin Wu'],          source: 'linkedin', relevance: 83, canRefer: true,  connectionPath: ['You', 'Mark Johnson', 'Lena Fischer'],   detail: 'Podcast infrastructure, hiring senior backend' },
  { id: '12', name: 'Omar Hassan',     role: 'Senior Product Manager',     company: 'Uber',      avatar: '', initials: 'OH', mutualCount: 2, mutualNames: ['Rahul Mehta', 'Neha Patel'],                        source: 'gmail',    relevance: 77, canRefer: false, connectionPath: ['You', 'Rahul Mehta', 'Omar Hassan'],     detail: 'Uber Eats growth team' },
  { id: '13', name: 'Yuki Tanaka',     role: 'Staff SWE',                  company: 'Salesforce',avatar: '', initials: 'YT', mutualCount: 4, mutualNames: ['Sarah Kim', 'Kevin Wu', 'Mark Johnson'],            source: 'linkedin', relevance: 75, canRefer: true,  connectionPath: ['You', 'Sarah Kim', 'Yuki Tanaka'],       detail: 'Einstein AI platform' },
  { id: '14', name: 'Nina Rossi',      role: 'Engineering Lead',           company: 'Figma',     avatar: '', initials: 'NR', mutualCount: 3, mutualNames: ['Kevin Wu', 'Sarah Kim', 'Mark Johnson'],            source: 'linkedin', relevance: 90, canRefer: true,  connectionPath: ['You', 'Kevin Wu', 'Nina Rossi'],         detail: 'Figma components and plugins team' },
  { id: '15', name: 'James Chen',      role: 'SWE III',                    company: 'Netflix',   avatar: '', initials: 'JC', mutualCount: 2, mutualNames: ['Neha Patel', 'Mark Johnson'],                       source: 'gmail',    relevance: 84, canRefer: true,  connectionPath: ['You', 'Neha Patel', 'James Chen'],       detail: 'Streaming recommendation algorithms' },
]

const SAMPLE_QUERIES = [
  'Find someone who can refer me at Google for a senior engineer role',
  'Who in my network knows people at Stripe or Figma?',
  'Connect me with hiring managers in AI/ML at top startups',
]

/* ─── Animation Styles ─── */
const animStyles = `
@keyframes flowRight {
  0% { stroke-dashoffset: 20; }
  100% { stroke-dashoffset: 0; }
}
@keyframes flowLeft {
  0% { stroke-dashoffset: -20; }
  100% { stroke-dashoffset: 0; }
}
@keyframes pulseGlow {
  0%, 100% { filter: drop-shadow(0 0 6px rgba(232,67,147,0.3)); }
  50% { filter: drop-shadow(0 0 16px rgba(232,67,147,0.6)); }
}
@keyframes nodeFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}
@keyframes shimmerLine {
  0% { opacity: 0.3; }
  50% { opacity: 0.8; }
  100% { opacity: 0.3; }
}
`

/* ─── Network Map Visualization (SVG-based) ─── */
function NetworkMap({ results, directConnections, searching }: {
  results: NetworkPerson[]
  directConnections: typeof DIRECT_CONNECTIONS
  searching: boolean
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dims, setDims] = useState({ w: 1200, h: 600 })

  useEffect(() => {
    const updateDims = () => {
      if (containerRef.current) {
        const r = containerRef.current.getBoundingClientRect()
        setDims({ w: r.width, h: Math.max(500, r.height) })
      }
    }
    updateDims()
    window.addEventListener('resize', updateDims)
    return () => window.removeEventListener('resize', updateDims)
  }, [])

  const cx = dims.w / 2
  const cy = dims.h / 2
  const leftX = 180
  const rightX = dims.w - 180
  const cardW = 260
  const cardH = 80

  // Positions for left cards (direct connections / YOUR NETWORK)
  const leftCards = directConnections.map((dc, i) => {
    const totalCards = directConnections.length
    const spacing = Math.min(100, (dims.h - 80) / totalCards)
    const startY = cy - ((totalCards - 1) * spacing) / 2
    return { ...dc, x: 20, y: startY + i * spacing - cardH / 2 }
  })

  // Positions for right cards (referral targets)
  const rightCards = (results.length > 0 ? results : []).map((p, i) => {
    const totalCards = results.length
    const spacing = Math.min(100, (dims.h - 80) / totalCards)
    const startY = cy - ((totalCards - 1) * spacing) / 2
    return { ...p, x: dims.w - cardW - 20, y: startY + i * spacing - cardH / 2 }
  })

  return (
    <div ref={containerRef} className="relative w-full" style={{ minHeight: '560px' }}>
      {/* Column Labels */}
      <div className="absolute top-3 left-5 text-[11px] font-bold tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>Your Network</div>
      <div className="absolute top-3 right-5 text-[11px] font-bold tracking-widest uppercase text-right" style={{ color: 'var(--text-muted)' }}>Referrals</div>

      {/* SVG Lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ minHeight: '560px' }}>
        <defs>
          <linearGradient id="lineGradLeft" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--purple, #6c5ce7)" stopOpacity="0.15" />
            <stop offset="40%" stopColor="var(--purple, #6c5ce7)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="var(--accent, #e84393)" stopOpacity="0.5" />
          </linearGradient>
          <linearGradient id="lineGradRight" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--accent, #e84393)" stopOpacity="0.5" />
            <stop offset="60%" stopColor="var(--green, #00b894)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="var(--green, #00b894)" stopOpacity="0.15" />
          </linearGradient>
          <filter id="glowFilter">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Lines from left cards to center */}
        {leftCards.map((card, i) => {
          const startX = 20 + cardW
          const startY = card.y + cardH / 2
          const ctrl1X = startX + (cx - startX) * 0.4
          const ctrl2X = cx - (cx - startX) * 0.2
          return (
            <g key={`l-${i}`}>
              {/* Glow line */}
              <path
                d={`M ${startX} ${startY} C ${ctrl1X} ${startY}, ${ctrl2X} ${cy}, ${cx} ${cy}`}
                fill="none" stroke={`${card.color}30`} strokeWidth="3" filter="url(#glowFilter)"
              />
              {/* Animated dashed line */}
              <path
                d={`M ${startX} ${startY} C ${ctrl1X} ${startY}, ${ctrl2X} ${cy}, ${cx} ${cy}`}
                fill="none" stroke={card.color} strokeWidth="1.5"
                strokeDasharray="6 4"
                style={{ animation: `flowRight 0.8s linear infinite`, animationDelay: `${i * 0.15}s` }}
                opacity="0.6"
              />
              {/* Moving dot */}
              <circle r="3" fill={card.color} opacity="0.9" filter="url(#glowFilter)">
                <animateMotion
                  dur={`${2 + i * 0.3}s`}
                  repeatCount="indefinite"
                  path={`M ${startX} ${startY} C ${ctrl1X} ${startY}, ${ctrl2X} ${cy}, ${cx} ${cy}`}
                />
              </circle>
            </g>
          )
        })}

        {/* Lines from center to right cards */}
        {rightCards.map((card, i) => {
          const endX = card.x
          const endY = card.y + cardH / 2
          const ctrl1X = cx + (endX - cx) * 0.3
          const ctrl2X = endX - (endX - cx) * 0.4
          const lineColor = card.canRefer ? '#00b894' : '#0984e3'
          return (
            <g key={`r-${i}`}>
              <path
                d={`M ${cx} ${cy} C ${ctrl1X} ${cy}, ${ctrl2X} ${endY}, ${endX} ${endY}`}
                fill="none" stroke={`${lineColor}25`} strokeWidth="3" filter="url(#glowFilter)"
              />
              <path
                d={`M ${cx} ${cy} C ${ctrl1X} ${cy}, ${ctrl2X} ${endY}, ${endX} ${endY}`}
                fill="none" stroke={lineColor} strokeWidth="1.5"
                strokeDasharray="6 4"
                style={{ animation: `flowRight 0.8s linear infinite`, animationDelay: `${i * 0.15}s` }}
                opacity="0.5"
              />
              <circle r="3" fill={lineColor} opacity="0.9" filter="url(#glowFilter)">
                <animateMotion
                  dur={`${2.2 + i * 0.25}s`}
                  repeatCount="indefinite"
                  path={`M ${cx} ${cy} C ${ctrl1X} ${cy}, ${ctrl2X} ${endY}, ${endX} ${endY}`}
                />
              </circle>
            </g>
          )
        })}

        {/* Scanning pulse when searching */}
        {searching && (
          <circle cx={cx} cy={cy} r="30" fill="none" stroke="var(--accent, #e84393)" strokeWidth="2" opacity="0.4">
            <animate attributeName="r" from="30" to="250" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" from="0.5" to="0" dur="2s" repeatCount="indefinite" />
          </circle>
        )}
      </svg>

      {/* Center Node */}
      <div
        className="absolute z-20 flex flex-col items-center justify-center rounded-full"
        style={{
          left: cx - 42, top: cy - 42,
          width: 84, height: 84,
          background: 'linear-gradient(135deg, #e84393, #d63384)',
          boxShadow: '0 0 0 6px rgba(232,67,147,0.12), 0 0 30px rgba(232,67,147,0.25), 0 8px 30px rgba(0,0,0,0.1)',
          animation: 'pulseGlow 3s ease-in-out infinite',
        }}
      >
        <span className="text-white font-black text-[15px] tracking-wide">YOU</span>
        <span className="text-white/60 text-[9px] font-medium mt-0.5">{directConnections.length} direct</span>
      </div>

      {/* Outer ring */}
      <div className="absolute z-10 rounded-full" style={{
        left: cx - 52, top: cy - 52, width: 104, height: 104,
        border: '1px solid rgba(232,67,147,0.1)',
        animation: 'nodeFloat 4s ease-in-out infinite',
      }} />

      {/* Left Cards (Your Network) */}
      {leftCards.map((card, i) => (
        <motion.div
          key={card.id}
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="absolute z-10 rounded-xl p-3.5 flex items-center gap-3 transition-all duration-300 hover:shadow-lg cursor-default group"
          style={{
            left: card.x, top: card.y, width: cardW, height: cardH,
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-[12px] font-bold text-white shrink-0" style={{ background: card.color }}>
            {card.initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-bold truncate" style={{ color: 'var(--text)' }}>{card.name}</div>
            <div className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>{card.role}</div>
            <div className="text-[10px] font-semibold mt-0.5" style={{ color: card.color }}>{card.company}</div>
          </div>
          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: card.color, boxShadow: `0 0 6px ${card.color}60` }} />
        </motion.div>
      ))}

      {/* Right Cards (Referrals) */}
      {rightCards.map((card, i) => {
        const lineColor = card.canRefer ? '#00b894' : '#0984e3'
        return (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="absolute z-10 rounded-xl p-3.5 flex items-center gap-3 transition-all duration-300 hover:shadow-lg cursor-default group"
            style={{
              left: card.x, top: card.y, width: cardW, height: cardH,
              background: 'var(--bg-card)', border: `1px solid ${lineColor}20`,
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: lineColor, boxShadow: `0 0 6px ${lineColor}60` }} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[13px] font-bold truncate" style={{ color: 'var(--text)' }}>{card.name}</span>
                {card.canRefer && (
                  <span className="shrink-0 text-[8px] font-bold px-1.5 py-0.5 rounded-full text-white bg-[#00b894]">REFER</span>
                )}
              </div>
              <div className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>{card.role}</div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] font-semibold" style={{ color: lineColor }}>{card.company}</span>
                <span className="text-[9px]" style={{ color: 'var(--text-faint)' }}>{card.relevance}% match</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-[12px] font-bold text-white shrink-0" style={{ background: `linear-gradient(135deg, ${lineColor}, ${lineColor}cc)` }}>
              {card.initials}
            </div>
          </motion.div>
        )
      })}

      {/* Empty state for right side */}
      {results.length === 0 && !searching && (
        <div className="absolute z-10 flex flex-col items-center justify-center text-center" style={{ right: 40, top: cy - 60, width: cardW }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3" style={{ background: 'var(--bg-overlay)', border: '1px dashed var(--border)' }}>
            <span style={{ color: 'var(--text-faint)' }}>{icons.people}</span>
          </div>
          <p className="text-[12px] font-medium" style={{ color: 'var(--text-muted)' }}>Search for people to<br/>discover referral paths</p>
        </div>
      )}
    </div>
  )
}

/* ─── Main Page ─── */
export default function NetworkPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<NetworkPerson[]>([])
  const [sources, setSources] = useState(NETWORK_SOURCES)
  const [showResults, setShowResults] = useState(false)
  const [activeTab, setActiveTab] = useState<'search' | 'graph' | 'sources'>('search')
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
    await new Promise(r => setTimeout(r, 1800))

    const q = searchQuery.toLowerCase()

    // Map every alias → canonical company name (covers abbreviations, alternate names)
    const companyAliases: Record<string, string> = {
      google: 'Google', alphabet: 'Google', deepmind: 'Google',
      meta: 'Meta', facebook: 'Meta', instagram: 'Meta', fb: 'Meta',
      stripe: 'Stripe',
      amazon: 'Amazon', aws: 'Amazon',
      apple: 'Apple',
      zoom: 'Zoom',
      paypal: 'PayPal',
      linkedin: 'LinkedIn',
      microsoft: 'Microsoft', msft: 'Microsoft', azure: 'Microsoft',
      spotify: 'Spotify',
      airbnb: 'Airbnb',
      uber: 'Uber',
      netflix: 'Netflix',
      figma: 'Figma',
      notion: 'Notion',
      salesforce: 'Salesforce',
    }

    // Collect ALL companies mentioned in the query
    const targetCompanies = [...new Set(
      Object.entries(companyAliases)
        .filter(([alias]) => q.includes(alias))
        .map(([, canonical]) => canonical)
    )]

    // Filter: company match + optionally canRefer
    let filtered = ALL_REFERRALS.filter(p => {
      const companyMatch = targetCompanies.length === 0 || targetCompanies.includes(p.company)
      const referMatch = !q.includes('refer') || p.canRefer
      return companyMatch && referMatch
    })

    // Role keyword filter (engineer, pm, manager, recruiter, etc.)
    const roleKeywords: Record<string, string[]> = {
      engineer: ['engineer', 'swe', 'engineering', 'developer', 'dev'],
      manager: ['manager', 'em', 'engineering manager', 'lead'],
      recruiter: ['recruiter', 'recruiting', 'talent'],
      pm: ['product manager', 'pm', 'product lead'],
    }
    for (const [, aliases] of Object.entries(roleKeywords)) {
      if (aliases.some(kw => q.includes(kw))) {
        const roleFiltered = filtered.filter(p =>
          aliases.some(kw => p.role.toLowerCase().includes(kw))
        )
        if (roleFiltered.length > 0) filtered = roleFiltered
        break
      }
    }

    // Fall back to top results if nothing matched
    if (!filtered.length) filtered = ALL_REFERRALS.slice(0, 5)

    // Sort by relevance descending
    filtered = [...filtered].sort((a, b) => b.relevance - a.relevance)

    setResults(filtered); setShowResults(true); setSearching(false)
  }

  const handleConnect = (id: string) => {
    setSources(prev => prev.map(s => s.id === id ? { ...s, connected: true } : s))
  }

  const connectedSources = sources.filter(s => s.connected)
  const totalContacts = sources.reduce((a, s) => a + s.count, 0)

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: animStyles }} />
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="max-w-[1400px] mx-auto space-y-6">

        {/* ─── Header ─── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(232,67,147,0.1), rgba(108,92,231,0.1))' }}>
                <span style={{ color: 'var(--accent)' }}>{icons.globe}</span>
              </div>
              <div>
                <h1 className="text-2xl font-black" style={{ color: 'var(--text)' }}>Referral Network</h1>
                <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>AI-powered people search — find who can refer you to your dream job</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>Network</div>
              <div className="text-xl font-black" style={{ color: 'var(--text)' }}>{totalContacts.toLocaleString()}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>Connected</div>
              <div className="text-xl font-black" style={{ color: 'var(--green)' }}>{connectedSources.length}/{sources.length}</div>
            </div>
          </div>
        </motion.div>

        {/* ─── Tabs ─── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
          {([
            { key: 'search' as const, label: 'AI People Search', icon: icons.sparkle },
            { key: 'graph' as const, label: 'Network Map', icon: icons.globe },
            { key: 'sources' as const, label: 'Connected Sources', icon: icons.link },
          ]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex-1 py-2.5 px-4 rounded-lg text-[13px] font-semibold transition-all duration-200 flex items-center justify-center gap-2"
              style={activeTab === tab.key ? {
                background: 'var(--accent-dim)',
                color: 'var(--accent)',
                boxShadow: 'var(--shadow-sm)',
              } : {
                color: 'var(--text-muted)',
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </motion.div>

        {/* ═══════ AI SEARCH TAB ═══════ */}
        {activeTab === 'search' && (
          <div className="space-y-6">
            {/* Search Box */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="rounded-2xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>{icons.sparkle}</div>
                <span className="text-[13px] font-bold" style={{ color: 'var(--text)' }}>Describe who you&apos;re looking for</span>
              </div>
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} placeholder={typingText}
                    className="w-full h-12 pl-11 pr-4 rounded-xl text-[14px] theme-input" />
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-faint)' }}>{icons.search}</span>
                </div>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleSearch} disabled={searching || !searchQuery.trim()}
                  className="h-12 px-6 rounded-xl font-bold text-[13px] text-white flex items-center gap-2 disabled:opacity-40 shrink-0"
                  style={{ background: 'linear-gradient(135deg, #e84393, #d63384)', boxShadow: '0 4px 14px rgba(232,67,147,0.25)' }}>
                  {searching ? <><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"/>Searching...</> : <>{icons.sparkle}Find People</>}
                </motion.button>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {SAMPLE_QUERIES.map((q, i) => (
                  <button key={i} onClick={() => setSearchQuery(q)} className="px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200 hover:border-[var(--accent)]" style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>{q}</button>
                ))}
              </div>
            </motion.div>

            {/* Searching */}
            <AnimatePresence>
              {searching && (
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="rounded-2xl p-10 text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ background: 'var(--accent-dim)' }}>
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }} style={{ color: 'var(--accent)' }}>{icons.globe}</motion.div>
                  </div>
                  <h3 className="text-[16px] font-bold mb-2" style={{ color: 'var(--text)' }}>Scanning your network...</h3>
                  <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>Finding the best matches across all sources</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Results + Network Map */}
            <AnimatePresence>
              {showResults && results.length > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-[16px] font-bold" style={{ color: 'var(--text)' }}>{results.length} referral paths found</h2>
                      <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>Ranked by relevance and referral potential</p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-[11px] font-bold" style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>AI-ranked</span>
                  </div>

                  {/* Network Map */}
                  <div className="rounded-2xl overflow-hidden relative" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}>
                    <NetworkMap results={results} directConnections={DIRECT_CONNECTIONS} searching={false} />
                  </div>

                  {/* Detail cards */}
                  <div className="grid gap-3">
                    {results.map((person, i) => (
                      <motion.div key={person.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        onClick={() => setExpandedId(expandedId === person.id ? null : person.id)}
                        className="rounded-xl p-5 cursor-pointer transition-all duration-300 group"
                        style={{ background: 'var(--bg-card)', border: expandedId === person.id ? '1px solid var(--border-accent)' : '1px solid var(--border)', boxShadow: expandedId === person.id ? 'var(--shadow-lg)' : 'var(--shadow-sm)' }}>
                        <div className="flex items-start gap-4">
                          <div className="relative shrink-0">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center text-[13px] font-bold text-white" style={{ background: person.canRefer ? 'linear-gradient(135deg, #00b894, #00a381)' : 'linear-gradient(135deg, #0984e3, #0773c5)' }}>{person.initials}</div>
                            {person.canRefer && <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-[#00b894] flex items-center justify-center" style={{ border: '2px solid var(--bg-card)' }}><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20,6 9,17 4,12"/></svg></div>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-[14px] font-bold" style={{ color: 'var(--text)' }}>{person.name}</h3>
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: person.relevance > 90 ? 'rgba(0,184,148,0.08)' : 'rgba(9,132,227,0.08)', color: person.relevance > 90 ? '#00b894' : '#0984e3' }}>{person.relevance}% match</span>
                              {person.canRefer && <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#00b894] text-white">Can Refer</span>}
                            </div>
                            <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>{person.role} at <span className="font-semibold" style={{ color: 'var(--purple)' }}>{person.company}</span></p>
                            <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>{person.detail}</p>
                            <div className="flex items-center gap-1.5 mt-2.5">
                              {person.connectionPath.map((step, j) => (
                                <span key={j} className="flex items-center gap-1.5">
                                  <span className="text-[11px] px-2 py-0.5 rounded-md font-medium" style={{ background: j === 0 ? 'var(--accent-dim)' : j === person.connectionPath.length - 1 ? 'var(--green-dim)' : 'var(--purple-dim)', color: j === 0 ? 'var(--accent)' : j === person.connectionPath.length - 1 ? 'var(--green)' : 'var(--purple)' }}>{step}</span>
                                  {j < person.connectionPath.length - 1 && <span style={{ color: 'var(--text-faint)' }}>{icons.arrow}</span>}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 shrink-0">
                            {person.canRefer && (
                              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="h-8 px-3.5 rounded-lg text-[11px] font-bold text-white flex items-center gap-1.5" style={{ background: 'linear-gradient(135deg, #00b894, #00a381)', boxShadow: '0 2px 8px rgba(0,184,148,0.2)' }}>{icons.send}Ask Referral</motion.button>
                            )}
                            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="h-8 px-3.5 rounded-lg text-[11px] font-semibold flex items-center gap-1.5" style={{ background: 'var(--purple-dim)', color: 'var(--purple)', border: '1px solid rgba(108,92,231,0.15)' }}>{icons.link}Get Intro</motion.button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Empty state */}
            {!showResults && !searching && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="rounded-2xl overflow-hidden relative" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}>
                <NetworkMap results={[]} directConnections={DIRECT_CONNECTIONS} searching={false} />
              </motion.div>
            )}
          </div>
        )}

        {/* ═══════ NETWORK GRAPH TAB ═══════ */}
        {activeTab === 'graph' && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
            <div className="rounded-2xl overflow-hidden relative" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}>
              <NetworkMap results={results} directConnections={DIRECT_CONNECTIONS} searching={searching} />
            </div>
            {results.length === 0 && (
              <p className="text-center mt-4 text-[13px]" style={{ color: 'var(--text-muted)' }}>Search for people first to see your full network map with referral paths</p>
            )}
          </motion.div>
        )}

        {/* ═══════ SOURCES TAB ═══════ */}
        {activeTab === 'sources' && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[16px] font-bold" style={{ color: 'var(--text)' }}>Connect Your Networks</h2>
                <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>More sources = better referral matches</p>
              </div>
              <div className="h-2 w-28 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(connectedSources.length / sources.length) * 100}%`, background: 'linear-gradient(90deg, #e84393, #d63384)' }} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sources.map((source, i) => (
                <motion.div key={source.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                  className="rounded-2xl p-5 transition-all duration-300" style={{ background: 'var(--bg-card)', border: source.connected ? '1px solid rgba(0,184,148,0.2)' : '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `${source.color}10`, color: source.color }}>{source.icon}</div>
                    {source.connected && <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-[#00b894]" style={{ background: 'rgba(0,184,148,0.08)' }}>{icons.check} Connected</span>}
                  </div>
                  <h3 className="text-[14px] font-bold" style={{ color: 'var(--text)' }}>{source.name}</h3>
                  <p className="text-[11px] mt-0.5 mb-1" style={{ color: 'var(--text-muted)' }}>{source.desc}</p>
                  <p className="text-[12px] font-semibold mb-4" style={{ color: 'var(--text-secondary)' }}>{source.count.toLocaleString()} contacts</p>
                  {!source.connected ? (
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => handleConnect(source.id)}
                      className="w-full h-10 rounded-xl text-[12px] font-bold flex items-center justify-center gap-2 text-white" style={{ background: source.gradient, boxShadow: `0 3px 10px ${source.color}25` }}>{icons.link} Connect {source.name}</motion.button>
                  ) : (
                    <div className="w-full h-10 rounded-xl text-[12px] font-semibold flex items-center justify-center gap-2 text-[#00b894]" style={{ background: 'rgba(0,184,148,0.06)', border: '1px solid rgba(0,184,148,0.12)' }}>{icons.check} Synced</div>
                  )}
                </motion.div>
              ))}
            </div>

            <div className="rounded-xl p-4 flex items-start gap-3" style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text-muted)' }}>{icons.lock}</span>
              <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}><span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>Your data stays private.</span> We never share contacts. Connections are analyzed securely to find referral paths, and you control who gets contacted.</p>
            </div>
          </motion.div>
        )}

        {/* ─── How It Works ─── */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="rounded-2xl p-8" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
          <div className="text-center mb-8">
            <h2 className="text-xl font-black" style={{ color: 'var(--text)' }}>How It Works</h2>
            <p className="text-[13px] mt-1" style={{ color: 'var(--text-muted)' }}>Four steps to land referrals at any company</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: '01', title: 'Connect Sources', desc: 'Link Gmail, LinkedIn, Calendar, and social accounts to map your network.', color: '#e84393', icon: icons.link },
              { step: '02', title: 'Search Naturally', desc: '"Find someone at Google who can refer me for a PM role."', color: '#6c5ce7', icon: icons.search },
              { step: '03', title: 'Discover Paths', desc: 'See who connects you to your target — with mutual connections highlighted.', color: '#0984e3', icon: icons.people },
              { step: '04', title: 'Get Referred', desc: 'Request warm introductions and track referral status in real-time.', color: '#00b894', icon: icons.send },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.08 }} className="text-center">
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ background: `${item.color}0d`, color: item.color }}>{item.icon}</div>
                <div className="text-[10px] font-black tracking-widest mb-1.5" style={{ color: item.color }}>{item.step}</div>
                <h3 className="text-[14px] font-bold mb-1.5" style={{ color: 'var(--text)' }}>{item.title}</h3>
                <p className="text-[12px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

      </motion.div>
    </>
  )
}
