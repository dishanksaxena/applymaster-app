'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase-browser'
import { PremiumCard, PremiumButton } from '@/components/premium'
import { fadeInUp, staggerContainer } from '@/lib/animations'

const ROLES = ['Software Engineer', 'Product Manager', 'Data Scientist', 'Designer', 'DevOps Engineer', 'Full Stack Dev', 'Frontend Dev', 'Backend Dev', 'ML Engineer', 'Mobile Dev']
const INDUSTRIES = ['Technology/IT', 'Finance', 'Healthcare', 'E-commerce', 'SaaS', 'Consulting', 'Manufacturing', 'Real Estate', 'Education', 'Media & Entertainment', 'Telecommunications', 'Automotive', 'Food & Beverage', 'Travel & Tourism', 'Logistics', 'Retail', 'Banking', 'Insurance', 'Government', 'Energy', 'Agriculture', 'Construction', 'Nonprofits', 'Legal Services', 'Recruiting', 'Marketing', 'Biotech/Pharma', 'Gaming', 'Fintech', 'Sustainability']
const WORK_AUTH = ['Citizen', 'Permanent Resident', 'Work Visa (Can Work)', 'Need Sponsorship', 'No Restrictions']
const EMPLOYMENT = ['Employed (Actively Looking)', 'Employed (Passive)', 'Unemployed', 'Student', 'Recently Laid Off', 'Self-Employed']
const START_DATES = ['Immediately', 'Within 2 Weeks', 'Within 1 Month', 'Within 2 Months', 'Within 3 Months', '3–6 Months', 'More than 6 Months', 'Flexible / Not Sure']
const SKILLS = ['Python', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'SQL', 'AWS', 'GCP', 'Docker', 'Kubernetes', 'Machine Learning', 'Data Analysis', 'UI/UX Design', 'Product Strategy', 'Leadership', 'Communication', 'Problem Solving', 'Project Management']
const COMPANY_SIZES = ['Startup (<50)', 'Small (50-200)', 'Medium (200-1000)', 'Large (1000+)', 'No preference']
const JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'No preference']
const INTERVIEW_STYLES = ['Behavioral', 'Technical/Coding', 'Case Studies', 'System Design', 'No preference']
const ETHNICITIES = ['Prefer not to say', 'Asian or Pacific Islander', 'Black or African American', 'Hispanic or Latino', 'Middle Eastern or North African', 'Native American or Alaska Native', 'White or Caucasian', 'Two or more races', 'Other']
const CITIES_BY_COUNTRY: Record<string, string[]> = {
  'United States': ['New York', 'San Francisco', 'Los Angeles', 'Seattle', 'Austin', 'Boston', 'Chicago', 'Denver', 'Miami', 'Portland', 'Atlanta', 'Dallas', 'Washington DC'],
  'Canada': ['Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Ottawa', 'Edmonton'],
  'United Kingdom': ['London', 'Manchester', 'Edinburgh', 'Birmingham', 'Bristol', 'Leeds'],
  'Australia': ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide'],
  'India': ['Bangalore', 'Mumbai', 'Delhi', 'Hyderabad', 'Chennai', 'Pune', 'Ahmedabad'],
  'Germany': ['Berlin', 'Munich', 'Hamburg', 'Frankfurt', 'Cologne'],
  'Netherlands': ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht'],
  'France': ['Paris', 'Lyon', 'Marseille', 'Bordeaux'],
  'Spain': ['Madrid', 'Barcelona', 'Valencia', 'Seville'],
  'Japan': ['Tokyo', 'Osaka', 'Yokohama', 'Kyoto'],
  'Singapore': ['Singapore'],
  'UAE': ['Dubai', 'Abu Dhabi', 'Sharjah'],
  'Hong Kong': ['Hong Kong'],
  'Ireland': ['Dublin', 'Cork', 'Galway'],
  'Sweden': ['Stockholm', 'Gothenburg', 'Malmö'],
}

function SectionCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <motion.div variants={fadeInUp}>
      <PremiumCard accent="pink" glowEffect={false}>
        <div className="p-6">
          <h3 className="text-[14px] font-bold mb-4 flex items-center gap-2 text-white">
            {icon} {title}
          </h3>
          {children}
        </div>
      </PremiumCard>
    </motion.div>
  )
}

function EditField({ label, value, onChange, type = 'text', multiline }: any) {
  return (
    <div className="space-y-1">
      <label className="text-[11px] font-bold text-[#fd79a8] uppercase">{label}</label>
      {multiline ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} rows={3}
          className="w-full px-3 py-2 rounded-lg bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-white text-[12px] focus:border-[rgba(253,121,168,0.3)] outline-none resize-none" />
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-white text-[12px] focus:border-[rgba(253,121,168,0.3)] outline-none" />
      )}
    </div>
  )
}

