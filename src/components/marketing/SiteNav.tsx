'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'

/**
 * Shared marketing navigation.
 *
 * Previously only the landing page had a nav — /features, /pricing, /blog,
 * /privacy and /terms rendered with no header at all, so a visitor landing
 * on any of them had no way to move around and no theme control.
 *
 * `anchors` is used on the landing page, where the links jump to sections.
 * Everywhere else they resolve to the real routes.
 */
export default function SiteNav({ anchors = false }: { anchors?: boolean }) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [signedIn, setSignedIn] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    ;(async () => {
      try {
        const { createClient } = await import('@/lib/supabase-browser')
        const { data: { user } } = await createClient().auth.getUser()
        if (user) setSignedIn(true)
      } catch { /* signed out */ }
    })()
  }, [])

  const links = anchors
    ? [['Features', '#features'], ['How it works', '#how-it-works'], ['Pricing', '#pricing'], ['FAQ', '#faq']]
    : [['Features', '/features'], ['Integrations', '/integrations'], ['Pricing', '/pricing'], ['Blog', '/blog']]

  return (
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
        <Link href="/" className="flex items-center gap-2.5">
          <span
            className="w-9 h-9 rounded-lg grid place-items-center font-bold text-[12px]"
            style={{ background: 'var(--accent-solid)', color: 'var(--text-on-accent)' }}
          >
            AM
          </span>
          <span className="text-[18px] font-bold tracking-tight" style={{ color: 'var(--text)' }}>
            Apply<span style={{ color: 'var(--accent)' }}>Master</span>
          </span>
        </Link>

        <div className="hidden lg:flex items-center gap-1">
          {links.map(([label, href]) => (
            <Link
              key={label}
              href={href}
              className="px-3 py-2 rounded-lg text-[13.5px] font-medium transition-colors hover:opacity-70"
              style={{ color: 'var(--text-secondary)' }}
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {signedIn ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center px-5 py-2.5 rounded-full text-[13px] font-semibold"
              style={{ background: 'var(--accent-solid)', color: 'var(--text-on-accent)' }}
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden lg:inline-block px-4 py-2 text-[13.5px] font-semibold rounded-lg"
                style={{ color: 'var(--text-secondary)' }}
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="hidden lg:inline-flex items-center px-5 py-2.5 rounded-full text-[13px] font-semibold"
                style={{ background: 'var(--accent-solid)', color: 'var(--text-on-accent)' }}
              >
                Start free
              </Link>
            </>
          )}

          <button
            onClick={() => setOpen(!open)}
            className="lg:hidden grid place-items-center w-9 h-9 rounded-md"
            style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
            aria-label="Toggle menu"
            aria-expanded={open}
            aria-controls="site-nav-mobile"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              {open ? <path d="M18 6 6 18M6 6l12 12" /> : <path d="M3 12h18M3 6h18M3 18h18" />}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div
          id="site-nav-mobile"
          className="lg:hidden p-6 space-y-1"
          style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}
        >
          {links.map(([label, href]) => (
            <Link
              key={label}
              href={href}
              onClick={() => setOpen(false)}
              className="block px-3 py-3 rounded-lg text-[15px] font-medium"
              style={{ color: 'var(--text-secondary)' }}
            >
              {label}
            </Link>
          ))}
          <div className="pt-3">
            <Link
              href={signedIn ? '/dashboard' : '/signup'}
              className="block text-center py-3 rounded-full font-semibold"
              style={{ background: 'var(--accent-solid)', color: 'var(--text-on-accent)' }}
            >
              {signedIn ? 'Dashboard' : 'Start free'}
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
