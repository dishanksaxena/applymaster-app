'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'

interface ParsedResume {
  name?: string
  email?: string
  phone?: string
  skills?: string[]
  experience?: { title: string; company: string; duration: string }[]
  education?: { degree: string; school: string }[]
}

interface OptimizationResult {
  ats_score: number
  strengths: string[]
  improvements: string[]
  tailored_resume: string
}

export default function ResumePage() {
  const [resumes, setResumes] = useState<any[]>([])
  const [selectedResume, setSelectedResume] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [optimizing, setOptimizing] = useState(false)
  const [optimization, setOptimization] = useState<OptimizationResult | null>(null)
  const [jobTitle, setJobTitle] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
  const router = useRouter()

  const loadResumes = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('resumes').select('*').eq('user_id', user.id)
    if (data) setResumes(data)
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const ext = file.name.split('.').pop()
    const path = `${user.id}/${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage.from('resumes').upload(path, file)
    if (uploadError) { console.error(uploadError); setLoading(false); return }

    const { data: { publicUrl } } = supabase.storage.from('resumes').getPublicUrl(path)

    const { error: insertError } = await supabase.from('resumes').insert({
      user_id: user.id,
      name: file.name,
      file_url: publicUrl,
      is_primary: resumes.length === 0,
    })

    if (!insertError) {
      await loadResumes()
    }
    setLoading(false)
  }

  const optimizeResume = async () => {
    if (!selectedResume || !jobTitle) {
      alert('Please select a resume and enter a job title')
      return
    }
    setOptimizing(true)

    try {
      const response = await fetch('/api/optimize-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume_id: selectedResume.id,
          job_title: jobTitle,
          resume_url: selectedResume.file_url,
        }),
      })

      const data = await response.json()
      setOptimization(data)
    } catch (err) {
      console.error(err)
      alert('Failed to optimize resume')
    }

    setOptimizing(false)
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black tracking-tight mb-1">Resume Optimizer</h2>
        <p className="text-[14px] text-[#8a8a9a]">Upload and optimize your resume for ATS compatibility and job-specific tailoring.</p>
      </div>

      <div className="grid lg:grid-cols-[1fr_400px] gap-6">
        {/* Main Content */}
        <div className="space-y-6">
          {/* Upload Section */}
          <div className="p-6 rounded-2xl bg-[#12121a] border border-[rgba(255,255,255,0.06)]">
            <h3 className="text-[15px] font-bold mb-5">Your Resumes</h3>
            {resumes.length === 0 ? (
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-[rgba(255,255,255,0.08)] rounded-xl p-10 text-center cursor-pointer hover:border-[rgba(253,121,168,0.2)] transition-colors"
              >
                <input ref={fileRef} type="file" accept=".pdf,.docx" className="hidden" onChange={handleUpload} />
                <div className="text-2xl mb-2">📄</div>
                <div className="text-[14px] font-semibold mb-1">Upload Your Resume</div>
                <div className="text-[12px] text-[#5a5a6a]">PDF or DOCX (max 5MB)</div>
              </div>
            ) : (
              <div className="space-y-3">
                {resumes.map(r => (
                  <div key={r.id} onClick={() => setSelectedResume(r)} className={`p-4 rounded-xl border transition-all cursor-pointer ${selectedResume?.id === r.id ? 'bg-[rgba(253,121,168,0.08)] border-[rgba(253,121,168,0.2)]' : 'bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.1)]'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">📄</span>
                        <div>
                          <div className="text-[13px] font-semibold">{r.name}</div>
                          <div className="text-[11px] text-[#5a5a6a]">ATS Score: {r.ats_score ? `${r.ats_score}/100` : 'Not analyzed'}</div>
                        </div>
                      </div>
                      {r.is_primary && <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-[rgba(0,184,148,0.1)] text-[#00b894]">Primary</span>}
                    </div>
                  </div>
                ))}
                <button onClick={() => fileRef.current?.click()} disabled={loading} className="w-full py-3 rounded-xl border border-[rgba(255,255,255,0.06)] text-[13px] font-semibold text-[#8a8a9a] hover:text-white transition-colors">
                  {loading ? 'Uploading...' : '+ Upload Another Resume'}
                </button>
              </div>
            )}
          </div>

          {/* Optimization Section */}
          {selectedResume && (
            <div className="p-6 rounded-2xl bg-[#12121a] border border-[rgba(255,255,255,0.06)]">
              <h3 className="text-[15px] font-bold mb-5">Optimize for Job</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-[12px] font-semibold text-[#8a8a9a] mb-2">Job Title</label>
                  <input value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="e.g., Senior Full Stack Engineer" className="w-full px-4 py-3 rounded-xl bg-[#16161f] border border-[rgba(255,255,255,0.06)] text-white text-[14px] placeholder-[#5a5a6a] focus:outline-none focus:border-[rgba(253,121,168,0.3)] transition-all" />
                </div>
                <button onClick={optimizeResume} disabled={optimizing} className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#fd79a8] to-[#e84393] text-white font-bold text-[14px] hover:shadow-[0_8px_30px_rgba(253,121,168,0.3)] transition-all disabled:opacity-50">
                  {optimizing ? 'Optimizing...' : '✨ Optimize Resume'}
                </button>
              </div>
            </div>
          )}

          {/* Results Section */}
          {optimization && (
            <div className="p-6 rounded-2xl bg-[#12121a] border border-[rgba(255,255,255,0.06)]">
              <h3 className="text-[15px] font-bold mb-5">Optimization Results</h3>
              <div className="space-y-6">
                {/* ATS Score */}
                <div className="text-center">
                  <div className="text-5xl font-black" style={{ color: optimization.ats_score >= 85 ? '#00b894' : optimization.ats_score >= 70 ? '#fdcb6e' : '#ff5f57' }}>
                    {optimization.ats_score}
                  </div>
                  <div className="text-[13px] text-[#8a8a9a] mt-2">ATS Compatibility Score</div>
                </div>

                {/* Strengths */}
                <div>
                  <div className="text-[13px] font-bold text-[#00b894] mb-3">✓ Strengths</div>
                  <div className="space-y-2">
                    {optimization.strengths.map((s, i) => (
                      <div key={i} className="flex gap-3 text-[13px] text-[#8a8a9a]">
                        <span className="text-[#00b894] shrink-0">✓</span>
                        <span>{s}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Improvements */}
                <div>
                  <div className="text-[13px] font-bold text-[#fdcb6e] mb-3">→ Recommended Improvements</div>
                  <div className="space-y-2">
                    {optimization.improvements.map((imp, i) => (
                      <div key={i} className="flex gap-3 text-[13px] text-[#8a8a9a]">
                        <span className="text-[#fdcb6e] shrink-0">→</span>
                        <span>{imp}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tailored Resume */}
                <div>
                  <div className="text-[13px] font-bold mb-3">Tailored Resume for {jobTitle}</div>
                  <div className="p-4 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] max-h-[300px] overflow-y-auto">
                    <p className="text-[12px] text-[#8a8a9a] whitespace-pre-wrap">{optimization.tailored_resume}</p>
                  </div>
                  <button className="w-full mt-3 py-2.5 rounded-xl bg-[rgba(253,121,168,0.1)] border border-[rgba(253,121,168,0.2)] text-[13px] font-semibold text-[#fd79a8] hover:bg-[rgba(253,121,168,0.15)] transition-all">
                    Download as PDF
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="h-fit p-6 rounded-2xl bg-[#12121a] border border-[rgba(255,255,255,0.06)]">
          <h3 className="text-[15px] font-bold mb-5">Tips for ATS Success</h3>
          <div className="space-y-4 text-[13px] text-[#8a8a9a]">
            {[
              { icon: '📝', title: 'Use Keywords', desc: 'Match job description keywords exactly' },
              { icon: '📊', title: 'Quantify Results', desc: 'Include metrics: "increased by 40%"' },
              { icon: '🎯', title: 'Action Verbs', desc: 'Start bullets with: Led, Designed, Built' },
              { icon: '🏗️', title: 'Simple Format', desc: 'Avoid fancy graphics or colors' },
            ].map((tip, i) => (
              <div key={i} className="pb-4 border-b border-[rgba(255,255,255,0.04)] last:border-0">
                <div className="text-lg mb-2">{tip.icon}</div>
                <div className="font-semibold text-white text-[12px] mb-1">{tip.title}</div>
                <div className="text-[11px]">{tip.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
