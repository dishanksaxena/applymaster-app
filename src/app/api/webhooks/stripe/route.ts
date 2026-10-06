import type Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase-admin'
import { planForPrice, stripe, stripeConfigured, type Plan } from '@/lib/stripe'
import { recordEvent } from '@/lib/track-server'

/**
 * Stripe payment events -> profiles.plan and the subscriptions row.
 *
 * Every event is verified against STRIPE_WEBHOOK_SECRET before it is read.
 * Each handler re-reads the object from Stripe and sets an absolute state,
 * so a redelivered or out-of-order event cannot leave a plan wrong.
 *
 * Whose plan: the user id the checkout carried (client_reference_id and
 * metadata, set from the session in /api/checkout), falling back to the
 * customer on the subscriptions row.
 */

type Db = ReturnType<typeof createAdminClient>
type SubStatus = 'active' | 'trialing' | 'past_due' | 'canceled'

const iso = (s?: number | null) => (s ? new Date(s * 1000).toISOString() : null)
const idOf = (x: string | { id: string } | null | undefined) => (typeof x === 'string' ? x : x?.id ?? null)

/** Stripe's subscription status as the plan it should give, and the status the table accepts. */
function mapStatus(status: Stripe.Subscription.Status): { keeps: boolean; row: SubStatus } | null {
  switch (status) {
    case 'active':
      return { keeps: true, row: 'active' }
    case 'trialing':
      return { keeps: true, row: 'trialing' }
    case 'past_due':
      return { keeps: true, row: 'past_due' } // Stripe is still retrying the card
    case 'canceled':
    case 'unpaid':
    case 'incomplete_expired':
    case 'paused':
      return { keeps: false, row: 'canceled' }
    default:
      return null // incomplete: the first payment has not gone through yet
  }
}

async function userForCustomer(db: Db, customer: string | null) {
  if (!customer) return null
  const { data } = await db.from('subscriptions').select('user_id').eq('stripe_customer_id', customer).maybeSingle()
  return (data?.user_id as string | undefined) ?? null
}

async function setPlan(db: Db, userId: string, next: string, why: Record<string, unknown>) {
  const { data: current } = await db.from('profiles').select('plan, email').eq('id', userId).maybeSingle()
  if (!current) throw new Error(`No profile for ${userId}`)
  // Only a refund of the lifetime purchase itself takes a lifetime plan away.
  if (current.plan === 'lifetime' && next !== 'lifetime' && why.event !== 'charge.refunded') return current.plan
  if (current.plan === next) return next
  const { error } = await db.from('profiles').update({ plan: next }).eq('id', userId)
  if (error) throw new Error(error.message)
  await recordEvent('plan_changed', { user_id: userId, email: current.email ?? null, meta: { ...why, from: current.plan ?? null, to: next } })
  return next
}

async function saveRow(db: Db, row: Record<string, unknown> & { user_id: string }) {
  const { error } = await db.from('subscriptions').upsert(row, { onConflict: 'user_id' })
  if (error) throw new Error(error.message)
}

/** A subscription's current state, applied to whoever it belongs to. */
async function applySubscription(db: Db, sub: Stripe.Subscription, event: string, userHint?: string | null) {
  const customer = idOf(sub.customer)
  const userId = userHint || sub.metadata?.user_id || (await userForCustomer(db, customer))
  if (!userId) return { matched: false }

  const item = sub.items.data[0]
  const plan = planForPrice(item?.price) ?? ((sub.metadata?.plan as Plan | undefined) || null)
  const mapped = mapStatus(sub.status)
  if (!plan || plan === 'lifetime' || !mapped) return { matched: true, skipped: sub.status }

  // An older subscription ending must not undo a newer one.
  const { data: row } = await db.from('subscriptions').select('stripe_subscription_id, status').eq('user_id', userId).maybeSingle()
  const onRecord = row?.stripe_subscription_id
  if (onRecord && onRecord !== sub.id && !mapped.keeps) return { matched: true, skipped: 'superseded' }

  // Bought a different plan while the old subscription is still running: stop charging for the old one.
  if (onRecord && onRecord !== sub.id && mapped.keeps && row?.status !== 'canceled') {
    try {
      await stripe().subscriptions.cancel(onRecord)
    } catch (e) {
      console.warn('[stripe] could not cancel superseded subscription', onRecord, e)
    }
  }

  await saveRow(db, {
    user_id: userId,
    stripe_customer_id: customer,
    stripe_subscription_id: sub.id,
    plan: mapped.keeps ? plan : 'free',
    status: mapped.row,
    current_period_start: iso(item?.current_period_start),
    current_period_end: iso(item?.current_period_end),
  })
  const next = await setPlan(db, userId, mapped.keeps ? plan : 'free', { event, subscription: sub.id, status: sub.status })
  return { matched: true, plan: next }
}

