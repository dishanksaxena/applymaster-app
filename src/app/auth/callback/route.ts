import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { recordEvent } from '@/lib/track-server'

/**
 * Landing point for Google sign-in and for email confirmation links.
 *
 * This used to throw every failure away: whatever went wrong, it redirected
 * to /login?error=auth_failed — and the login page never read that
 * parameter. Someone whose Google sign-in failed landed back on a blank form
 * with no message, and nothing anywhere recorded that it had happened. It
 * also ignored the error Google itself sends back.
 *
 * Now each failure is recorded with its actual reason and passed to the login
 * page as a code it knows how to explain.
 */

/** Only same-site paths; "//evil.com" is a protocol-relative URL, not a path. */
function safeNext(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) return '/dashboard'
  return raw
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const anonId = cookies().get('am_anon')?.value ?? null
  const next = safeNext(url.searchParams.get('next'))

  const fail = async (reason: string, message: string | null, meta: Record<string, unknown> = {}) => {
    await recordEvent(
      'oauth_callback_failed',
      { method: 'google', error_code: reason, error_message: message, path: '/auth/callback', anon_id: anonId, meta },
      request.headers
    )
    const to = new URL('/login', request.url)
    to.searchParams.set('error', reason)
    if (message) to.searchParams.set('error_description', message.slice(0, 200))
    return NextResponse.redirect(to)
  }

  // The provider refused before we ever got a code — the user cancelled the
  // Google consent screen, or the OAuth app is misconfigured.
  const providerError = url.searchParams.get('error')
  if (providerError) {
    return fail(
      providerError === 'access_denied' ? 'oauth_cancelled' : 'oauth_provider_error',
      url.searchParams.get('error_description'),
      { provider_error: providerError, error_code: url.searchParams.get('error_code') }
    )
  }

  if (!code) return fail('missing_code', 'The sign-in link was incomplete')

  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    }
  )

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    /* By far the most common cause: the link was opened in a different
       browser from the one that started the flow — a confirmation email
       opened on a phone after signing up on a laptop. The exchange needs a
       verifier stored in the original browser, so it fails. But by the time
       we are here Supabase has already confirmed the email address, so the
       honest thing to tell the person is "you're confirmed — sign in". */
    const verifier = /code verifier|flow state|both auth code/i.test(error.message)
    return fail(verifier ? 'link_other_browser' : 'exchange_failed', error.message, {
      status: (error as { status?: number }).status ?? null,
    })
  }

  const user = data.user
  const isNew = user?.created_at ? Date.now() - new Date(user.created_at).getTime() < 5 * 60_000 : false
  await recordEvent(
    'oauth_callback_success',
    {
      method: (user?.app_metadata?.provider as 'google' | undefined) === 'google' ? 'google' : 'email_link',
      email: user?.email ?? null,
      user_id: user?.id ?? null,
      path: '/auth/callback',
      anon_id: anonId,
      meta: { new_user: isNew },
    },
    request.headers
  )

  return NextResponse.redirect(new URL(next, request.url))
}
