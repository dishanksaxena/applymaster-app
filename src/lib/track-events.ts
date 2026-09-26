/**
 * The events the tracker accepts. Shared by the browser helper and the API
 * route so a typo on either side is a type error rather than a silently
 * dropped event.
 */
export const TRACK_EVENTS = [
  // Someone arrived at an auth page — the only signal for people who leave
  // without trying anything.
  'auth_page_view',

  // A signed-in person opened the app today. Supabase's last_sign_in_at only
  // moves on an actual sign-in, and sessions last for weeks, so it cannot say
  // who came back. This can.
  'app_open',

  'login_attempt',
  'login_success',
  'login_failed',

  'signup_attempt',
  'signup_success',
  'signup_failed',
  // Supabase answers a sign-up for an address that already has an account
  // with a normal-looking success and sends no email. Without this the
  // person waits for a confirmation that will never come.
  'signup_existing_account',

  'confirm_resend',
  'confirm_resend_failed',

  'oauth_start',
  'oauth_failed',
  'oauth_callback_success',
  'oauth_callback_failed',

  'password_reset_requested',
  'password_reset_failed',
  'password_updated',
  'password_update_failed',

  'support_opened',
  'support_submitted',
  'support_failed',
] as const

export type TrackEvent = (typeof TRACK_EVENTS)[number]

export type TrackProps = {
  outcome?: 'view' | 'attempt' | 'success' | 'failure'
  method?: 'password' | 'google' | 'email_link'
  email?: string | null
  error_code?: string | null
  error_message?: string | null
  meta?: Record<string, unknown>
}

export const isTrackEvent = (e: unknown): e is TrackEvent =>
  typeof e === 'string' && (TRACK_EVENTS as readonly string[]).includes(e)

/** Outcome implied by the event name when the caller does not say. */
export function outcomeOf(event: TrackEvent): TrackProps['outcome'] {
  if (event === 'auth_page_view' || event === 'support_opened' || event === 'app_open') return 'view'
  if (/_(failed|existing_account)$/.test(event)) return 'failure'
  if (/_(success|submitted|updated|requested)$/.test(event) || event === 'confirm_resend') return 'success'
  return 'attempt'
}
