const products: Record<string, string> = {
  pro: process.env.LEMONSQUEEZY_PRODUCT_ID_PRO || '921495',
  elite: process.env.LEMONSQUEEZY_PRODUCT_ID_ELITE || '921497',
  lifetime: process.env.LEMONSQUEEZY_PRODUCT_ID_LIFETIME || '921498',
}

export async function POST(request: Request) {
  try {
    const { user_id, email, plan } = await request.json()

    if (!email || !plan || !products[plan]) {
      return Response.json({ error: 'Missing email or invalid plan' }, { status: 400 })
    }

    const productId = products[plan]
    const storeId = process.env.LEMONSQUEEZY_STORE_ID || '326546'
    const successUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?plan=${plan}`
    const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings`

    // Lemonsqueezy checkout URL format
    const checkoutUrl = `https://checkout.lemonsqueezy.com/buy/${storeId}/${productId}?checkout[email]=${encodeURIComponent(email)}&checkout[custom][user_id]=${encodeURIComponent(user_id)}`

    return Response.json({ url: checkoutUrl })
  } catch (error) {
    console.error('Lemonsqueezy error:', error)
    return Response.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
