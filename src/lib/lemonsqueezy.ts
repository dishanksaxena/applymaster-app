import 'server-only'

/**
 * LemonSqueezy, the payment provider.
 *
 * State of play when this was written: the store had never been activated
 * ("This store has not been activated"), so every checkout link 404'd, and
 * nothing listened for payment events, so even a successful payment could
 * not have upgraded anyone. Payments are therefore behind PAYMENTS_ENABLED;
 * until it is "true", an upgrade click is recorded as interest instead of
 * sending the person to a dead page.
 */

export type Plan = 'pro' | 'elite' | 'lifetime'

export const PLAN_PRODUCTS: Record<Plan, string> = {
  pro: process.env.LEMONSQUEEZY_PRODUCT_ID_PRO || '921495',
  elite: process.env.LEMONSQUEEZY_PRODUCT_ID_ELITE || '921497',
  lifetime: process.env.LEMONSQUEEZY_PRODUCT_ID_LIFETIME || '921498',
}

export const paymentsEnabled = () => process.env.PAYMENTS_ENABLED === 'true'

export function planForProduct(productId: string | number | null | undefined): Plan | null {
  const id = String(productId ?? '')
  return (Object.entries(PLAN_PRODUCTS).find(([, p]) => p === id)?.[0] as Plan) ?? null
}

const API = 'https://api.lemonsqueezy.com/v1'
const headers = () => ({
  Authorization: `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`,
  Accept: 'application/vnd.api+json',
  'Content-Type': 'application/vnd.api+json',
})

const variantCache = new Map<string, string>()

/** First published variant of a product. Checkouts are created per variant. */
async function variantFor(productId: string): Promise<string> {
  const explicit = Object.entries(PLAN_PRODUCTS).find(([, p]) => p === productId)?.[0]
  const envVariant = explicit ? process.env[`LEMONSQUEEZY_VARIANT_ID_${explicit.toUpperCase()}`] : undefined
  if (envVariant) return envVariant
  if (variantCache.has(productId)) return variantCache.get(productId)!

  const res = await fetch(`${API}/variants?filter[product_id]=${productId}`, { headers: headers() })
  if (!res.ok) throw new Error(`LemonSqueezy variants ${res.status}`)
  const json = (await res.json()) as { data?: { id: string; attributes: { status: string } }[] }
  const v = json.data?.find(x => x.attributes.status !== 'draft') ?? json.data?.[0]
  if (!v) throw new Error(`No variant for product ${productId}`)
  variantCache.set(productId, v.id)
  return v.id
}

/**
 * A checkout created through the API rather than a hand-built link: the
 * hand-built format this app used does not exist and answered 404. The
 * signed-in user's id travels as custom data, which is how the webhook knows
 * whose plan to change.
 */
export async function createCheckout(opts: { plan: Plan; userId: string; email: string; redirectUrl: string }): Promise<string> {
  const storeId = process.env.LEMONSQUEEZY_STORE_ID
  if (!process.env.LEMONSQUEEZY_API_KEY || !storeId) throw new Error('Payments are not configured')

  const variantId = await variantFor(PLAN_PRODUCTS[opts.plan])
  const res = await fetch(`${API}/checkouts`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      data: {
        type: 'checkouts',
        attributes: {
          checkout_data: { email: opts.email, custom: { user_id: opts.userId, plan: opts.plan } },
          product_options: { redirect_url: opts.redirectUrl },
        },
        relationships: {
          store: { data: { type: 'stores', id: String(storeId) } },
          variant: { data: { type: 'variants', id: String(variantId) } },
        },
      },
    }),
  })
  if (!res.ok) throw new Error(`LemonSqueezy checkout ${res.status}: ${(await res.text()).slice(0, 200)}`)
  const json = (await res.json()) as { data?: { attributes?: { url?: string } } }
  const url = json.data?.attributes?.url
  if (!url) throw new Error('LemonSqueezy returned no checkout URL')
  return url
}
