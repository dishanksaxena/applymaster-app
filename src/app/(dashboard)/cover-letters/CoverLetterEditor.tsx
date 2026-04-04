'use client'

import { useState, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase-browser'
import { PremiumButton, PremiumInput, PremiumCard } from '@/components/premium'
import CoverLetterPreview from './CoverLetterPreview'
import { staggerContainer, fadeInUp } from '@/lib/animations'

interface CoverLetterEditorProps {
  initialLetter?: {
    id: string
    title: string
    content: string
    tone: string
    job_id?: string | null
  }
  onClose?: () => void
  onSave?: (letter: any) => void
}

const TONES = [
  { value: 'professional', label: 'Professional' },
  { value: 'casual', label: 'Casual' },
  { value: 'enthusiastic', label: 'Enthusiastic' },
  { value: 'confident', label: 'Confident' },
]

export default function CoverLetterEditor({ initialLetter, onClose, onSave }: CoverLetterEditorProps) {
  const [title, setTitle] = useState(initialLetter?.title || '')
  const [content, setContent] = useState(initialLetter?.content || '')
  const [tone, setTone] = useState<string>(initialLetter?.tone || 'professional')
  const [isDirty, setIsDirty] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const supabase = createClient()

  // Auto-save draft (debounced via parent)
  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent)
    setIsDirty(true)
  }, [])

  const handleTitleChange = useCallback((newTitle: string) => {
    setTitle(newTitle)
    setIsDirty(true)
  }, [])

  // Save to database
  const handleSave = useCallback(async () => {
    setIsSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const letterData = {
        user_id: user.id,
        title,
        content,
        tone,
        job_id: initialLetter?.job_id || null,
      }

      if (initialLetter?.id) {
        // Update existing
        const { error } = await supabase
          .from('cover_letters')
          .update(letterData)
          .eq('id', initialLetter.id)
        if (error) throw error
      } else {
        // Create new
        const { error } = await supabase
          .from('cover_letters')
          .insert([letterData])
        if (error) throw error
      }

      setIsDirty(false)
      onSave?.(letterData)
      alert('✓ Cover letter saved!')
    } catch (err: any) {
      console.error('Save error:', err)
      alert(`Failed to save: ${err.message}`)
    } finally {
      setIsSaving(false)
    }
  }, [title, content, tone, initialLetter, supabase, onSave])

  // Regenerate with different tone
  const handleRegenerate = useCallback(async () => {
    setIsRegenerating(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Extract job title and company from the title (format: "Job Title at Company")
      const parts = title.split(' at ')
      const jobTitle = parts[0] || title
      const company = parts[1] || ''

      const response = await fetch('/api/generate-cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_title: jobTitle,
          company,
          tone,
          job_id: initialLetter?.job_id || null,
        }),
      })

      if (!response.ok) throw new Error('Failed to regenerate')
      const data = await response.json()

      setContent(data.cover_letter || data.content || '')
      setIsDirty(true)
    } catch (err: any) {
      console.error('Regenerate error:', err)
      alert(`Failed to regenerate: ${err.message}`)
    } finally {
      setIsRegenerating(false)
    }
  }, [title, tone, content, supabase])

  // Export to PDF
  const handleExportPDF = useCallback(async () => {
    setIsExporting(true)
    try {
      const response = await fetch('/api/cover-letters/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          tone,
        }),
      })

      if (!response.ok) throw new Error('Failed to generate PDF')

      // Download PDF
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${title || 'cover-letter'}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err: any) {
      console.error('Export error:', err)
      alert(`Failed to export PDF: ${err.message}`)
    } finally {
      setIsExporting(false)
    }
  }, [title, content, tone])

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="space-y-6 max-w-[1400px] mx-auto"
    >
      {/* Toolbar */}
      <motion.div variants={fadeInUp} className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-black text-white mb-1">Cover Letter Editor</h1>
          <p className="text-sm text-[#6a6a7a]">
            {isDirty ? '✏️ Unsaved changes' : '✓ All saved'}
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          {onClose && (
            <PremiumButton variant="ghost" onClick={onClose}>
              Close
            </PremiumButton>
          )}
          <PremiumButton
            variant="secondary"
            onClick={handleRegenerate}
            disabled={isRegenerating || !content}
            loading={isRegenerating}
          >
            🔄 Regenerate
          </PremiumButton>
          <PremiumButton
            variant="secondary"
            onClick={handleExportPDF}
            disabled={isExporting || !content}
            loading={isExporting}
          >
            📄 Export PDF
          </PremiumButton>
          <PremiumButton
            variant="primary"
            onClick={handleSave}
            disabled={isSaving || !title || !content}
            loading={isSaving}
          >
            ✓ Save
          </PremiumButton>
        </div>
      </motion.div>

      {/* Main Editor Area */}
      <motion.div variants={fadeInUp} className="grid grid-cols-2 gap-6 min-h-[600px]">
        {/* Left: Editor */}
        <div className="space-y-4">
          <PremiumCard accent="blue" hover={false}>
            <div className="p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="text-xs font-bold text-[#6a6a7a] uppercase tracking-wide mb-2 block">
                  Title / Job Position
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g., Senior Software Engineer"
                  className="w-full px-4 py-3 rounded-xl bg-[#16161f] border border-white/[0.06] text-white text-sm placeholder-[#3a3a4a] focus:outline-none focus:border-[rgba(116,185,255,0.3)] transition-all"
                />
              </div>

              {/* Tone Selector */}
              <div>
                <label className="text-xs font-bold text-[#6a6a7a] uppercase tracking-wide mb-2 block">
                  Tone
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {TONES.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setTone(t.value)}
                      className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                        tone === t.value
                          ? 'bg-[#74b9ff] text-black'
                          : 'bg-[rgba(116,185,255,0.1)] text-[#74b9ff] hover:bg-[rgba(116,185,255,0.2)]'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div>
                <label className="text-xs font-bold text-[#6a6a7a] uppercase tracking-wide mb-2 block">
                  Content
                </label>
                <textarea
                  value={content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  placeholder="Write or edit your cover letter here..."
                  className="w-full h-[450px] px-4 py-3 rounded-xl bg-[#16161f] border border-white/[0.06] text-white text-sm placeholder-[#3a3a4a] focus:outline-none focus:border-[rgba(116,185,255,0.3)] transition-all resize-none font-mono"
                />
                <p className="text-xs text-[#4a4a5a] mt-2">
                  {content.length} characters
                </p>
              </div>
            </div>
          </PremiumCard>
        </div>

        {/* Right: Preview */}
        <div>
          <CoverLetterPreview
            title={title}
            content={content}
            tone={tone}
          />
        </div>
      </motion.div>
    </motion.div>
  )
}
