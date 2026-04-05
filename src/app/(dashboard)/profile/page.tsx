'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase-browser'
import { PremiumCard, PremiumButton } from '@/components/premium'
import { fadeInUp, staggerContainer } from '@/lib/animations'

interface ParsedResume {
  full_name: string | null
  email: string | null
  phone: string | null
  location: string | null
  summary: string | null
  skills: string[]
  experience: { company: string; title: string; start_date?: string; end_date?: string; description?: string }[]
  education: { institution: string; degree?: string; field?: string; end_date?: string }[]
  certifications: string[]
  languages: string[]
}

function Section({ title, color, icon, children, accent }: { title: string; color: string; icon: React.ReactNode; children: React.ReactNode; accent?: 'pink' | 'purple' | 'blue' | 'green' | 'yellow' | 'none' }) {
  return (
    <motion.div variants={fadeInUp}>
      <PremiumCard accent={accent || 'pink'} glowEffect={false}>
        <div className="p-6">
          <h3 className="text-[14px] font-bold mb-4 flex items-center gap-2 text-white">
            {icon}{title}
          </h3>
          {children}
        </div>
      </PremiumCard>
    </motion.div>
  )
}

function EditableField({ label, value, onChange, multiline, type }: { label: string; value: string; onChange: (v: string) => void; multiline?: boolean; type?: string }) {
  const cls = "w-full px-4 py-3 rounded-xl bg-[#16161f] border border-white/[0.06] text-white text-[13px] focus:outline-none focus:border-[rgba(253,121,168,0.3)] transition-all resize-none"
  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-semibold text-[#5a5a6a] uppercase tracking-wide">{label}</label>
      {multiline ? (
        <textarea rows={3} value={value} onChange={e => onChange(e.target.value)} className={cls} />
      ) : (
        <input type={type || 'text'} value={value} onChange={e => onChange(e.target.value)} className={cls} />
      )}
    </div>
  )
}

