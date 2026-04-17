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
  network: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="18" r="2.5"/><circle cx="12" cy="12" r="3"/>
      <line x1="8" y1="7.5" x2="10" y2="10"/><line x1="16" y1="7.5" x2="14" y2="10"/><line x1="8" y1="16.5" x2="10" y2="14"/><line x1="16" y1="16.5" x2="14" y2="14"/>
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
  { label: 'Referral Network', href: '/network', icon: icons.network },
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
`

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [onboardingChecked, setOnboardingChecked] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  // Restore theme preference on mount — default is light (no class)
  useEffect(() => {
    const saved = localStorage.getItem('theme')
    if (saved === 'dark') {
      document.documentElement.classList.add('dark-theme')
    } else {
      document.documentElement.classList.remove('dark-theme')
    }
  }, [pathname])

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setLoading(false)
          return
        }
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        if (data) {
          const profileData = data as Profile
          setProfile(profileData)

          if (!onboardingChecked) {
            if (pathname !== '/onboarding' && !profileData.onboarding_complete) {
              router.push('/onboarding')
            }
            setOnboardingChecked(true)
          }
        }
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [supabase, onboardingChecked, pathname, router])

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

  if (loading) {
    return <div className="min-h-screen" style={{ background: 'var(--bg)' }} />
  }

  if (pathname === '/onboarding') {
    return <>{children}</>
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: animationStyles }} />
      <div className="min-h-screen flex" style={{ background: 'var(--bg)' }}>

        {/* ─── Sidebar ─── */}
        <aside
          className={`fixed lg:sticky top-0 left-0 z-40 h-screen flex flex-col transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${sidebarOpen ? 'w-[260px]' : 'w-[72px]'} ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
          style={{ background: 'var(--bg-sidebar)', borderRight: '1px solid var(--sidebar-border)' }}
        >
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-3 px-5 h-[64px] shrink-0 relative hover:opacity-80 transition-opacity duration-200" style={{ borderBottom: '1px solid var(--sidebar-divider)' }}>
            <div className="relative w-8 h-8 shrink-0">
              <div
                className="absolute inset-0 rounded-lg"
                style={{
                  background: 'linear-gradient(135deg, #fd79a8, #e84393, #fd79a8)',
                  backgroundSize: '200% 200%',
                  animation: 'gradient-rotate 3s ease infinite',
                }}
              />
              <div className="absolute inset-[1px] rounded-[7px] flex items-center justify-center" style={{ background: 'var(--bg-sidebar)' }}>
                <span className="text-[10px] font-black bg-gradient-to-r from-[#fd79a8] to-[#e84393] bg-clip-text text-transparent">AM</span>
              </div>
            </div>
            {sidebarOpen && (
              <span className="text-[15px] font-extrabold tracking-tight" style={{ color: 'var(--text)', animation: 'fade-in 0.2s ease' }}>
                Apply<span className="bg-gradient-to-r from-[#fd79a8] to-[#e84393] bg-clip-text text-transparent">Master</span>
              </span>
            )}
          </Link>

          {/* Navigation */}
          <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
            {sidebarOpen && (
              <div className="px-3 pb-2 pt-1">
                <span className="text-[10px] font-semibold tracking-[0.08em] uppercase" style={{ color: 'var(--text-faint)' }}>Navigation</span>
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
                    background: 'var(--sidebar-active-bg)',
                    color: 'var(--sidebar-active-text)',
                    boxShadow: 'var(--shadow-sm)',
                  } : {
                    color: 'var(--sidebar-text)',
                  }}
                >
                  {/* Active indicator dot */}
                  {active && (
                    <div
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                      style={{
                        background: 'linear-gradient(180deg, #fd79a8, #e84393)',
                      }}
                    />
                  )}

                  {/* Hover bg */}
                  {!active && (
                    <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{ background: 'var(--sidebar-hover-bg)' }}
                    />
                  )}

                  {/* Icon */}
                  <span className={`relative shrink-0 transition-all duration-200 ${active ? '' : 'group-hover:text-[var(--text)]'}`}>
                    {item.icon}
                  </span>

                  {sidebarOpen && (
                    <span className={`relative transition-all duration-200 ${active ? '' : 'group-hover:text-[var(--text)] group-hover:translate-x-0.5'}`}>
                      {item.label}
                    </span>
                  )}

                  {active && (
                    <div className="absolute inset-0 rounded-xl pointer-events-none" style={{ border: '1px solid var(--border-accent)' }} />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* User Section */}
          <div className="p-3 relative" style={{ borderTop: '1px solid var(--sidebar-divider)' }}>
            {sidebarOpen ? (
              <div className="flex items-center gap-3 px-2 py-2 rounded-xl transition-colors duration-200 group" style={{ cursor: 'default' }}>
                <div className="relative w-9 h-9 shrink-0">
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: 'linear-gradient(135deg, #fd79a8, #6c5ce7, #e84393, #a29bfe, #fd79a8)',
                      backgroundSize: '300% 300%',
                      animation: 'avatar-ring 4s ease infinite',
                    }}
                  />
                  <div className="absolute inset-[2px] rounded-full flex items-center justify-center" style={{ background: 'var(--bg-sidebar)' }}>
                    <span className="text-[12px] font-bold bg-gradient-to-br from-[#fd79a8] to-[#a29bfe] bg-clip-text text-transparent">
                      {profile?.full_name?.[0]?.toUpperCase() || profile?.email?.[0]?.toUpperCase() || '?'}
                    </span>
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-semibold truncate" style={{ color: 'var(--text)' }}>
                      {profile?.full_name || 'User'}
                    </span>
                    <span
                      className="shrink-0 text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded"
                      style={isPremiumPlan ? {
                        background: 'var(--badge-pro-bg)',
                        backgroundSize: '200% auto',
                        animation: 'shimmer 3s linear infinite',
                        color: 'var(--badge-pro-text)',
                        border: '1px solid var(--border-accent)',
                      } : {
                        background: 'var(--badge-free-bg)',
                        color: 'var(--badge-free-text)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      {planLabel}
                    </span>
                  </div>
                  <div className="text-[10px] truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {profile?.email || 'loading...'}
                  </div>
                </div>

                <button
                  onClick={handleSignOut}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all duration-200"
                  style={{ color: 'var(--text-muted)' }}
                  title="Sign out"
                >
                  {icons.signOut}
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="relative w-9 h-9">
                  <div className="absolute inset-0 rounded-full" style={{ background: 'linear-gradient(135deg, #fd79a8, #6c5ce7, #e84393, #a29bfe, #fd79a8)', backgroundSize: '300% 300%', animation: 'avatar-ring 4s ease infinite' }} />
                  <div className="absolute inset-[2px] rounded-full flex items-center justify-center" style={{ background: 'var(--bg-sidebar)' }}>
                    <span className="text-[12px] font-bold bg-gradient-to-br from-[#fd79a8] to-[#a29bfe] bg-clip-text text-transparent">
                      {profile?.full_name?.[0]?.toUpperCase() || profile?.email?.[0]?.toUpperCase() || '?'}
                    </span>
                  </div>
                </div>
                <button onClick={handleSignOut} className="p-1.5 rounded-lg transition-all duration-200" style={{ color: 'var(--text-muted)' }} title="Sign out">
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
            style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }}
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}

        {/* ─── Main Content ─── */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* Topbar */}
          <header
            className="sticky top-0 z-20 h-[64px] flex items-center justify-between px-4 lg:px-6"
            style={{
              background: 'var(--bg-topbar)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              borderBottom: '1px solid var(--border)',
            }}
          >
            {/* Left: nav controls + breadcrumb */}
            <div className="flex items-center gap-1 lg:gap-3 min-w-0">
              <button onClick={() => setMobileSidebarOpen(true)} className="lg:hidden p-2 rounded-lg transition-all duration-200" style={{ color: 'var(--text-muted)' }}>
                {icons.menu}
              </button>

              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="hidden lg:flex p-2 rounded-lg transition-all duration-200" style={{ color: 'var(--text-faint)' }} title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}>
                {icons.collapse}
              </button>

              <div className="hidden sm:flex items-center gap-1 text-[12px] min-w-0">
                {breadcrumbs.map((crumb, i) => (
                  <span key={crumb.href} className="flex items-center gap-1 min-w-0">
                    {i > 0 && <span className="mx-0.5" style={{ color: 'var(--text-faint)' }}>{icons.chevronRight}</span>}
                    {crumb.isLast ? (
                      <span className="font-semibold capitalize truncate" style={{ color: 'var(--text)' }}>{crumb.label}</span>
                    ) : (
                      <Link href={crumb.href} className="capitalize truncate transition-colors" style={{ color: 'var(--text-muted)' }}>
                        {crumb.label}
                      </Link>
                    )}
                  </span>
                ))}
              </div>

              <h1 className="sm:hidden text-[14px] font-semibold capitalize truncate" style={{ color: 'var(--text)' }}>
                {pathname.split('/').pop()?.replace(/-/g, ' ') || 'Dashboard'}
              </h1>
            </div>

            {/* Right: actions */}
            <div className="flex items-center gap-2">
              <button
                className="hidden md:flex items-center gap-2 h-8 px-3 rounded-lg text-[12px] transition-all duration-200 group"
                style={{
                  border: '1px solid var(--border)',
                  background: 'var(--bg-overlay)',
                  color: 'var(--text-muted)',
                }}
              >
                <span className="transition-colors">{icons.search}</span>
                <span className="font-medium">Search...</span>
                <kbd className="ml-2 h-5 px-1.5 rounded text-[10px] font-semibold flex items-center" style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border)', color: 'var(--text-faint)' }}>
                  <span className="text-[9px] mr-0.5">&#8984;</span>K
                </kbd>
              </button>

              <button
                onClick={() => router.push('/notifications')}
                className="relative p-2 rounded-lg transition-all duration-200 cursor-pointer"
                style={{ color: 'var(--text-muted)' }}
                title="Notifications"
              >
                {icons.bell}
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#e84393]" style={{ boxShadow: '0 0 6px rgba(232,67,147,0.5)' }} />
              </button>

              <div className="w-px h-6 mx-1 hidden sm:block" style={{ background: 'var(--border)' }} />

              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                style={{
                  background: 'var(--green-dim)',
                  border: '1px solid rgba(0,184,148,0.15)',
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
