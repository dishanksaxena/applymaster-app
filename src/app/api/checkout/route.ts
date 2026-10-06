import type Stripe from 'stripe'
import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { canCheckout, PLANS, priceFor, stripe, stripeTestMode, type Plan } from '@/lib/stripe'
import { recordEvent } from '@/lib/track-server'

/**
 * Start an upgrade for the signed-in person: a Stripe Checkout session with
 * Managed Payments.
 *
 * The buyer comes from the session, never the request body: that user id
 * travels on the checkout (client_reference_id and metadata) and is what the
 * webhook uses to decide whose plan to change.
 *
 * When checkout is not open to this person (no keys, or test keys and they
 * are not a tester) the click is recorded as interest and they are told
 * plainly, rather than sent somewhere that cannot take their money.
 */
export async function POST(request: Request) {
  const {
    data: { user },
  } = await createClient().auth.getUser()
  if (!user?.email) return Response.json({ error: 'Sign in to upgrade' }, { status: 401 })

  let plan: Plan
  try {
    const body = await request.json()
    if (!PLANS.includes(body.plan)) return Response.json({ error: 'Unknown plan' }, { status: 400 })
    plan = body.plan
  } catch {
    return Response.json({ error: 'Invalid request' }, { status: 400 })
  }

  if (!canCheckout(user.email)) {
    await recordEvent('upgrade_interest', { email: user.email, user_id: user.id, meta: { plan } }, request.headers)
    return Response.json({ waitlist: true, plan })
  }

  try {
    const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin
    const price = await priceFor(plan)
    // Someone who has paid before keeps their Stripe customer, so the portal shows everything.
    const { data: sub } = await createAdminClient()
      .from('subscriptions')
      .select('stripe_customer_id, stripe_subscription_id, status')
      .eq('user_id', user.id)
      .maybeSingle()
    const meta = { user_id: user.id, plan }

    // Already paying monthly and switching between Pro and Elite: change the
    // running subscription (Stripe shows the prorated amount to confirm)
    // rather than starting a second one.
    if (plan !== 'lifetime' && sub?.stripe_customer_id && sub.stripe_subscription_id && sub.status !== 'canceled') {
      const running = await stripe().subscriptions.retrieve(sub.stripe_subscription_id)
      if (!['canceled', 'incomplete_expired'].includes(running.status)) {
        const portal = await stripe().billingPortal.sessions.create({
          customer: sub.stripe_customer_id,
          return_url: `${origin}/settings?upgraded=${plan}`,
          flow_data: {
            type: 'subscription_update_confirm',
            subscription_update_confirm: { subscription: running.id, items: [{ id: running.items.data[0].id, price: price.id, quantity: 1 }] },
            after_completion: { type: 'redirect', redirect: { return_url: `${origin}/settings?upgraded=${plan}` } },
          },
        })
        return Response.json({ url: portal.url })
      }
    }

    const params: Stripe.Checkout.SessionCreateParams & { managed_payments: { enabled: boolean } } = {
      mode: plan === 'lifetime' ? 'payment' : 'subscription',
      line_items: [{ price: price.id, quantity: 1 }],
      managed_payments: { enabled: true },
      client_reference_id: user.id,
      metadata: meta,
      ...(sub?.stripe_customer_id ? { customer: sub.stripe_customer_id } : { customer_email: user.email }),
      // A customer even for one-time purchases, so receipts and the billing portal work afterwards.
      ...(plan === 'lifetime'
        ? { payment_intent_data: { metadata: meta }, ...(sub?.stripe_customer_id ? {} : { customer_creation: 'always' as const }) }
        : { subscription_data: { metadata: meta } }),
      allow_promotion_codes: true,
      success_url: `${origin}/settings?upgraded=${plan}`,
      cancel_url: `${origin}/settings?checkout=cancelled`,
    }
    const session = await stripe().checkout.sessions.create(params)
    await recordEvent('upgrade_interest', { email: user.email, user_id: user.id, meta: { plan, checkout: session.id, test: stripeTestMode() } }, request.headers)
    return Response.json({ url: session.url })
  } catch (err) {
    console.error('checkout error:', err)
    await recordEvent(
      'upgrade_interest',
      { email: user.email, user_id: user.id, error_message: err instanceof Error ? err.message : 'checkout failed', meta: { plan } },
      request.headers
    )
    return Response.json({ error: 'Checkout is unavailable right now — we have noted your interest.' }, { status: 503 })
  }
}
