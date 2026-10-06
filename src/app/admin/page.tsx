import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import { getAdmin, loadAdminData } from '@/lib/admin-data'
import { AutoRefresh, SupportStatus, ResendConfirmation } from './AdminActions'
import { AdminShell, Card, SectionHead, Kpi, Pill, Empty, ago, when } from './ui'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Admin — ApplyMaster', robots: { index: false, follow: false } }

const EVENT_LABEL: Record<string, string> = {
  auth_page_view: 'Opened',
  login_attempt: 'Login attempt',
  login_success: 'Logged in',
  login_failed: 'Login failed',
  signup_attempt: 'Sign-up attempt',
  signup_success: 'Signed up',
  signup_failed: 'Sign-up failed',
  signup_existing_account: 'Already had an account',
  confirm_resend: 'Resent confirmation',
  confirm_resend_failed: 'Resend failed',
  oauth_start: 'Started Google sign-in',
  oauth_failed: 'Google sign-in failed',
  oauth_callback_success: 'Google / link sign-in ok',
  oauth_callback_failed: 'Google / link sign-in failed',
  password_reset_requested: 'Requested reset',
  password_reset_failed: 'Reset request failed',
  password_updated: 'Changed password',
  password_update_failed: 'Password change failed',
  support_opened: 'Opened support',
  support_submitted: 'Sent support message',
  support_failed: 'Support message failed',
  app_open: 'Opened the app',
  upgrade_interest: 'Clicked a paid plan',
  plan_changed: 'Plan changed',
  payment_webhook_failed: 'Payment problem',
  network_imported: 'Imported LinkedIn network',
  account_deleted: 'Deleted their account',
}

const CATEGORY_LABEL: Record<string, string> = {
  sign_in: 'Can’t sign in',
  sign_up: 'Can’t sign up',
  billing: 'Billing',
  bug: 'Bug',
  feature: 'Feature',
  other: 'Other',
}

const toneOf = (outcome: string | null) =>
  outcome === 'failure' ? 'red' : outcome === 'success' ? 'green' : outcome === 'attempt' ? 'blue' : 'text-muted'

