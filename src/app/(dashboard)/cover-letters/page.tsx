'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase-browser'
import { PremiumButton, PremiumCard } from '@/components/premium'
import CoverLetterEditor from './CoverLetterEditor'
import { staggerContainer, fadeInUp } from '@/lib/animations'

interface CoverLetter {
  id: string
  title: string
  content: string
  tone: string
  created_at: string
  job_id?: string | null
}

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } } }

export default function CoverLettersPage() {
  const [coverLetters, setCoverLetters] = useState<CoverLetter[]>([])
  const [editingLetter, setEditingLetter] = useState<CoverLetter | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const supabase = createClient()

  useEffect(() => { setMounted(true) }, [])

  // Load cover letters
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: letters } = await supabase
        .from('cover_letters')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (letters) setCoverLetters(letters)
      setLoading(false)
    }
    load()
  }, [supabase])

  const handleSave = (letter: any) => {
    // Reload letters list
    setEditingLetter(null)
    setIsCreating(false)
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: letters } = await supabase
        .from('cover_letters')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (letters) setCoverLetters(letters)
    }
    load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this cover letter?')) return
    await supabase.from('cover_letters').delete().eq('id', id)
    setCoverLetters(coverLetters.filter(l => l.id !== id))
  }

  if (!mounted) return <div className="p-8" />

  // Show editor if editing
  if (editingLetter || isCreating) {
    return (
      <CoverLetterEditor
        initialLetter={editingLetter || undefined}
        onClose={() => {
          setEditingLetter(null)
          setIsCreating(false)
        }}
        onSave={handleSave}
      />
    )
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="space-y-8 max-w-[1200px] mx-auto"
    >
      {/* Header */}
      <motion.div variants={fadeInUp} className="relative overflow-hidden rounded-2xl p-8" style={{
        background: 'linear-gradient(135deg, rgba(253,121,168,0.08) 0%, rgba(162,155,254,0.06) 100%)',
        border: '1px solid rgba(253,121,168,0.1)',
      }}>
        <div className="absolute top-[-50%] right-[-10%] w-[300px] h-[300px] rounded-full opacity-[0.07]" style={{ background: 'radial-gradient(circle, #fd79a8, transparent 70%)' }} />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight mb-2 text-white">Cover Letters</h1>
            <p className="text-[14px] text-[#8a8a9a]">Create, edit, and manage AI-powered cover letters</p>
          </div>
          <PremiumButton
            variant="primary"
            onClick={() => setIsCreating(true)}
          >
            ✎ New Cover Letter
          </PremiumButton>
        </div>
      </motion.div>

      {/* Letters Grid */}
      {loading ? (
        <motion.div variants={fadeInUp} className="flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-[rgba(253,121,168,0.1)] border-t-[#fd79a8] animate-spin" />
        </motion.div>
      ) : coverLetters.length === 0 ? (
        <motion.div variants={fadeInUp} className="text-center py-20">
          <p className="text-[15px] font-semibold text-[#5a5a6a]">No cover letters yet</p>
          <p className="text-[12px] text-[#3a3a4a] mt-1">Create your first cover letter</p>
          <PremiumButton
            variant="primary"
            onClick={() => setIsCreating(true)}
            className="mt-4"
          >
            Create First Letter
          </PremiumButton>
        </motion.div>
      ) : (
        <motion.div
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {coverLetters.map((letter, idx) => (
            <motion.div key={letter.id} variants={fadeInUp}>
              <PremiumCard accent="blue" glowEffect={true} animationDelay={idx * 0.05}>
                <div className="p-5 space-y-4">
                  {/* Title */}
                  <div>
                    <h3 className="text-[15px] font-bold text-white truncate">{letter.title}</h3>
                    <p className="text-[12px] text-[#6a6a7a] mt-1">
                      {new Date(letter.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Content Preview */}
                  <p className="text-[13px] text-[#8a8a9a] line-clamp-3 leading-relaxed">
                    {letter.content}
                  </p>

                  {/* Tone Badge */}
                  <div className="flex gap-2 items-center">
                    <span
                      className="inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold"
                      style={{
                        background: 'rgba(116,185,255,0.1)',
                        color: '#74b9ff',
                      }}
                    >
                      {letter.tone.charAt(0).toUpperCase() + letter.tone.slice(1)}
                    </span>
                    <span className="text-[11px] text-[#5a5a6a]">
                      {letter.content.split(/\s+/).length} words
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-3 border-t border-white/5">
                    <PremiumButton
                      variant="secondary"
                      size="sm"
                      onClick={() => setEditingLetter(letter)}
                      className="flex-1"
                    >
                      Edit
                    </PremiumButton>
                    <PremiumButton
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(letter.id)}
                    >
                      Delete
                    </PremiumButton>
                  </div>
                </div>
              </PremiumCard>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  )
}
