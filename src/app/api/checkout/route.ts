import { createClient } from '@/lib/supabase-server'
import { createCheckout, paymentsEnabled, PLAN_PRODUCTS, type Plan } from '@/lib/lemonsqueezy'
import { recordEvent } from '@/lib/track-server'

/**
 * Start an upgrade for the signed-in person.
 *
 * The buyer comes from the session, never the request body: that user id is
 * what the payment webhook uses to decide whose plan to change.
 *
 * While payments are not live (PAYMENTS_ENABLED unset — the LemonSqueezy
 * store has not been activated) the click is recorded as interest and the
 * person is told plainly, rather than sent to a checkout page that 404s. A
 * list of people who tried to pay is the most useful thing to have on the
 * day payments open.
 */
export async function POST(request: Request) {
  const {
    data: { user },
  } = await createClient().auth.getUser()
  if (!user?.email) return Response.json({ error: 'Sign in to upgrade' }, { status: 401 })

  let plan: Plan
  try {
    const body = await request.json()
    if (!(body.plan in PLAN_PRODUCTS)) return Response.json({ error: 'Unknown plan' }, { status: 400 })
    plan = body.plan
  } catch {
    return Response.json({ error: 'Invalid request' }, { status: 400 })
  }

  if (!paymentsEnabled()) {
    await recordEvent(
      'upgrade_interest',
      { email: user.email, user_id: user.id, meta: { plan } },
      request.headers
    )
    return Response.json({ waitlist: true, plan })
  }

  try {
    const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin
    const url = await createCheckout({
      plan,
      userId: user.id,
      email: user.email,
      redirectUrl: `${origin}/settings?upgraded=${plan}`,
    })
    return Response.json({ url })
  } catch (err) {
    console.error('checkout error:', err)
    // Still worth knowing someone tried.
    await recordEvent(
      'upgrade_interest',
      { email: user.email, user_id: user.id, error_message: err instanceof Error ? err.message : 'checkout failed', meta: { plan } },
      request.headers
    )
    return Response.json({ error: 'Checkout is unavailable right now — we have noted your interest.' }, { status: 503 })
  }
}