export default function ProfilePage() {
  const [parsedExtra, setParsedExtra] = useState<ParsedResume | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [resumeId, setResumeId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const supabase = createClient()

  // Editable fields — always available
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [location, setLocation] = useState('')
  const [summary, setSummary] = useState('')
  const [skillsStr, setSkillsStr] = useState('')

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // 1. Load from profiles table
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profile) {
        setName(profile.full_name || '')
        setEmail(profile.email || user.email || '')
      } else {
        setEmail(user.email || '')
      }

      // 2. Load from job_preferences for resume data
      const { data: prefs } = await supabase
        .from('job_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (prefs) {
        // Build a ParsedResume object from job_preferences
        const resumeData: ParsedResume = {
          full_name: profile?.full_name || null,
          email: profile?.email || null,
          phone: null, // Not stored yet, can be added to onboarding
          location: null, // Not stored yet
          summary: null, // Not stored yet
          skills: prefs.key_skills || [],
          experience: [],
          education: [],
          certifications: [],
          languages: [],
        }
        setParsedExtra(resumeData)
        setSkillsStr((prefs.key_skills || []).join(', '))
      }

      // 3. Check if primary resume exists
      const { data: resume } = await supabase
        .from('resumes')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_primary', true)
        .single()

      if (resume) {
        setResumeId(resume.id)
      }

      setLoading(false)
    }
    load()
  }, [supabase])

  const saveProfile = async () => {
    setSaving(true)
    const skills = skillsStr.split(',').map(s => s.trim()).filter(Boolean)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    // Save name to profiles table
    await supabase.from('profiles').update({ full_name: name }).eq('id', user.id)

    // Save skills to job_preferences
    const { data: prefs } = await supabase.from('job_preferences').select('id').eq('user_id', user.id).single()
    if (prefs) {
      await supabase.from('job_preferences').update({ key_skills: skills }).eq('user_id', user.id)
    }

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  if (!mounted) return <div className="p-8" />

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="w-8 h-8 rounded-full" style={{ border: '2px solid rgba(253,121,168,0.1)', borderTopColor: '#fd79a8' }} />
    </div>
  )

  return (
    <motion.div initial="hidden" animate="show" variants={staggerContainer} className="space-y-6 max-w-[900px] mx-auto">

      {/* Header */}
      <motion.div variants={fadeInUp} className="relative overflow-hidden rounded-2xl p-8" style={{
        background: 'linear-gradient(135deg, rgba(253,121,168,0.08) 0%, rgba(162,155,254,0.06) 100%)',
        border: '1px solid rgba(253,121,168,0.1)',
      }}>
        <div className="absolute top-[-50%] right-[-10%] w-[300px] h-[300px] rounded-full opacity-[0.07]" style={{ background: 'radial-gradient(circle, #fd79a8, transparent 70%)' }} />
        <div className="relative z-10 flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 text-2xl font-black"
            style={{ background: 'linear-gradient(135deg, rgba(253,121,168,0.15), rgba(162,155,254,0.15))', border: '1px solid rgba(253,121,168,0.15)', color: '#fd79a8' }}>
            {name?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">{name || 'Your Profile'}</h1>
            <p className="text-[13px] text-[#8a8a9a] mt-0.5">
              {parsedExtra ? 'Auto-populated from your resume — edit any field and save' : 'Edit your profile details and save'}
            </p>
            {!parsedExtra && (
              <a href="/resume" className="inline-flex items-center gap-1.5 mt-2 text-[12px] font-semibold" style={{ color: '#fd79a8' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                Upload resume to auto-fill →
              </a>
            )}
          </div>
          <PremiumButton
            variant={saved ? 'success' : 'primary'}
            onClick={saveProfile}
            disabled={saving}
            loading={saving}>
            {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Profile'}
          </PremiumButton>
        </div>
      </motion.div>

      {/* Contact Info — always visible */}
      <Section title="Contact Information" color="#fd79a8" accent="pink"
        icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}>
        <div className="grid sm:grid-cols-2 gap-4">
          <EditableField label="Full Name" value={name} onChange={setName} />
          <EditableField label="Email" value={email} onChange={setEmail} type="email" />
          <EditableField label="Phone" value={phone} onChange={setPhone} type="tel" />
          <EditableField label="Location" value={location} onChange={setLocation} />
        </div>
      </Section>

      {/* Summary — always visible */}
      <Section title="Professional Summary" color="#a29bfe" accent="purple"
        icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"/></svg>}>
        <EditableField label="Summary" value={summary} onChange={setSummary} multiline />
      </Section>

      {/* Skills — always visible */}
      <Section title="Skills" color="#00b894" accent="green"
        icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>}>
        <div className="space-y-3">
          <EditableField label="Skills (comma-separated)" value={skillsStr} onChange={setSkillsStr} />
          {skillsStr && (
            <div className="flex flex-wrap gap-2 mt-3">
              {skillsStr.split(',').map(s => s.trim()).filter(Boolean).map((skill, i) => (
                <span key={i} className="text-[11px] font-semibold px-2.5 py-1 rounded-lg" style={{ background: 'rgba(0,184,148,0.08)', color: '#00b894', border: '1px solid rgba(0,184,148,0.12)' }}>
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>
      </Section>

      {/* Work Experience — from resume if available */}
      {(parsedExtra?.experience ?? []).length > 0 && (
        <Section title="Work Experience" color="#fdcb6e" accent="yellow"
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>}>
          <div className="space-y-4">
            {(parsedExtra?.experience ?? []).map((exp, i) => (
              <div key={i} className="p-4 rounded-xl" style={{ background: 'rgba(253,203,110,0.03)', border: '1px solid rgba(253,203,110,0.08)' }}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div>
                    <div className="text-[13px] font-bold text-white">{exp.title}</div>
                    <div className="text-[12px] text-[#fdcb6e]">{exp.company}</div>
                  </div>
                  {(exp.start_date || exp.end_date) && (
                    <span className="text-[11px] text-[#5a5a6a] shrink-0">{exp.start_date} {exp.start_date && exp.end_date ? '–' : ''} {exp.end_date || 'Present'}</span>
                  )}
                </div>
                {exp.description && <p className="text-[12px] text-[#6a6a7a] mt-2 leading-relaxed">{typeof exp.description === 'string' ? exp.description.slice(0, 300) : ''}</p>}
              </div>
            ))}
          </div>
          <p className="text-[11px] text-[#4a4a5a] mt-3">Re-upload your resume to update work history</p>
        </Section>
      )}

      {/* Education — from resume if available */}
      {(parsedExtra?.education ?? []).length > 0 && (
        <Section title="Education" color="#74b9ff" accent="blue"
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>}>
          <div className="space-y-3">
            {(parsedExtra?.education ?? []).map((edu, i) => (
              <div key={i} className="p-4 rounded-xl" style={{ background: 'rgba(116,185,255,0.03)', border: '1px solid rgba(116,185,255,0.08)' }}>
                <div className="text-[13px] font-bold text-white">{edu.degree}{edu.field ? ` in ${edu.field}` : ''}</div>
                <div className="text-[12px] text-[#74b9ff]">{edu.institution}</div>
                {edu.end_date && <div className="text-[11px] text-[#5a5a6a] mt-0.5">{edu.end_date}</div>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Certifications & Languages — from resume if available */}
      {((parsedExtra?.certifications ?? []).length > 0 || (parsedExtra?.languages ?? []).length > 0) && (
        <div className="grid sm:grid-cols-2 gap-6">
          {(parsedExtra?.certifications ?? []).length > 0 && (
            <Section title="Certifications" color="#fd79a8" accent="pink"
              icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>}>
              <div className="flex flex-wrap gap-2">
                {(parsedExtra?.certifications ?? []).map((c, i) => (
                  <span key={i} className="text-[11px] font-semibold px-2.5 py-1 rounded-lg" style={{ background: 'rgba(253,121,168,0.08)', color: '#fd79a8', border: '1px solid rgba(253,121,168,0.12)' }}>{c}</span>
                ))}
              </div>
            </Section>
          )}
          {(parsedExtra?.languages ?? []).length > 0 && (
            <Section title="Languages" color="#a29bfe" accent="purple"
              icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>}>
              <div className="flex flex-wrap gap-2">
                {(parsedExtra?.languages ?? []).map((l, i) => (
                  <span key={i} className="text-[11px] font-semibold px-2.5 py-1 rounded-lg" style={{ background: 'rgba(162,155,254,0.08)', color: '#a29bfe', border: '1px solid rgba(162,155,254,0.12)' }}>{l}</span>
                ))}
              </div>
            </Section>
          )}
        </div>
      )}

      {/* Save button at bottom too */}
      <motion.div variants={fadeInUp} className="flex justify-end">
        <PremiumButton
          variant={saved ? 'success' : 'primary'}
          size="lg"
          onClick={saveProfile}
          disabled={saving}
          loading={saving}>
          {saving ? 'Saving...' : saved ? '✓ Profile Saved!' : 'Save Profile'}
        </PremiumButton>
      </motion.div>

    </motion.div>
  )
}
