/**
 * Renders the image files the site's metadata points at, which did not exist:
 * favicon PNGs, the Apple touch icon, the web-app icons, and a share image
 * for each blog post. Icons come from public/favicon.svg; blog images carry
 * the post's own title.
 *
 *   node scripts/build-brand-images.mjs                  icons + blog images
 *   BASE=http://localhost:3000 node scripts/build-brand-images.mjs
 *                                                        also saves the site's
 *                                                        social card as og-image.png
 *
 * Run again after changing the favicon or adding a blog post. Output is committed.
 */
import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'

const PUB = 'public'
const svg = fs.readFileSync(path.join(PUB, 'favicon.svg'), 'utf8')
const br = await chromium.launch()
const page = await br.newPage()

// 1. Icons
for (const [file, size] of [
  ['favicon-16x16.png', 16],
  ['favicon-32x32.png', 32],
  ['apple-touch-icon.png', 180],
  ['icon-192.png', 192],
  ['icon-512.png', 512],
  ['logo.png', 512], // publisher logo in the blog posts' structured data
]) {
  await page.setViewportSize({ width: size, height: size })
  await page.setContent(`<html><body style="margin:0;background:transparent">${svg.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`)
  await page.screenshot({ path: path.join(PUB, file), omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } })
  console.log('  icon', file)
}

// 2. Blog share images, from each post's title
const BLOG = 'src/app/(marketing)/blog'
fs.mkdirSync(path.join(PUB, 'og'), { recursive: true })
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
for (const slug of fs.readdirSync(BLOG).filter(d => fs.existsSync(path.join(BLOG, d, 'page.tsx')))) {
  const src = fs.readFileSync(path.join(BLOG, slug, 'page.tsx'), 'utf8')
  const title = src.match(/^const title = '(.+)'$/m)?.[1]?.replace(/\\'/g, "'")
  if (!title) continue
  await page.setViewportSize({ width: 1200, height: 630 })
  await page.setContent(`<!doctype html><html><head><style>
    body{margin:0;width:1200px;height:630px;display:flex;flex-direction:column;justify-content:space-between;padding:72px 80px;box-sizing:border-box;
      background:linear-gradient(135deg,#12100E 0%,#1F1418 55%,#0C0A09 100%);font-family:system-ui,-apple-system,'Segoe UI',sans-serif;color:#fff;position:relative;overflow:hidden}
    body:before{content:'';position:absolute;inset:0;background-image:linear-gradient(rgba(240,146,180,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(240,146,180,.07) 1px,transparent 1px);background-size:40px 40px}
    .glow{position:absolute;width:640px;height:640px;border-radius:50%;right:-160px;top:-220px;background:radial-gradient(circle,rgba(240,146,180,.28),rgba(166,161,240,.12) 45%,transparent 70%)}
    .brand{display:flex;align-items:center;gap:18px;position:relative;font-size:30px;font-weight:700}
    .logo{width:64px;height:64px;border-radius:16px;background:linear-gradient(135deg,#F092B4,#C33A66);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:28px}
    .kicker{color:#F092B4;font-size:24px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;position:relative}
    h1{position:relative;margin:14px 0 0;font-size:64px;line-height:1.08;font-weight:800;letter-spacing:-.02em;max-width:1000px}
    .url{position:relative;color:rgba(255,255,255,.45);font-size:24px}
  </style></head><body><div class="glow"></div>
    <div class="brand"><div class="logo">AM</div>ApplyMaster</div>
    <div><div class="kicker">ApplyMaster Blog</div><h1>${esc(title)}</h1></div>
    <div class="url">www.applymaster.ai/blog</div>
  </body></html>`)
  await page.screenshot({ path: path.join(PUB, 'og', `${slug}.png`) })
  console.log('  blog', `og/${slug}.png`)
}

// 3. The site's own social card, saved as a static file for the places that need a plain URL
if (process.env.BASE) {
  const res = await fetch(`${process.env.BASE}/opengraph-image`)
  const buf = Buffer.from(await res.arrayBuffer())
  if (res.ok && buf.length > 1000) {
    fs.writeFileSync(path.join(PUB, 'og-image.png'), buf)
    console.log('  card og-image.png', buf.length, 'bytes')
  } else console.log('  card FAILED', res.status, buf.length, 'bytes')
}

await br.close()
