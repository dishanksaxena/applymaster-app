/**
 * Builds the ApplyMaster Chrome extension.
 *
 *   extension/dist       production: talks to applymaster.ai only
 *   extension/dist-dev   local testing: also accepts http://localhost:3000
 *   public/downloads/applymaster-extension.zip   the production build, for
 *                        people to install before the Web Store listing
 *
 * Field recognition is not copied by hand: src/lib/ats/fields.ts — the same
 * rules the server uses — is compiled into the content script, so the
 * extension and the server read a form the same way.
 *
 * Runs before `next build` (see package.json).
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
import { zipSync } from 'fflate'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SRC = path.join(ROOT, 'extension', 'src')
const ICONS = path.join(ROOT, 'extension', 'icons')
const VERSION = '1.0.0'

const ATS_SITES = ['https://*.greenhouse.io/*', 'https://jobs.lever.co/*', 'https://jobs.ashbyhq.com/*', 'https://*.myworkdayjobs.com/*']

function fieldsBundle() {
  const source = fs.readFileSync(path.join(ROOT, 'src', 'lib', 'ats', 'fields.ts'), 'utf8')
  const js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext } }).outputText
  const body = js.replace(/^export\s+(?=(const|function|let|class)\b)/gm, '').replace(/^export\s*\{\s*\};?\s*$/gm, '')
  return `const AMFields = (() => {\n${body}\nreturn { classifyField, valueForField, knownAnswer, isVoluntaryDemographic, isPersonalConsent }\n})();\n`
}

function manifest(origins) {
  return {
    manifest_version: 3,
    name: 'ApplyMaster: fill job applications',
    short_name: 'ApplyMaster',
    version: VERSION,
    description: 'Fills job applications from your ApplyMaster profile. You review and submit; ApplyMaster keeps the receipt.',
    icons: { 16: 'icons/16.png', 48: 'icons/48.png', 128: 'icons/128.png' },
    action: { default_title: 'ApplyMaster', default_popup: 'popup.html', default_icon: { 16: 'icons/16.png', 48: 'icons/48.png' } },
    background: { service_worker: 'background.js' },
    permissions: ['storage', 'activeTab', 'scripting'],
    host_permissions: [...origins.map(o => `${o}/*`), ...ATS_SITES],
    content_scripts: [
      { matches: ATS_SITES, js: ['content.js'], run_at: 'document_idle', all_frames: true },
      { matches: origins.map(o => `${o}/extension*`), js: ['connect.js'], run_at: 'document_start' },
    ],
  }
}

function build(outDir, origins) {
  fs.rmSync(outDir, { recursive: true, force: true })
  fs.mkdirSync(path.join(outDir, 'icons'), { recursive: true })
  const read = f => fs.readFileSync(path.join(SRC, f), 'utf8')
  const files = {
    'manifest.json': JSON.stringify(manifest(origins), null, 2),
    'background.js': read('background.js').replace('__ALLOWED_ORIGINS__', JSON.stringify(origins)),
    'content.js': fieldsBundle() + read('content.js'),
    'connect.js': read('connect.js'),
    'popup.html': read('popup.html'),
    'popup.js': read('popup.js'),
  }
  for (const [name, text] of Object.entries(files)) fs.writeFileSync(path.join(outDir, name), text)
  for (const icon of fs.readdirSync(ICONS)) fs.copyFileSync(path.join(ICONS, icon), path.join(outDir, 'icons', icon))
  return files
}

const prodDir = path.join(ROOT, 'extension', 'dist')
build(prodDir, ['https://applymaster.ai'])
build(path.join(ROOT, 'extension', 'dist-dev'), ['https://applymaster.ai', 'http://localhost:3000'])

// The downloadable zip is the production build.
const entries = {}
const walk = (dir, prefix = '') => {
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f)
    if (fs.statSync(full).isDirectory()) walk(full, `${prefix}${f}/`)
    else entries[`applymaster-extension/${prefix}${f}`] = new Uint8Array(fs.readFileSync(full))
  }
}
walk(prodDir)
fs.mkdirSync(path.join(ROOT, 'public', 'downloads'), { recursive: true })
fs.writeFileSync(path.join(ROOT, 'public', 'downloads', 'applymaster-extension.zip'), zipSync(entries, { level: 9 }))
console.log(`ApplyMaster extension ${VERSION} built: extension/dist, extension/dist-dev, public/downloads/applymaster-extension.zip`)