async function applyCheckout(db: Db, session: Stripe.Checkout.Session, event: string) {
  const userId = session.client_reference_id || session.metadata?.user_id || null
  if (!userId) return { matched: false }
  if (session.payment_status === 'unpaid') return { matched: true, skipped: 'unpaid' } // async payment still pending

  if (session.mode === 'subscription') {
    const subId = idOf(session.subscription)
    if (!subId) return { matched: true, skipped: 'no subscription' }
    return applySubscription(db, await stripe().subscriptions.retrieve(subId), event, userId)
  }

  // One-time: the plan comes from what was actually bought, not from the metadata.
  const items = await stripe().checkout.sessions.listLineItems(session.id, { limit: 5 })
  const plan = items.data.map(i => planForPrice(i.price)).find(Boolean)
  if (plan !== 'lifetime') return { matched: true, skipped: `one-time ${plan ?? 'unknown'}` }

  const customer = idOf(session.customer)
  const { data: row } = await db.from('subscriptions').select('stripe_subscription_id, status').eq('user_id', userId).maybeSingle()
  // Lifetime replaces any monthly plan, so stop billing for it.
  if (row?.stripe_subscription_id && row.status !== 'canceled') {
    try {
      await stripe().subscriptions.cancel(row.stripe_subscription_id)
    } catch (e) {
      console.warn('[stripe] could not cancel subscription after lifetime purchase', e)
    }
  }
  await saveRow(db, {
    user_id: userId,
    stripe_customer_id: customer,
    stripe_subscription_id: null,
    plan: 'lifetime',
    status: 'active',
    current_period_start: iso(session.created),
    current_period_end: null,
  })
  return { matched: true, plan: await setPlan(db, userId, 'lifetime', { event, checkout: session.id }) }
}

/** A fully refunded lifetime purchase ends the lifetime plan. Monthly refunds leave the plan to the subscription. */
async function applyRefund(db: Db, charge: Stripe.Charge, event: string) {
  if (!charge.refunded) return { matched: true, skipped: 'partial refund' }
  const piId = idOf(charge.payment_intent)
  if (!piId) return { matched: true, skipped: 'no payment intent' }
  const pi = await stripe().paymentIntents.retrieve(piId)
  if (pi.metadata?.plan !== 'lifetime') return { matched: true, skipped: 'not lifetime' }
  const userId = pi.metadata.user_id || (await userForCustomer(db, idOf(charge.customer)))
  if (!userId) return { matched: false }

  const { data: profile } = await db.from('profiles').select('plan').eq('id', userId).maybeSingle()
  if (profile?.plan !== 'lifetime') return { matched: true, skipped: `plan is ${profile?.plan}` }
  await saveRow(db, { user_id: userId, plan: 'free', status: 'canceled', current_period_end: iso(charge.created) })
  return { matched: true, plan: await setPlan(db, userId, 'free', { event, charge: charge.id }) }
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret || !stripeConfigured()) return Response.json({ error: 'Webhook not configured' }, { status: 503 })

  const raw = await req.text()
  let event: Stripe.Event
  try {
    event = stripe().webhooks.constructEvent(raw, req.headers.get('stripe-signature') || '', secret)
  } catch {
    return Response.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const db = createAdminClient()
  try {
    let result: { matched: boolean; [k: string]: unknown } = { matched: true, skipped: 'ignored event' }
    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded':
        result = await applyCheckout(db, event.data.object, event.type)
        break
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        // Re-read it: events can arrive out of order, the subscription itself is current.
        result = await applySubscription(db, await stripe().subscriptions.retrieve(event.data.object.id), event.type)
        break
      case 'charge.refunded':
        result = await applyRefund(db, event.data.object, event.type)
        break
      case 'invoice.payment_failed': {
        const inv = event.data.object
        const sub = idOf(inv.parent?.subscription_details?.subscription)
        await recordEvent('payment_webhook_failed', {
          email: inv.customer_email ?? null,
          user_id: await userForCustomer(db, idOf(inv.customer)),
          error_message: `Card declined for invoice ${inv.id} (Stripe will retry)`,
          meta: { event: event.type, subscription: sub, attempt: inv.attempt_count },
        })
        break
      }
    }
    if (!result.matched) {
      await recordEvent('payment_webhook_failed', { error_message: `No account for ${event.type}`, meta: { event: event.type, id: event.id } })
    }
    // 200 even when unmatched, so Stripe does not retry forever; the admin log has it.
    return Response.json({ ok: true, ...result })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'webhook failed'
    console.error('[stripe webhook]', event.type, message)
    await recordEvent('payment_webhook_failed', { error_message: message, meta: { event: event.type, id: event.id } })
    return Response.json({ error: 'Could not apply event' }, { status: 500 }) // let Stripe retry
  }
}
