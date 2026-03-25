'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'

const steps = ['Upload Resume', 'Job Preferences', 'Choose Plan']

export default function OnboardingPage() {
  const [step, setStep] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [preferences, setPreferences] = useState({
    target_roles: '' as string,
    target_locations: '' as string,
    remote_preference: 'any' as string,
    experience_level: 'mid' as string,
    min_salary: '' as string,
  })
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleResumeUpload = async () => {
    if (!resumeFile) { setStep(1); return }
    setUploading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const ext = resumeFile.name.split('.').pop()
    const path = `${user.id}/${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage.from('resumes').upload(path, resumeFile)
    if (uploadError) { console.error(uploadError); setUploading(false); return }

    const { data: { publicUrl } } = supabase.storage.from('resumes').getPublicUrl(path)

    await supabase.from('resumes').insert({
      user_id: user.id,
      name: resumeFile.name,
      file_url: publicUrl,
      is_primary: true,
    })

    setUploading(false)
    setStep(1)
  }

  const handlePreferences = async () => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('job_preferences').upsert({
      user_id: user.id,
      target_roles: preferences.target_roles.split(',').map(s => s.trim()).filter(Boolean),
      target_locations: preferences.target_locations.split(',').map(s => s.trim()).filter(Boolean),
      remote_preference: preferences.remote_preference,
      experience_level: preferences.experience_level,
      min_salary: preferences.min_salary ? parseInt(preferences.min_salary) : null,
    })

    setSaving(false)
    setStep(2)
  }

  const handleComplete = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('profiles').update({ onboarding_complete: true }).eq('id', user.id)
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center relative overflow-hidden">
      <div className="absolute top-[-30%] right-[-20%] w-[600px] h-[600px] rounded-full opacity-[0.06]" style={{ background: 'radial-gradient(circle, #fd79a8, transparent 70%)' }} />
      <div className="absolute bottom-[-30%] left-[-20%] w-[600px] h-[600px] rounded-full opacity-[0.04]" style={{ background: 'radial-gradient(circle, #a29bfe, transparent 70%)' }} />

      <div className="relative z-10 w-full max-w-xl px-6">
        {/* Progress */}
        <div className="flex items-center justify-center gap-3 mb-10">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold transition-all ${i <= step ? 'bg-gradient-to-br from-[#fd79a8] to-[#e84393] text-white' : 'bg-[#1a1a26] text-[#5a5a6a] border border-[rgba(255,255,255,0.06)]'}`}>
                {i < step ? '✓' : i + 1}
              </div>
              {i < steps.length - 1 && <div className={`w-16 h-[2px] rounded-full transition-all ${i < step ? 'bg-[#fd79a8]' : 'bg-[rgba(255,255,255,0.06)]'}`} />}
            </div>
          ))}
        </div>

        <div className="p-8 rounded-2xl bg-[#12121a] border border-[rgba(255,255,255,0.06)] shadow-[0_40px_100px_rgba(0,0,0,0.5)]">
          {/* Step 1: Upload Resume */}
          {step === 0 && (
            <div>
              <div className="text-center mb-8">
                <div className="text-3xl mb-3">📄</div>
                <h2 className="text-xl font-black mb-2">Upload Your Resume</h2>
                <p className="text-[13px] text-[#8a8a9a]">AI will parse and optimize it for maximum ATS scores.</p>
              </div>

              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-[rgba(255,255,255,0.08)] rounded-xl p-10 text-center cursor-pointer hover:border-[rgba(253,121,168,0.2)] transition-colors"
              >
                <input ref={fileRef} type="file" accept=".pdf,.docx" className="hidden" onChange={e => setResumeFile(e.target.files?.[0] || null)} />
                {resumeFile ? (
                  <div>
                    <div className="text-2xl mb-2">✅</div>
                    <div className="text-[14px] font-semibold">{resumeFile.name}</div>
                    <div className="text-[12px] text-[#5a5a6a] mt-1">{(resumeFile.size / 1024).toFixed(0)} KB</div>
                  </div>
                ) : (
                  <div>
                    <div className="text-2xl mb-2">📤</div>
                    <div className="text-[14px] font-semibold mb-1">Drop your PDF or DOCX here</div>
                    <div className="text-[12px] text-[#5a5a6a]">or click to browse</div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-8">
                <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl border border-[rgba(255,255,255,0.06)] text-[13px] font-semibold text-[#8a8a9a] hover:text-white transition-colors">
                  Skip for now
                </button>
                <button onClick={handleResumeUpload} disabled={uploading} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#fd79a8] to-[#e84393] text-white font-bold text-[13px] hover:shadow-[0_8px_30px_rgba(253,121,168,0.3)] transition-all disabled:opacity-50">
                  {uploading ? 'Uploading...' : 'Continue'}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Job Preferences */}
          {step === 1 && (
            <div>
              <div className="text-center mb-8">
                <div className="text-3xl mb-3">🎯</div>
                <h2 className="text-xl font-black mb-2">Set Your Preferences</h2>
                <p className="text-[13px] text-[#8a8a9a]">Tell us what you&apos;re looking for so AI can find perfect matches.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[12px] font-semibold text-[#8a8a9a] mb-2">Target Roles (comma separated)</label>
                  <input value={preferences.target_roles} onChange={e => setPreferences({ ...preferences, target_roles: e.target.value })} placeholder="Software Engineer, Full Stack Developer" className="w-full px-4 py-3 rounded-xl bg-[#16161f] border border-[rgba(255,255,255,0.06)] text-white text-[14px] placeholder-[#5a5a6a] focus:outline-none focus:border-[rgba(253,121,168,0.3)] transition-all" />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-[#8a8a9a] mb-2">Preferred Locations</label>
                  <input value={preferences.target_locations} onChange={e => setPreferences({ ...preferences, target_locations: e.target.value })} placeholder="San Francisco, New York, Remote" className="w-full px-4 py-3 rounded-xl bg-[#16161f] border border-[rgba(255,255,255,0.06)] text-white text-[14px] placeholder-[#5a5a6a] focus:outline-none focus:border-[rgba(253,121,168,0.3)] transition-all" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-semibold text-[#8a8a9a] mb-2">Work Type</label>
                    <select value={preferences.remote_preference} onChange={e => setPreferences({ ...preferences, remote_preference: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-[#16161f] border border-[rgba(255,255,255,0.06)] text-white text-[14px] focus:outline-none focus:border-[rgba(253,121,168,0.3)] transition-all">
                      <option value="any">Any</option>
                      <option value="remote">Remote</option>
                      <option value="hybrid">Hybrid</option>
                      <option value="onsite">On-site</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-[#8a8a9a] mb-2">Experience Level</label>
                    <select value={preferences.experience_level} onChange={e => setPreferences({ ...preferences, experience_level: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-[#16161f] border border-[rgba(255,255,255,0.06)] text-white text-[14px] focus:outline-none focus:border-[rgba(253,121,168,0.3)] transition-all">
                      <option value="entry">Entry Level</option>
                      <option value="mid">Mid Level</option>
                      <option value="senior">Senior</option>
                      <option value="lead">Lead / Staff</option>
                      <option value="executive">Executive</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-[#8a8a9a] mb-2">Minimum Salary ($/year)</label>
                  <input type="number" value={preferences.min_salary} onChange={e => setPreferences({ ...preferences, min_salary: e.target.value })} placeholder="100000" className="w-full px-4 py-3 rounded-xl bg-[#16161f] border border-[rgba(255,255,255,0.06)] text-white text-[14px] placeholder-[#5a5a6a] focus:outline-none focus:border-[rgba(253,121,168,0.3)] transition-all" />
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button onClick={() => setStep(0)} className="flex-1 py-3 rounded-xl border border-[rgba(255,255,255,0.06)] text-[13px] font-semibold text-[#8a8a9a] hover:text-white transition-colors">Back</button>
                <button onClick={handlePreferences} disabled={saving} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#fd79a8] to-[#e84393] text-white font-bold text-[13px] hover:shadow-[0_8px_30px_rgba(253,121,168,0.3)] transition-all disabled:opacity-50">
                  {saving ? 'Saving...' : 'Continue'}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Choose Plan */}
          {step === 2 && (
            <div>
              <div className="text-center mb-8">
                <div className="text-3xl mb-3">🚀</div>
                <h2 className="text-xl font-black mb-2">You&apos;re All Set!</h2>
                <p className="text-[13px] text-[#8a8a9a]">Start with Free and upgrade anytime. No credit card required.</p>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-8">
                {[
                  { name: 'Free', price: '$0', features: '10 apps/mo', active: true },
                  { name: 'Pro', price: '$29', features: '100 apps/mo', active: false },
                ].map(p => (
                  <div key={p.name} className={`p-5 rounded-xl border text-center ${p.active ? 'border-[rgba(253,121,168,0.3)] bg-[rgba(253,121,168,0.04)]' : 'border-[rgba(255,255,255,0.06)]'}`}>
                    <div className="text-[14px] font-bold mb-1">{p.name}</div>
                    <div className="text-2xl font-black mb-2" style={{ color: p.active ? '#fd79a8' : '#8a8a9a' }}>{p.price}</div>
                    <div className="text-[11px] text-[#5a5a6a]">{p.features}</div>
                  </div>
                ))}
              </div>

              <button onClick={handleComplete} className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#fd79a8] to-[#e84393] text-white font-bold text-[14px] hover:shadow-[0_8px_30px_rgba(253,121,168,0.3)] transition-all">
                Start Applying on Autopilot
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
