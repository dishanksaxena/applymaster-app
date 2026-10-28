/**
 * Renders the profile picture and cover images each social platform asks for,
 * from public/favicon.svg and the site's colours. Output goes to the folder
 * given as the first argument.
 *
 *   node scripts/build-social-images.mjs "C:/Users/you/Downloads/ApplyMaster Social"
 */
import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'

const OUT = process.argv[2]
if (!OUT) { console.error('usage: node scripts/build-social-images.mjs <output folder>'); process.exit(1) }
fs.mkdirSync(OUT, { recursive: true })
const svg = fs.readFileSync('public/favicon.svg', 'utf8')
const tile = (size, radius = true, text = 18) =>
  `<div style="width:${size}px;height:${size}px;flex:none">${svg.replace('<svg', '<svg width="100%" height="100%"').replace('rx="8"', radius ? 'rx="8"' : 'rx="0"').replace('font-size="18"', `font-size="${text}"`)}</div>`

const BONE = '#FAF8F5', INK = '#12100E', ROSE = '#A8325C', MUTED = '#6B645E'
const SERIF = `'Instrument Serif', Georgia, 'Times New Roman', serif`
const SANS = `Inter, 'Segoe UI', Arial, sans-serif`

// [file, width, height]
const SIZES = [
  ['profile-picture-800.png', 800, 800],
  ['linkedin-cover-1128x191.png', 1128, 191],
  ['x-bluesky-header-1500x500.png', 1500, 500],
  ['youtube-banner-2560x1440.png', 2560, 1440],
  ['facebook-cover-820x312.png', 820, 312],
  ['github-social-preview-1280x640.png', 1280, 640],
  ['pinterest-profile-banner-1600x400.png', 1600, 400],
]

const html = (w, h) => {
  if (w === h) {
    // Profile pictures are cropped to a circle: the gradient fills the whole square.
    return `<body style="margin:0;width:${w}px;height:${h}px;display:grid;place-items:center">${tile(w, false, 11)}</body>`
  }
  const wide = w / h > 4 // LinkedIn-style strip: one row, one line of text
  const safeW = w === 2560 ? 1546 : w // YouTube shows only the centre on phones and TVs
  const title = wide ? h * 0.3 : Math.min(h * 0.2, safeW / 12)
  const sub = title * (wide ? 0.34 : 0.3)
  const mark = wide ? h * 0.52 : title * 1.35
  const tagline = wide
    ? `Fills job applications on the employer's own site. You check and press Submit. &nbsp;<span style="color:${ROSE};font-weight:600">applymaster.ai</span>`
    : `Fills job applications on the employer's own site.<br>You check them and press Submit.`
  return `<body style="margin:0;width:${w}px;height:${h}px;background:${BONE};display:flex;align-items:center;justify-content:center">
    <div style="display:flex;align-items:center;gap:${title * 0.45}px;max-width:${safeW * 0.92}px">
      ${tile(mark)}
      <div>
        <div style="font:${title}px/1.05 ${SERIF};color:${INK};letter-spacing:-0.01em">ApplyMaster</div>
        <div style="font:500 ${sub}px/1.35 ${SANS};color:${MUTED};white-space:nowrap;margin-top:${title * 0.1}px">${tagline}</div>
        ${wide ? '' : `<div style="font:600 ${sub * 0.85}px ${SANS};color:${ROSE};margin-top:${title * 0.16}px">applymaster.ai</div>`}
      </div></div></body>`
}

const br = await chromium.launch()
for (const [file, w, h] of SIZES) {
  const p = await br.newPage({ viewport: { width: w, height: h } })
  await p.setContent(html(w, h))
  await p.screenshot({ path: path.join(OUT, file) })
  await p.close()
  console.log('wrote', file)
}
await br.close()
