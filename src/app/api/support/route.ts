import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createAdminClient, isMissingTable } from '@/lib/supabase-admin'
import { recordEvent } from '@/lib/track-server'
import { sendMail, SUPPORT_INBOX, escapeHtml, mailConfigured } from '@/lib/mailer'

/**
 * The in-app support form.
 *
 * Until now there was no way to reach anyone from inside ApplyMaster. The
 * support@applymaster.ai mailbox exists, but nothing in the product linked
 * to it and it has never received a message.
 *
 * Order matters: the message is written to the database before any email is
 * attempted, so a mail outage delays a notification but cannot lose the
 * message. Then it is forwarded to the support inbox with Reply-To set to
 * the sender, so answering is just replying.
 */

export const maxDuration = 30

const CATEGORIES = ['sign_in', 'sign_up', 'billing', 'bug', 'feature', 'other'] as const
const CATEGORY_LABEL: Record<string, string> = {
  sign_in: 'Can’t sign in',
  sign_up: 'Can’t sign up',
  billing: 'Billing',
  bug: 'Something is broken',
  feature: 'Feature request',
  other: 'Other',
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid request' }, { status: 400 })
  }

  const str = (v: unknown, n: number) => (typeof v === 'string' ? v.trim().slice(0, n) : '')
  const name = str(body.name, 120)
  const email = str(body.email, 254).toLowerCase()
  const message = str(body.message, 5000)
  const category = CATEGORIES.includes(body.category as (typeof CATEGORIES)[number])
    ? (body.category as string)
    : 'other'

  // Honeypot: a hidden field people never see and bots fill in.
  if (str(body.website, 200)) return Response.json({ ok: true })

  if (!EMAIL_RE.test(email)) {
    return Response.json({ error: 'Enter an email address we can reply to.' }, { status: 400 })
  }
  if (message.length < 5) {
    return Response.json({ error: 'Tell us a little about what happened.' }, { status: 400 })
  }

  let userId: string | null = null
  try {
    const {
      data: { user },
    } = await createClient().auth.getUser()
    userId = user?.id ?? null
  } catch {}

  const context = {
    page: str(body.page, 300) || null,
    last_error: str(body.last_error, 300) || null,
    anon_id: str(body.anon_id, 64) || null,
    user_agent: req.headers.get('user-agent')?.slice(0, 300) ?? null,
    country: req.headers.get('x-vercel-ip-country') ?? null,
  }

  const admin = createAdminClient()

  // Rate limit by address: five messages an hour is plenty for a person.
  const since = new Date(Date.now() - 3600_000).toISOString()
  const recent = await admin
    .from('support_messages')
    .select('id', { count: 'exact', head: true })
    .eq('email', email)
    .gte('created_at', since)
  if (!recent.error && (recent.count ?? 0) >= 5) {
    return Response.json(
      { error: 'We have your earlier messages and will reply soon — no need to send more.' },
      { status: 429 }
    )
  }

  const { data: saved, error } = await admin
    .from('support_messages')
    .insert({ user_id: userId, name: name || null, email, category, message, context })
    .select('id')
    .single()

  // Table not created yet: still get the message to a human by email.
  const stored = !error
  if (error && !isMissingTable(error)) {
    console.error('support insert failed:', error.message)
  }

  let emailed = false
  if (mailConfigured()) {
    const ref = saved?.id ? saved.id.slice(0, 8) : 'unsaved'
    const subject = `[${CATEGORY_LABEL[category]}] ${name || email} — #${ref}`
    const lines = [
      `From: ${name ? `${name} <${email}>` : email}`,
      `Category: ${CATEGORY_LABEL[category]}`,
      `Signed in: ${userId ? 'yes' : 'no'}`,
      context.page ? `Page: ${context.page}` : null,
      context.last_error ? `Last error they saw: ${context.last_error}` : null,
      context.country ? `Country: ${context.country}` : null,
      '',
      message,
    ].filter(l => l !== null) as string[]

    const res = await sendMail({
      to: SUPPORT_INBOX,
      replyTo: email,
      subject,
      text: lines.join('\n'),
      html: `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.5;color:#16181d">
        ${lines
          .slice(0, -2)
          .map(l => `<div style="color:#5c6472">${escapeHtml(l)}</div>`)
          .join('')}
        <div style="margin-top:14px;white-space:pre-wrap">${escapeHtml(message)}</div>
        <div style="margin-top:18px;color:#8a8f98;font-size:12px">Reply to this email to answer ${escapeHtml(email)} directly.</div>
      </div>`,
    })
    emailed = res.ok
    if (!res.ok) console.error('support email failed:', res.error)

    if (emailed && saved?.id) {
      await admin.from('support_messages').update({ emailed: true }).eq('id', saved.id)
    }
  }

  if (!stored && !emailed) {
    await recordEvent('support_failed', { email, error_message: error?.message ?? 'no sink available' }, req.headers)
    return Response.json(
      // The form turns this into a pre-filled email, so nothing typed is lost.
      { error: 'We could not send that from here — open it in your email app instead.', fallback: 'mailto' },
      { status: 503 }
    )
  }

  await recordEvent(
    'support_submitted',
    { email, user_id: userId, meta: { category, emailed, stored } },
    req.headers
  )
  return Response.json({ ok: true, id: saved?.id ?? null })
}
