'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase-browser'

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } } }

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

function Section({ title, color, icon, children }: { title: string; color: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <motion.div variants={fadeUp} className="p-6 rounded-2xl" style={{ background: 'linear-gradient(135deg, #1c1c2e 0%, #16162a 100%)', border: `1px solid ${color}18` }}>
      <h3 className="text-[14px] font-bold mb-4 flex items-center gap-2" style={{ color }}>
        {icon}{title}
      </h3>
      {children}
    </motion.div>
  )
}

function EditableField({ label, value, onChange, multiline }: { label: string; value: string; onChange: (v: string) => void; multiline?: boolean }) {
  const cls = "w-full px-4 py-3 rounded-xl bg-[#16161f] border border-white/[0.06] text-white text-[13px] focus:outline-none focus:border-[rgba(253,121,168,0.3)] transition-all resize-none"
  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-semibold text-[#5a5a6a] uppercase tracking-wide">{label}</label>
      {multiline ? (
        <textarea rows={3} value={value} onChange={e => onChange(e.target.value)} className={cls} />
      ) : (
        <input value={value} onChange={e => onChange(e.target.value)} className={cls} />
      )}
    </div>
  )
}

export default function ProfilePage() {
  const [parsed, setParsed] = useState<ParsedResume | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [resumeId, setResumeId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const supabase = createClient()

  // Editable fields
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

      const { data: resume } = await supabase
        .from('resumes')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_primary', true)
        .single()

      if (resume) {
        setResumeId(resume.id)
        const { data } = await supabase
          .from('parsed_resumes')
          .select('*')
          .eq('resume_id', resume.id)
          .single()

        if (data) {
          setParsed(data as ParsedResume)
          setName(data.full_name || '')
          setEmail(data.email || '')
          setPhone(data.phone || '')
          setLocation(data.location || '')
          setSummary(data.summary || '')
          setSkillsStr((data.skills || []).join(', '))
        }
      }
      setLoading(false)
    }
    load()
  }, [supabase])

  const saveProfile = async () => {
    if (!resumeId) return
    setSaving(true)
    const skills = skillsStr.split(',').map(s => s.trim()).filter(Boolean)
    await supabase.from('parsed_resumes').update({
      full_name: name,
      email,
      phone,
      location,
      summary,
      skills,
    }).eq('resume_id', resumeId)

    // Also update profiles table
    const { data: { user } } = await supabase.auth.getUser()
    if (user) await supabase.from('profiles').update({ full_name: name }).eq('id', user.id)

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (!mounted) return <div className="p-8" />

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="w-8 h-8 rounded-full" style={{ border: '2px solid rgba(253,121,168,0.1)', borderTopColor: '#fd79a8' }} />
    </div>
  )

  return (
    <motion.div initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }} className="space-y-6 max-w-[900px] mx-auto">

      {/* Header */}
      <motion.div variants={fadeUp} className="relative overflow-hidden rounded-2xl p-8" style={{
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
              {parsed ? 'Auto-populated from your resume — edit any field and save' : 'Upload a resume to auto-populate your profile'}
            </p>
          </div>
          {parsed && (
            <motion.button whileTap={{ scale: 0.95 }} onClick={saveProfile} disabled={saving}
              className="ml-auto px-6 py-3 rounded-xl text-[13px] font-bold text-white"
              style={{ background: saved ? 'linear-gradient(135deg, #00b894, #00a381)' : 'linear-gradient(135deg, #fd79a8, #e84393)' }}>
              {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Profile'}
            </motion.button>
          )}
        </div>
      </motion.div>

      {!parsed ? (
        <motion.div variants={fadeUp} className="text-center py-16">
          <div className="inline-block mb-4">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#3a3a4a" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <p className="text-[15px] font-semibold text-[#5a5a6a]">No resume uploaded yet</p>
          <p className="text-[12px] text-[#3a3a4a] mt-1 mb-4">Upload a resume to auto-fill your profile</p>
          <a href="/resume" className="inline-block px-6 py-3 rounded-xl text-[13px] font-bold text-white" style={{ background: 'linear-gradient(135deg, #fd79a8, #e84393)' }}>
            Upload Resume →
          </a>
        </motion.div>
      ) : (
        <>
          {/* Contact Info */}
          <Section title="Contact Information" color="#fd79a8"
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}>
            <div className="grid sm:grid-cols-2 gap-4">
              <EditableField label="Full Name" value={name} onChange={setName} />
              <EditableField label="Email" value={email} onChange={setEmail} />
              <EditableField label="Phone" value={phone} onChange={setPhone} />
              <EditableField label="Location" value={location} onChange={setLocation} />
            </div>
          </Section>

          {/* Summary */}
          <Section title="Professional Summary" color="#a29bfe"
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"/></svg>}>
            <EditableField label="Summary" value={summary} onChange={setSummary} multiline />
          </Section>

          {/* Skills */}
          <Section title="Skills" color="#00b894"
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

          {/* Work Experience */}
          {(parsed.experience ?? []).length > 0 && (
            <Section title="Work Experience" color="#fdcb6e"
              icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>}>
              <div className="space-y-4">
                {(parsed.experience ?? []).map((exp, i) => (
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
            </Section>
          )}

          {/* Education */}
          {(parsed.education ?? []).length > 0 && (
            <Section title="Education" color="#74b9ff"
              icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>}>
              <div className="space-y-3">
                {(parsed.education ?? []).map((edu, i) => (
                  <div key={i} className="p-4 rounded-xl" style={{ background: 'rgba(116,185,255,0.03)', border: '1px solid rgba(116,185,255,0.08)' }}>
                    <div className="text-[13px] font-bold text-white">{edu.degree}{edu.field ? ` in ${edu.field}` : ''}</div>
                    <div className="text-[12px] text-[#74b9ff]">{edu.institution}</div>
                    {edu.end_date && <div className="text-[11px] text-[#5a5a6a] mt-0.5">{edu.end_date}</div>}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Certifications & Languages */}
          <div className="grid sm:grid-cols-2 gap-6">
            {(parsed.certifications ?? []).length > 0 && (
              <Section title="Certifications" color="#fd79a8"
                icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>}>
                <div className="flex flex-wrap gap-2">
                  {(parsed.certifications ?? []).map((c, i) => (
                    <span key={i} className="text-[11px] font-semibold px-2.5 py-1 rounded-lg" style={{ background: 'rgba(253,121,168,0.08)', color: '#fd79a8', border: '1px solid rgba(253,121,168,0.12)' }}>{c}</span>
                  ))}
                </div>
              </Section>
            )}
            {(parsed.languages ?? []).length > 0 && (
              <Section title="Languages" color="#a29bfe"
                icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>}>
                <div className="flex flex-wrap gap-2">
                  {(parsed.languages ?? []).map((l, i) => (
                    <span key={i} className="text-[11px] font-semibold px-2.5 py-1 rounded-lg" style={{ background: 'rgba(162,155,254,0.08)', color: '#a29bfe', border: '1px solid rgba(162,155,254,0.12)' }}>{l}</span>
                  ))}
                </div>
              </Section>
            )}
          </div>
        </>
      )}
    </motion.div>
  )
}
