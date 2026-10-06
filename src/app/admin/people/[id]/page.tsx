import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAdmin, type EventRow } from '@/lib/admin-data'
import { loadPerson, sectionOf, deviceOf, browserOf, osOf } from '@/lib/admin-insights'
import { AdminShell, Card, Empty, Kpi, Pill, PLAN_TONE, Ranked, SectionHead, ago, countryName, when } from '../../ui'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Person — Admin', robots: { index: false, follow: false } }

const LABEL: Record<string, string> = {
  page_view: 'Viewed',
  app_open: 'Opened the app',
  job_search: 'Searched jobs',
  login_success: 'Logged in',
  login_failed: 'Login failed',
  oauth_callback_success: 'Signed in with Google',
  signup_success: 'Signed up',
  upgrade_interest: 'Clicked a paid plan',
  plan_changed: 'Plan changed',
  network_imported: 'Imported LinkedIn network',
  support_opened: 'Opened support',
  support_submitted: 'Sent a support message',
  ui_error: 'Saw an error',
  api_error: 'A request failed',
  client_error: 'Page crashed',
}

/** Collapse runs of page views in the same part of the product into one line. */
function compact(events: EventRow[]) {
  const out: { e: EventRow; n: number; detail: string }[] = []
  for (const e of events) {
    const detail =
      e.event === 'page_view'
        ? sectionOf(e.path || '/')
        : e.event === 'job_search'
          ? `“${String(e.meta?.query ?? '')}”${e.meta?.location ? ` in ${String(e.meta.location)}` : ''} → ${String(e.meta?.results ?? '?')} results`
          : e.event === 'plan_changed'
            ? `${String(e.meta?.from ?? '?')} → ${String(e.meta?.to ?? '?')}`
            : e.event === 'upgrade_interest'
              ? String(e.meta?.plan ?? '')
              : e.error_message || ''
    const prev = out[out.length - 1]
    if (prev && e.event === 'page_view' && prev.e.event === 'page_view' && prev.detail === detail) {
      prev.n += 1
      continue
    }
    out.push({ e, n: 1, detail })
  }
  return out
}

