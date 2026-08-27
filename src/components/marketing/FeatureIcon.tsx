/**
 * Line icons for the marketing feature cards.
 *
 * These replaced emoji (⚡ 📄 ✉️ 🎤 🎯) rendered at text-4xl. Emoji render
 * differently on every OS, carry their own colour so they ignore the theme,
 * and read as a placeholder rather than a designed mark.
 */
export type FeatureIconName = 'bolt' | 'doc' | 'mail' | 'mic' | 'target'

const PATHS: Record<FeatureIconName, React.ReactNode> = {
  bolt: <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />,
  doc: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </>
  ),
  mail: (
    <>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-10 6L2 7" />
    </>
  ),
  mic: (
    <>
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </>
  ),
}

export default function FeatureIcon({ name }: { name: FeatureIconName }) {
  return (
    <span
      className="grid place-items-center w-11 h-11 rounded-xl mb-4"
      style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}
    >
      <svg
        width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
      >
        {PATHS[name]}
      </svg>
    </span>
  )
}
