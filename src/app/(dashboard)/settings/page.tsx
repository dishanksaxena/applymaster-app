'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'
import { applyTheme, getStoredTheme, type Theme } from '@/lib/theme'
import { withAlpha } from '@/lib/tone'
import { toast } from '@/components/Toast'

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } }
const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } } }

const THEME_OPTIONS: { value: Theme; label: string; icon: JSX.Element }[] = [
  {
    value: 'light',
    label: 'Light',
    icon: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
      </>
    ),
  },
  {
    value: 'dark',
    label: 'Dark',
    icon: <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />,
  },
  {
    value: 'system',
    label: 'System',
    icon: (
      <>
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </>
    ),
  },
]

export default function SettingsPage() {
  const [profile, setProfile] = useState<{ full_name: string; email: string; plan: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [mounted, setMounted] = useState(false)
  const [theme, setTheme] = useState<Theme>('system')
  const [newEmail, setNewEmail] = useState('')
  const [emailMsg, setEmailMsg] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)
  const [resetMsg, setResetMsg] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [nameSaved, setNameSaved] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  // The class is already set by the root layout's pre-paint script; this
  // only syncs local state so the control renders the right position.
  useEffect(() => {
    setMounted(true)
    setTheme(getStoredTheme())
  }, [])

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
      if (data) {
        setProfile({ full_name: data.full_name || '', email: data.email, plan: data.plan })
        setName(data.full_name || '')
      }
      setLoading(false)
    }
    load()
  }, [supabase])

  const saveName = async () => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) await supabase.from('profiles').update({ full_name: name }).eq('id', user.id)
    setSaving(false)
    setNameSaved(true)
    setTimeout(() => setNameSaved(false), 2000)
  }

  const updateEmail = async () => {
    if (!newEmail || !newEmail.includes('@')) { setEmailMsg('Please enter a valid email.'); return }
    setEmailLoading(true)
    setEmailMsg('')
    const { error } = await supabase.auth.updateUser({ email: newEmail })
    setEmailLoading(false)
    if (error) { setEmailMsg(error.message) } else { setEmailMsg('Confirmation email sent to both addresses.'); setNewEmail('') }
  }

  const sendPasswordReset = async () => {
    if (!profile?.email) return
    setResetLoading(true)
    setResetMsg('')
    const { error } = await supabase.auth.resetPasswordForEmail(profile.email, { redirectTo: `${window.location.origin}/reset-password` })
    setResetLoading(false)
    if (error) { setResetMsg(error.message) } else { setResetMsg('Password reset email sent! Check your inbox.') }
  }

  /* Back from Stripe. The plan is changed by the webhook, not by this page,
     so wait for it to land rather than claiming it already has. */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const upgraded = params.get('upgraded')
    const cancelled = params.get('checkout') === 'cancelled'
    if (!upgraded && !cancelled) return
    window.history.replaceState(null, '', window.location.pathname)
    if (cancelled) {
      toast.info('Checkout cancelled. You were not charged.')
      return
    }
    const label = upgraded!.charAt(0).toUpperCase() + upgraded!.slice(1)
    let tries = 0
    let stop = false
    const check = async () => {
      if (stop) return
      const { data: { user } } = await supabase.auth.getUser()
      const { data } = user ? await supabase.from('profiles').select('plan').eq('id', user.id).maybeSingle() : { data: null }
      if (data?.plan === upgraded) {
        setProfile(p => (p ? { ...p, plan: data.plan } : p))
        toast.success(`You're on ${label}. Thank you!`)
      } else if (++tries < 15) setTimeout(check, 2000)
      else toast.info(`Payment received. ${label} can take a minute to switch on; refresh this page shortly.`)
    }
    check()
    return () => { stop = true }
  }, [supabase])

  const [billingLoading, setBillingLoading] = useState(false)
  const openBilling = async () => {
    setBillingLoading(true)
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' })
      const json = await res.json().catch(() => ({}))
      if (json.url) { window.location.href = json.url; return }
      toast.error(json.error || 'Billing is unavailable right now')
    } catch {
      toast.error('Billing is unavailable right now')
    }
    setBillingLoading(false)
  }

  /* Opens Stripe Checkout, or the billing portal to switch an existing
     monthly plan. While checkout is not open to this account the server
     records the interest and says so instead. */
  const handleCheckout = async (plan: string) => {
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const json = await response.json().catch(() => ({}))
      if (json.url) {
        window.location.href = json.url
        return
      }
      if (json.waitlist) {
        const name = plan.charAt(0).toUpperCase() + plan.slice(1)
        toast.success(`You’re on the list for ${name}. Paid plans open shortly — we’ll email you the moment they do. Everything you use today stays free meanwhile.`)
        return
      }
      toast.error(json.error || 'Checkout is unavailable right now')
    } catch {
      toast.error('Checkout is unavailable right now')
    }
  }

  const handleSignOut = async () => { await supabase.auth.signOut(); router.push('/'); router.refresh() }

  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)
  const handleDeleteAccount = async () => {
    setDeleting(true)
    try {
      const res = await fetch('/api/account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: deleteConfirm }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'Could not delete your account')
      await supabase.auth.signOut().catch(() => {})
      router.push('/?deleted=1')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not delete your account')
      setDeleting(false)
    }
  }

  const setThemePref = (next: Theme) => {
    setTheme(next)
    applyTheme(next)
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="w-8 h-8 rounded-full" style={{ border: '2px solid var(--accent-dim)', borderTopColor: 'var(--accent)' }} />
    </div>
  )

  const plans = [
    { name: 'pro', price: 29, period: '/mo', color: 'var(--accent-solid)', features: ['100 applications/month', 'AI resume optimization', 'Cover letter generation', 'Email support'], icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="13,2 3,14 12,14 11,22 21,10 12,10"/></svg> },
    { name: 'elite', price: 59, period: '/mo', color: 'var(--purple)', popular: true, features: ['Unlimited applications', 'Priority AI processing', 'Auto-apply engine', 'Interview coaching', 'Priority support'], icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> },
    { name: 'lifetime', price: 199, period: ' once', color: 'var(--green)', features: ['Everything in Elite', 'Lifetime access', 'All future features', 'VIP support', 'Early access'], icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
  ]

  const rank = (p?: string) => ['free', 'pro', 'elite', 'lifetime'].indexOf(p || 'free')
  const paid = rank(profile?.plan) > 0

  if (!mounted) return <div className="p-8" />

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8 max-w-[900px] mx-auto">
      <motion.div variants={fadeUp}>
        <h1 className="font-display text-[1.6rem]" style={{ color: 'var(--text)' }}>Settings</h1>
        <p className="text-[14px] mt-1" style={{ color: 'var(--text-muted)' }}>Manage your account, billing, and preferences</p>
      </motion.div>

      {/* Profile */}
      <motion.div variants={fadeUp} className="theme-card-gradient p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--accent-dim)' }}>
            <span className="text-xl font-bold bg-gradient-to-br from-[var(--accent)] to-[var(--purple)] bg-clip-text text-transparent">
              {profile?.full_name?.[0]?.toUpperCase() || '?'}
            </span>
          </div>
          <div>
            <h3 className="text-[18px] font-bold" style={{ color: 'var(--text)' }}>{profile?.full_name || 'User'}</h3>
            <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>{profile?.email}</p>
            <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--border-accent)' }}>
              {profile?.plan?.toUpperCase() || 'FREE'} PLAN
            </span>
          </div>
        </div>
        <div className="space-y-5">
          <div>
            <label className="block text-[12px] font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Display Name</label>
            <div className="flex gap-3">
              <input value={name} onChange={e => setName(e.target.value)} className="flex-1 px-4 py-3 rounded-xl text-[14px] theme-input" />
              <motion.button whileTap={{ scale: 0.95 }} onClick={saveName} disabled={saving} className="px-6 py-3 rounded-xl text-[13px] font-bold text-ink" style={{ background: nameSaved ? 'linear-gradient(135deg, var(--green), var(--green))' : 'linear-gradient(135deg, var(--accent-solid), var(--accent-solid))' }}>
                {saving ? 'Saving...' : nameSaved ? 'Saved' : 'Save'}
              </motion.button>
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Current Email</label>
            <div className="px-4 py-3 rounded-xl text-[14px]" style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>{profile?.email}</div>
          </div>

          <div>
            <label className="block text-[12px] font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Update Email Address</label>
            <div className="flex gap-3">
              <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="Enter new email address" className="flex-1 px-4 py-3 rounded-xl text-[14px] theme-input" />
              <motion.button whileTap={{ scale: 0.95 }} onClick={updateEmail} disabled={emailLoading} className="px-6 py-3 rounded-xl text-[13px] font-bold text-[var(--text-on-accent)] shrink-0" style={{ background: 'linear-gradient(135deg, var(--blue), #0773c5)' }}>
                {emailLoading ? 'Sending...' : 'Update'}
              </motion.button>
            </div>
            {emailMsg && <p className="mt-2 text-[12px]" style={{ color: emailMsg.startsWith('Confirmation') ? 'var(--green)' : 'var(--red)' }}>{emailMsg}</p>}
            <p className="mt-1.5 text-[11px]" style={{ color: 'var(--text-faint)' }}>A confirmation link will be sent to both your old and new email.</p>
          </div>

          <div className="pt-2" style={{ borderTop: '1px solid var(--border)' }}>
            <label className="block text-[12px] font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Password</label>
            <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border)' }}>
              <div>
                <p className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>Reset Password</p>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>We&apos;ll send a reset link to {profile?.email}</p>
              </div>
              <motion.button whileTap={{ scale: 0.95 }} onClick={sendPasswordReset} disabled={resetLoading} className="px-5 py-2.5 rounded-xl text-[12px] font-bold shrink-0" style={{ background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--border-accent)' }}>
                {resetLoading ? 'Sending...' : 'Send Reset Link'}
              </motion.button>
            </div>
            {resetMsg && <p className="mt-2 text-[12px]" style={{ color: resetMsg.startsWith('Password') ? 'var(--green)' : 'var(--red)' }}>{resetMsg}</p>}
          </div>
        </div>
      </motion.div>

      {/* Billing */}
      <motion.div variants={fadeUp} className="theme-card-gradient p-6">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h3 className="text-[16px] font-bold mb-1" style={{ color: 'var(--text)' }}>{paid ? 'Your Plan' : 'Upgrade Your Plan'}</h3>
            <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
              {paid ? 'Switch plans, update your card, cancel, or download invoices.' : 'Unlock more features'}
            </p>
          </div>
          {paid && (
            <motion.button whileTap={{ scale: 0.95 }} onClick={openBilling} disabled={billingLoading} className="px-4 py-2.5 rounded-xl text-[12px] font-bold shrink-0" style={{ background: 'var(--bg-overlay)', color: 'var(--text)', border: '1px solid var(--border)' }}>
              {billingLoading ? 'Opening…' : 'Manage billing'}
            </motion.button>
          )}
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {plans.map(plan => (
            <motion.div key={plan.name} whileHover={{ y: -4, scale: 1.02 }} className="relative p-5 rounded-2xl group" style={{ background: 'var(--bg-card)', border: `1px solid ${plan.popular ? `${withAlpha(plan.color, 0.18, true)}` : 'var(--border)'}`, boxShadow: 'var(--shadow-sm)' }}>
              {plan.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold px-3 py-1 rounded-full text-[var(--text-on-accent)]" style={{ background: 'linear-gradient(135deg, var(--purple), var(--purple))' }}>POPULAR</div>}
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: `${withAlpha(plan.color, 0.09, true)}`, color: plan.color }}>{plan.icon}</div>
              <div className="text-[13px] font-bold capitalize mb-1" style={{ color: plan.color }}>{plan.name}</div>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="font-display text-[1.9rem]" style={{ color: 'var(--text)' }}>${plan.price}</span>
                <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>{plan.period}</span>
              </div>
              <div className="space-y-2 mb-5">
                {plan.features.map(f => (
                  <div key={f} className="flex items-center gap-2 text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={plan.color} strokeWidth="3"><path d="M20 6L9 17L4 12"/></svg>{f}
                  </div>
                ))}
              </div>
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleCheckout(plan.name)} disabled={profile?.plan === plan.name || profile?.plan === 'lifetime'} className="w-full py-2.5 rounded-xl text-[12px] font-bold disabled:opacity-30" style={{ background: `${withAlpha(plan.color, 0.09, true)}`, color: plan.color, border: `1px solid ${withAlpha(plan.color, 0.14, true)}` }}>
                {profile?.plan === plan.name
                  ? 'Current Plan'
                  : profile?.plan === 'lifetime'
                    ? 'Included'
                    : rank(plan.name) < rank(profile?.plan)
                      ? `Switch to ${plan.name.charAt(0).toUpperCase() + plan.name.slice(1)}`
                      : 'Upgrade'}
              </motion.button>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Appearance */}
      <motion.div variants={fadeUp} className="theme-card-gradient p-6">
        <h3 className="text-[16px] font-bold mb-1" style={{ color: 'var(--text)' }}>Appearance</h3>
        <p className="text-[12px] mb-5" style={{ color: 'var(--text-muted)' }}>
          Choose a theme, or follow your device setting.
        </p>

        <div
          role="radiogroup"
          aria-label="Colour theme"
          className="grid grid-cols-3 gap-2 p-2 rounded-xl"
          style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border)' }}
        >
          {THEME_OPTIONS.map(opt => {
            const active = mounted && theme === opt.value
            return (
              <button
                key={opt.value}
                role="radio"
                aria-checked={active}
                onClick={() => setThemePref(opt.value)}
                className="flex flex-col items-center gap-2 py-3 px-2 rounded-lg text-[12px] font-semibold transition-colors"
                style={{
                  background: active ? 'var(--accent-dim)' : 'transparent',
                  color: active ? 'var(--accent)' : 'var(--text-secondary)',
                  border: `1px solid ${active ? 'var(--border-accent)' : 'transparent'}`,
                }}
              >
                <svg
                  width="18" height="18" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="1.8"
                  strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
                >
                  {opt.icon}
                </svg>
                {opt.label}
              </button>
            )
          })}
        </div>
      </motion.div>

      {/* Your data — promised on the site as export and one-click deletion,
          and neither existed until now. */}
      <motion.div variants={fadeUp} className="p-6 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
        <h3 className="text-[15px] font-bold text-[var(--text)] mb-1">Your data</h3>
        <p className="text-[12.5px] text-[var(--text-muted)] mb-4">
          Everything ApplyMaster holds about you — profile, resumes, applications, receipts, cover letters, network and more — as one file.
        </p>
        <a
          href="/api/account/export"
          className="inline-block px-5 py-2.5 rounded-xl text-[13px] font-semibold"
          style={{ background: 'var(--bg-overlay)', color: 'var(--text)' }}
        >
          Download my data
        </a>
      </motion.div>

      {/* Danger Zone */}
      <motion.div variants={fadeUp} className="p-6 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid rgb(var(--red-rgb) / 0.18)', boxShadow: 'var(--shadow-sm)' }}>
        <h3 className="text-[15px] font-bold text-[var(--red)] mb-4">Danger Zone</h3>
        <motion.button whileTap={{ scale: 0.95 }} onClick={handleSignOut} className="px-6 py-2.5 rounded-xl text-[13px] font-bold text-[var(--red)] hover:bg-[rgb(var(--red-rgb)/0.06)]" style={{ border: '1px solid rgb(var(--red-rgb) / calc(0.2 * var(--tint-scale)))' }}>
          Sign Out
        </motion.button>

        <div className="mt-6 pt-5" style={{ borderTop: '1px solid var(--border)' }}>
          <p className="text-[13px] font-semibold text-[var(--text)]">Delete my account</p>
          <p className="text-[12.5px] text-[var(--text-muted)] mt-1 mb-3">
            Permanently deletes your account, resumes, applications, receipts, network and every other record. This cannot be undone.
            Download your data first if you want a copy.
          </p>
          <label htmlFor="delete-confirm" className="block text-[12px] text-[var(--text-secondary)] mb-1.5">
            Type <strong className="text-[var(--text)]">{profile?.email}</strong> to confirm
          </label>
          <div className="flex flex-wrap gap-2">
            <input
              id="delete-confirm"
              value={deleteConfirm}
              onChange={e => setDeleteConfirm(e.target.value)}
              autoComplete="off"
              className="flex-1 min-w-[220px] px-3.5 py-2.5 rounded-xl text-[13px] outline-none"
              style={{ background: 'var(--bg-input)', color: 'var(--text)', boxShadow: 'inset 0 0 0 1px var(--card-ring)' }}
            />
            <button
              onClick={handleDeleteAccount}
              disabled={deleting || !profile?.email || deleteConfirm.trim().toLowerCase() !== profile.email.toLowerCase()}
              className="px-5 py-2.5 rounded-xl text-[13px] font-bold disabled:opacity-40"
              style={{ background: 'var(--red)', color: '#fff' }}
            >
              {deleting ? 'Deleting…' : 'Delete everything'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