/* ── pieces ───────────────────────────────────────────────────────── */
function SignupBars({ data }: { data: { day: string; n: number }[] }) {
  const max = Math.max(1, ...data.map(d => d.n))
  const total = data.reduce((a, d) => a + d.n, 0)
  return (
    <div className="px-5 pb-5">
      <div className="flex items-end gap-[3px] h-[110px]" role="img" aria-label={`${total} sign-ups in the last 30 days`}>
        {data.map(d => (
          <div key={d.day} className="flex-1 flex flex-col justify-end h-full group relative">
            <div
              className="rounded-t-[3px] min-h-[2px]"
              style={{
                height: `${(d.n / max) * 100}%`,
                background: d.n ? 'var(--accent-solid)' : 'var(--bg-overlay)',
                opacity: d.n ? 0.9 : 1,
              }}
              title={`${d.day}: ${d.n}`}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-2 text-[10.5px] tabular-nums" style={{ color: 'var(--text-faint)' }}>
        <span>{new Date(data[0].day).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
        <span>today</span>
      </div>
    </div>
  )
}

function FunnelRow({ label, steps }: { label: string; steps: { name: string; n: number; tone?: string }[] }) {
  const top = Math.max(1, steps[0].n)
  return (
    <div className="px-5 py-3" style={{ borderTop: '1px solid var(--border)' }}>
      <div className="text-[12.5px] font-semibold mb-2" style={{ color: 'var(--text)' }}>
        {label}
      </div>
      <div className="grid grid-cols-4 gap-3">
        {steps.map(s => (
          <div key={s.name}>
            <div className="text-[10.5px] uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>
              {s.name}
            </div>
            <div className="font-display text-[1.5rem] leading-none mt-1 tabular-nums" style={{ color: s.tone ? `var(--${s.tone})` : 'var(--text)' }}>
              {s.n}
            </div>
            <div className="h-1 rounded-full mt-2 overflow-hidden" style={{ background: 'var(--bg-overlay)' }}>
              <div className="h-full rounded-full" style={{ width: `${Math.min(100, (s.n / top) * 100)}%`, background: s.tone ? `var(--${s.tone})` : 'var(--text-muted)' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── page ─────────────────────────────────────────────────────────── */

export default async function AdminPage() {
  const {
    data: { user },
  } = await createClient().auth.getUser()
  if (!user) redirect('/login?next=/admin')

  // Anyone else gets a plain 404 — no hint that this page exists.
  const admin = await getAdmin()
  if (!admin) notFound()

  const d = await loadAdminData()
  const f = d.funnel

  return (
    <AdminShell
      active="/admin"
      title="Who’s using ApplyMaster"
      note="Today at a glance, sign-ups and sign-ins, the people who tried and could not get in, and support messages."
      right={<AutoRefresh />}
    >
        {/* Today at a glance: each tile opens the tab with the detail */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/admin/traffic" className="block">
            <Kpi label="Visitors today" value={d.today.visitors} sub={`${d.today.visitors7} in 7 days · ${d.today.now} on the site now`} tone="accent" />
          </Link>
          <Link href="/admin/people" className="block">
            <Kpi label="Customers active today" value={d.today.activeUsers} sub={`${d.today.activeUsers7} in 7 days`} tone="green" />
          </Link>
          <Link href="/admin/people" className="block">
            <Kpi label="Paying customers" value={d.today.paying} sub={d.today.plans || 'no paid plans yet'} tone="purple" />
          </Link>
          <Link href="/admin/issues" className="block">
            <Kpi label="Problems · 7 days" value={d.today.issues7} sub={`${d.today.issuePeople7} people affected`} tone={d.today.issues7 ? 'red' : undefined} />
          </Link>
        </div>

        {(!d.trackingReady || !d.supportReady) && (
          <Card className="p-5">
            <p className="text-[13.5px] font-semibold" style={{ color: 'var(--yellow)' }}>
              Tracking tables are not created yet
            </p>
            <p className="text-[13px] mt-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Account numbers below come straight from Supabase Auth and are already live. Failed attempts and support
              messages start recording as soon as <code>supabase/migrations/add_ops_tracking.sql</code> has been run.
            </p>
          </Card>
        )}
        {d.usersError && (
          <Card className="p-5">
            <p className="text-[13px]" style={{ color: 'var(--red)' }}>
              Could not read accounts from Supabase Auth: {d.usersError}
            </p>
          </Card>
        )}

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          <Kpi label="Accounts" value={d.accounts.total} sub={`${d.accounts.google} Google · ${d.accounts.email} email`} />
          <Kpi label="New · 7 days" value={d.accounts.new7} sub={`${d.accounts.new30} in 30 days`} tone="accent" />
          {d.trackingReady && d.usage.opened30 > 0 ? (
            <Kpi
              label="Used the app · 7 days"
              value={d.usage.opened7}
              sub={`${d.usage.returning7} returning · ${d.usage.opened30} in 30 days`}
              tone="green"
            />
          ) : (
            /* Until app_open data exists, fall back to sign-ins — and say
               what it is, since it undercounts anyone with a live session. */
            <Kpi label="Signed in · 7 days" value={d.accounts.active7} sub={`${d.accounts.active30} in 30 days`} tone="green" />
          )}
          <Kpi
            label="Couldn’t get in"
            value={d.trackingReady ? d.stuck.length : '—'}
            sub={d.trackingReady ? 'last 30 days, still stuck' : 'needs tracking tables'}
            tone={d.stuck.length ? 'red' : undefined}
          />
          <Kpi label="Failed attempts · 7d" value={d.trackingReady ? d.failures7 : '—'} tone={d.failures7 ? 'yellow' : undefined} />
          <Kpi
            label="Open support"
            value={d.supportReady ? d.openSupport : '—'}
            sub={d.supportReady ? `${d.support.length} total` : 'needs tracking tables'}
            tone={d.openSupport ? 'purple' : undefined}
          />
        </div>

        {/* The people this page exists for */}
        <Card>
          <SectionHead
            title="People who tried and couldn’t get in"
            note="Their latest attempt failed and nothing succeeded after it. Worth an email."
          />
          {!d.trackingReady ? (
            <Empty>Starts filling in once tracking tables exist.</Empty>
          ) : d.stuck.length === 0 ? (
            <Empty>Nobody is stuck right now.</Empty>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[12.5px]">
                <thead>
                  <tr style={{ color: 'var(--text-faint)' }} className="text-left text-[10.5px] uppercase tracking-wider">
                    <th className="px-5 py-2 font-semibold">Who</th>
                    <th className="px-3 py-2 font-semibold">What went wrong</th>
                    <th className="px-3 py-2 font-semibold">Tries</th>
                    <th className="px-3 py-2 font-semibold">When</th>
                    <th className="px-5 py-2 font-semibold text-right">Reach out</th>
                  </tr>
                </thead>
                <tbody>
                  {d.stuck.map(p => (
                    <tr key={p.key} style={{ borderTop: '1px solid var(--border)' }}>
                      <td className="px-5 py-2.5">
                        <div style={{ color: 'var(--text)' }} className="font-medium">
                          {p.email ?? 'Unknown visitor'}
                        </div>
                        <div className="flex gap-1.5 mt-1">
                          {p.email && <Pill tone={p.hasAccount ? 'blue' : 'yellow'}>{p.hasAccount ? 'has account' : 'no account'}</Pill>}
                          {p.country && <Pill tone="text-muted">{p.country}</Pill>}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 max-w-[380px]">
                        <div style={{ color: 'var(--red)' }} className="font-medium">
                          {EVENT_LABEL[p.lastEvent] ?? p.lastEvent}
                        </div>
                        <div className="truncate" style={{ color: 'var(--text-muted)' }} title={p.lastError}>
                          {p.lastError}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                        {p.attempts}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                        {ago(p.lastAt)}
                      </td>
                      <td className="px-5 py-2.5 text-right">
                        {p.email ? (
                          <a
                            href={`mailto:${p.email}?subject=${encodeURIComponent('Trouble signing in to ApplyMaster?')}&body=${encodeURIComponent(
                              `Hi,\n\nI noticed you had trouble getting into ApplyMaster (“${p.lastError}”). Happy to help — ${
                                p.hasAccount
                                  ? 'if you originally signed up with Google, choose “Continue with Google” rather than entering a password.'
                                  : 'reply here and I will get you set up.'
                              }\n\nDishank\nApplyMaster`
                            )}`}
                            className="px-2.5 py-1 rounded-md text-[11.5px] font-semibold"
                            style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}
                          >
                            Email them
                          </a>
                        ) : (
                          <span className="text-[11.5px]" style={{ color: 'var(--text-faint)' }}>
                            no email given
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Support inbox */}
        <Card>
          <SectionHead
            title="Support messages"
            note="From the in-app form. Each one is also forwarded to support@applymaster.ai when email is configured."
          />
          {!d.supportReady ? (
            <Empty>Starts filling in once tracking tables exist.</Empty>
          ) : d.support.length === 0 ? (
            <Empty>No messages yet.</Empty>
          ) : (
            <div>
              {d.support.map(m => (
                <article key={m.id} className="px-5 py-4" style={{ borderTop: '1px solid var(--border)' }}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[13.5px] font-semibold" style={{ color: 'var(--text)' }}>
                          {m.name || m.email}
                        </span>
                        {m.name && (
                          <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                            {m.email}
                          </span>
                        )}
                        <Pill tone={m.category === 'sign_in' || m.category === 'sign_up' ? 'red' : 'blue'}>
                          {CATEGORY_LABEL[m.category] ?? m.category}
                        </Pill>
                        <Pill tone={m.status === 'open' ? 'yellow' : m.status === 'replied' ? 'blue' : 'green'}>{m.status}</Pill>
                        {!m.emailed && <Pill tone="text-muted">not emailed</Pill>}
                      </div>
                      <div className="text-[11.5px] mt-0.5" style={{ color: 'var(--text-faint)' }}>
                        {when(m.created_at)} · {m.user_id ? 'signed in' : 'not signed in'}
                        {typeof m.context?.country === 'string' ? ` · ${m.context.country}` : ''}
                      </div>
                    </div>
                    <div className="flex gap-1.5 items-center">
                      <a
                        href={`mailto:${m.email}?subject=${encodeURIComponent('Re: your ApplyMaster support message')}`}
                        className="px-2.5 py-1 rounded-md text-[11.5px] font-semibold"
                        style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}
                      >
                        Reply
                      </a>
                      <SupportStatus id={m.id} status={m.status} />
                    </div>
                  </div>
                  <p className="text-[13px] mt-2.5 whitespace-pre-wrap leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {m.message}
                  </p>
                  {typeof m.context?.last_error === 'string' && m.context.last_error && (
                    <p className="text-[11.5px] mt-2 px-2.5 py-1.5 rounded-md inline-block" style={{ background: 'var(--red-dim)', color: 'var(--red)' }}>
                      Error they saw: {m.context.last_error}
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}
        </Card>

        {/* People who tried to pay */}
        <Card>
          <SectionHead
            title="Wanted to upgrade"
            note="Clicked a paid plan. While payments are off this is recorded instead of a checkout — the list to email the day paid plans open."
          />
          {!d.trackingReady ? (
            <Empty>Starts filling in once tracking tables exist.</Empty>
          ) : d.upgradeInterest.length === 0 ? (
            <Empty>Nobody yet.</Empty>
          ) : (
            <ul>
              {d.upgradeInterest.map(u => (
                <li key={u.email} className="flex flex-wrap items-center justify-between gap-3 px-5 py-2.5" style={{ borderTop: '1px solid var(--border)' }}>
                  <div>
                    <div className="text-[13px] font-medium" style={{ color: 'var(--text)' }}>
                      {u.email}
                    </div>
                    <div className="flex gap-1.5 mt-1">
                      {u.plans.map(p => (
                        <Pill key={p} tone={p === 'lifetime' ? 'purple' : p === 'elite' ? 'accent' : 'blue'}>
                          {p}
                        </Pill>
                      ))}
                      <span className="text-[11.5px]" style={{ color: 'var(--text-muted)' }}>
                        {u.clicks} click{u.clicks === 1 ? '' : 's'} · last {ago(u.last)}
                      </span>
                    </div>
                  </div>
                  {u.email !== 'unknown' && (
                    <a
                      href={`mailto:${u.email}?subject=${encodeURIComponent('ApplyMaster paid plans are open')}`}
                      className="px-2.5 py-1 rounded-md text-[11.5px] font-semibold"
                      style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}
                    >
                      Email
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
          {d.planChanges.length > 0 && (
            <div className="px-5 py-3 text-[12px]" style={{ borderTop: '1px solid var(--border)', color: 'var(--text-muted)' }}>
              <div className="font-semibold mb-1" style={{ color: 'var(--text)' }}>
                Payment events
              </div>
              {d.planChanges.map((e, i) => (
                <div key={i}>
                  {ago(e.created_at)} ·{' '}
                  {e.event === 'plan_changed'
                    ? `${e.email ?? 'account'} ${String(e.meta?.from ?? '?')} → ${String(e.meta?.to ?? '?')}`
                    : <span style={{ color: 'var(--red)' }}>webhook problem: {e.error_message}</span>}
                </div>
              ))}
            </div>
          )}
        </Card>

        <div className="grid lg:grid-cols-2 gap-5">
          {/* Funnel */}
          <Card>
            <SectionHead title="Sign-in and sign-up, last 30 days" note="Visitors are distinct browsers that opened the page." />
            {!d.trackingReady ? (
              <Empty>Starts filling in once tracking tables exist.</Empty>
            ) : (
              <div className="pb-2">
                <FunnelRow
                  label="Email & password login"
                  steps={[
                    { name: 'Visitors', n: f.loginVisitors },
                    { name: 'Tried', n: f.loginAttempts, tone: 'blue' },
                    { name: 'Got in', n: f.loginSuccess, tone: 'green' },
                    { name: 'Failed', n: f.loginFailed, tone: 'red' },
                  ]}
                />
                <FunnelRow
                  label="Email sign-up"
                  steps={[
                    { name: 'Visitors', n: f.signupVisitors },
                    { name: 'Tried', n: f.signupAttempts, tone: 'blue' },
                    { name: 'Signed up', n: f.signupSuccess, tone: 'green' },
                    { name: 'Failed', n: f.signupFailed, tone: 'red' },
                  ]}
                />
                <FunnelRow
                  label="Continue with Google"
                  steps={[
                    { name: 'Clicked', n: f.googleStarts },
                    { name: 'Returned', n: f.googleSuccess + f.googleFailed, tone: 'blue' },
                    { name: 'Got in', n: f.googleSuccess, tone: 'green' },
                    { name: 'Failed', n: f.googleFailed, tone: 'red' },
                  ]}
                />
              </div>
            )}
          </Card>

          {/* Failure reasons */}
          <Card>
            <SectionHead title="Why attempts fail" note="Grouped by the message the person actually saw, last 30 days." />
            {!d.trackingReady ? (
              <Empty>Starts filling in once tracking tables exist.</Empty>
            ) : d.failureReasons.length === 0 ? (
              <Empty>No failures recorded.</Empty>
            ) : (
              <ul className="px-5 pb-5 space-y-2.5">
                {d.failureReasons.map(([reason, n]) => {
                  const max = d.failureReasons[0][1]
                  return (
                    <li key={reason}>
                      <div className="flex justify-between gap-4 text-[12.5px]">
                        <span className="truncate" style={{ color: 'var(--text-secondary)' }} title={reason}>
                          {reason}
                        </span>
                        <span className="tabular-nums font-semibold" style={{ color: 'var(--text)' }}>
                          {n}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full mt-1 overflow-hidden" style={{ background: 'var(--bg-overlay)' }}>
                        <div className="h-full rounded-full" style={{ width: `${(n / max) * 100}%`, background: 'var(--red)' }} />
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>
        </div>

        <div className="grid lg:grid-cols-[1fr_1.2fr] gap-5">
          <Card>
            <SectionHead title="New accounts per day" note="Last 30 days, from Supabase Auth — already complete, no tracking needed." />
            <SignupBars data={d.signupsByDay} />
          </Card>

          <Card>
            <SectionHead
              title="Stuck at email confirmation"
              note="Signed up with email but never clicked the link, so they cannot log in."
            />
            {d.unconfirmed.length === 0 ? (
              <Empty>Nobody is waiting on a confirmation email.</Empty>
            ) : (
              <ul>
                {d.unconfirmed.map(u => (
                  <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-2.5" style={{ borderTop: '1px solid var(--border)' }}>
                    <div>
                      <div className="text-[13px] font-medium" style={{ color: 'var(--text)' }}>
                        {u.email}
                      </div>
                      <div className="text-[11.5px]" style={{ color: 'var(--text-muted)' }}>
                        signed up {ago(u.created_at)} · email sent {ago(u.confirmation_sent_at)}
                      </div>
                    </div>
                    {u.email && <ResendConfirmation email={u.email} />}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-5">
          <Card>
            <SectionHead title="Latest accounts" />
            <div className="overflow-x-auto pb-2">
              <table className="w-full text-[12.5px]">
                <thead>
                  <tr style={{ color: 'var(--text-faint)' }} className="text-left text-[10.5px] uppercase tracking-wider">
                    <th className="px-5 py-2 font-semibold">Account</th>
                    <th className="px-3 py-2 font-semibold">Via</th>
                    <th className="px-3 py-2 font-semibold">Joined</th>
                    <th className="px-5 py-2 font-semibold">Last in</th>
                  </tr>
                </thead>
                <tbody>
                  {d.recentSignups.map(u => (
                    <tr key={u.id} style={{ borderTop: '1px solid var(--border)' }}>
                      <td className="px-5 py-2">
                        <div className="font-medium truncate max-w-[240px]" style={{ color: 'var(--text)' }}>
                          {u.name || u.email}
                        </div>
                        {u.name && (
                          <div className="truncate max-w-[240px]" style={{ color: 'var(--text-muted)' }}>
                            {u.email}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <Pill tone={u.provider === 'google' ? 'blue' : 'purple'}>{u.provider}</Pill>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                        {ago(u.created_at)}
                      </td>
                      <td className="px-5 py-2 whitespace-nowrap" style={{ color: u.last_sign_in_at ? 'var(--text-secondary)' : 'var(--red)' }}>
                        {ago(u.last_sign_in_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <SectionHead title="Live activity" note="Every auth and support event, newest first." />
            {!d.trackingReady ? (
              <Empty>Starts filling in once tracking tables exist.</Empty>
            ) : d.recentEvents.length === 0 ? (
              <Empty>Nothing recorded yet.</Empty>
            ) : (
              <ul className="max-h-[560px] overflow-y-auto pb-2">
                {d.recentEvents.map(e => (
                  <li key={e.id} className="flex gap-3 px-5 py-2" style={{ borderTop: '1px solid var(--border)' }}>
                    <span className="mt-[6px] w-1.5 h-1.5 rounded-full shrink-0" style={{ background: `var(--${toneOf(e.outcome)})` }} />
                    <div className="min-w-0 flex-1">
                      <div className="text-[12.5px]" style={{ color: 'var(--text)' }}>
                        {EVENT_LABEL[e.event] ?? e.event}
                        {e.event === 'auth_page_view' && typeof e.meta?.page === 'string' ? ` ${e.meta.page.replace('_', ' ')}` : ''}
                        {e.email ? <span style={{ color: 'var(--text-muted)' }}> · {e.email}</span> : null}
                      </div>
                      {e.error_message && (
                        <div className="text-[11.5px] truncate" style={{ color: 'var(--red)' }} title={e.error_message}>
                          {e.error_message}
                        </div>
                      )}
                    </div>
                    <div className="text-[10.5px] shrink-0 text-right tabular-nums" style={{ color: 'var(--text-faint)' }}>
                      {ago(e.created_at)}
                      {e.country ? <div>{e.country}</div> : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
    </AdminShell>
  )
}
