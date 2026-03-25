'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'

interface CoverLetter {
  id: string
  title: string
  content: string
  tone: string
  created_at: string
}

export default function CoverLettersPage() {
  const [coverLetters, setCoverLetters] = useState<CoverLetter[]>([])
  const [generating, setGenerating] = useState(false)
  const [selectedLetter, setSelectedLetter] = useState<CoverLetter | null>(null)
  const [formData, setFormData] = useState({
    jobTitle: '',
    company: '',
    tone: 'professional' as string,
  })
  const supabase = createClient()

  const generateCoverLetter = async () => {
    if (!formData.jobTitle || !formData.company) {
      alert('Please fill in all fields')
      return
    }

    setGenerating(true)
    try {
      const response = await fetch('/api/generate-cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_title: formData.jobTitle,
          company: formData.company,
          tone: formData.tone,
        }),
      })

      const data = await response.json()

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: saved } = await supabase.from('cover_letters').insert({
        user_id: user.id,
        title: `${formData.jobTitle} at ${formData.company}`,
        content: data.cover_letter,
        tone: formData.tone,
      }).select().single()

      if (saved) {
        setCoverLetters([saved, ...coverLetters])
        setSelectedLetter(saved)
        setFormData({ jobTitle: '', company: '', tone: 'professional' })
      }
    } catch (err) {
      console.error(err)
      alert('Failed to generate cover letter')
    }
    setGenerating(false)
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black tracking-tight mb-1">Cover Letter Generator</h2>
        <p className="text-[14px] text-[#8a8a9a]">AI generates personalized cover letters in seconds.</p>
      </div>

      <div className="grid lg:grid-cols-[1fr_380px] gap-6">
        {/* Main Content */}
        <div className="space-y-6">
          {/* Generator Form */}
          <div className="p-6 rounded-2xl bg-[#12121a] border border-[rgba(255,255,255,0.06)]">
            <h3 className="text-[15px] font-bold mb-5">Generate New Cover Letter</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-[#8a8a9a] mb-2">Job Title</label>
                <input
                  value={formData.jobTitle}
                  onChange={e => setFormData({ ...formData, jobTitle: e.target.value })}
                  placeholder="e.g., Senior Full Stack Engineer"
                  className="w-full px-4 py-3 rounded-xl bg-[#16161f] border border-[rgba(255,255,255,0.06)] text-white text-[14px] placeholder-[#5a5a6a] focus:outline-none focus:border-[rgba(253,121,168,0.3)] transition-all"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-[#8a8a9a] mb-2">Company Name</label>
                <input
                  value={formData.company}
                  onChange={e => setFormData({ ...formData, company: e.target.value })}
                  placeholder="e.g., Google"
                  className="w-full px-4 py-3 rounded-xl bg-[#16161f] border border-[rgba(255,255,255,0.06)] text-white text-[14px] placeholder-[#5a5a6a] focus:outline-none focus:border-[rgba(253,121,168,0.3)] transition-all"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-[#8a8a9a] mb-2">Tone</label>
                <select
                  value={formData.tone}
                  onChange={e => setFormData({ ...formData, tone: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-[#16161f] border border-[rgba(255,255,255,0.06)] text-white text-[14px] focus:outline-none focus:border-[rgba(253,121,168,0.3)] transition-all"
                >
                  <option value="professional">Professional</option>
                  <option value="casual">Casual</option>
                  <option value="enthusiastic">Enthusiastic</option>
                  <option value="confident">Confident</option>
                </select>
              </div>
              <button
                onClick={generateCoverLetter}
                disabled={generating}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#fd79a8] to-[#e84393] text-white font-bold text-[14px] hover:shadow-[0_8px_30px_rgba(253,121,168,0.3)] transition-all disabled:opacity-50"
              >
                {generating ? 'Generating...' : '✨ Generate Cover Letter'}
              </button>
            </div>
          </div>

          {/* Selected Letter Preview */}
          {selectedLetter && (
            <div className="p-6 rounded-2xl bg-[#12121a] border border-[rgba(255,255,255,0.06)]">
              <h3 className="text-[15px] font-bold mb-5">{selectedLetter.title}</h3>
              <div className="p-4 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] max-h-[400px] overflow-y-auto mb-5">
                <p className="text-[13px] text-[#8a8a9a] leading-relaxed whitespace-pre-wrap">{selectedLetter.content}</p>
              </div>
              <div className="flex gap-3">
                <button className="flex-1 py-2.5 rounded-xl bg-[rgba(253,121,168,0.1)] border border-[rgba(253,121,168,0.2)] text-[13px] font-semibold text-[#fd79a8] hover:bg-[rgba(253,121,168,0.15)] transition-all">
                  Download
                </button>
                <button className="flex-1 py-2.5 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] text-[13px] font-semibold text-white hover:bg-[rgba(255,255,255,0.06)] transition-all">
                  Copy to Clipboard
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="h-fit p-6 rounded-2xl bg-[#12121a] border border-[rgba(255,255,255,0.06)]">
          <h3 className="text-[15px] font-bold mb-5">Recent Letters</h3>
          {coverLetters.length === 0 ? (
            <div className="text-center py-8 text-[#5a5a6a]">
              <div className="text-2xl mb-2">📝</div>
              <div className="text-[11px]">No letters yet</div>
            </div>
          ) : (
            <div className="space-y-3">
              {coverLetters.map(letter => (
                <button
                  key={letter.id}
                  onClick={() => setSelectedLetter(letter)}
                  className={`w-full text-left p-3 rounded-xl transition-all ${
                    selectedLetter?.id === letter.id
                      ? 'bg-[rgba(253,121,168,0.1)] border border-[rgba(253,121,168,0.2)]'
                      : 'bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.1)]'
                  }`}
                >
                  <div className="text-[12px] font-semibold text-white truncate">{letter.title}</div>
                  <div className="text-[10px] text-[#5a5a6a] mt-1">{new Date(letter.created_at).toLocaleDateString()}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
