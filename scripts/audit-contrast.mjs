import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'

/**
 * Runtime dark-surface audit.
 *
 * Static greps only catch colour syntax I thought to look for — they missed
 * dark rgba() triplets entirely. This instead asks the browser what it
 * actually painted: in light theme, flag any reasonably large element whose
 * computed background is dark, and any text whose contrast against its own
 * painted backdrop falls below AA.
 */

const BASE = 'http://localhost:3400'
/* Credentials come from the environment in CI; the local dev file is a
   convenience fallback and is gitignored. */
const cred = process.env.AUDIT_EMAIL
  ? { email: process.env.AUDIT_EMAIL, password: process.env.AUDIT_PASSWORD }
  : JSON.parse(readFileSync('.review-cred.json', 'utf8'))
const ROUTES = process.argv.slice(2)

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' })
const page = await ctx.newPage()

await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
await page.fill('input[type="email"]', cred.email)
await page.fill('input[type="password"]', cred.password)
await Promise.all([
  page.waitForURL(u => !u.pathname.includes('/login'), { timeout: 30000 }).catch(() => {}),
  page.click('button[type="submit"]'),
])
await page.waitForTimeout(2500)

const AUDIT = () => {
  const lum = (r, g, b) => {
    const f = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4) }
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
  }
  const parse = s => {
    const m = /rgba?\(([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?\)/.exec(s || '')
    return m ? { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] } : null
  }
  /** First colour stop of a gradient, if the element is gradient-filled. */
  const gradientFill = cs => {
    const img = cs.backgroundImage || ''
    if (!img.includes('gradient')) return null
    const m = img.match(/rgba?\([^)]+\)/)
    return m ? parse(m[0]) : null
  }
  /** Walk up until we find an element that actually paints a background. */
  const backdrop = el => {
    let n = el
    while (n && n !== document.documentElement) {
      const cs = getComputedStyle(n)
      const g = gradientFill(cs)
      if (g && g.a > 0.85) return g
      const c = parse(cs.backgroundColor)
      if (c && c.a > 0.85) return c
      n = n.parentElement
    }
    const c = parse(getComputedStyle(document.body).backgroundColor)
    return c || { r: 255, g: 255, b: 255, a: 1 }
  }
  const ratio = (x, y) => {
    const [hi, lo] = [lum(x.r, x.g, x.b), lum(y.r, y.g, y.b)].sort((a, b) => b - a)
    return (hi + 0.05) / (lo + 0.05)
  }

  const darkPanels = []
  const lowText = []
  const seen = new Set()

  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect()
    if (r.width < 90 || r.height < 34) continue
    const cs = getComputedStyle(el)
    if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity < 0.1) continue

    // 1. Dark *neutral* panel painted while the light theme is active.
    //    Saturated fills are excluded: an accent button is legitimately dark
    //    and carries white text, which the text check below validates on its
    //    own. Only near-grey dark surfaces indicate a dark-theme leak.
    const bg = parse(cs.backgroundColor) || gradientFill(cs)
    const spread = bg ? Math.max(bg.r, bg.g, bg.b) - Math.min(bg.r, bg.g, bg.b) : 0
    const neutral = spread <= 24
    if (bg && bg.a > 0.55 && neutral && lum(bg.r, bg.g, bg.b) < 0.14) {
      const key = el.tagName + (el.className || '').toString().slice(0, 50)
      if (!seen.has(key)) {
        seen.add(key)
        darkPanels.push({
          tag: el.tagName.toLowerCase(),
          cls: (el.className || '').toString().slice(0, 70),
          bg: cs.backgroundColor,
          size: `${Math.round(r.width)}x${Math.round(r.height)}`,
        })
      }
    }

    // 2. Text below AA against whatever is actually painted behind it.
    const txt = (el.textContent || '').trim()
    const ownText = Array.from(el.childNodes).some(n => n.nodeType === 3 && n.textContent.trim())
    if (!ownText || txt.length < 2) continue
    const fg = parse(cs.color)
    if (!fg || fg.a < 0.5) continue
    const back = backdrop(el)
    const cr = ratio(fg, back)
    const size = parseFloat(cs.fontSize)
    const large = size >= 24 || (size >= 18.66 && +cs.fontWeight >= 700)
    const need = large ? 3 : 4.5
    if (cr < need) {
      const key = 'T' + txt.slice(0, 24) + cs.color
      if (!seen.has(key)) {
        seen.add(key)
        lowText.push({ text: txt.slice(0, 40), ratio: +cr.toFixed(2), need, color: cs.color, size: Math.round(size) })
      }
    }
  }
  return { darkPanels, lowText }
}

let totalPanels = 0, totalText = 0
for (const route of ROUTES) {
  try {
    await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 45000 })
    await page.waitForTimeout(2000)
    const { darkPanels, lowText } = await page.evaluate(AUDIT)
    totalPanels += darkPanels.length
    totalText += lowText.length
    const flag = darkPanels.length || lowText.length ? '!!' : 'ok'
    console.log(`\n${flag} ${route}   dark panels: ${darkPanels.length}   low-contrast text: ${lowText.length}`)
    for (const d of darkPanels.slice(0, 5)) console.log(`     panel ${d.size.padEnd(10)} ${d.bg.padEnd(24)} .${d.cls}`)
    for (const t of lowText.slice(0, 6)) console.log(`     text  ${String(t.ratio).padStart(5)}:1 (need ${t.need})  ${t.color.padEnd(20)} "${t.text}"`)
  } catch (e) {
    console.log(`\n?? ${route}  ${String(e).split('\n')[0].slice(0, 80)}`)
  }
}
console.log(`\nTOTAL  dark panels: ${totalPanels}   low-contrast text: ${totalText}`)
await browser.close()
