import { motion, AnimatePresence } from 'framer-motion'
import { ReactNode, useState } from 'react'

interface PremiumInputProps {
  type?: string
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  onFocus?: () => void
  onBlur?: () => void
  icon?: ReactNode
  error?: string
  label?: string
  disabled?: boolean
  className?: string
  success?: boolean
}

export default function PremiumInput({
  type = 'text',
  placeholder = '',
  value = '',
  onChange,
  onFocus,
  onBlur,
  icon,
  error,
  label,
  disabled = false,
  className = '',
  success = false,
}: PremiumInputProps) {
  const [isFocused, setIsFocused] = useState(false)

  const handleFocus = () => {
    setIsFocused(true)
    onFocus?.()
  }

  const handleBlur = () => {
    setIsFocused(false)
    onBlur?.()
  }

  return (
    <div className="w-full">
      {/* Label */}
      {label && (
        <motion.label
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="block text-[12px] font-semibold text-[#6a6a7a] mb-2 uppercase tracking-wide"
        >
          {label}
        </motion.label>
      )}

      {/* Input Container */}
      <motion.div
        className={`
          relative rounded-xl overflow-hidden
          transition-all duration-300
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${className}
        `}
        animate={{
          boxShadow: isFocused
            ? error
              ? '0 0 20px rgba(255,107,107,0.2)'
              : success
              ? '0 0 20px rgba(0,184,148,0.2)'
              : '0 0 20px rgba(253,121,168,0.2)'
            : '0 0 0px rgba(0,0,0,0)',
        }}
      >
        {/* Background */}
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{
            opacity: isFocused ? 0.05 : 0,
            background: error
              ? 'rgba(255,107,107,0.05)'
              : success
              ? 'rgba(0,184,148,0.05)'
              : 'rgba(253,121,168,0.05)',
          }}
          transition={{ duration: 0.2 }}
        />

        {/* Icon Left */}
        {icon && (
          <motion.div
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5a5a6a]"
            animate={{
              scale: isFocused ? 1.1 : 1,
              color: isFocused ? '#fd79a8' : '#5a5a6a',
            }}
          >
            {icon}
          </motion.div>
        )}

        {/* Input */}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            relative w-full py-3.5 px-4 rounded-xl
            ${icon ? 'pl-12' : 'px-4'}
            bg-[#16161f] border transition-all duration-300
            text-white text-[14px] placeholder-[#3a3a4a]
            focus:outline-none disabled:cursor-not-allowed
            ${
              error
                ? 'border-[rgba(255,107,107,0.3)] focus:border-[rgba(255,107,107,0.5)]'
                : success
                ? 'border-[rgba(0,184,148,0.3)] focus:border-[rgba(0,184,148,0.5)]'
                : 'border-[rgba(255,255,255,0.06)] focus:border-[rgba(253,121,168,0.3)]'
            }
          `}
        />

        {/* Success Icon */}
        <AnimatePresence>
          {success && !error && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#00b894]"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M20 6L9 17L4 12" />
              </svg>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Border Animation */}
        <motion.div
          className="absolute inset-0 rounded-xl pointer-events-none"
          animate={{
            border: isFocused
              ? error
                ? '2px solid rgba(255,107,107,0.3)'
                : success
                ? '2px solid rgba(0,184,148,0.3)'
                : '2px solid rgba(253,121,168,0.3)'
              : '2px solid transparent',
          }}
        />
      </motion.div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="text-[12px] text-[#ff6b6b] mt-2 flex items-center gap-1"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2" stroke="white" />
              <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2" stroke="white" />
            </svg>
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
