import 'server-only'
import Stripe from 'stripe'
import { adminEmails } from '@/lib/supabase-admin'

/**
 * Stripe, the payment provider.
 *
 * Checkout runs through Stripe Managed Payments: Stripe (via Link) is the
 * merchant of record and handles sales tax, VAT and GST, fraud, disputes and
 * transaction support. Products and prices are set up by
 * scripts/stripe-setup.mjs and found here by lookup key, so the same code
 * works against test and live keys.
 *
 * Plans are applied by the webhook (/api/webhooks/stripe), never by the
 * success page: a redirect can be skipped or faked, a signed event cannot.
 */

export type Plan = 'pro' | 'elite' | 'lifetime'
export const PLANS: Plan[] = ['pro', 'elite', 'lifetime']
export type Interval = 'month' | 'year'

/** Lifetime is one-time and has no interval; its map has only 'month' so priceFor's lookup is uniform. */
export const PRICE_LOOKUP: Record<Plan, Record<Interval, string>> = {
  pro: { month: 'applymaster_pro_monthly', year: 'applymaster_pro_yearly' },
  elite: { month: 'applymaster_elite_monthly', year: 'applymaster_elite_yearly' },
  lifetime: { month: 'applymaster_lifetime', year: 'applymaster_lifetime' },
}
const ALL_LOOKUP_KEYS: { key: string; plan: Plan }[] = (Object.entries(PRICE_LOOKUP) as [Plan, Record<Interval, string>][]).flatMap(
  ([plan, byInterval]) => [...new Set(Object.values(byInterval))].map(key => ({ key, plan }))
)

let client: Stripe | null = null
export function stripe(): Stripe {
  if (!client) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) throw new Error('Stripe is not configured')
    client = new Stripe(key)
  }
  return client
}

export const stripeConfigured = () => !!process.env.STRIPE_SECRET_KEY
export const stripeTestMode = () => (process.env.STRIPE_SECRET_KEY || '').includes('_test_')

/**
 * Who may start a checkout. With live keys, everyone. With test keys, only
 * admins and STRIPE_TEST_EMAILS: a test card must not hand real users a paid
 * plan on the live site.
 */
export function canCheckout(email: string | null | undefined) {
  if (!stripeConfigured() || !email) return false
  if (!stripeTestMode()) return true
  const testers = [...adminEmails(), ...(process.env.STRIPE_TEST_EMAILS || '').split(',')].map(e => e.trim().toLowerCase()).filter(Boolean)
  return testers.includes(email.toLowerCase())
}

/** The $5 pack of 20 extra applications, for Pro accounts that hit the monthly pool. */
export const CREDITS_LOOKUP = 'applymaster_credits_20'
let creditsPriceCache: Stripe.Price | null = null
export async function creditsPrice(): Promise<Stripe.Price> {
  if (creditsPriceCache) return creditsPriceCache
  const { data } = await stripe().prices.list({ lookup_keys: [CREDITS_LOOKUP], active: true, limit: 1 })
  if (!data[0]) throw new Error('No Stripe price for credits. Run node scripts/stripe-setup.mjs --apply')
  creditsPriceCache = data[0]
  return data[0]
}

const priceCache = new Map<string, Stripe.Price>()
export async function priceFor(plan: Plan, interval: Interval = 'month'): Promise<Stripe.Price> {
  const lookup = PRICE_LOOKUP[plan][plan === 'lifetime' ? 'month' : interval]
  const hit = priceCache.get(lookup)
  if (hit) return hit
  const { data } = await stripe().prices.list({ lookup_keys: [lookup], active: true, limit: 1 })
  if (!data[0]) throw new Error(`No Stripe price for ${plan}/${interval}. Run node scripts/stripe-setup.mjs --apply`)
  priceCache.set(lookup, data[0])
  return data[0]
}

/** The plan a price sells, from its lookup key (or the plan stamped on it) — either billing interval. */
export function planForPrice(price: Stripe.Price | string | null | undefined): Plan | null {
  if (!price || typeof price === 'string') return null
  const byKey = ALL_LOOKUP_KEYS.find(k => k.key === price.lookup_key)?.plan ?? null
  return byKey ?? ((PLANS as string[]).includes(price.metadata?.plan ?? '') ? (price.metadata.plan as Plan) : null)
}
