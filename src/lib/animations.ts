/**
 * 🎬 Professional Animation Library
 * Reusable Framer Motion presets for production-level UI
 */

import { Variants } from 'framer-motion'

// ─── Page Transitions ───
export const pageTransition: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
}

// ─── Stagger Container (for lists) ───
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.2,
    },
  },
}

// ─── Smooth Fade ───
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6 },
  },
}

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -30 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6 },
  },
}

// ─── Scale Animations ───
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5 },
  },
}

export const scaleInCenter: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  show: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 20,
    },
  },
}

// ─── Slide Animations ───
export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -60 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6 },
  },
}

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 60 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6 },
  },
}

// ─── Rotate Animations ───
export const rotateIn: Variants = {
  hidden: { opacity: 0, rotate: -10 },
  show: {
    opacity: 1,
    rotate: 0,
    transition: { duration: 0.6 },
  },
}

// ─── Button Hover States ───
export const buttonHover = {
  scale: 1.02,
  transition: { duration: 0.2 },
}

export const buttonTap = {
  scale: 0.98,
  transition: { duration: 0.1 },
}

// ─── Card Hover ───
export const cardHover = {
  y: -8,
  boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
  transition: { duration: 0.3 },
}

// ─── Floating Animation (for icons, badges) ───
export const float = {
  y: [0, -10, 0],
  transition: {
    duration: 3,
    repeat: Infinity,
  },
}

// ─── Pulse Animation ───
export const pulse = {
  opacity: [1, 0.5, 1],
  transition: {
    duration: 2,
    repeat: Infinity,
  },
}

// ─── Shimmer/Loading Animation ───
export const shimmer = {
  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
  transition: {
    duration: 3,
    repeat: Infinity,
  },
}

// ─── Rotate Infinite ───
export const rotateInfinite = {
  rotate: 360,
  transition: {
    duration: 2,
    repeat: Infinity,
  },
}

// ─── Bounce Animation ───
export const bounce = {
  y: [0, -20, 0],
  transition: {
    duration: 0.6,
    repeat: Infinity,
  },
}

// ─── Success Check Animation ───
export const successCheck: Variants = {
  hidden: { opacity: 0, scale: 0.5, rotate: -45 },
  show: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 15,
    },
  },
}

// ─── Modal Animations ───
export const modalBackdrop: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
}

export const modalContent: Variants = {
  hidden: { opacity: 0, scale: 0.9, y: 40 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
  exit: { opacity: 0, scale: 0.9, y: 40, transition: { duration: 0.2 } },
}

// ─── Dropdown/Menu Animation ───
export const dropdownMenu: Variants = {
  hidden: { opacity: 0, y: -10, pointerEvents: 'none' },
  show: {
    opacity: 1,
    y: 0,
    pointerEvents: 'auto',
    transition: { duration: 0.2 },
  },
  exit: { opacity: 0, y: -10, pointerEvents: 'none', transition: { duration: 0.15 } },
}

// ─── Tab Switch Animation ───
export const tabSwitch: Variants = {
  hidden: { opacity: 0, x: 20 },
  show: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, x: -20, transition: { duration: 0.3 } },
}

// ─── Input Focus Animation ───
export const inputFocus = {
  scale: 1.01,
  transition: { duration: 0.2 },
}

// ─── Notification Animation ───
export const notificationSlide: Variants = {
  hidden: { opacity: 0, x: 100 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4 },
  },
  exit: { opacity: 0, x: 100, transition: { duration: 0.3 } },
}

// ─── Backdrop Blur Animation ───
export const blurIn: Variants = {
  hidden: { backdropFilter: 'blur(0px)', opacity: 0 },
  show: {
    backdropFilter: 'blur(10px)',
    opacity: 1,
    transition: { duration: 0.3 },
  },
}

// ─── Text Reveal Animation ───
export const textReveal: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
}

// ─── Progress Bar Animation ───
export const progressFill = (progress: number) => ({
  width: `${progress}%`,
  transition: { duration: 0.8, ease: 'easeInOut' },
})

// ─── Custom Easing Presets ───
// These are spring-based alternatives to cubic-bezier curves for smooth animations
export const easeOutExpo = { type: 'spring', stiffness: 300, damping: 30 } as const
export const easeOutBack = { type: 'spring', stiffness: 200, damping: 20 } as const
export const easeInOutQuad = { type: 'spring', stiffness: 250, damping: 25 } as const

// ─── Hover Variants ───
export const hoverVariants = (yOffset = -5) => ({
  hover: {
    y: yOffset,
    transition: { duration: 0.3 },
  },
})

// ─── Container Variants (for orchestrating animations) ───
export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
}
