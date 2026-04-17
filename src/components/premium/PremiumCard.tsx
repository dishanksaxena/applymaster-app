import { motion } from 'framer-motion'
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
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: animationDelay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={hover ? cardHover : {}}
      onClick={onClick}
      className={`
        relative rounded-2xl overflow-hidden transition-all duration-300
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div className="relative z-10">{children}</div>
    </motion.div>
  )
}
