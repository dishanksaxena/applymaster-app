'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } }
const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } } }

export default function SettingsPage() {
  const [profile, setProfile] = useState<{ full_name: string; email: string; plan: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [mounted, setMounted] = useState(false)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [newEmail, setNewEmail] = useState('')
  const [emailMsg, setEmailMsg] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)
  const [resetMsg, setResetMsg] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [nameSaved, setNameSaved] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('theme') as 'dark' | 'light' | null
    if (saved) {
      setTheme(saved)
      document.documentElement.classList.toggle('light-theme', saved === 'light')
    }
  }, [])

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
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
    if (error) {
      setEmailMsg(error.message)
    } else {
      setEmailMsg('✓ Confirmation email sent to both addresses. Check your inbox.')
      setNewEmail('')
    }
  }

  const sendPasswordReset = async () => {
    if (!profile?.email) return
    setResetLoading(true)
    setResetMsg('')
    const { error } = await supabase.auth.resetPasswordForEmail(profile.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setResetLoading(false)
    if (error) {
      setResetMsg(error.message)
    } else {
      setResetMsg('✓ Password reset email sent! Check your inbox.')
    }
  }

  const handleCheckout = async (plan: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    try {
      const response = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: user.id, email: user.email, plan }) })
      const { url } = await response.json()
      if (url) window.location.href = url
    } catch { alert('Failed to start checkout') }
  }

  const handleSignOut = async () => { await supabase.auth.signOut(); router.push('/'); router.refresh() }

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('theme', next)
    document.documentElement.classList.toggle('light-theme', next === 'light')
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="w-8 h-8 rounded-full" style={{ border: '2px solid rgba(253,121,168,0.1)', borderTopColor: '#fd79a8' }} />
    </div>
  )

  const plans = [
    { name: 'pro', price: 29, period: '/mo', color: '#fd79a8', features: ['100 applications/month', 'AI resume optimization', 'Cover letter generation', 'Email support'], icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="13,2 3,14 12,14 11,22 21,10 12,10"/></svg> },
    { name: 'elite', price: 59, period: '/mo', color: '#a29bfe', popular: true, features: ['Unlimited applications', 'Priority AI processing', 'Auto-apply engine', 'Interview coaching', 'Priority support'], icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> },
    { name: 'lifetime', price: 199, period: ' once', color: '#00b894', features: ['Everything in Elite', 'Lifetime access', 'All future features', 'VIP support', 'Early access'], icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
  ]

  if (!mounted) return <div className="p-8" />

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8 max-w-[900px] mx-auto">
      <motion.div variants={fadeUp}>
        <h1 className="text-2xl font-black tracking-tight">Settings</h1>
        <p className="text-[14px] text-[#5a5a6a] mt-1">Manage your account, billing, and preferences</p>
      </motion.div>

      {/* Profile */}
      <motion.div variants={fadeUp} className="p-6 rounded-2xl" style={{ background: 'linear-gradient(135deg, #1c1c2e 0%, #16162a 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, rgba(253,121,168,0.15), rgba(162,155,254,0.15))' }}>
            <span className="text-xl font-bold bg-gradient-to-br from-[#fd79a8] to-[#a29bfe] bg-clip-text text-transparent">
              {profile?.full_name?.[0]?.toUpperCase() || '?'}
            </span>
          </div>
          <div>
            <h3 className="text-[18px] font-bold">{profile?.full_name || 'User'}</h3>
            <p className="text-[13px] text-[#5a5a6a]">{profile?.email}</p>
            <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: 'rgba(253,121,168,0.1)', color: '#fd79a8', border: '1px solid rgba(253,121,168,0.2)' }}>
              {profile?.plan?.toUpperCase() || 'FREE'} PLAN
            </span>
          </div>
        </div>
        <div className="space-y-5">
          {/* Display Name */}
          <div>
            <label className="block text-[12px] font-semibold text-[#6a6a7a] mb-2">Display Name</label>
            <div className="flex gap-3">
              <input value={name} onChange={e => setName(e.target.value)} className="flex-1 px-4 py-3 rounded-xl bg-[#16161f] border border-white/[0.06] text-white text-[14px] focus:outline-none focus:border-[rgba(253,121,168,0.3)] transition-all" />
              <motion.button whileTap={{ scale: 0.95 }} onClick={saveName} disabled={saving} className="px-6 py-3 rounded-xl text-[13px] font-bold text-white" style={{ background: nameSaved ? 'linear-gradient(135deg, #00b894, #00a381)' : 'linear-gradient(135deg, #fd79a8, #e84393)' }}>
                {saving ? 'Saving...' : nameSaved ? '✓ Saved' : 'Save'}
              </motion.button>
            </div>
          </div>

          {/* Current Email */}
          <div>
            <label className="block text-[12px] font-semibold text-[#6a6a7a] mb-2">Current Email</label>
            <div className="px-4 py-3 rounded-xl bg-[#16161f] border border-white/[0.06] text-[#5a5a6a] text-[14px]">{profile?.email}</div>
          </div>

          {/* Update Email */}
          <div>
            <label className="block text-[12px] font-semibold text-[#6a6a7a] mb-2">Update Email Address</label>
            <div className="flex gap-3">
              <input
                type="email"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                placeholder="Enter new email address"
                className="flex-1 px-4 py-3 rounded-xl bg-[#16161f] border border-white/[0.06] text-white text-[14px] placeholder-[#3a3a4a] focus:outline-none focus:border-[rgba(116,185,255,0.3)] transition-all"
              />
              <motion.button whileTap={{ scale: 0.95 }} onClick={updateEmail} disabled={emailLoading}
                className="px-6 py-3 rounded-xl text-[13px] font-bold text-white shrink-0"
                style={{ background: 'linear-gradient(135deg, #74b9ff, #0984e3)' }}>
                {emailLoading ? 'Sending...' : 'Update'}
              </motion.button>
            </div>
            {emailMsg && (
              <p className="mt-2 text-[12px]" style={{ color: emailMsg.startsWith('✓') ? '#00b894' : '#ff6b6b' }}>{emailMsg}</p>
            )}
            <p className="mt-1.5 text-[11px] text-[#4a4a5a]">A confirmation link will be sent to both your old and new email.</p>
          </div>

          {/* Reset Password */}
          <div className="pt-2 border-t border-white/[0.04]">
            <label className="block text-[12px] font-semibold text-[#6a6a7a] mb-2">Password</label>
            <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div>
                <p className="text-[13px] text-white font-semibold">Reset Password</p>
                <p className="text-[11px] text-[#5a5a6a] mt-0.5">We&apos;ll send a reset link to {profile?.email}</p>
              </div>
              <motion.button whileTap={{ scale: 0.95 }} onClick={sendPasswordReset} disabled={resetLoading}
                className="px-5 py-2.5 rounded-xl text-[12px] font-bold shrink-0"
                style={{ background: 'rgba(253,121,168,0.1)', color: '#fd79a8', border: '1px solid rgba(253,121,168,0.2)' }}>
                {resetLoading ? 'Sending...' : 'Send Reset Link'}
              </motion.button>
            </div>
            {resetMsg && (
              <p className="mt-2 text-[12px]" style={{ color: resetMsg.startsWith('✓') ? '#00b894' : '#ff6b6b' }}>{resetMsg}</p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Billing */}
      <motion.div variants={fadeUp} className="p-6 rounded-2xl" style={{ background: 'linear-gradient(135deg, #1c1c2e 0%, #16162a 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <h3 className="text-[16px] font-bold mb-1">Upgrade Your Plan</h3>
        <p className="text-[12px] text-[#5a5a6a] mb-6">Unlock more features</p>
        <div className="grid sm:grid-cols-3 gap-4">
          {plans.map(plan => (
            <motion.div key={plan.name} whileHover={{ y: -4, scale: 1.02 }} className="relative p-5 rounded-2xl group"
              style={{ background: profile?.plan === plan.name ? `${plan.color}08` : 'rgba(255,255,255,0.02)', border: `1px solid ${plan.popular ? `${plan.color}20` : 'rgba(255,255,255,0.1)'}` }}>
              {plan.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold px-3 py-1 rounded-full text-white" style={{ background: 'linear-gradient(135deg, #a29bfe, #6c5ce7)' }}>POPULAR</div>}
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: `${plan.color}12`, color: plan.color }}>{plan.icon}</div>
              <div className="text-[13px] font-bold capitalize mb-1" style={{ color: plan.color }}>{plan.name}</div>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-3xl font-black text-white">${plan.price}</span>
                <span className="text-[12px] text-[#5a5a6a]">{plan.period}</span>
              </div>
              <div className="space-y-2 mb-5">
                {plan.features.map(f => (
                  <div key={f} className="flex items-center gap-2 text-[12px] text-[#8a8a9a]">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={plan.color} strokeWidth="3"><path d="M20 6L9 17L4 12"/></svg>{f}
                  </div>
                ))}
              </div>
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleCheckout(plan.name)} disabled={profile?.plan === plan.name}
                className="w-full py-2.5 rounded-xl text-[12px] font-bold disabled:opacity-30"
                style={{ background: `${plan.color}15`, color: plan.color, border: `1px solid ${plan.color}20` }}>
                {profile?.plan === plan.name ? 'Current Plan' : 'Upgrade'}
              </motion.button>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Appearance */}
      <motion.div variants={fadeUp} className="p-6 rounded-2xl" style={{ background: 'linear-gradient(135deg, #1c1c2e 0%, #16162a 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <h3 className="text-[16px] font-bold mb-1">Appearance</h3>
        <p className="text-[12px] text-[#5a5a6a] mb-5">Choose your preferred theme</p>
        <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: theme === 'dark' ? 'rgba(162,155,254,0.12)' : 'rgba(253,203,110,0.12)' }}>
              {theme === 'dark' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a29bfe" strokeWidth="1.8"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fdcb6e" strokeWidth="1.8"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              )}
            </div>
            <div>
              <div className="text-[13px] font-semibold text-white">{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</div>
              <div className="text-[11px] text-[#5a5a6a]">{theme === 'dark' ? 'Easy on the eyes' : 'Bright and clear'}</div>
            </div>
          </div>
          <button onClick={toggleTheme} className="relative w-12 h-6 rounded-full transition-all duration-300 focus:outline-none"
            style={{ background: theme === 'dark' ? 'rgba(162,155,254,0.3)' : 'rgba(253,203,110,0.5)', border: `1px solid ${theme === 'dark' ? 'rgba(162,155,254,0.4)' : 'rgba(253,203,110,0.5)'}` }}>
            <span className="absolute top-0.5 w-5 h-5 rounded-full transition-all duration-300 shadow-md flex items-center justify-center"
              style={{ left: theme === 'dark' ? '2px' : 'calc(100% - 22px)', background: theme === 'dark' ? '#a29bfe' : '#fdcb6e' }}>
              {theme === 'dark' ? (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="white" stroke="none"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
              ) : (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="white" stroke="none"><circle cx="12" cy="12" r="5"/></svg>
              )}
            </span>
          </button>
        </div>
      </motion.div>

      {/* Danger Zone */}
      <motion.div variants={fadeUp} className="p-6 rounded-2xl" style={{ background: '#12121a', border: '1px solid rgba(255,95,87,0.1)' }}>
        <h3 className="text-[15px] font-bold text-[#ff6b6b] mb-4">Danger Zone</h3>
        <motion.button whileTap={{ scale: 0.95 }} onClick={handleSignOut}
          className="px-6 py-2.5 rounded-xl text-[13px] font-bold text-[#ff6b6b] hover:bg-[rgba(255,107,107,0.08)]" style={{ border: '1px solid rgba(255,107,107,0.15)' }}>
          Sign Out
        </motion.button>
      </motion.div>
    </motion.div>
  )
}
