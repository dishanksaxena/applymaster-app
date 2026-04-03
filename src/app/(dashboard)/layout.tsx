'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase-browser'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import type { Profile } from '@/lib/database.types'

/* ─── SVG Icon Components ─── */
const icons = {
  dashboard: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  ),
  jobs: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  ),
  applications: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <path d="M9 14l2 2 4-4" />
    </svg>
  ),
  resume: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
      <polyline points="14,2 14,8 20,8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
  ),
  coverLetters: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  ),
  autoApply: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13,2 3,14 12,14 11,22 21,10 12,10" />
    </svg>
  ),
  interviewCoach: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
      <path d="M19 10v2a7 7 0 01-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  ),
  settings: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  ),
  signOut: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16,17 21,12 16,7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  menu: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="15" y2="12" />
      <line x1="3" y1="18" x2="18" y2="18" />
    </svg>
  ),
  collapse: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="9" y1="3" x2="9" y2="21" />
    </svg>
  ),
  bell: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  ),
  search: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  ),
  chevronRight: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9,18 15,12 9,6" />
    </svg>
  ),
}

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: icons.dashboard },
  { label: 'Jobs', href: '/jobs', icon: icons.jobs },
  { label: 'Saved Jobs', href: '/saved-jobs', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg> },
  { label: 'Applications', href: '/applications', icon: icons.applications },
  { label: 'Resume', href: '/resume', icon: icons.resume },
  { label: 'Profile', href: '/profile', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
  { label: 'Cover Letters', href: '/cover-letters', icon: icons.coverLetters },
  { label: 'Auto-Apply', href: '/auto-apply', icon: icons.autoApply },
  { label: 'Interview Coach', href: '/interview-coach', icon: icons.interviewCoach },
  { label: 'Settings', href: '/settings', icon: icons.settings },
]

