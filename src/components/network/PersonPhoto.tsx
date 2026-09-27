'use client'

import { useEffect, useState } from 'react'

/**
 * A person's stored profile photo, laid over their initials inside a round,
 * position: relative avatar. Until it loads — or if it never does — the
 * initials underneath are what shows.
 */
export function PersonPhoto({ src }: { src?: string | null }) {
  const [bad, setBad] = useState(false)
  useEffect(() => setBad(false), [src])
  if (!src || bad) return null
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      loading="lazy"
      className="absolute inset-0 w-full h-full rounded-full object-cover"
      style={{ background: 'var(--bg-overlay)' }}
      onError={() => setBad(true)}
    />
  )
}
