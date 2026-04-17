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
    bg: 'linear-gradient(135deg, #e84393, #d63384)',
    text: '#ffffff',
    shadow: '0 4px 14px rgba(232,67,147,0.25)',
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
    bg: 'linear-gradient(135deg, #ff6b6b, #ff5252)',
    text: '#ffffff',
    shadow: '0 4px 14px rgba(255,107,107,0.25)',
  },
  success: {
    bg: 'linear-gradient(135deg, #00b894, #00a381)',
    text: '#ffffff',
    shadow: '0 4px 14px rgba(0,184,148,0.25)',
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

  return (
    <motion.button
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        relative inline-flex items-center justify-center gap-2
        rounded-xl font-bold transition-all duration-300
        ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      style={{
        ...sizeStyle,
        background: style.bg,
        color: style.text,
        border: variant === 'ghost' ? '1px solid var(--border)' : 'none',
        boxShadow: disabled || loading ? 'none' : style.shadow,
      }}
    >
      {loading && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-4 h-4 rounded-full"
          style={{ border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff' }}
        />
      )}
      {icon && !loading && <span className="text-base">{icon}</span>}
      {children}
    </motion.button>
  )
}