/* ─── Inline Keyframe Styles ─── */
const animationStyles = `
@keyframes gradient-rotate {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
@keyframes shimmer {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 4px rgba(0, 184, 148, 0.4), 0 0 8px rgba(0, 184, 148, 0.2); }
  50% { box-shadow: 0 0 8px rgba(0, 184, 148, 0.6), 0 0 20px rgba(0, 184, 148, 0.3); }
}
@keyframes avatar-ring {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
@keyframes fade-in {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes sidebar-glow {
  0% { opacity: 0.3; }
  50% { opacity: 0.6; }
  100% { opacity: 0.3; }
}
`

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  // Restore theme preference on mount and route changes
  useEffect(() => {
    const saved = localStorage.getItem('theme')
    if (saved === 'light') {
      document.documentElement.classList.add('light-theme')
    } else {
      document.documentElement.classList.remove('light-theme')
    }
  }, [pathname])

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) setProfile(data as Profile)
    }
    fetchProfile()
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const breadcrumbs = useMemo(() => {
    const segments = pathname.split('/').filter(Boolean)
    return segments.map((seg, i) => ({
      label: seg.replace(/-/g, ' '),
      href: '/' + segments.slice(0, i + 1).join('/'),
      isLast: i === segments.length - 1,
    }))
  }, [pathname])

  const planLabel = profile?.plan?.toUpperCase() || 'FREE'
  const isPremiumPlan = planLabel === 'PRO' || planLabel === 'ELITE'

  // Onboarding page gets its own minimal layout
  if (pathname === '/onboarding') {
    return <>{children}</>
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: animationStyles }} />
      <div className="min-h-screen bg-[#09090e] flex">

        {/* ─── Sidebar ─── */}
        <aside
          className={`fixed lg:sticky top-0 left-0 z-40 h-screen flex flex-col transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${sidebarOpen ? 'w-[260px]' : 'w-[72px]'} ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
          style={{ background: 'linear-gradient(180deg, rgba(14,14,22,0.95) 0%, rgba(10,10,15,0.98) 100%)' }}
        >
          {/* Glassmorphism border effect */}
          <div
            className="absolute inset-0 rounded-none pointer-events-none"
            style={{
              borderRight: '1px solid rgba(253, 121, 168, 0.06)',
              background: 'linear-gradient(180deg, rgba(253,121,168,0.02) 0%, transparent 30%, transparent 70%, rgba(232,67,147,0.02) 100%)',
            }}
          />
          {/* Animated gradient edge line */}
          <div
            className="absolute top-0 right-0 w-[1px] h-full pointer-events-none"
            style={{
              background: 'linear-gradient(180deg, transparent 0%, rgba(253,121,168,0.15) 20%, rgba(232,67,147,0.25) 50%, rgba(253,121,168,0.15) 80%, transparent 100%)',
              animation: 'sidebar-glow 4s ease-in-out infinite',
            }}
          />

          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-3 px-5 h-[64px] border-b border-white/[0.04] shrink-0 relative hover:opacity-80 transition-opacity duration-200">
            <div className="relative w-8 h-8 shrink-0">
              <div
                className="absolute inset-0 rounded-lg"
                style={{
                  background: 'linear-gradient(135deg, #fd79a8, #e84393, #fd79a8)',
                  backgroundSize: '200% 200%',
                  animation: 'gradient-rotate 3s ease infinite',
                }}
              />
              <div className="absolute inset-[1px] rounded-[7px] bg-[#0e0e16] flex items-center justify-center">
                <span className="text-[10px] font-black bg-gradient-to-r from-[#fd79a8] to-[#e84393] bg-clip-text text-transparent">AM</span>
              </div>
            </div>
            {sidebarOpen && (
              <span className="text-[15px] font-extrabold tracking-tight" style={{ animation: 'fade-in 0.2s ease' }}>
                Apply<span className="bg-gradient-to-r from-[#fd79a8] to-[#e84393] bg-clip-text text-transparent">Master</span>
              </span>
            )}
          </Link>

          {/* Navigation */}
          <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
            {sidebarOpen && (
              <div className="px-3 pb-2 pt-1">
                <span className="text-[10px] font-semibold tracking-[0.08em] uppercase text-[#3a3a4a]">Navigation</span>
              </div>
            )}
            {navItems.map(item => {
              const active = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileSidebarOpen(false)}
                  className="group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200"
                  style={active ? {
                    background: 'linear-gradient(135deg, rgba(253,121,168,0.1) 0%, rgba(232,67,147,0.06) 100%)',
                    color: '#fd79a8',
                    boxShadow: '0 0 20px rgba(253,121,168,0.06), inset 0 0 20px rgba(253,121,168,0.02)',
                  } : {
                    color: '#6a6a7a',
                  }}
                >
                  {/* Active indicator dot */}
                  {active && (
                    <div
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                      style={{
                        background: 'linear-gradient(180deg, #fd79a8, #e84393)',
                        boxShadow: '0 0 8px rgba(253,121,168,0.5)',
                      }}
                    />
                  )}

                  {/* Hover glow bg */}
                  {!active && (
                    <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.01) 100%)' }}
                    />
                  )}

                  {/* Icon */}
                  <span
                    className={`relative shrink-0 transition-all duration-200 ${active ? '' : 'group-hover:text-white'}`}
                    style={active ? { filter: 'drop-shadow(0 0 4px rgba(253,121,168,0.4))' } : {}}
                  >
                    {item.icon}
                  </span>

                  {sidebarOpen && (
                    <span className={`relative transition-all duration-200 ${active ? '' : 'group-hover:text-white group-hover:translate-x-0.5'}`}>
                      {item.label}
                    </span>
                  )}

                  {/* Active border */}
                  {active && (
                    <div className="absolute inset-0 rounded-xl border border-[rgba(253,121,168,0.12)] pointer-events-none" />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* User Section */}
          <div className="p-3 border-t border-white/[0.04] relative">
            {sidebarOpen ? (
              <div className="flex items-center gap-3 px-2 py-2 rounded-xl transition-colors duration-200 hover:bg-white/[0.02] group">
                {/* Avatar with animated gradient ring */}
                <div className="relative w-9 h-9 shrink-0">
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: 'linear-gradient(135deg, #fd79a8, #6c5ce7, #e84393, #a29bfe, #fd79a8)',
                      backgroundSize: '300% 300%',
                      animation: 'avatar-ring 4s ease infinite',
                    }}
                  />
                  <div className="absolute inset-[2px] rounded-full bg-[#0e0e16] flex items-center justify-center">
                    <span className="text-[12px] font-bold bg-gradient-to-br from-[#fd79a8] to-[#a29bfe] bg-clip-text text-transparent">
                      {profile?.full_name?.[0]?.toUpperCase() || profile?.email?.[0]?.toUpperCase() || '?'}
                    </span>
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-semibold truncate text-white/90">
                      {profile?.full_name || 'User'}
                    </span>
                    {/* Plan badge with shimmer for pro/elite */}
                    <span
                      className="shrink-0 text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded"
                      style={isPremiumPlan ? {
                        background: 'linear-gradient(90deg, rgba(253,121,168,0.15), rgba(232,67,147,0.25), rgba(253,121,168,0.15))',
                        backgroundSize: '200% auto',
                        animation: 'shimmer 3s linear infinite',
                        color: '#fd79a8',
                        border: '1px solid rgba(253,121,168,0.2)',
                      } : {
                        background: 'rgba(255,255,255,0.04)',
                        color: '#5a5a6a',
                        border: '1px solid rgba(255,255,255,0.06)',
                      }}
                    >
                      {planLabel}
                    </span>
                  </div>
                  <div className="text-[10px] text-[#4a4a5a] truncate mt-0.5">
                    {profile?.email || 'loading...'}
                  </div>
                </div>

                <button
                  onClick={handleSignOut}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-[#5a5a6a] hover:text-[#ff6b6b] hover:bg-[rgba(255,107,107,0.08)] transition-all duration-200"
                  title="Sign out"
                >
                  {icons.signOut}
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="relative w-9 h-9">
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: 'linear-gradient(135deg, #fd79a8, #6c5ce7, #e84393, #a29bfe, #fd79a8)',
                      backgroundSize: '300% 300%',
                      animation: 'avatar-ring 4s ease infinite',
                    }}
                  />
                  <div className="absolute inset-[2px] rounded-full bg-[#0e0e16] flex items-center justify-center">
                    <span className="text-[12px] font-bold bg-gradient-to-br from-[#fd79a8] to-[#a29bfe] bg-clip-text text-transparent">
                      {profile?.full_name?.[0]?.toUpperCase() || profile?.email?.[0]?.toUpperCase() || '?'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="p-1.5 rounded-lg text-[#5a5a6a] hover:text-[#ff6b6b] hover:bg-[rgba(255,107,107,0.08)] transition-all duration-200"
                  title="Sign out"
                >
                  {icons.signOut}
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* Mobile overlay */}
        {mobileSidebarOpen && (
          <div
            className="fixed inset-0 z-30 lg:hidden"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}

        {/* ─── Main Content ─── */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* Topbar */}
          <header
            className="sticky top-0 z-20 h-[64px] flex items-center justify-between px-4 lg:px-6 border-b border-white/[0.04]"
            style={{
              background: 'rgba(9,9,14,0.7)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            }}
          >
            {/* Left: nav controls + breadcrumb */}
            <div className="flex items-center gap-1 lg:gap-3 min-w-0">
              {/* Mobile menu */}
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg text-[#6a6a7a] hover:text-white hover:bg-white/[0.04] transition-all duration-200"
              >
                {icons.menu}
              </button>

              {/* Sidebar toggle */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="hidden lg:flex p-2 rounded-lg text-[#4a4a5a] hover:text-white/70 hover:bg-white/[0.03] transition-all duration-200"
                title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
              >
                {icons.collapse}
              </button>

              {/* Breadcrumb */}
              <div className="hidden sm:flex items-center gap-1 text-[12px] min-w-0">
                {breadcrumbs.map((crumb, i) => (
                  <span key={crumb.href} className="flex items-center gap-1 min-w-0">
                    {i > 0 && <span className="text-[#2a2a3a] mx-0.5">{icons.chevronRight}</span>}
                    {crumb.isLast ? (
                      <span className="font-semibold text-white/90 capitalize truncate">{crumb.label}</span>
                    ) : (
                      <Link href={crumb.href} className="text-[#5a5a6a] hover:text-white/70 transition-colors capitalize truncate">
                        {crumb.label}
                      </Link>
                    )}
                  </span>
                ))}
              </div>

              {/* Mobile: simple page title */}
              <h1 className="sm:hidden text-[14px] font-semibold capitalize truncate text-white/90">
                {pathname.split('/').pop()?.replace(/-/g, ' ') || 'Dashboard'}
              </h1>
            </div>

            {/* Right: actions */}
            <div className="flex items-center gap-2">
              {/* Command palette trigger */}
              <button
                className="hidden md:flex items-center gap-2 h-8 px-3 rounded-lg text-[12px] text-[#4a4a5a] transition-all duration-200 hover:text-[#6a6a7a] hover:bg-white/[0.03] group"
                style={{
                  border: '1px solid rgba(255,255,255,0.06)',
                  background: 'rgba(255,255,255,0.02)',
                }}
              >
                <span className="text-[#4a4a5a] group-hover:text-[#6a6a7a] transition-colors">{icons.search}</span>
                <span className="font-medium">Search...</span>
                <kbd className="ml-2 h-5 px-1.5 rounded text-[10px] font-semibold flex items-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: '#3a3a4a' }}>
                  <span className="text-[9px] mr-0.5">&#8984;</span>K
                </kbd>
              </button>

              {/* Notification bell */}
              <button
                onClick={() => router.push('/notifications')}
                className="relative p-2 rounded-lg text-[#5a5a6a] hover:text-white/80 hover:bg-white/[0.03] transition-all duration-200 cursor-pointer"
                title="Notifications"
              >
                {icons.bell}
                {/* Badge */}
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#fd79a8]" style={{ boxShadow: '0 0 6px rgba(253,121,168,0.5)' }} />
              </button>

              {/* Divider */}
              <div className="w-px h-6 bg-white/[0.06] mx-1 hidden sm:block" />

              {/* Engine Active badge */}
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                style={{
                  background: 'linear-gradient(135deg, rgba(0,184,148,0.06) 0%, rgba(0,184,148,0.03) 100%)',
                  border: '1px solid rgba(0,184,148,0.1)',
                  animation: 'pulse-glow 3s ease-in-out infinite',
                }}
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-[#00b894] opacity-60 animate-ping" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00b894]" style={{ boxShadow: '0 0 6px rgba(0,184,148,0.6)' }} />
                </span>
                <span className="text-[11px] font-semibold text-[#00b894] hidden sm:inline">Engine Active</span>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 p-4 lg:p-8" style={{ animation: 'fade-in 0.3s ease' }}>
            {children}
          </main>
        </div>
      </div>
    </>
  )
}