function SelectField({ label, value, onChange, options }: any) {
  return (
    <div className="space-y-1">
      <label className="text-[11px] font-bold text-[#fd79a8] uppercase">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-[rgba(255,255,255,0.08)] text-white text-[12px] focus:border-[rgba(253,121,168,0.3)] outline-none"
        style={{ background: '#13131f' }}>
        {options.map((opt: string) => <option key={opt} value={opt} style={{ background: '#13131f', color: 'white' }}>{opt}</option>)}
      </select>
    </div>
  )
}

function ChipSelector({ label, selected, options, onChange, max }: any) {
  return (
    <div>
      <label className="text-[11px] font-bold text-[#fd79a8] uppercase mb-2 block">{label}</label>
      <div className="grid grid-cols-2 gap-2">
        {options.map((opt: string) => (
          <button key={opt} onClick={() => {
            if (selected.includes(opt)) onChange(selected.filter((s: string) => s !== opt))
            else if (!max || selected.length < max) onChange([...selected, opt])
          }}
            className={`px-3 py-2 rounded-lg text-[11px] font-medium transition-all ${selected.includes(opt) ? 'bg-[rgba(253,121,168,0.15)] text-[#fd79a8] border border-[rgba(253,121,168,0.3)]' : 'bg-[rgba(255,255,255,0.04)] text-[#8a8a9a] border border-transparent hover:bg-[rgba(255,255,255,0.08)]'}`}>
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const supabase = createClient()

  // Contact Info
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  // Professional Summary & Details
  const [summary, setSummary] = useState('')
  const [education, setEducation] = useState<any[]>([])
  const [certifications, setCertifications] = useState<any[]>([])
  const [workExperience, setWorkExperience] = useState<any[]>([])

  // Career Preferences
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [minSalary, setMinSalary] = useState(50000)
  const [maxSalary, setMaxSalary] = useState(150000)
  const [experienceLevel, setExperienceLevel] = useState('mid')
  const [remotePreference, setRemotePreference] = useState('any')
  const [workType, setWorkType] = useState('Full-time')

  // Career Details
  const [employmentStatus, setEmploymentStatus] = useState('Employed (Actively Looking)')
  const [workAuth, setWorkAuth] = useState('Citizen')
  const [desiredJobTitle, setDesiredJobTitle] = useState('')
  const [availableStartDate, setAvailableStartDate] = useState('Immediately')
  const [willingToRelocate, setWillingToRelocate] = useState(true)
  const [selectedCountry, setSelectedCountry] = useState('')
  const [selectedCities, setSelectedCities] = useState<string[]>([])
  const [ethnicity, setEthnicity] = useState('Prefer not to say')

  // Skills & Industries
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([])
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [companySize, setCompanySize] = useState('No preference')
  const [interviewStyle, setInterviewStyle] = useState('No preference')

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    const load = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        if (profile) {
          setName(profile.full_name || '')
          setEmail(profile.email || user.email || '')
          setSummary(profile.professional_summary || '')
          setEducation(profile.education || [])
          setCertifications(profile.certifications || [])
          setWorkExperience(profile.work_experience || [])
        } else {
          setEmail(user.email || '')
        }

        const { data: prefs } = await supabase.from('job_preferences').select('*').eq('user_id', user.id).single()
        if (prefs) {
          if (prefs.target_roles?.length) setSelectedRoles(prefs.target_roles)
          if (prefs.min_salary) setMinSalary(prefs.min_salary)
          if (prefs.max_salary) setMaxSalary(prefs.max_salary)
          if (prefs.experience_level) setExperienceLevel(prefs.experience_level)
          if (prefs.remote_preference) setRemotePreference(prefs.remote_preference)
          if (prefs.employment_type) setWorkType(prefs.employment_type)
          if (prefs.work_authorization) setWorkAuth(prefs.work_authorization)
          if (prefs.current_employment_status) setEmploymentStatus(prefs.current_employment_status)
          if (prefs.desired_job_title) setDesiredJobTitle(prefs.desired_job_title)
          if (prefs.available_start_date) setAvailableStartDate(prefs.available_start_date)
          if (prefs.willing_to_relocate !== null) setWillingToRelocate(prefs.willing_to_relocate)
          if (prefs.country_preference) setSelectedCountry(prefs.country_preference)
          if (prefs.city_preferences?.length) setSelectedCities(prefs.city_preferences)
          if (prefs.ethnicity) setEthnicity(prefs.ethnicity)
          if (prefs.industries?.length) setSelectedIndustries(prefs.industries)
          if (prefs.key_skills?.length) setSelectedSkills(prefs.key_skills)
          if (prefs.company_size_preference) setCompanySize(prefs.company_size_preference)
          if (prefs.interview_strength) setInterviewStyle(prefs.interview_strength)
        }
      } catch (err) { console.error('Error loading profile:', err) }
      setLoading(false)
    }
    load()
  }, [supabase])

  const saveProfile = async () => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase.from('profiles').update({
        full_name: name,
        professional_summary: summary,
        education,
        certifications,
        work_experience: workExperience
      }).eq('id', user.id)

      await supabase.from('job_preferences').upsert({
        user_id: user.id,
        target_roles: selectedRoles,
        min_salary: minSalary,
        max_salary: maxSalary,
        experience_level: experienceLevel,
        remote_preference: remotePreference,
        employment_type: workType,
        work_authorization: workAuth,
        current_employment_status: employmentStatus,
        desired_job_title: desiredJobTitle,
        available_start_date: availableStartDate,
        willing_to_relocate: willingToRelocate,
        country_preference: selectedCountry,
        city_preferences: selectedCities,
        ethnicity,
        industries: selectedIndustries,
        key_skills: selectedSkills,
        company_size_preference: companySize,
        interview_strength: interviewStyle,
      })

      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) { console.error('Error saving:', err) }
    setSaving(false)
  }

  if (!mounted || loading) return <div className="p-8" />

  const citiesForCountry = selectedCountry ? CITIES_BY_COUNTRY[selectedCountry] || [] : []

  return (
    <motion.div initial="hidden" animate="show" variants={staggerContainer} className="space-y-6 max-w-[1000px] mx-auto pb-10">
      <SectionCard title="Contact Information" icon={<span>👤</span>}>
        <div className="grid sm:grid-cols-2 gap-4">
          <EditField label="Full Name" value={name} onChange={setName} />
          <EditField label="Email" value={email} onChange={setEmail} type="email" />
        </div>
      </SectionCard>

      <SectionCard title="Professional Summary" icon={<span>📝</span>}>
        <EditField label="Professional Summary" value={summary} onChange={setSummary} multiline />
      </SectionCard>

      <SectionCard title="Work Experience" icon={<span>💼</span>}>
        <div className="space-y-4">
          {workExperience.map((exp, i) => (
            <div key={i} className="p-4 rounded-lg bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)]">
              <div className="grid sm:grid-cols-2 gap-3 mb-3">
                <EditField label="Company" value={exp.company} onChange={(c: string) => { exp.company = c; setWorkExperience([...workExperience]) }} />
                <EditField label="Job Title" value={exp.title} onChange={(t: string) => { exp.title = t; setWorkExperience([...workExperience]) }} />
              </div>
              <EditField label="Description" value={exp.description} onChange={(d: string) => { exp.description = d; setWorkExperience([...workExperience]) }} multiline />
            </div>
          ))}
          <button onClick={() => setWorkExperience([...workExperience, { company: '', title: '', startDate: '', endDate: '', description: '' }])}
            className="px-3 py-2 rounded-lg text-[12px] font-medium bg-[rgba(253,121,168,0.1)] text-[#fd79a8] hover:bg-[rgba(253,121,168,0.2)]">
            + Add Experience
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Education" icon={<span>🎓</span>}>
        <div className="space-y-4">
          {education.map((edu, i) => (
            <div key={i} className="p-4 rounded-lg bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)]">
              <div className="grid sm:grid-cols-2 gap-3">
                <EditField label="School" value={edu.school} onChange={(s: string) => { edu.school = s; setEducation([...education]) }} />
                <EditField label="Degree" value={edu.degree} onChange={(d: string) => { edu.degree = d; setEducation([...education]) }} />
              </div>
            </div>
          ))}
          <button onClick={() => setEducation([...education, { school: '', degree: '', field: '', endDate: '' }])}
            className="px-3 py-2 rounded-lg text-[12px] font-medium bg-[rgba(253,121,168,0.1)] text-[#fd79a8] hover:bg-[rgba(253,121,168,0.2)]">
            + Add Education
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Certifications" icon={<span>🏆</span>}>
        <div className="space-y-2">
          {certifications.map((cert, i) => (
            <div key={i} className="flex gap-2">
              <input value={cert} onChange={(c: React.ChangeEvent<HTMLInputElement>) => { certifications[i] = c.target.value; setCertifications([...certifications]) }}
                className="flex-1 px-3 py-2 rounded-lg bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-white text-[12px] outline-none" />
              <button onClick={() => setCertifications(certifications.filter((_, idx) => idx !== i))}
                className="px-2 py-1 rounded bg-[rgba(255,0,0,0.1)] text-[#ff6b6b] text-[11px]">Delete</button>
            </div>
          ))}
          <button onClick={() => setCertifications([...certifications, ''])}
            className="px-3 py-2 rounded-lg text-[12px] font-medium bg-[rgba(253,121,168,0.1)] text-[#fd79a8] hover:bg-[rgba(253,121,168,0.2)]">
            + Add Certification
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Career Preferences" icon={<span>🎯</span>}>
        <div className="space-y-4">
          <ChipSelector label="Target Roles (up to 5)" selected={selectedRoles} options={ROLES} onChange={setSelectedRoles} max={5} />
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-[#fd79a8] uppercase">Annual Salary Range</label>
            <div className="flex gap-4">
              <div className="flex-1 space-y-1">
                <label className="text-[10px] text-[#8a8a9a]">Min: ${(minSalary/1000).toFixed(0)}k</label>
                <input type="range" min="30000" max="500000" step="5000" value={minSalary} onChange={e => setMinSalary(Math.min(parseInt(e.target.value), maxSalary - 5000))}
                  className="w-full accent-[#fd79a8]" />
              </div>
              <div className="flex-1 space-y-1">
                <label className="text-[10px] text-[#8a8a9a]">Max: ${(maxSalary/1000).toFixed(0)}k</label>
                <input type="range" min="30000" max="500000" step="5000" value={maxSalary} onChange={e => setMaxSalary(Math.max(parseInt(e.target.value), minSalary + 5000))}
                  className="w-full accent-[#fd79a8]" />
              </div>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <SelectField label="Experience Level" value={experienceLevel} onChange={setExperienceLevel} options={['entry', 'mid', 'senior', 'lead', 'executive']} />
            <SelectField label="Remote Preference" value={remotePreference} onChange={setRemotePreference} options={['remote', 'hybrid', 'onsite', 'any']} />
            <SelectField label="Work Type" value={workType} onChange={setWorkType} options={JOB_TYPES} />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Career Details" icon={<span>📋</span>}>
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <SelectField label="Employment Status" value={employmentStatus} onChange={setEmploymentStatus} options={EMPLOYMENT} />
            <SelectField label="Work Authorization" value={workAuth} onChange={setWorkAuth} options={WORK_AUTH} />
            <EditField label="Desired Job Title" value={desiredJobTitle} onChange={setDesiredJobTitle} />
            <SelectField label="Available Start Date" value={availableStartDate} onChange={setAvailableStartDate} options={START_DATES} />
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-[#fd79a8] uppercase block">Willing to Relocate?</label>
            <div className="flex gap-2">
              <button onClick={() => setWillingToRelocate(true)}
                className={`flex-1 px-3 py-2 rounded-lg font-medium transition-all ${willingToRelocate ? 'bg-[rgba(253,121,168,0.2)] text-[#fd79a8] border border-[#fd79a8]' : 'bg-[rgba(255,255,255,0.04)] text-[#8a8a9a] border border-transparent'}`}>
                Yes
              </button>
              <button onClick={() => setWillingToRelocate(false)}
                className={`flex-1 px-3 py-2 rounded-lg font-medium transition-all ${!willingToRelocate ? 'bg-[rgba(253,121,168,0.2)] text-[#fd79a8] border border-[#fd79a8]' : 'bg-[rgba(255,255,255,0.04)] text-[#8a8a9a] border border-transparent'}`}>
                No
              </button>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <SelectField label="Country Preference" value={selectedCountry} onChange={(c: string) => { setSelectedCountry(c); setSelectedCities([]) }} options={Object.keys(CITIES_BY_COUNTRY)} />
            {selectedCountry && <ChipSelector label={`Cities (up to 3)`} selected={selectedCities} options={citiesForCountry} onChange={setSelectedCities} max={3} />}
            <SelectField label="Ethnicity" value={ethnicity} onChange={setEthnicity} options={ETHNICITIES} />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Industries & Skills" icon={<span>⭐</span>}>
        <div className="space-y-4">
          <ChipSelector label="Industry Preferences (up to 5)" selected={selectedIndustries} options={INDUSTRIES} onChange={setSelectedIndustries} max={5} />
          <ChipSelector label="Key Skills (up to 8)" selected={selectedSkills} options={SKILLS} onChange={setSelectedSkills} max={8} />
          <div className="grid sm:grid-cols-2 gap-4">
            <SelectField label="Company Size Preference" value={companySize} onChange={setCompanySize} options={COMPANY_SIZES} />
            <SelectField label="Interview Strength" value={interviewStyle} onChange={setInterviewStyle} options={INTERVIEW_STYLES} />
          </div>
        </div>
      </SectionCard>

      <motion.div variants={fadeInUp} className="flex justify-end">
        <PremiumButton onClick={saveProfile} disabled={saving} variant={saved ? 'success' : 'primary'}>
          {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Profile'}
        </PremiumButton>
      </motion.div>
    </motion.div>
  )
}
