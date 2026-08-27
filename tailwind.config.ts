import type { Config } from 'tailwindcss'

/**
 * Colours resolve through the CSS variables in src/app/globals.css so that
 * every Tailwind utility follows the active theme. The previous config
 * hardcoded dark hexes here, which meant `bg-bg-card` and friends could
 * never respond to `html.dark-theme` — two competing colour systems.
 *
 * `<alpha-value>` requires raw channels, which is why globals.css declares
 * each colour twice (`--x-rgb` for here, `--x` for inline styles).
 */
const channel = (name: string) => `rgb(var(${name}) / <alpha-value>)`

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        /* Surfaces */
        surface: {
          DEFAULT: channel('--bg-rgb'),
          secondary: channel('--bg-secondary-rgb'),
          card: channel('--bg-card-rgb'),
          'card-hover': channel('--bg-card-hover-rgb'),
          input: channel('--bg-input-rgb'),
          elevated: channel('--bg-elevated-rgb'),
          sidebar: channel('--bg-sidebar-rgb'),
        },

        /* Ink */
        ink: {
          DEFAULT: channel('--text-rgb'),
          secondary: channel('--text-secondary-rgb'),
          muted: channel('--text-muted-rgb'),
          faint: channel('--text-faint-rgb'),
        },

        /* Accent. `accent` reads on the page ground; `accent-solid` is the
           fill that carries white text. They differ in dark mode. */
        accent: {
          DEFAULT: channel('--accent-rgb'),
          solid: channel('--accent-solid-rgb'),
          /* Legacy sub-keys retained so existing `*-accent-pink` style
             classes keep resolving; they now follow the theme. */
          pink: channel('--accent-rgb'),
          purple: channel('--purple-rgb'),
          green: channel('--green-rgb'),
          blue: channel('--blue-rgb'),
          yellow: channel('--yellow-rgb'),
          red: channel('--red-rgb'),
        },

        /* Semantic */
        success: channel('--green-rgb'),
        info: channel('--blue-rgb'),
        warning: channel('--yellow-rgb'),
        danger: channel('--red-rgb'),
      },

      /* Borders carry their own alpha in the token, so they are plain
         var() rather than channel form. */
      borderColor: {
        DEFAULT: 'var(--border)',
        hover: 'var(--border-hover)',
        accent: 'var(--border-accent)',
      },

      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
        accent: 'var(--shadow-accent)',
      },

      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['Instrument Serif', 'Iowan Old Style', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },

      /* Unchanged: 283 existing `rounded-{sm,md,lg,xl}` usages depend on
         these exact values. */
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
