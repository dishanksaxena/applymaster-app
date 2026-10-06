/**
 * One-time Stripe setup for ApplyMaster. Safe to run again: it finds what
 * already exists by lookup key and URL instead of creating duplicates.
 *
 *   node scripts/stripe-setup.mjs            report what exists, change nothing
 *   node scripts/stripe-setup.mjs --apply    create what is missing
 *
 * Uses STRIPE_SECRET_KEY from .env.local, so it sets up whichever mode those
 * keys are (test now; run again after switching to live keys).
 *
 * Creates:
 *   - the three plans, as products with the SaaS tax code Managed Payments
 *     requires, and prices found by lookup key (src/lib/stripe.ts)
 *   - the webhook to https://www.applymaster.ai/api/webhooks/stripe; its
 *     signing secret is written to .env.local, never printed
 *   - a default Customer Portal configuration (cancel, update card, invoices)
 */
import fs from 'node:fs'
import Stripe from 'stripe'

const APPLY = process.argv.includes('--apply')
const ENV = '.env.local'
const env = Object.fromEntries(
  fs
    .readFileSync(ENV, 'utf8')
    .split(/\r?\n/)
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => {
      const i = l.indexOf('=')
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]
    })
)
const stripe = new Stripe(env.STRIPE_SECRET_KEY)
const mode = env.STRIPE_SECRET_KEY.includes('_test_') ? 'TEST' : 'LIVE'
const SITE = 'https://www.applymaster.ai'
const WEBHOOK_URL = `${SITE}/api/webhooks/stripe`
// Software as a service, personal use: eligible for Managed Payments.
const TAX_CODE = 'txcd_10103000'

const PLANS = [
  { plan: 'pro', name: 'ApplyMaster Pro', description: '100 applications a month, AI resume optimization and cover letters.', amount: 2900, recurring: { interval: 'month' }, lookup: 'applymaster_pro_monthly' },
  { plan: 'elite', name: 'ApplyMaster Elite', description: 'Unlimited applications, the auto-apply engine and interview coaching.', amount: 5900, recurring: { interval: 'month' }, lookup: 'applymaster_elite_monthly' },
  { plan: 'lifetime', name: 'ApplyMaster Lifetime', description: 'Everything in Elite, paid once.', amount: 19900, recurring: null, lookup: 'applymaster_lifetime' },
]

const EVENTS = [
  'checkout.session.completed',
  'checkout.session.async_payment_succeeded',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'charge.refunded',
  'invoice.payment_failed',
]

console.log(`Stripe ${mode} mode${APPLY ? '' : ' (report only — pass --apply to create)'}\n`)

// 1. Plans
const existing = await stripe.prices.list({ lookup_keys: PLANS.map(p => p.lookup), active: true, expand: ['data.product'] })
for (const p of PLANS) {
  const price = existing.data.find(x => x.lookup_key === p.lookup)
  if (price) {
    console.log(`  plan ${p.plan.padEnd(8)} exists: ${price.id} ($${price.unit_amount / 100}${p.recurring ? '/month' : ' once'}), tax code ${price.product.tax_code}`)
    continue
  }
  if (!APPLY) {
    console.log(`  plan ${p.plan.padEnd(8)} missing`)
    continue
  }
  const product = await stripe.products.create({ name: p.name, description: p.description, tax_code: TAX_CODE, metadata: { plan: p.plan } })
  const created = await stripe.prices.create({
    product: product.id,
    unit_amount: p.amount,
    currency: 'usd',
    ...(p.recurring ? { recurring: p.recurring } : {}),
    lookup_key: p.lookup,
    transfer_lookup_key: true,
    metadata: { plan: p.plan },
  })
  console.log(`  plan ${p.plan.padEnd(8)} created: ${created.id}`)
}

// 2. Webhook
const hooks = await stripe.webhookEndpoints.list({ limit: 100 })
let hook = hooks.data.find(h => h.url === WEBHOOK_URL)
const haveSecret = !!env.STRIPE_WEBHOOK_SECRET
if (hook && !haveSecret && APPLY) {
  // Stripe shows a signing secret only once, at creation: without it saved, start over.
  await stripe.webhookEndpoints.del(hook.id)
  hook = null
}
if (hook) {
  const missing = EVENTS.filter(e => !hook.enabled_events.includes(e))
  if (missing.length && APPLY) await stripe.webhookEndpoints.update(hook.id, { enabled_events: EVENTS })
  console.log(`  webhook exists: ${hook.id} -> ${hook.url}${missing.length ? (APPLY ? ' (events updated)' : ` (missing ${missing.join(', ')})`) : ''}`)
} else if (APPLY) {
  const created = await stripe.webhookEndpoints.create({ url: WEBHOOK_URL, enabled_events: EVENTS, description: 'ApplyMaster plans' })
  const text = fs.readFileSync(ENV, 'utf8').replace(/^STRIPE_WEBHOOK_SECRET=.*\r?\n?/m, '')
  fs.writeFileSync(ENV, text.replace(/\s*$/, '\n') + `STRIPE_WEBHOOK_SECRET=${created.secret}\n`)
  console.log(`  webhook created: ${created.id} -> ${created.url} (signing secret saved to ${ENV})`)
} else console.log('  webhook missing')

// 3. Customer Portal. Switching between Pro and Elite happens here too, prorated.
const monthly = (await stripe.prices.list({ lookup_keys: ['applymaster_pro_monthly', 'applymaster_elite_monthly'], active: true })).data
const portalFeatures = {
  subscription_cancel: { enabled: true, mode: 'at_period_end' },
  payment_method_update: { enabled: true },
  invoice_history: { enabled: true },
  customer_update: { enabled: true, allowed_updates: ['email', 'address'] },
  subscription_update: {
    enabled: monthly.length === 2,
    default_allowed_updates: ['price'],
    proration_behavior: 'always_invoice',
    products: monthly.map(p => ({ product: typeof p.product === 'string' ? p.product : p.product.id, prices: [p.id] })),
  },
}
const configs = await stripe.billingPortal.configurations.list({ is_default: true, limit: 1 })
const portal = configs.data[0]
if (portal) {
  const switching = portal.features.subscription_update.enabled
  if (!switching && APPLY && monthly.length === 2) await stripe.billingPortal.configurations.update(portal.id, { features: portalFeatures })
  console.log(`  customer portal configured: ${portal.id}${switching ? '' : APPLY ? ' (plan switching turned on)' : ' (plan switching off)'}`)
} else if (APPLY) {
  const c = await stripe.billingPortal.configurations.create({
    business_profile: { privacy_policy_url: `${SITE}/privacy`, terms_of_service_url: `${SITE}/terms`, headline: 'Manage your ApplyMaster plan' },
    features: portalFeatures,
    default_return_url: `${SITE}/settings`,
  })
  console.log(`  customer portal created: ${c.id}`)
} else console.log('  customer portal missing')

// 4. Is Managed Payments switched on for this account?
const pro = (await stripe.prices.list({ lookup_keys: ['applymaster_pro_monthly'], active: true })).data[0]
if (pro) {
  try {
    const s = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: pro.id, quantity: 1 }],
      managed_payments: { enabled: true },
      success_url: `${SITE}/settings`,
    })
    await stripe.checkout.sessions.expire(s.id)
    console.log('  managed payments: ON (a probe checkout was created and expired)')
  } catch (e) {
    console.log(`  managed payments: NOT AVAILABLE — ${e.message}`)
  }
}
