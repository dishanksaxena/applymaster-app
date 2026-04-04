import { motion, MotionProps } from 'framer-motion'
import { ReactNode } from 'react'
import { cardHover } from '@/lib/animations'

interface PremiumCardProps {
  children: ReactNode
  onClick?: () => void
  hover?: boolean
  gradient?: boolean
  accent?: 'pink' | 'purple' | 'blue' | 'green' | 'yellow' | 'none'
  glowEffect?: boolean
  className?: string
  animationDelay?: number
}

const accentColors = {
  pink: { border: 'rgba(253,121,168,0.2)', glow: 'rgba(253,121,168,0.15)' },
  purple: { border: 'rgba(162,155,254,0.2)', glow: 'rgba(162,155,254,0.15)' },
  blue: { border: 'rgba(116,185,255,0.2)', glow: 'rgba(116,185,255,0.15)' },
  green: { border: 'rgba(0,184,148,0.2)', glow: 'rgba(0,184,148,0.15)' },
  yellow: { border: 'rgba(253,203,110,0.2)', glow: 'rgba(253,203,110,0.15)' },
  none: { border: 'rgba(255,255,255,0.06)', glow: 'rgba(0,0,0,0)' },
}

export default function PremiumCard({
  children,
  onClick,
  hover = true,
  gradient = true,
  accent = 'pink',
  glowEffect = false,
  className = '',
  animationDelay = 0,
}: PremiumCardProps) {
  const accentColor = accentColors[accent]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: animationDelay,
        ease: [0.16, 1, 0.3, 1],
      }}
      whileHover={hover ? cardHover : {}}
      onClick={onClick}
      className={`
        relative rounded-2xl overflow-hidden
        transition-all duration-300
        ${onClick ? 'cursor-pointer' : ''}
        ${glowEffect ? 'group' : ''}
        ${className}
      `}
      style={{
        background: gradient
          ? 'linear-gradient(135deg, #1c1c2e 0%, #16162a 100%)'
          : '#12121a',
        border: `1px solid ${accentColor.border}`,
        boxShadow: glowEffect
          ? `0 0 30px ${accentColor.glow}, inset 0 0 30px ${accentColor.glow}`
          : '0 4px 20px rgba(0,0,0,0.2)',
      }}
    >
      {/* Animated Border Gradient */}
      {glowEffect && (
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: `linear-gradient(135deg, ${accentColor.glow}, transparent)`,
          }}
        />
      )}

      {/* Content */}
      <div className="relative z-10">{children}</div>

      {/* Accent Line */}
      <motion.div
        className="absolute top-0 left-0 h-1 rounded-full"
        initial={{ width: 0 }}
        whileHover={hover ? { width: '100%' } : {}}
        transition={{ duration: 0.5 }}
        style={{ background: accentColor.border.replace('0.2', '1') }}
      />
    </motion.div>
  )
}
