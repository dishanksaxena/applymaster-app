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
    bg: 'linear-gradient(135deg, #fd79a8, #e84393)',
    text: '#ffffff',
    hover: 'rgba(253,121,168,0.9)',
    shadow: '0 8px 30px rgba(253,121,168,0.3)',
  },
  secondary: {
    bg: 'rgba(255,255,255,0.1)',
    text: '#ffffff',
    hover: 'rgba(255,255,255,0.15)',
    shadow: '0 8px 30px rgba(0,0,0,0.1)',
  },
  ghost: {
    bg: 'transparent',
    text: '#fd79a8',
    hover: 'rgba(253,121,168,0.1)',
    shadow: 'none',
  },
  danger: {
    bg: 'linear-gradient(135deg, #ff6b6b, #ff5252)',
    text: '#ffffff',
    hover: 'rgba(255,107,107,0.9)',
    shadow: '0 8px 30px rgba(255,107,107,0.3)',
  },
  success: {
    bg: 'linear-gradient(135deg, #00b894, #00a381)',
    text: '#ffffff',
    hover: 'rgba(0,184,148,0.9)',
    shadow: '0 8px 30px rgba(0,184,148,0.3)',
  },
}

const sizeStyles = {
  sm: {
    padding: '0.5rem 1rem',
    fontSize: '12px',
    height: '32px',
  },
  md: {
    padding: '0.75rem 1.5rem',
    fontSize: '14px',
    height: '40px',
  },
  lg: {
    padding: '1rem 2rem',
    fontSize: '16px',
    height: '48px',
  },
}

export default function PremiumButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  fullWidth = false,
  className = '',
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
        border: variant === 'ghost' ? `1px solid ${style.text}20` : 'none',
        boxShadow: disabled || loading ? 'none' : style.shadow,
      }}
    >
      {/* Loading Spinner */}
      {loading && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-4 h-4 rounded-full"
          style={{
            border: '2px solid',
            borderColor: `${style.text}40`,
            borderTopColor: style.text,
          }}
        />
      )}

      {/* Icon */}
      {icon && !loading && <span className="text-base">{icon}</span>}

      {/* Text */}
      {children}

      {/* Shine Effect on Hover (Premium Touch) */}
      <motion.div
        className="absolute inset-0 rounded-xl"
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 0.2 }}
        style={{
          background: 'linear-gradient(90deg, transparent, white, transparent)',
          pointerEvents: 'none',
        }}
      />
    </motion.button>
  )
}
