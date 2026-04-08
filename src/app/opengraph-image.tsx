import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'ApplyMaster — AI Auto Job Application System'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0a0a12 0%, #1a0a20 50%, #0a0a18 100%)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Grid pattern */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'linear-gradient(rgba(253,121,168,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(253,121,168,0.04) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            display: 'flex',
          }}
        />

        {/* Glow effect */}
        <div
          style={{
            position: 'absolute',
            width: 500,
            height: 500,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(253,121,168,0.15) 0%, rgba(162,155,254,0.08) 40%, transparent 70%)',
            top: '10%',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
          }}
        />

        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 80,
            height: 80,
            borderRadius: 20,
            background: 'linear-gradient(135deg, #fd79a8, #e84393)',
            fontSize: 36,
            fontWeight: 800,
            color: 'white',
            marginBottom: 32,
            boxShadow: '0 0 60px rgba(253,121,168,0.4)',
          }}
        >
          AM
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 56,
            fontWeight: 800,
            color: 'white',
            textAlign: 'center',
            lineHeight: 1.1,
            marginBottom: 16,
            display: 'flex',
          }}
        >
          ApplyMaster
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 24,
            fontWeight: 500,
            background: 'linear-gradient(90deg, #fd79a8, #a29bfe)',
            backgroundClip: 'text',
            color: 'transparent',
            textAlign: 'center',
            marginBottom: 32,
            display: 'flex',
          }}
        >
          AI Auto Job Application System
        </div>

        {/* Feature chips */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            flexWrap: 'wrap',
            justifyContent: 'center',
            maxWidth: 800,
          }}
        >
          {['Auto Apply 50+ Portals', 'ATS Resume Optimizer', 'AI Cover Letters', 'Live Interview Coach'].map((feat) => (
            <div
              key={feat}
              style={{
                padding: '10px 22px',
                borderRadius: 100,
                border: '1px solid rgba(253,121,168,0.3)',
                background: 'rgba(253,121,168,0.08)',
                color: '#fd79a8',
                fontSize: 16,
                fontWeight: 600,
                display: 'flex',
              }}
            >
              {feat}
            </div>
          ))}
        </div>

        {/* Bottom URL */}
        <div
          style={{
            position: 'absolute',
            bottom: 32,
            fontSize: 18,
            color: 'rgba(255,255,255,0.4)',
            fontWeight: 500,
            display: 'flex',
          }}
        >
          applymaster.ai
        </div>
      </div>
    ),
    { ...size }
  )
}
