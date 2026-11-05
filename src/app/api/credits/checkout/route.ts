import type Stripe from 'stripe'
import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { canCheckout, creditsPrice, stripe } from '@/lib/stripe'
import { CREDIT_PACK } from '@/lib/plan-limits'
import { recordEvent } from '@/lib/track-server'

/**
 * Buy a pack of extra applications: $5 for 20, Pro only.
 *
 * Free is pointed at the Pro upgrade instead (credits would undercut it),
 * and Elite/Lifetime have nothing to top up. The balance is added by the
 * webhook when Stripe confirms payment, never by this route or the
 * success redirect.
 */
export async function POST(request: Request) {
  const {
    data: { user },
  } = await createClient().auth.getUser()
  if (!user?.email) return Response.json({ error: 'Sign in to buy credits' }, { status: 401 })

  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('plan').eq('id', user.id).maybeSingle()
  if (profile?.plan !== 'pro') {
    return Response.json(
      {
        error:
          profile?.plan === 'free'
            ? 'Application credits are part of Pro. Upgrade first — Pro includes 150 applications a month.'
            : 'Your plan already has unlimited applications; there is nothing to top up.',
      },
      { status: 403 }
    )
  }
  if (!canCheckout(user.email)) {
    return Response.json({ error: 'Checkout is not open for this account yet.' }, { status: 403 })
  }

  try {
    const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin
    const price = await creditsPrice()
    const { data: sub } = await admin.from('subscriptions').select('stripe_customer_id').eq('user_id', user.id).maybeSingle()
    const meta = { user_id: user.id, kind: 'credits', credits: String(CREDIT_PACK.credits) }

    const params: Stripe.Checkout.SessionCreateParams & { managed_payments: { enabled: boolean } } = {
      mode: 'payment',
      line_items: [{ price: price.id, quantity: 1 }],
      managed_payments: { enabled: true },
      client_reference_id: user.id,
      metadata: meta,
      payment_intent_data: { metadata: meta },
      ...(sub?.stripe_customer_id ? { customer: sub.stripe_customer_id } : { customer_email: user.email }),
      success_url: `${origin}/settings?credits=purchased`,
      cancel_url: `${origin}/settings?checkout=cancelled`,
    }
    const session = await stripe().checkout.sessions.create(params)
    await recordEvent('upgrade_interest', { email: user.email, user_id: user.id, meta: { plan: 'credits', checkout: session.id } }, request.headers)
    return Response.json({ url: session.url })
  } catch (err) {
    console.error('credits checkout error:', err)
    return Response.json({ error: 'Checkout is unavailable right now' }, { status: 500 })
  }
}
