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

export const PRICE_LOOKUP: Record<Plan, string> = {
  pro: 'applymaster_pro_monthly',
  elite: 'applymaster_elite_monthly',
  lifetime: 'applymaster_lifetime',
}

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

const priceCache = new Map<Plan, Stripe.Price>()
export async function priceFor(plan: Plan): Promise<Stripe.Price> {
  const hit = priceCache.get(plan)
  if (hit) return hit
  const { data } = await stripe().prices.list({ lookup_keys: [PRICE_LOOKUP[plan]], active: true, limit: 1 })
  if (!data[0]) throw new Error(`No Stripe price for ${plan}. Run node scripts/stripe-setup.mjs --apply`)
  priceCache.set(plan, data[0])
  return data[0]
}

/** The plan a price sells, from its lookup key (or the plan stamped on it). */
export function planForPrice(price: Stripe.Price | string | null | undefined): Plan | null {
  if (!price || typeof price === 'string') return null
  const byKey = (Object.entries(PRICE_LOOKUP).find(([, k]) => k === price.lookup_key)?.[0] as Plan | undefined) ?? null
  return byKey ?? ((PLANS as string[]).includes(price.metadata?.plan ?? '') ? (price.metadata.plan as Plan) : null)
}
