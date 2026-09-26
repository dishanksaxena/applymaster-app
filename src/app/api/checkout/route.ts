import { createClient } from '@/lib/supabase-server'

/**
 * Start a LemonSqueezy checkout for the signed-in person.
 *
 * The buyer's identity comes from the session. It used to come from the
 * request body — user_id and email were whatever the browser sent — and
 * that user_id is what the payment webhook uses to decide whose plan to
 * upgrade, so it has to be one the server vouches for.
 */

const products: Record<string, string> = {
  pro: process.env.LEMONSQUEEZY_PRODUCT_ID_PRO || '921495',
  elite: process.env.LEMONSQUEEZY_PRODUCT_ID_ELITE || '921497',
  lifetime: process.env.LEMONSQUEEZY_PRODUCT_ID_LIFETIME || '921498',
}

export async function POST(request: Request) {
  const {
    data: { user },
  } = await createClient().auth.getUser()
  if (!user?.email) return Response.json({ error: 'Sign in to upgrade' }, { status: 401 })

  try {
    const { plan } = await request.json()
    if (!plan || !products[plan]) return Response.json({ error: 'Unknown plan' }, { status: 400 })

    const storeId = process.env.LEMONSQUEEZY_STORE_ID || '326546'
    const params = new URLSearchParams({
      'checkout[email]': user.email,
      'checkout[custom][user_id]': user.id,
      'checkout[custom][plan]': plan,
    })
    return Response.json({ url: `https://checkout.lemonsqueezy.com/buy/${storeId}/${products[plan]}?${params}` })
  } catch (error) {
    console.error('checkout error:', error)
    return Response.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
