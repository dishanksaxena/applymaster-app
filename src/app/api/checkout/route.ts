import Stripe from 'stripe'

const prices: Record<string, string> = {
  pro: 'price_1234567890',
  elite: 'price_0987654321',
  lifetime: 'price_5555555555',
}

export async function POST(request: Request) {
  try {
    const { user_id, email, plan } = await request.json()

    if (!email || !plan || !prices[plan]) {
      return Response.json({ error: 'Missing email or invalid plan' }, { status: 400 })
    }

    // Initialize Stripe inside the function so env vars are available
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      httpClient: undefined,
    })

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: prices[plan],
          quantity: 1,
        },
      ],
      mode: plan === 'lifetime' ? 'payment' : 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings`,
      customer_email: email,
      metadata: { user_id, plan },
    })

    return Response.json({ url: session.url })
  } catch (error) {
    console.error('Stripe error:', error)
    return Response.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
