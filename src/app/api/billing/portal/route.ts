import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { stripe, stripeConfigured } from '@/lib/stripe'

/**
 * Open Stripe's billing portal for the signed-in person: cancel, switch
 * between Pro and Elite, update the card, download invoices.
 */
export async function POST(request: Request) {
  const {
    data: { user },
  } = await createClient().auth.getUser()
  if (!user) return Response.json({ error: 'Sign in to manage billing' }, { status: 401 })
  if (!stripeConfigured()) return Response.json({ error: 'Billing is unavailable right now' }, { status: 503 })

  const { data: sub } = await createAdminClient().from('subscriptions').select('stripe_customer_id').eq('user_id', user.id).maybeSingle()
  if (!sub?.stripe_customer_id) {
    return Response.json({ error: 'No payments on this account yet. Your plan was not bought through checkout.' }, { status: 404 })
  }

  try {
    const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin
    const session = await stripe().billingPortal.sessions.create({ customer: sub.stripe_customer_id, return_url: `${origin}/settings` })
    return Response.json({ url: session.url })
  } catch (err) {
    console.error('billing portal error:', err)
    return Response.json({ error: 'Billing is unavailable right now' }, { status: 503 })
  }
}
