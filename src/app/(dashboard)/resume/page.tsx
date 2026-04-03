'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'

/* ─── Types ─── */
interface OptimizationResult {
  ats_score: number
  strengths: string[]
  improvements: string[]
  tailored_resume: string
}

/* ─── Inline Keyframes ─── */
const pageStyles = `
@keyframes border-dance {
  0% { background-position: 0% 0%; }
  100% { background-position: 200% 0%; }
}
@keyframes float-up {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-6px); }
}
@keyframes cloud-bounce {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-8px) scale(1.05); }
}
@keyframes arrow-pulse {
  0%, 100% { transform: translateY(0); opacity: 1; }
  50% { transform: translateY(4px); opacity: 0.5; }
}
@keyframes progress-gradient {
  0% { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}
@keyframes score-fill {
  from { stroke-dashoffset: var(--circumference); }
  to { stroke-dashoffset: var(--offset); }
}
@keyframes shimmer-badge {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}
@keyframes card-fade-in {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes pulse-brain {
  0%, 100% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.15); opacity: 1; }
}
@keyframes scan-line {
  0% { top: 0%; }
  100% { top: 100%; }
}
@keyframes glow-border {
  0%, 100% { box-shadow: 0 0 15px rgba(253,121,168,0.15), 0 0 30px rgba(253,121,168,0.05); }
  50% { box-shadow: 0 0 25px rgba(253,121,168,0.3), 0 0 50px rgba(253,121,168,0.1); }
}
@keyframes drop-glow {
  0%, 100% { box-shadow: inset 0 0 30px rgba(253,121,168,0.05); }
  50% { box-shadow: inset 0 0 60px rgba(253,121,168,0.12); }
}
@keyframes tip-icon-float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  25% { transform: translateY(-3px) rotate(-3deg); }
  75% { transform: translateY(1px) rotate(2deg); }
}
@keyframes empty-doc-float {
  0%, 100% { transform: translateY(0) rotate(-2deg); }
  50% { transform: translateY(-12px) rotate(2deg); }
}
@keyframes success-pop {
  0% { transform: scale(0.8); opacity: 0; }
  50% { transform: scale(1.15); }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes ring-rotate {
  from { transform: rotate(-90deg); }
  to { transform: rotate(-90deg); }
}
@keyframes count-up {
  from { opacity: 0; transform: scale(0.5); }
  to { opacity: 1; transform: scale(1); }
}
`

/* ─── SVG Components ─── */
const CloudUploadIcon = ({ animated }: { animated?: boolean }) => (
  <svg
    width="48" height="48" viewBox="0 0 48 48" fill="none"
    style={animated ? { animation: 'cloud-bounce 2.5s ease-in-out infinite' } : {}}
  >
    <path d="M14 32a8 8 0 01-.5-16A10 10 0 0134 18a6 6 0 012 11.5" stroke="url(#cloud-grad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path d="M24 22v14M20 26l4-4 4 4" stroke="url(#arrow-grad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      style={animated ? { animation: 'arrow-pulse 1.5s ease-in-out infinite' } : {}}
    />
    <defs>
      <linearGradient id="cloud-grad" x1="8" y1="16" x2="38" y2="32">
        <stop stopColor="#fd79a8" /><stop offset="1" stopColor="#e84393" />
      </linearGradient>
      <linearGradient id="arrow-grad" x1="20" y1="22" x2="28" y2="36">
        <stop stopColor="#fd79a8" /><stop offset="1" stopColor="#e84393" />
      </linearGradient>
    </defs>
  </svg>
)

const BrainIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a4 4 0 014 4c2.21 0 4 1.79 4 4a4 4 0 01-2 3.46A4 4 0 0114 18v2H10v-2a4 4 0 01-4-4.54A4 4 0 014 10c0-2.21 1.79-4 4-4a4 4 0 014-4z" />
    <path d="M12 2v20" opacity="0.5" />
    <path d="M8 8c1 0 2 .5 2.5 1.5" opacity="0.5" />
    <path d="M16 8c-1 0-2 .5-2.5 1.5" opacity="0.5" />
  </svg>
)

