'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import type { Profile } from '@/lib/database.types'

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: '◉' },
  { label: 'Jobs', href: '/jobs', icon: '🔍' },
  { label: 'Applications', href: '/applications', icon: '📋' },
  { label: 'Resume', href: '/resume', icon: '📄' },
  { label: 'Cover Letters', href: '/cover-letters', icon: '✉️' },
  { label: 'Auto-Apply', href: '/auto-apply', icon: '⚡' },
  { label: 'Interview Coach', href: '/interview-coach', icon: '🎤' },
  { label: 'Settings', href: '/settings', icon: '⚙️' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

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

  // Onboarding page gets its own minimal layout
  if (pathname === '/onboarding') {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">
      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 z-40 h-screen flex flex-col transition-all duration-300 bg-[#0e0e16] border-r border-[rgba(255,255,255,0.04)] ${sidebarOpen ? 'w-[240px]' : 'w-[72px]'} ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 h-[64px] border-b border-[rgba(255,255,255,0.04)] shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#fd79a8] to-[#e84393] flex items-center justify-center text-white font-black text-[10px] shrink-0">AM</div>
          {sidebarOpen && <span className="text-[15px] font-extrabold tracking-tight">Apply<span className="text-[#fd79a8]">Master</span></span>}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 group ${active ? 'bg-[rgba(253,121,168,0.08)] text-[#fd79a8] border border-[rgba(253,121,168,0.15)]' : 'text-[#8a8a9a] hover:text-white hover:bg-[rgba(255,255,255,0.03)]'}`}
              >
                <span className="text-base shrink-0">{item.icon}</span>
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* User section */}
        <div className="p-3 border-t border-[rgba(255,255,255,0.04)]">
          {sidebarOpen ? (
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#a29bfe] to-[#6c5ce7] flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                {profile?.full_name?.[0]?.toUpperCase() || profile?.email?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-semibold truncate">{profile?.full_name || 'User'}</div>
                <div className="text-[10px] text-[#5a5a6a] truncate">{profile?.plan?.toUpperCase() || 'FREE'} Plan</div>
              </div>
              <button onClick={handleSignOut} className="text-[#5a5a6a] hover:text-[#ff5f57] transition-colors" title="Sign out">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              </button>
            </div>
          ) : (
            <button onClick={handleSignOut} className="w-full flex justify-center py-2 text-[#5a5a6a] hover:text-[#ff5f57] transition-colors" title="Sign out">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
          )}
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileSidebarOpen && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setMobileSidebarOpen(false)} />}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-20 h-[64px] flex items-center justify-between px-6 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-[rgba(255,255,255,0.04)]">
          <div className="flex items-center gap-4">
            <button onClick={() => setMobileSidebarOpen(true)} className="lg:hidden p-2 text-[#8a8a9a] hover:text-white">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="hidden lg:block p-2 text-[#5a5a6a] hover:text-white transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <h1 className="text-[15px] font-bold capitalize">
              {pathname.split('/').pop()?.replace(/-/g, ' ') || 'Dashboard'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[rgba(0,184,148,0.06)] border border-[rgba(0,184,148,0.12)]">
              <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full rounded-full bg-[#00b894] opacity-75 animate-ping" /><span className="relative inline-flex rounded-full h-2 w-2 bg-[#00b894]" /></span>
              <span className="text-[11px] font-semibold text-[#00b894]">Engine Active</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
