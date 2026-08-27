import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface PremiumButtonProps {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  icon?: ReactNode
  fullWidth?: boolean
  className?: string
}

const variantStyles = {
  primary: {
    bg: 'linear-gradient(135deg, var(--accent-solid), var(--accent-solid))',
    text: '#ffffff',
    shadow: '0 4px 14px rgb(var(--accent-rgb) / 0.25)',
  },
  secondary: {
    bg: 'var(--bg-overlay)',
    text: 'var(--text)',
    shadow: 'var(--shadow-sm)',
  },
  ghost: {
    bg: 'transparent',
    text: 'var(--accent)',
    shadow: 'none',
  },
  danger: {
    bg: 'linear-gradient(135deg, var(--red), var(--red))',
    text: '#ffffff',
    shadow: '0 4px 14px rgb(var(--red-rgb) / 0.25)',
  },
  success: {
    bg: 'linear-gradient(135deg, var(--green), var(--green))',
    text: '#ffffff',
    shadow: '0 4px 14px rgb(var(--green-rgb) / 0.25)',
  },
}

const sizeStyles = {
  sm: { padding: '0.5rem 1rem', fontSize: '12px', height: '32px' },
  md: { padding: '0.75rem 1.5rem', fontSize: '14px', height: '40px' },
  lg: { padding: '1rem 2rem', fontSize: '16px', height: '48px' },
}

export default function PremiumButton({
  children, onClick, variant = 'primary', size = 'md',
  disabled = false, loading = false, icon, fullWidth = false, className = '',
}: PremiumButtonProps) {
  const style = variantStyles[variant]
  const sizeStyle = sizeStyles[size]
  const inactive = disabled || loading

  /* A disabled state has to be a different treatment, not a faded copy of
     the enabled one. Halving the opacity of white-on-accent fades the fill
     and the label together: the ratio between them is preserved, so the
     text stays "legible" by the numbers while the whole control washes out
     against the page and reads as broken rather than unavailable. A neutral
     fill with muted text says unavailable and still passes contrast.

     Loading keeps the accent fill — the action is running, not unavailable. */
  const face = disabled
    ? { background: 'var(--bg-overlay)', color: 'var(--text-faint)', boxShadow: 'none' }
    : { background: style.bg, color: style.text, boxShadow: loading ? 'none' : style.shadow }

  return (
    <motion.button
      whileHover={{ scale: inactive ? 1 : 1.02 }}
      whileTap={{ scale: inactive ? 1 : 0.98 }}
      onClick={onClick}
      disabled={inactive}
      aria-busy={loading || undefined}
      className={`
        relative inline-flex items-center justify-center gap-2
        rounded-xl font-bold transition-all duration-300
        ${inactive ? 'cursor-not-allowed' : 'cursor-pointer'}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      style={{
        ...sizeStyle,
        ...face,
        border: variant === 'ghost' ? '1px solid var(--border)' : 'none',
      }}
    >
      {loading && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-4 h-4 rounded-full shrink-0"
          // currentColor keeps the spinner visible whatever face the button
          // is wearing; it used to be hardcoded white.
          style={{ border: '2px solid rgb(255 255 255 / 0.3)', borderTopColor: 'currentColor' }}
        />
      )}
      {icon && !loading && <span className="text-base">{icon}</span>}
      {children}
    </motion.button>
  )
}
