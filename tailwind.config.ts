import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0a0a0f',
          secondary: '#0e0e16',
          card: '#12121a',
          'card-hover': '#1a1a26',
          input: '#16161f',
        },
        accent: {
          pink: '#fd79a8',
          'pink-dim': 'rgba(253,121,168,0.12)',
          'pink-glow': 'rgba(253,121,168,0.3)',
          purple: '#a29bfe',
          'purple-dim': 'rgba(162,155,254,0.12)',
          green: '#00b894',
          'green-dim': 'rgba(0,184,148,0.12)',
          blue: '#74b9ff',
          'blue-dim': 'rgba(116,185,255,0.12)',
          yellow: '#fdcb6e',
          'yellow-dim': 'rgba(253,203,110,0.12)',
          red: '#ff6b6b',
          'red-dim': 'rgba(255,107,107,0.12)',
        },
        text: {
          primary: '#f0f0f5',
          secondary: '#8a8a9a',
          muted: '#5a5a6a',
        },
        border: {
          DEFAULT: 'rgba(255,255,255,0.06)',
          hover: 'rgba(255,255,255,0.12)',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '20px',
        xl: '28px',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease forwards',
        'fade-up': 'fadeUp 0.6s ease forwards',
        'slide-in-left': 'slideInLeft 0.8s ease forwards',
        'slide-in-right': 'slideInRight 0.8s ease forwards',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'typing': 'typing 3.5s steps(40) 1s forwards, blink 0.75s step-end infinite',
        'counter': 'counter 2s ease forwards',
        'marquee': 'marquee 30s linear infinite',
        'spin-slow': 'spin 8s linear infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        fadeUp: { from: { opacity: '0', transform: 'translateY(30px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideInLeft: { from: { opacity: '0', transform: 'translateX(-60px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        slideInRight: { from: { opacity: '0', transform: 'translateX(60px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        pulseGlow: { '0%, 100%': { opacity: '1', transform: 'scale(1)' }, '50%': { opacity: '0.5', transform: 'scale(0.85)' } },
        float: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-20px)' } },
        marquee: { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
      },
    },
  },
  plugins: [],
}

export default config
