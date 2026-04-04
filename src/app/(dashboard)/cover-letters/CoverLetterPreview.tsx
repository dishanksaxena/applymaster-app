'use client'

import { motion } from 'framer-motion'
import { PremiumCard } from '@/components/premium'
import { fadeInUp } from '@/lib/animations'

interface CoverLetterPreviewProps {
  title: string
  content: string
  tone: string
}

const TONE_COLORS = {
  professional: { border: '#74b9ff', bg: 'rgba(116,185,255,0.05)' },
  casual: { border: '#00b894', bg: 'rgba(0,184,148,0.05)' },
  enthusiastic: { border: '#fd79a8', bg: 'rgba(253,121,168,0.05)' },
  confident: { border: '#fdcb6e', bg: 'rgba(253,203,110,0.05)' },
}

export default function CoverLetterPreview({ title, content, tone }: CoverLetterPreviewProps) {
  const toneColor = TONE_COLORS[tone as keyof typeof TONE_COLORS] || TONE_COLORS.professional

  // Split content into lines for better formatting
  const lines = content.split('\n').filter(line => line.trim())

  return (
    <motion.div variants={fadeInUp} className="h-full">
      <PremiumCard accent="purple" hover={false}>
        <div
          className="p-8 space-y-6 min-h-[600px] overflow-y-auto rounded-xl"
          style={{
            background: `linear-gradient(135deg, #12121a 0%, ${toneColor.bg} 100%)`,
            border: `2px solid ${toneColor.border}`,
          }}
        >
          {/* Header Info */}
          <div className="space-y-2 pb-6 border-b border-white/10">
            <div className="text-xs font-bold uppercase tracking-wider text-[#6a6a7a]">
              Cover Letter — {title}
            </div>
            <div
              className="inline-block px-3 py-1 rounded-lg text-xs font-bold"
              style={{ color: toneColor.border, backgroundColor: toneColor.bg }}
            >
              {tone.charAt(0).toUpperCase() + tone.slice(1)} Tone
            </div>
          </div>

          {/* Content Preview */}
          <div className="space-y-4 text-sm text-[#a8a8b8] leading-relaxed">
            {lines.length > 0 ? (
              lines.map((line, idx) => (
                <motion.p
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="whitespace-pre-wrap"
                >
                  {line}
                </motion.p>
              ))
            ) : (
              <div className="text-center py-20 text-[#5a5a6a]">
                <p>Your cover letter preview will appear here</p>
                <p className="text-xs mt-2">Start typing in the editor on the left</p>
              </div>
            )}
          </div>

          {/* Footer Info - PDF Ready */}
          {content && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-auto pt-6 border-t border-white/10 text-xs text-[#4a4a5a]"
            >
              <p>✓ PDF-ready formatting</p>
              <p>Word count: {content.split(/\s+/).filter(w => w).length}</p>
            </motion.div>
          )}
        </div>
      </PremiumCard>
    </motion.div>
  )
}
