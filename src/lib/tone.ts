/**
 * Semantic colour tones, safe to interpolate.
 *
 * The bug this exists to prevent: the codebase was written against hex
 * colours, so tinted surfaces were built by suffixing an alpha pair —
 * `${color}20` produced `#a78bfa20`, which is valid CSS. When colours moved
 * to design tokens that same template produced `var(--purple)20`, which is
 * not valid CSS. Browsers drop an invalid declaration silently, so every
 * tinted background, glow and coloured border in the app rendered as
 * nothing. Cards that were meant to read as layered and tinted collapsed
 * into flat white boxes with a hairline border.
 *
 * A tone is therefore a *name*, not a colour string. You cannot concatenate
 * a name into something invalid; you have to go through `toneA`, which
 * resolves to the channel variable and produces real CSS.
 */

export type Tone = 'accent' | 'green' | 'blue' | 'purple' | 'yellow' | 'red'

/** Solid colour for text, strokes and icons. */
export const tone = (t: Tone) => `var(--${t})`

/** The same tone at partial opacity — for fills, glows and tinted borders. */
export const toneA = (t: Tone, alpha: number) => `rgb(var(--${t}-rgb) / ${alpha})`

/**
 * A tinted surface that stays legible in both themes.
 *
 * Light mode wants a whisper of colour over white; dark mode needs more,
 * because a 6% tint over near-black is invisible. One value cannot serve
 * both, so this leans on the `--tint-scale` multiplier set per theme in
 * globals.css.
 */
export const toneSurface = (t: Tone, alpha = 0.08) =>
  `rgb(var(--${t}-rgb) / calc(${alpha} * var(--tint-scale)))`

/** Border in a tone — heavier than a surface tint so the edge reads. */
export const toneBorder = (t: Tone, alpha = 0.22) =>
  `rgb(var(--${t}-rgb) / calc(${alpha} * var(--tint-scale)))`

/** Soft directional glow used behind stat values and active states. */
export const toneGlow = (t: Tone, alpha = 0.18) =>
  `0 8px 28px -12px rgb(var(--${t}-rgb) / ${alpha})`

/**
 * Apply alpha to a colour that arrives as a string at runtime.
 *
 * Call sites that were written for hex colours did this by concatenation:
 * `${color}20`. That silently became invalid CSS once colours were tokens.
 * This does the same job correctly for tokens, hex and rgb() alike, and
 * leaves anything it does not recognise opaque rather than broken.
 *
 * `scale` routes the alpha through --tint-scale, which is what you want for
 * a surface or a border: the same wash that reads on white disappears on
 * near-black.
 */
export function withAlpha(color: string, alpha: number, scale = false): string {
  const a = scale ? `calc(${alpha} * var(--tint-scale))` : `${alpha}`
  const c = (color || '').trim()

  const token = /^var\(\s*(--[a-z0-9-]+)\s*\)$/i.exec(c)
  if (token) return `rgb(var(${token[1]}-rgb) / ${a})`

  const hex6 = /^#([0-9a-f]{6})$/i.exec(c)
  if (hex6) {
    const n = parseInt(hex6[1], 16)
    return `rgb(${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255} / ${a})`
  }

  const hex3 = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(c)
  if (hex3) {
    const [r, g, b] = hex3.slice(1).map(h => parseInt(h + h, 16))
    return `rgb(${r} ${g} ${b} / ${a})`
  }

  const rgbish = /^rgba?\(\s*([0-9.]+)[\s,]+([0-9.]+)[\s,]+([0-9.]+)/i.exec(c)
  if (rgbish) return `rgb(${rgbish[1]} ${rgbish[2]} ${rgbish[3]} / ${a})`

  // Gradients and named colours: no safe way to add alpha, so stay opaque.
  return c
}
