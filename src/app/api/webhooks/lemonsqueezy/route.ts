import { createHmac, timingSafeEqual } from 'node:crypto'
import { createAdminClient } from '@/lib/supabase-admin'
import { planForProduct, type Plan } from '@/lib/lemonsqueezy'
import { recordEvent } from '@/lib/track-server'

/**
 * LemonSqueezy payment events -> profiles.plan.
 *
 * Nothing listened for these before, so no payment could ever have upgraded
 * anyone. Every event is verified against LEMONSQUEEZY_WEBHOOK_SECRET before
 * it is read, and each one sets an absolute state rather than toggling, so a
 * redelivered or out-of-order event cannot leave a plan wrong.
 *
 * Whose plan: the user id the checkout carried as custom data (set from the
 * session, see /api/checkout), falling back to the buyer's email.
 */

type Payload = {
  meta?: { event_name?: string; custom_data?: { user_id?: string; plan?: string } }
  data?: {
    id?: string
    attributes?: {
      status?: string
      user_email?: string
      product_id?: number
      first_order_item?: { product_id?: number }
      ends_at?: string | null
    }
  }
}

const ACTIVE = new Set(['active', 'on_trial', 'past_due', 'cancelled']) // cancelled stays active until it expires
const ENDED = new Set(['expired', 'unpaid'])

export async function POST(req: Request) {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET
  if (!secret) return Response.json({ error: 'Webhook not configured' }, { status: 503 })

  const raw = await req.text()
  const got = Buffer.from(req.headers.get('x-signature') || '', 'utf8')
  const want = Buffer.from(createHmac('sha256', secret).update(raw).digest('hex'), 'utf8')
  if (got.length !== want.length || !timingSafeEqual(got, want)) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let body: Payload
  try {
    body = JSON.parse(raw)
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const event = body.meta?.event_name || ''
  const attrs = body.data?.attributes || {}
  const custom = body.meta?.custom_data || {}
  const productPlan = planForProduct(attrs.product_id ?? attrs.first_order_item?.product_id)
  const plan = (productPlan ?? (custom.plan as Plan | undefined)) || null

  const db = createAdminClient()

  // Who: the id the checkout carried, else the buyer's email.
  let userId = custom.user_id || null
  if (!userId && attrs.user_email) {
    const { data } = await db.from('profiles').select('id').ilike('email', attrs.user_email).maybeSingle()
    userId = data?.id ?? null
  }
  if (!userId) {
    await recordEvent('payment_webhook_failed', {
      email: attrs.user_email ?? null,
      error_message: `No account for ${event}`,
      meta: { event, plan },
    })
    // 200 so LemonSqueezy does not retry forever; the admin log has it.
    return Response.json({ ok: true, matched: false })
  }

  const { data: current } = await db.from('profiles').select('plan').eq('id', userId).maybeSingle()
  let next: string | null = null

  if (event === 'order_created' && attrs.status === 'paid' && plan === 'lifetime') next = 'lifetime'
  else if (event === 'order_refunded' && plan === 'lifetime') next = 'free'
  else if (event.startsWith('subscription_') && plan && plan !== 'lifetime') {
    const status = attrs.status || ''
    if (ACTIVE.has(status)) next = plan
    else if (ENDED.has(status) || event === 'subscription_expired') next = 'free'
  }

  // A subscription event never takes away a lifetime plan.
  if (current?.plan === 'lifetime' && next !== null && event !== 'order_refunded') next = 'lifetime'

  if (next && next !== current?.plan) {
    const { error } = await db.from('profiles').update({ plan: next }).eq('id', userId)
    if (error) {
      await recordEvent('payment_webhook_failed', { user_id: userId, error_message: error.message, meta: { event, plan: next } })
      return Response.json({ error: 'Could not update plan' }, { status: 500 }) // let LemonSqueezy retry
    }
    await recordEvent('plan_changed', {
      user_id: userId,
      email: attrs.user_email ?? null,
      meta: { event, from: current?.plan ?? null, to: next, status: attrs.status ?? null },
    })
  }

  return Response.json({ ok: true, plan: next ?? current?.plan ?? null })
}
