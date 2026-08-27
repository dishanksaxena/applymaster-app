#!/usr/bin/env node
/**
 * WCAG contrast audit for the ApplyMaster token set.
 *
 * Reads the `--*-rgb` channel triplets straight out of globals.css so the
 * audit can never drift from the real values. Run after touching any token:
 *
 *     node scripts/contrast-audit.mjs
 *
 * Exits non-zero on any failure so it can gate CI.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

/* Comments are stripped before parsing: the token file documents its own
   selectors in prose, and a `style={{ ... }}` example inside a comment
   otherwise captures the brace matcher. */
const css = readFileSync(join(root, 'src/app/globals.css'), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '');

/* ── Parse ──────────────────────────────────────────────────── */

/** Pull the body of a rule, matching the selector only where it actually
 *  opens a rule (start of line, optional indent, followed by `{`). */
function block(selector) {
  const re = new RegExp(
    `^[ \\t]*${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[ \\t]*\\{`,
    'm'
  );
  const m = re.exec(css);
  if (!m) throw new Error(`selector not found: ${selector}`);
  const open = m.index + m[0].length - 1;
  let depth = 0;
  for (let i = open; i < css.length; i++) {
    if (css[i] === '{') depth++;
    else if (css[i] === '}' && --depth === 0) return css.slice(open + 1, i);
  }
  throw new Error(`unbalanced braces after ${selector}`);
}

/** { name: [r,g,b] } from every `--name-rgb: r g b;` in a block. */
function channels(body) {
  const out = {};
  for (const m of body.matchAll(/--([\w-]+)-rgb:\s*(\d+)\s+(\d+)\s+(\d+)\s*;/g)) {
    out[m[1]] = [+m[2], +m[3], +m[4]];
  }
  return out;
}

const light = channels(block(':root'));
const dark = channels(block('html.dark-theme'));

/* ── WCAG maths ─────────────────────────────────────────────── */

const lin = (c) => {
  c /= 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
};
const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
const WHITE = [255, 255, 255];

/* ── Cases ──────────────────────────────────────────────────── */

const AA = 4.5;      // body text
const AA_UI = 3.0;   // non-text: focus rings, borders, icons

/** Text tokens that must be readable on each surface. */
const INK = ['text', 'text-secondary', 'text-muted'];
const SURFACES = ['bg', 'bg-secondary', 'bg-card', 'bg-card-hover', 'bg-input'];
/** Colours used as coloured text on the page ground. */
const ON_BG = ['accent', 'green', 'blue', 'purple', 'yellow', 'red'];

let failures = 0;

function check(label, fg, bg, min) {
  const r = ratio(fg, bg);
  const pass = r >= min;
  if (!pass) failures++;
  const mark = pass ? '  ok ' : 'FAIL ';
  console.log(`  ${mark} ${r.toFixed(2).padStart(5)}:1  (min ${min.toFixed(1)})  ${label}`);
}

for (const [name, T] of [['LIGHT', light], ['DARK', dark]]) {
  console.log(`\n═══ ${name} ${'═'.repeat(52 - name.length)}`);

  console.log('\n  ink on surfaces');
  for (const s of SURFACES) {
    if (!T[s]) continue;
    for (const i of INK) check(`${i} on ${s}`, T[i], T[s], AA);
  }

  console.log('\n  coloured text on page ground');
  for (const c of ON_BG) check(`${c} on bg`, T[c], T.bg, AA);

  console.log('\n  white on solid fills (buttons)');
  check('text-on-accent on accent-solid', WHITE, T['accent-solid'], AA);

  console.log('\n  faint text (placeholders) on input');
  check('text-faint on bg-input', T['text-faint'], T['bg-input'], AA);

  console.log('\n  non-text');
  check('accent ring on bg', T.accent, T.bg, AA_UI);
  check('accent-solid fill vs bg', T['accent-solid'], T.bg, AA_UI);
}

console.log(
  failures === 0
    ? '\n✓ all contrast pairs pass WCAG AA\n'
    : `\n✗ ${failures} contrast failure(s)\n`
);
process.exit(failures === 0 ? 0 : 1);
