import nodemailer, { type Transporter } from 'nodemailer'

/**
 * Outbound mail through the support@applymaster.ai mailbox (Spacemail).
 *
 * Configured entirely from the environment. When SMTP_PASSWORD is absent the
 * mailer reports itself as unavailable and callers carry on — a support
 * message is always stored in the database first, so a missing or failing
 * mail server can delay a notification but never lose a message.
 */

const HOST = process.env.SMTP_HOST || 'mail.spacemail.com'
const PORT = Number(process.env.SMTP_PORT || 465)
const USER = process.env.SMTP_USER || 'support@applymaster.ai'
const PASS = process.env.SMTP_PASSWORD

/** Where new support messages and alerts are delivered. */
export const SUPPORT_INBOX = process.env.SUPPORT_INBOX || 'support@applymaster.ai'

let transporter: Transporter | null = null

export const mailConfigured = () => Boolean(PASS)

function getTransport(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: HOST,
      port: PORT,
      secure: PORT === 465,
      auth: { user: USER, pass: PASS },
      // Serverless functions are short-lived; do not wait long on a slow server.
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    })
  }
  return transporter
}

export async function sendMail(opts: {
  to: string
  subject: string
  text: string
  html?: string
  replyTo?: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!PASS) return { ok: false, error: 'SMTP_PASSWORD not configured' }
  try {
    await getTransport().sendMail({
      from: `ApplyMaster Support <${USER}>`,
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      html: opts.html,
      replyTo: opts.replyTo,
    })
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'send failed' }
  }
}

export const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