export default async function PersonPage({ params }: { params: { id: string } }) {
  await requireAdmin(`/admin/people/${params.id}`)
  const d = await loadPerson(params.id)
  if (!d) notFound()
  const plan = (d.profile?.plan as string) || 'free'
  const located = d.timeline.find(e => e.country)
  const lastView = d.timeline.find(e => e.event === 'page_view')
  const prefs = d.prefs || {}
  const list = (v: unknown) => (Array.isArray(v) ? v.filter(Boolean).join(', ') : typeof v === 'string' ? v : '')
  const applied = d.applications.filter(a => a.applied_at || ['applied', 'interview', 'interviewing', 'offer', 'rejected'].includes(a.status))
  const facts: [string, string][] = [
    ['Looking for', list(prefs.desired_job_title) || list(prefs.target_roles)],
    ['Where', list(prefs.target_locations) || list(prefs.country_preference)],
    ['Experience', list(prefs.experience_level)],
    ['Work authorisation', list(prefs.work_authorization)],
    ['Remote', list(prefs.remote_preference)],
    ['Auto-apply', list(prefs.auto_apply_mode)],
    ['Salary', prefs.min_salary ? `${prefs.min_salary}${prefs.max_salary ? `–${prefs.max_salary}` : '+'}` : ''],
    ['First came from', d.firstSource ? `${d.firstSource}${d.firstLanding ? ` → ${d.firstLanding}` : ''}` : ''],
    ['Device', lastView ? `${deviceOf(lastView)} · ${browserOf(lastView.user_agent)} on ${osOf(lastView.user_agent)}` : ''],
  ].filter(([, v]) => v) as [string, string][]

  return (
    <AdminShell
      active="/admin/people"
      title={d.user.name || d.user.email || 'Customer'}
      note={`${d.user.email ?? ''} · signed up ${ago(d.user.joined)} with ${d.user.provider}`}
      right={
        d.user.email ? (
          <a
            href={`mailto:${d.user.email}?subject=${encodeURIComponent('ApplyMaster')}`}
            className="px-3.5 py-2 rounded-xl text-[12.5px] font-semibold"
            style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}
          >
            Email them
          </a>
        ) : null
      }
    >
      <Link href="/admin/people" className="text-[12px] font-semibold" style={{ color: 'var(--text-muted)' }}>
        ← All people
      </Link>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <Kpi label="Plan" value={plan[0].toUpperCase() + plan.slice(1)} sub={d.subscription?.stripe_customer_id ? `Stripe · ${String(d.subscription.status)}` : 'not bought through checkout'} tone={PLAN_TONE[plan]} />
        <Kpi label="Last seen" value={ago(d.timeline[0]?.created_at ?? d.user.lastSignIn)} sub={located ? `${typeof located.meta?.city === 'string' ? `${located.meta.city}, ` : ''}${countryName(located.country)}` : 'location unknown'} />
        <Kpi label="Jobs tracked" value={d.applications.length} sub={`${applied.length} applied`} tone="blue" />
        <Kpi label="Page views" value={d.timeline.filter(e => e.event === 'page_view').length} sub="since tracking began" />
        <Kpi label="Searches" value={d.timeline.filter(e => e.event === 'job_search').length} />
        <Kpi label="Problems" value={d.issues.length} tone={d.issues.length ? 'red' : undefined} sub={d.support.length ? `${d.support.length} support messages` : undefined} />
      </div>

      <div className="grid lg:grid-cols-[1fr_1.4fr] gap-5">
        <div className="space-y-5">
          <Card>
            <SectionHead title="About them" />
            {facts.length === 0 ? (
              <Empty>No job preferences saved yet.</Empty>
            ) : (
              <dl className="px-5 pb-5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[12.5px]">
                {facts.map(([k, v]) => (
                  <div key={k} className="contents">
                    <dt style={{ color: 'var(--text-muted)' }}>{k}</dt>
                    <dd style={{ color: 'var(--text)' }}>{v}</dd>
                  </div>
                ))}
              </dl>
            )}
          </Card>
          <Card>
            <SectionHead title="Where they spend time" />
            <Ranked rows={d.sections.map(([s, n]) => ({ key: s, label: s, n }))} unit="views" empty="No page views recorded yet." />
          </Card>
          <Card>
            <SectionHead title="Problems they hit" />
            {d.issues.length === 0 ? (
              <Empty>None recorded.</Empty>
            ) : (
              <ul className="pb-2">
                {d.issues.map(e => (
                  <li key={e.id} className="px-5 py-2" style={{ borderTop: '1px solid var(--border)' }}>
                    <div className="text-[12.5px]" style={{ color: 'var(--red)' }}>
                      {e.error_message || e.event}
                    </div>
                    <div className="text-[11px]" style={{ color: 'var(--text-faint)' }}>
                      {LABEL[e.event] ?? e.event.replace(/_/g, ' ')} · {String(e.meta?.page ?? e.path ?? '')} · {when(e.created_at)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          {d.support.length > 0 && (
            <Card>
              <SectionHead title="Support messages" />
              <ul className="pb-2">
                {d.support.map(m => (
                  <li key={m.id} className="px-5 py-3" style={{ borderTop: '1px solid var(--border)' }}>
                    <div className="flex gap-2 items-center">
                      <Pill tone={m.status === 'open' ? 'yellow' : 'green'}>{m.status}</Pill>
                      <span className="text-[11px]" style={{ color: 'var(--text-faint)' }}>
                        {when(m.created_at)}
                      </span>
                    </div>
                    <p className="text-[12.5px] mt-1.5 whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>
                      {m.message}
                    </p>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        <div className="space-y-5">
          <Card>
            <SectionHead title="Jobs they are working on" note="Newest first." />
            {d.applications.length === 0 ? (
              <Empty>No jobs saved or applied to yet.</Empty>
            ) : (
              <ul className="pb-2 max-h-[420px] overflow-y-auto">
                {d.applications.map(a => (
                  <li key={a.id} className="flex items-center justify-between gap-3 px-5 py-2" style={{ borderTop: '1px solid var(--border)' }}>
                    <div className="min-w-0">
                      <div className="text-[12.5px] font-medium truncate" style={{ color: 'var(--text)' }}>
                        {a.jobs?.title ?? 'Unknown role'}
                      </div>
                      <div className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>
                        {a.jobs?.company ?? ''}
                        {a.jobs?.location ? ` · ${a.jobs.location}` : ''}
                        {a.match_score ? ` · ${a.match_score}% match` : ''}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <Pill tone={a.status === 'applied' ? 'green' : a.status === 'interview' ? 'purple' : a.status === 'rejected' ? 'red' : 'text-muted'}>{a.status}</Pill>
                      <div className="text-[10.5px] mt-0.5" style={{ color: 'var(--text-faint)' }}>
                        {ago(a.applied_at || a.created_at)}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <SectionHead title="Everything they did" note="Newest first, including visits before they signed in from the same browser." />
            {d.timeline.length === 0 ? (
              <Empty>Nothing recorded yet.</Empty>
            ) : (
              <ul className="pb-2 max-h-[640px] overflow-y-auto">
                {compact(d.timeline).map(({ e, n, detail }) => {
                  const bad = ['ui_error', 'api_error', 'client_error'].includes(e.event) || e.outcome === 'failure'
                  return (
                    <li key={e.id} className="flex gap-3 px-5 py-2" style={{ borderTop: '1px solid var(--border)' }}>
                      <span className="mt-[6px] w-1.5 h-1.5 rounded-full shrink-0" style={{ background: bad ? 'var(--red)' : e.user_id ? 'var(--accent)' : 'var(--text-faint)' }} />
                      <div className="min-w-0 flex-1 text-[12.5px]" style={{ color: bad ? 'var(--red)' : 'var(--text)' }}>
                        {LABEL[e.event] ?? e.event.replace(/_/g, ' ')} <span style={{ color: bad ? 'var(--red)' : 'var(--text-muted)' }}>{detail}</span>
                        {n > 1 && <span style={{ color: 'var(--text-faint)' }}> · {n} pages</span>}
                        {!e.user_id && <span style={{ color: 'var(--text-faint)' }}> · before signing in</span>}
                      </div>
                      <div className="text-[10.5px] shrink-0 text-right tabular-nums" style={{ color: 'var(--text-faint)' }}>
                        {when(e.created_at)}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </AdminShell>
  )
}
