#!/usr/bin/env node
/**
 * Switch payments on, once the LemonSqueezy store is activated.
 *
 *   node scripts/lemonsqueezy-setup.mjs            check only, change nothing
 *   node scripts/lemonsqueezy-setup.mjs --apply    register the webhook, push env to Vercel
 *
 * Needs LEMONSQUEEZY_API_KEY in .env.local. With --apply it:
 *   1. confirms the key works and the store is activated
 *   2. confirms the three product ids have a published variant
 *   3. registers https://www.applymaster.ai/api/webhooks/lemonsqueezy with a
 *      freshly generated signing secret (skipped if one already exists)
 *   4. writes that secret to .env.local and to Vercel production, along with
 *      the API key and PAYMENTS_ENABLED=true
 * Secrets are never printed.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { randomBytes } from 'node:crypto'
import { execSync } from 'node:child_process'

const APPLY = process.argv.includes('--apply')
const WEBHOOK_URL = 'https://www.applymaster.ai/api/webhooks/lemonsqueezy'
const EVENTS = [
  'order_created', 'order_refunded',
  'subscription_created', 'subscription_updated', 'subscription_cancelled',
  'subscription_resumed', 'subscription_expired', 'subscription_paused',
  'subscription_unpaused', 'subscription_payment_success',
]

const envText = existsSync('.env.local') ? readFileSync('.env.local', 'utf8') : ''
const env = Object.fromEntries(
  envText.split(/\r?\n/).filter(l => /^\s*[A-Z0-9_]+\s*=/.test(l)).map(l => {
    const i = l.indexOf('=')
    return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]
  })
)
const KEY = env.LEMONSQUEEZY_API_KEY
if (!KEY) { console.error('LEMONSQUEEZY_API_KEY is not in .env.local'); process.exit(1) }

const H = { Authorization: `Bearer ${KEY}`, Accept: 'application/vnd.api+json', 'Content-Type': 'application/vnd.api+json' }
const api = async (path, init) => {
  const r = await fetch(`https://api.lemonsqueezy.com/v1${path}`, { headers: H, ...init })
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(`${path} -> ${r.status} ${JSON.stringify(j.errors || j).slice(0, 200)}`)
  return j
}

const stores = (await api('/stores')).data
const store = stores.find(s => s.id === String(env.LEMONSQUEEZY_STORE_ID)) || stores[0]
if (!store) { console.error('No store on this API key'); process.exit(1) }
console.log(`store: ${store.attributes.name} (${store.id})  slug: ${store.attributes.slug}`)

// An unactivated store answers "This store has not been activated" to buyers.
const probe = await fetch(`https://${store.attributes.slug}.lemonsqueezy.com/`, { redirect: 'manual' })
const activated = probe.status !== 403
console.log(`storefront reachable: ${activated ? 'yes' : 'NO — activate the store in LemonSqueezy first'}`)

let ok = true
for (const plan of ['PRO', 'ELITE', 'LIFETIME']) {
  const pid = env[`LEMONSQUEEZY_PRODUCT_ID_${plan}`]
  if (!pid) { console.log(`  ${plan}: no product id in .env.local`); ok = false; continue }
  const v = (await api(`/variants?filter[product_id]=${pid}`)).data || []
  const live = v.find(x => x.attributes.status !== 'draft')
  console.log(`  ${plan.padEnd(8)} product ${pid}: ${live ? `variant ${live.id} (${live.attributes.status})` : 'NO published variant'}`)
  if (!live) ok = false
}

const hooks = (await api(`/webhooks?filter[store_id]=${store.id}`)).data || []
const existing = hooks.find(h => h.attributes.url === WEBHOOK_URL)
console.log(`webhook: ${existing ? 'already registered' : 'not registered'}`)

if (!APPLY) {
  console.log('\nCheck only. Re-run with --apply to switch payments on.')
  process.exit(0)
}
if (!activated || !ok) {
  console.error('\nNot applying: the store must be activated and every plan needs a published variant.')
  process.exit(1)
}

let secret = env.LEMONSQUEEZY_WEBHOOK_SECRET
if (!existing) {
  secret = randomBytes(24).toString('hex')
  await api('/webhooks', {
    method: 'POST',
    body: JSON.stringify({
      data: {
        type: 'webhooks',
        attributes: { url: WEBHOOK_URL, events: EVENTS, secret },
        relationships: { store: { data: { type: 'stores', id: store.id } } },
      },
    }),
  })
  console.log('webhook registered')
} else if (!secret) {
  console.error('A webhook exists but its secret is not in .env.local. Delete it in LemonSqueezy and re-run.')
  process.exit(1)
}

// .env.local
let text = envText
const setLocal = (k, v) => {
  const re = new RegExp(`^${k}=.*$`, 'm')
  text = re.test(text) ? text.replace(re, `${k}=${v}`) : `${text.replace(/\s*$/, '')}\n${k}=${v}\n`
}
setLocal('LEMONSQUEEZY_WEBHOOK_SECRET', secret)
setLocal('PAYMENTS_ENABLED', 'true')
writeFileSync('.env.local', text)

// Vercel production
for (const [k, v] of [
  ['LEMONSQUEEZY_API_KEY', KEY],
  ['LEMONSQUEEZY_WEBHOOK_SECRET', secret],
  ['PAYMENTS_ENABLED', 'true'],
]) {
  try { execSync(`npx vercel env rm ${k} production -y`, { stdio: 'ignore' }) } catch {}
  execSync(`npx vercel env add ${k} production`, { input: v, stdio: ['pipe', 'ignore', 'inherit'] })
  console.log(`vercel: ${k} set`)
}
console.log('\nDone. Redeploy production for the new variables to take effect.')
