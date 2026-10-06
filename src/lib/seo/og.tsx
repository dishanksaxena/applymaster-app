import { ImageResponse } from 'next/og'

/** Share image for the landing pages: brand, a small label, and the page's own headline. */
export const OG_SIZE = { width: 1200, height: 630 }

export function ogImage(kicker: string, headline: string, foot = 'www.applymaster.ai') {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          background: 'linear-gradient(135deg, #12100E 0%, #1F1418 55%, #0C0A09 100%)',
          color: 'white',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, fontSize: 30, fontWeight: 700 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #F092B4, #C33A66)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              fontWeight: 800,
            }}
          >
            AM
          </div>
          ApplyMaster
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ color: '#F092B4', fontSize: 24, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase' }}>{kicker}</div>
          <div style={{ marginTop: 14, fontSize: 62, lineHeight: 1.08, fontWeight: 800, maxWidth: 1000 }}>{headline}</div>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 24 }}>{foot}</div>
      </div>
    ),
    OG_SIZE
  )
}