function ATSScoreRing({ score, size = 120, strokeWidth = 8 }: { score: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const color = score >= 85 ? '#00b894' : score >= 70 ? '#fdcb6e' : '#ff6b6b'
  const glowColor = score >= 85 ? 'rgba(0,184,148,0.4)' : score >= 70 ? 'rgba(253,203,110,0.4)' : 'rgba(255,107,107,0.4)'

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Background circle */}
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={strokeWidth} />
        {/* Score arc */}
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            filter: `drop-shadow(0 0 6px ${glowColor})`,
            transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-black"
          style={{
            fontSize: size * 0.3,
            color,
            animation: 'count-up 0.8s ease-out',
            filter: `drop-shadow(0 0 8px ${glowColor})`,
          }}
        >
          {score}
        </span>
        <span className="text-[10px] font-semibold text-[#5a5a6a] tracking-wider uppercase">ATS</span>
      </div>
    </div>
  )
}

/* ─── File Type Badge ─── */
function FileTypeBadge({ type, active }: { type: string; active?: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all duration-300"
      style={{
        background: active ? 'rgba(253,121,168,0.12)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${active ? 'rgba(253,121,168,0.25)' : 'rgba(255,255,255,0.06)'}`,
        color: active ? '#fd79a8' : '#5a5a6a',
      }}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
        <polyline points="14,2 14,8 20,8" />
      </svg>
      {type}
    </span>
  )
}

