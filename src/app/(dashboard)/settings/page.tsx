'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'

interface Profile {
  full_name: string
  email: string
  plan: string
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (data) {
      setProfile({
        full_name: data.full_name || '',
        email: data.email,
        plan: data.plan,
      })
    }
    setLoading(false)
  }

  const handleCheckout = async (plan: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          email: user.email,
          plan: plan,
        }),
      })

      const { url } = await response.json()
      if (url) window.location.href = url
    } catch (err) {
      console.error(err)
      alert('Failed to start checkout')
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  if (loading) return <div className="text-center py-12 text-[#5a5a6a]">Loading...</div>

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h2 className="text-2xl font-black tracking-tight mb-1">Settings</h2>
        <p className="text-[14px] text-[#8a8a9a]">Manage your account and subscription.</p>
      </div>

      {/* Account */}
      <div className="p-6 rounded-2xl bg-[#12121a] border border-[rgba(255,255,255,0.06)]">
        <h3 className="text-[15px] font-bold mb-5">Account</h3>
        {profile && (
          <div className="space-y-4">
            <div>
              <label className="block text-[12px] font-semibold text-[#8a8a9a] mb-2">Name</label>
              <div className="px-4 py-3 rounded-xl bg-[#16161f] border border-[rgba(255,255,255,0.06)] text-white text-[14px]">
                {profile.full_name || 'Not set'}
              </div>
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-[#8a8a9a] mb-2">Email</label>
              <div className="px-4 py-3 rounded-xl bg-[#16161f] border border-[rgba(255,255,255,0.06)] text-white text-[14px]">
                {profile.email}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Billing */}
      <div className="p-6 rounded-2xl bg-[#12121a] border border-[rgba(255,255,255,0.06)]">
        <h3 className="text-[15px] font-bold mb-5">Billing</h3>
        <div className="mb-6">
          <p className="text-[13px] text-[#8a8a9a] mb-3">Current Plan: <span className="font-bold text-white">{profile?.plan?.toUpperCase() || 'FREE'}</span></p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { name: 'pro', price: 29, features: '100 apps/mo' },
            { name: 'elite', price: 59, features: 'Unlimited apps' },
            { name: 'lifetime', price: 199, features: 'Forever access' },
          ].map(plan => (
            <button
              key={plan.name}
              onClick={() => handleCheckout(plan.name)}
              disabled={profile?.plan === plan.name}
              className={`p-4 rounded-xl border transition-all text-center ${
                profile?.plan === plan.name ? 'bg-[rgba(253,121,168,0.08)] border-[rgba(253,121,168,0.2)] cursor-not-allowed' : 'bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.06)] hover:border-[rgba(253,121,168,0.2)]'
              }`}
            >
              <div className="text-[13px] font-bold text-white capitalize mb-1">{plan.name}</div>
              <div className="text-2xl font-black text-[#fd79a8] mb-2">${plan.price}</div>
              <div className="text-[11px] text-[#5a5a6a]">{plan.features}</div>
              {profile?.plan === plan.name && <div className="text-[10px] text-[#00b894] mt-2">✓ Current</div>}
            </button>
          ))}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="p-6 rounded-2xl bg-[#12121a] border border-[rgba(255,95,87,0.1)]">
        <h3 className="text-[15px] font-bold text-[#ff5f57] mb-4">Danger Zone</h3>
        <button onClick={handleSignOut} className="px-6 py-2.5 rounded-xl bg-[rgba(255,95,87,0.1)] border border-[rgba(255,95,87,0.2)] text-[13px] font-bold text-[#ff5f57] hover:bg-[rgba(255,95,87,0.15)] transition-all">
          Sign Out
        </button>
      </div>
    </div>
  )
}