/* ─── Main Page ─── */
export default function ResumePage() {
  const [resumes, setResumes] = useState<any[]>([])
  const [selectedResume, setSelectedResume] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [optimizing, setOptimizing] = useState(false)
  const [optimization, setOptimization] = useState<OptimizationResult | null>(null)
  const [jobTitle, setJobTitle] = useState('')
  const [jobTitleFocused, setJobTitleFocused] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [copiedTailored, setCopiedTailored] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    loadResumes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadResumes = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('resumes').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    if (data) setResumes(data)
  }

  const handleUpload = async (file: File) => {
    if (!file) return
    setLoading(true)
    setUploadProgress(0)

    // Simulate progress while API processes
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 85) { clearInterval(progressInterval); return 85 }
        return prev + Math.random() * 10
      })
    }, 300)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/resume/upload', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)

      if (!response.ok) {
        const err = await response.json()
        console.error('Upload error:', err)
        alert(err.error || 'Upload failed. Please try again.')
        setLoading(false)
        setUploadProgress(0)
        return
      }

      setUploadProgress(100)
      await loadResumes()
      setTimeout(() => { setLoading(false); setUploadProgress(0) }, 600)
    } catch (e) {
      clearInterval(progressInterval)
      console.error('Upload error:', e)
      alert('Upload failed. Please try again.')
      setLoading(false)
      setUploadProgress(0)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleUpload(file)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file && (file.name.endsWith('.pdf') || file.name.endsWith('.docx'))) {
      handleUpload(file)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumes])

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true) }
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(false) }

  const setPrimary = async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('resumes').update({ is_primary: false }).eq('user_id', user.id)
    await supabase.from('resumes').update({ is_primary: true }).eq('id', id)
    await loadResumes()
  }
  const deleteResume = async (id: string) => {
    try {
      const { error } = await supabase.from('resumes').delete().eq('id', id)
      if (error) throw error
      if (selectedResume?.id === id) setSelectedResume(null)
      setDeleteConfirm(null)
      await loadResumes()
    } catch (err) {
      console.error('Delete error:', err)
      setDeleteConfirm(null)
    }
  }
    await loadResumes()
  }

  const optimizeResume = async () => {
    if (!selectedResume || !jobTitle) return
    setOptimizing(true)
    setOptimization(null)

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
    }
    setOptimizing(false)
  }

  const copyTailored = () => {
    if (!optimization?.tailored_resume) return
    navigator.clipboard.writeText(optimization.tailored_resume)
    setCopiedTailored(true)
    setTimeout(() => setCopiedTailored(false), 2000)
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1048576).toFixed(1)} MB`
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  if (!mounted) return <div className="p-8" />

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: pageStyles }} />

      <div className="space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-2xl font-black tracking-tight">Resume Optimizer</h2>
            <span
              className="text-[10px] font-bold px-2.5 py-1 rounded-full tracking-wider"
              style={{
                background: 'linear-gradient(135deg, rgba(253,121,168,0.12), rgba(232,67,147,0.08))',
                border: '1px solid rgba(253,121,168,0.2)',
                color: '#fd79a8',
              }}
            >
              AI-POWERED
            </span>
          </div>
          <p className="text-[14px] text-[#6a6a7a]">
            Upload, analyze, and optimize your resume for ATS compatibility and job-specific tailoring.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1fr_340px] gap-6">
          {/* ═══ Main Content ═══ */}
          <div className="space-y-6">

            {/* ─── Upload / Resume List Section ─── */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(18,18,26,0.95), rgba(14,14,22,0.98))',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div className="px-6 pt-6 pb-2 flex items-center justify-between">
                <h3 className="text-[15px] font-bold flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fd79a8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
                    <polyline points="14,2 14,8 20,8" />
                  </svg>
                  Your Resumes
                </h3>
                {resumes.length > 0 && (
                  <span className="text-[11px] font-semibold text-[#4a4a5a] bg-[rgba(255,255,255,0.03)] px-2 py-0.5 rounded-md">
                    {resumes.length} file{resumes.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              <div className="p-6 pt-4">
                {/* Upload Drop Zone */}
                <div
                  onClick={() => fileRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  className="relative rounded-2xl cursor-pointer transition-all duration-500 overflow-hidden group"
                  style={{
                    padding: resumes.length === 0 ? '48px 24px' : '24px',
                    background: isDragOver
                      ? 'rgba(253,121,168,0.04)'
                      : 'rgba(255,255,255,0.01)',
                    animation: isDragOver ? 'drop-glow 1.5s ease-in-out infinite' : undefined,
                  }}
                >
                  {/* Animated dashed border */}
                  <div
                    className="absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-500"
                    style={{
                      opacity: isDragOver ? 1 : 0.4,
                      background: `url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='16' ry='16' stroke='${isDragOver ? '%23fd79a8' : '%23333344'}' stroke-width='2' stroke-dasharray='8%2c 8' stroke-dashoffset='0' stroke-linecap='round'/%3e%3c/svg%3e")`,
                    }}
                  />
                  {/* Hover glow overlay */}
                  <div
                    className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      background: 'radial-gradient(ellipse at center, rgba(253,121,168,0.06) 0%, transparent 70%)',
                    }}
                  />

                  <input ref={fileRef} type="file" accept=".pdf,.docx" className="hidden" onChange={handleFileInput} />

                  <div className="relative flex flex-col items-center text-center">
                    <div className="mb-4">
                      <CloudUploadIcon animated />
                    </div>
                    <div className="text-[14px] font-semibold text-white/90 mb-1">
                      {isDragOver ? 'Drop your resume here' : 'Drag & drop your resume'}
                    </div>
                    <div className="text-[12px] text-[#5a5a6a] mb-4">or click to browse files</div>
                    <div className="flex items-center gap-2">
                      <FileTypeBadge type=".pdf" active={isDragOver} />
                      <FileTypeBadge type=".docx" active={isDragOver} />
                    </div>
                    <div className="text-[10px] text-[#3a3a4a] mt-3">Maximum file size: 5MB</div>
                  </div>
                </div>

                {/* Upload Progress */}
                {loading && (
                  <div className="mt-4" style={{ animation: 'card-fade-in 0.3s ease' }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[12px] font-semibold text-[#8a8a9a]">Uploading...</span>
                      <span className="text-[11px] font-bold text-[#fd79a8]">{Math.round(uploadProgress)}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[rgba(255,255,255,0.04)] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${uploadProgress}%`,
                          background: 'linear-gradient(90deg, #fd79a8, #e84393, #fd79a8)',
                          backgroundSize: '200% 100%',
                          animation: 'progress-gradient 1.5s linear infinite',
                          boxShadow: '0 0 12px rgba(253,121,168,0.4)',
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Resume Cards */}
                {resumes.length > 0 && (
                  <div className="mt-5 space-y-3">
                    {resumes.map((r, idx) => (
                      <div
                        key={r.id}
                        onClick={() => setSelectedResume(r)}
                        className="group/card relative rounded-xl cursor-pointer transition-all duration-300"
                        style={{
                          animation: `card-fade-in 0.4s ease ${idx * 0.08}s both`,
                          padding: '16px',
                          background: selectedResume?.id === r.id
                            ? 'linear-gradient(135deg, rgba(253,121,168,0.06), rgba(232,67,147,0.03))'
                            : 'rgba(255,255,255,0.015)',
                          border: `1px solid ${selectedResume?.id === r.id ? 'rgba(253,121,168,0.2)' : 'rgba(255,255,255,0.04)'}`,
                          boxShadow: selectedResume?.id === r.id ? '0 4px 24px rgba(253,121,168,0.08)' : 'none',
                          transform: 'translateY(0)',
                        }}
                        onMouseEnter={e => {
                          if (selectedResume?.id !== r.id) {
                            e.currentTarget.style.transform = 'translateY(-2px)'
                            e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.3)'
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                          }
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.transform = 'translateY(0)'
                          if (selectedResume?.id !== r.id) {
                            e.currentTarget.style.boxShadow = 'none'
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)'
                          }
                        }}
                      >
                        <div className="flex items-center gap-4">
                          {/* ATS Score Ring (mini) */}
                          <div className="shrink-0">
                            {r.ats_score ? (
                              <ATSScoreRing score={r.ats_score} size={52} strokeWidth={4} />
                            ) : (
                              <div
                                className="w-[52px] h-[52px] rounded-full flex items-center justify-center"
                                style={{
                                  background: 'rgba(255,255,255,0.02)',
                                  border: '2px solid rgba(255,255,255,0.06)',
                                }}
                              >
                                <span className="text-[10px] font-bold text-[#3a3a4a]">N/A</span>
                              </div>
                            )}
                          </div>

                          {/* File Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[13px] font-semibold text-white/90 truncate">{r.name}</span>
                              {r.is_primary && (
                                <span
                                  className="shrink-0 text-[9px] font-bold px-2 py-0.5 rounded-full tracking-wider"
                                  style={{
                                    background: 'linear-gradient(90deg, rgba(0,184,148,0.12), rgba(0,184,148,0.2), rgba(0,184,148,0.12))',
                                    backgroundSize: '200% auto',
                                    animation: 'shimmer-badge 3s linear infinite',
                                    color: '#00b894',
                                    border: '1px solid rgba(0,184,148,0.2)',
                                  }}
                                >
                                  PRIMARY
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-[11px] text-[#5a5a6a]">
                              <span>{formatDate(r.created_at)}</span>
                              {r.file_size && (
                                <>
                                  <span className="w-0.5 h-0.5 rounded-full bg-[#3a3a4a]" />
                                  <span>{formatFileSize(r.file_size)}</span>
                                </>
                              )}
                              {r.ats_score && (
                                <>
                                  <span className="w-0.5 h-0.5 rounded-full bg-[#3a3a4a]" />
                                  <span>Score: {r.ats_score}/100</span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity duration-200">
                            {!r.is_primary && (
                              <button
                                onClick={(e) => { e.stopPropagation(); setPrimary(r.id) }}
                                className="p-2 rounded-lg text-[#5a5a6a] hover:text-[#00b894] hover:bg-[rgba(0,184,148,0.08)] transition-all duration-200"
                                title="Set as primary"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                                </svg>
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                if (deleteConfirm === r.id) deleteResume(r.id)
                                else setDeleteConfirm(r.id)
                              }}
                              className="p-2 rounded-lg transition-all duration-200"
                              style={{
                                color: deleteConfirm === r.id ? '#ff6b6b' : '#5a5a6a',
                                background: deleteConfirm === r.id ? 'rgba(255,107,107,0.1)' : 'transparent',
                              }}
                              onMouseEnter={e => { if (deleteConfirm !== r.id) { e.currentTarget.style.color = '#ff6b6b'; e.currentTarget.style.background = 'rgba(255,107,107,0.08)' } }}
                              onMouseLeave={e => { if (deleteConfirm !== r.id) { e.currentTarget.style.color = '#5a5a6a'; e.currentTarget.style.background = 'transparent' }; setDeleteConfirm(null) }}
                              title={deleteConfirm === r.id ? 'Click again to confirm' : 'Delete'}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3,6 5,6 21,6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Empty State */}
                {resumes.length === 0 && !loading && (
                  <div className="mt-6 text-center" style={{ animation: 'card-fade-in 0.6s ease' }}>
                    {/* Animated resume illustration */}
                    <div className="relative w-24 h-32 mx-auto mb-4">
                      <div
                        className="absolute inset-0 rounded-lg"
                        style={{
                          background: 'linear-gradient(135deg, rgba(253,121,168,0.08), rgba(232,67,147,0.04))',
                          border: '1px solid rgba(253,121,168,0.15)',
                          animation: 'empty-doc-float 4s ease-in-out infinite',
                        }}
                      >
                        {/* Lines */}
                        <div className="absolute top-4 left-3 right-3 space-y-2">
                          <div className="h-1 rounded bg-[rgba(253,121,168,0.15)] w-3/4" />
                          <div className="h-1 rounded bg-[rgba(255,255,255,0.04)] w-full" />
                          <div className="h-1 rounded bg-[rgba(255,255,255,0.04)] w-5/6" />
                          <div className="h-1 rounded bg-[rgba(255,255,255,0.04)] w-full" />
                          <div className="h-1 rounded bg-[rgba(255,255,255,0.04)] w-2/3" />
                          <div className="mt-3 h-1 rounded bg-[rgba(253,121,168,0.1)] w-1/2" />
                          <div className="h-1 rounded bg-[rgba(255,255,255,0.04)] w-full" />
                          <div className="h-1 rounded bg-[rgba(255,255,255,0.04)] w-4/5" />
                        </div>
                        {/* Corner fold */}
                        <div className="absolute top-0 right-0 w-5 h-5">
                          <div className="absolute top-0 right-0 w-0 h-0" style={{ borderLeft: '20px solid transparent', borderTop: '20px solid rgba(253,121,168,0.1)' }} />
                        </div>
                      </div>
                    </div>
                    <p className="text-[13px] font-semibold text-[#6a6a7a] mb-1">No resumes yet</p>
                    <p className="text-[11px] text-[#4a4a5a]">Upload your first resume to get started</p>
                  </div>
                )}
              </div>
            </div>

            {/* ─── Optimization Section ─── */}
            {selectedResume && (
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(18,18,26,0.95), rgba(14,14,22,0.98))',
                  border: '1px solid rgba(255,255,255,0.06)',
                  animation: 'card-fade-in 0.4s ease',
                }}
              >
                <div className="px-6 pt-6 pb-2 flex items-center justify-between">
                  <h3 className="text-[15px] font-bold flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fd79a8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="13,2 3,14 12,14 11,22 21,10 12,10" />
                    </svg>
                    Optimize for Job
                  </h3>
                  <div
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wider"
                    style={{
                      background: 'linear-gradient(135deg, rgba(108,92,231,0.08), rgba(162,155,254,0.05))',
                      border: '1px solid rgba(108,92,231,0.15)',
                      color: '#a29bfe',
                    }}
                  >
                    <BrainIcon size={12} />
                    CLAUDE AI
                  </div>
                </div>

                <div className="p-6 pt-4 space-y-4">
                  {/* Job Title Input with floating label */}
                  <div className="relative">
                    <input
                      value={jobTitle}
                      onChange={e => setJobTitle(e.target.value)}
                      onFocus={() => setJobTitleFocused(true)}
                      onBlur={() => setJobTitleFocused(false)}
                      placeholder=" "
                      className="peer w-full px-4 pt-5 pb-2 rounded-xl text-[14px] text-white transition-all duration-300 focus:outline-none"
                      style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: `1px solid ${jobTitleFocused ? 'rgba(253,121,168,0.3)' : 'rgba(255,255,255,0.06)'}`,
                        boxShadow: jobTitleFocused ? '0 0 20px rgba(253,121,168,0.06)' : 'none',
                      }}
                    />
                    <label
                      className="absolute left-4 transition-all duration-300 pointer-events-none"
                      style={{
                        top: jobTitle || jobTitleFocused ? '6px' : '14px',
                        fontSize: jobTitle || jobTitleFocused ? '10px' : '14px',
                        color: jobTitleFocused ? '#fd79a8' : '#5a5a6a',
                        fontWeight: jobTitle || jobTitleFocused ? 700 : 400,
                        letterSpacing: jobTitle || jobTitleFocused ? '0.05em' : 'normal',
                      }}
                    >
                      {jobTitle || jobTitleFocused ? 'JOB TITLE' : 'e.g., Senior Full Stack Engineer'}
                    </label>
                  </div>

                  {/* Optimize Button */}
                  <button
                    onClick={optimizeResume}
                    disabled={optimizing || !jobTitle}
                    className="relative w-full py-3.5 rounded-xl text-white font-bold text-[14px] transition-all duration-300 overflow-hidden disabled:opacity-40"
                    style={{
                      background: 'linear-gradient(135deg, #fd79a8, #e84393)',
                      boxShadow: !optimizing && jobTitle ? '0 4px 20px rgba(253,121,168,0.3)' : 'none',
                    }}
                    onMouseEnter={e => { if (!optimizing && jobTitle) e.currentTarget.style.boxShadow = '0 8px 40px rgba(253,121,168,0.4)' }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = !optimizing && jobTitle ? '0 4px 20px rgba(253,121,168,0.3)' : 'none' }}
                  >
                    {optimizing ? (
                      <span className="flex items-center justify-center gap-2">
                        <span style={{ animation: 'pulse-brain 1.5s ease-in-out infinite' }}>
                          <BrainIcon size={18} />
                        </span>
                        Analyzing & Optimizing...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 3l1.912 5.813a2 2 0 001.272 1.278L21 12l-5.816 1.91a2 2 0 00-1.278 1.277L12 21l-1.906-5.813a2 2 0 00-1.278-1.277L3 12l5.816-1.91a2 2 0 001.278-1.277L12 3z" />
                        </svg>
                        Optimize Resume
                      </span>
                    )}
                  </button>
                </div>

                {/* Optimizing Overlay Animation */}
                {optimizing && (
                  <div className="px-6 pb-6">
                    <div
                      className="relative rounded-xl overflow-hidden"
                      style={{
                        height: '120px',
                        background: 'rgba(255,255,255,0.01)',
                        border: '1px solid rgba(255,255,255,0.04)',
                      }}
                    >
                      {/* Scanning lines */}
                      <div
                        className="absolute left-0 right-0 h-[2px] pointer-events-none"
                        style={{
                          background: 'linear-gradient(90deg, transparent, rgba(253,121,168,0.4), transparent)',
                          animation: 'scan-line 2s linear infinite',
                          boxShadow: '0 0 15px rgba(253,121,168,0.3)',
                        }}
                      />
                      {/* Content placeholders */}
                      <div className="p-4 space-y-3">
                        {[80, 65, 90, 50].map((w, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full" style={{ background: 'rgba(253,121,168,0.1)', animation: `pulse-brain 1.5s ease-in-out ${i * 0.2}s infinite` }} />
                            <div className="h-2 rounded-full" style={{ width: `${w}%`, background: 'rgba(255,255,255,0.04)' }} />
                          </div>
                        ))}
                      </div>
                      {/* Center brain pulse */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div
                          className="text-[#fd79a8]"
                          style={{
                            animation: 'pulse-brain 1.5s ease-in-out infinite',
                            filter: 'drop-shadow(0 0 12px rgba(253,121,168,0.5))',
                          }}
                        >
                          <BrainIcon size={36} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ─── Results Section ─── */}
            {optimization && (
              <div className="space-y-4" style={{ animation: 'card-fade-in 0.5s ease' }}>
                {/* ATS Score Card */}
                <div
                  className="rounded-2xl text-center py-8"
                  style={{
                    background: 'linear-gradient(135deg, rgba(18,18,26,0.95), rgba(14,14,22,0.98))',
                    border: '1px solid rgba(255,255,255,0.06)',
                    animation: 'glow-border 3s ease-in-out infinite',
                  }}
                >
                  <ATSScoreRing score={optimization.ats_score} size={140} strokeWidth={10} />
                  <div className="mt-3 text-[13px] font-semibold text-[#6a6a7a]">ATS Compatibility Score</div>
                  <div className="mt-1 text-[11px] text-[#4a4a5a]">
                    {optimization.ats_score >= 85 ? 'Excellent - Your resume is well optimized' :
                     optimization.ats_score >= 70 ? 'Good - Minor improvements recommended' :
                     'Needs work - Several improvements suggested'}
                  </div>
                </div>

                {/* Strengths */}
                <div
                  className="rounded-2xl p-6"
                  style={{
                    background: 'linear-gradient(135deg, rgba(18,18,26,0.95), rgba(14,14,22,0.98))',
                    border: '1px solid rgba(0,184,148,0.1)',
                  }}
                >
                  <h4 className="text-[13px] font-bold text-[#00b894] mb-4 flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00b894" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22,4 12,14.01 9,11.01" />
                    </svg>
                    Strengths
                    <span className="ml-auto text-[10px] font-semibold text-[#3a3a4a] bg-[rgba(0,184,148,0.06)] px-2 py-0.5 rounded-md">{optimization.strengths.length} found</span>
                  </h4>
                  <div className="space-y-2">
                    {optimization.strengths.map((s, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 p-3 rounded-xl transition-all duration-300 hover:bg-[rgba(0,184,148,0.03)]"
                        style={{
                          background: 'rgba(0,184,148,0.02)',
                          border: '1px solid rgba(0,184,148,0.06)',
                          animation: `card-fade-in 0.4s ease ${i * 0.1}s both`,
                        }}
                      >
                        <div className="shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,184,148,0.12)' }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#00b894" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20,6 9,17 4,12" />
                          </svg>
                        </div>
                        <span className="text-[12px] text-[#9a9aaa] leading-relaxed">{s}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Improvements */}
                <div
                  className="rounded-2xl p-6"
                  style={{
                    background: 'linear-gradient(135deg, rgba(18,18,26,0.95), rgba(14,14,22,0.98))',
                    border: '1px solid rgba(253,203,110,0.1)',
                  }}
                >
                  <h4 className="text-[13px] font-bold text-[#fdcb6e] mb-4 flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fdcb6e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    Improvements
                    <span className="ml-auto text-[10px] font-semibold text-[#3a3a4a] bg-[rgba(253,203,110,0.06)] px-2 py-0.5 rounded-md">{optimization.improvements.length} suggested</span>
                  </h4>
                  <div className="space-y-2">
                    {optimization.improvements.map((imp, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 p-3 rounded-xl transition-all duration-300 hover:bg-[rgba(253,203,110,0.03)]"
                        style={{
                          background: 'rgba(253,203,110,0.02)',
                          border: '1px solid rgba(253,203,110,0.06)',
                          animation: `card-fade-in 0.4s ease ${i * 0.1}s both`,
                        }}
                      >
                        <div className="shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(253,203,110,0.12)' }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fdcb6e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19" /><polyline points="19,12 12,5 5,12" />
                          </svg>
                        </div>
                        <span className="text-[12px] text-[#9a9aaa] leading-relaxed">{imp}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tailored Resume */}
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, rgba(18,18,26,0.95), rgba(14,14,22,0.98))',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  {/* Document header bar */}
                  <div
                    className="flex items-center justify-between px-5 py-3"
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                        <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                        <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                      </div>
                      <span className="text-[11px] font-semibold text-[#5a5a6a]">
                        Tailored Resume — {jobTitle}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Copy Button */}
                      <button
                        onClick={copyTailored}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-300"
                        style={{
                          background: copiedTailored ? 'rgba(0,184,148,0.1)' : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${copiedTailored ? 'rgba(0,184,148,0.2)' : 'rgba(255,255,255,0.06)'}`,
                          color: copiedTailored ? '#00b894' : '#6a6a7a',
                        }}
                      >
                        {copiedTailored ? (
                          <span style={{ animation: 'success-pop 0.3s ease' }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#00b894" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20,6 9,17 4,12" />
                            </svg>
                          </span>
                        ) : (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                          </svg>
                        )}
                        {copiedTailored ? 'Copied!' : 'Copy'}
                      </button>
                      {/* Download Button */}
                      <button
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-300"
                        style={{
                          background: 'rgba(253,121,168,0.08)',
                          border: '1px solid rgba(253,121,168,0.15)',
                          color: '#fd79a8',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(253,121,168,0.15)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(253,121,168,0.15)' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(253,121,168,0.08)'; e.currentTarget.style.boxShadow = 'none' }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7,10 12,15 17,10" /><line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        Download PDF
                      </button>
                    </div>
                  </div>

                  {/* Document content */}
                  <div className="p-6 max-h-[400px] overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(253,121,168,0.2) transparent' }}>
                    {/* Page styling */}
                    <div
                      className="p-6 rounded-xl min-h-[200px]"
                      style={{
                        background: 'rgba(255,255,255,0.015)',
                        border: '1px solid rgba(255,255,255,0.04)',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
                      }}
                    >
                      <p className="text-[12px] text-[#9a9aaa] leading-relaxed whitespace-pre-wrap font-mono">{optimization.tailored_resume}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ═══ Tips Sidebar ═══ */}
          <div className="space-y-4 h-fit lg:sticky lg:top-[80px]">
            {/* Pro Tips Card */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(18,18,26,0.95), rgba(14,14,22,0.98))',
                border: '1px solid rgba(253,121,168,0.1)',
              }}
            >
              <div
                className="px-5 py-3 flex items-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, rgba(253,121,168,0.06), rgba(232,67,147,0.03))',
                  borderBottom: '1px solid rgba(253,121,168,0.08)',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fd79a8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                </svg>
                <span className="text-[13px] font-bold text-[#fd79a8]">Pro Tips</span>
              </div>
              <div className="p-4 space-y-1">
                {[
                  {
                    icon: (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fd79a8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.35-4.35" /><line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" />
                      </svg>
                    ),
                    title: 'Mirror Keywords',
                    desc: 'Match exact phrases from the job description in your resume',
                    pro: true,
                  },
                  {
                    icon: (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fd79a8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
                      </svg>
                    ),
                    title: 'Quantify Impact',
                    desc: 'Replace vague claims with measurable achievements',
                    pro: true,
                  },
                  {
                    icon: (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fd79a8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="13,2 3,14 12,14 11,22 21,10 12,10" />
                      </svg>
                    ),
                    title: 'Strong Action Verbs',
                    desc: 'Start each bullet with: Led, Architected, Shipped, Drove',
                    pro: true,
                  },
                ].map((tip, i) => (
                  <div
                    key={i}
                    className="group/tip p-3 rounded-xl transition-all duration-300 hover:bg-[rgba(253,121,168,0.03)]"
                    style={{
                      animation: `card-fade-in 0.4s ease ${i * 0.1}s both`,
                      borderLeft: '2px solid rgba(253,121,168,0.2)',
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="shrink-0 mt-0.5"
                        style={{ animation: `tip-icon-float 3s ease-in-out ${i * 0.5}s infinite` }}
                      >
                        {tip.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[12px] font-bold text-white/90">{tip.title}</span>
                          {tip.pro && (
                            <span
                              className="text-[8px] font-bold px-1.5 py-0.5 rounded tracking-wider"
                              style={{
                                background: 'linear-gradient(135deg, rgba(253,121,168,0.15), rgba(232,67,147,0.1))',
                                color: '#fd79a8',
                                border: '1px solid rgba(253,121,168,0.2)',
                              }}
                            >
                              PRO
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-[#5a5a6a] leading-relaxed">{tip.desc}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Basic Tips Card */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(18,18,26,0.95), rgba(14,14,22,0.98))',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div
                className="px-5 py-3 flex items-center gap-2"
                style={{
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6a6a7a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <span className="text-[13px] font-bold text-[#8a8a9a]">Basics</span>
              </div>
              <div className="p-4 space-y-1">
                {[
                  {
                    icon: (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00b894" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" />
                      </svg>
                    ),
                    title: 'Clean Formatting',
                    desc: 'Use standard fonts and simple layouts',
                  },
                  {
                    icon: (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00b894" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" /><polyline points="14,2 14,8 20,8" />
                      </svg>
                    ),
                    title: 'PDF Format',
                    desc: 'Always submit as PDF to preserve layout',
                  },
                  {
                    icon: (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00b894" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
                      </svg>
                    ),
                    title: 'One Page Rule',
                    desc: 'Keep it concise — recruiters scan in 7 seconds',
                  },
                ].map((tip, i) => (
                  <div
                    key={i}
                    className="group/tip p-3 rounded-xl transition-all duration-300 hover:bg-[rgba(255,255,255,0.02)]"
                    style={{
                      animation: `card-fade-in 0.4s ease ${(i + 3) * 0.1}s both`,
                      borderLeft: '2px solid rgba(0,184,148,0.15)',
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="shrink-0 mt-0.5"
                        style={{ animation: `tip-icon-float 3s ease-in-out ${(i + 3) * 0.5}s infinite` }}
                      >
                        {tip.icon}
                      </div>
                      <div>
                        <span className="text-[12px] font-bold text-white/80 block mb-0.5">{tip.title}</span>
                        <span className="text-[11px] text-[#5a5a6a] leading-relaxed">{tip.desc}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Selected Resume Info */}
            {selectedResume && (
              <div
                className="rounded-2xl p-4"
                style={{
                  background: 'linear-gradient(135deg, rgba(253,121,168,0.04), rgba(232,67,147,0.02))',
                  border: '1px solid rgba(253,121,168,0.1)',
                  animation: 'card-fade-in 0.3s ease',
                }}
              >
                <div className="text-[10px] font-bold text-[#fd79a8] tracking-wider mb-2">SELECTED FOR OPTIMIZATION</div>
                <div className="text-[13px] font-semibold text-white/90 truncate">{selectedResume.name}</div>
                <div className="text-[11px] text-[#5a5a6a] mt-1">
                  {selectedResume.ats_score ? `Current ATS Score: ${selectedResume.ats_score}/100` : 'Not yet analyzed'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
