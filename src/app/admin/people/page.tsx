import type { Metadata } from 'next'
import Link from 'next/link'
import { requireAdmin } from '@/lib/admin-data'
import { loadPeople, type Person } from '@/lib/admin-insights'
import { AdminShell, Card, Empty, Kpi, Pill, PLAN_TONE, SectionHead, ago, countryName } from '../ui'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'People — Admin', robots: { index: false, follow: false } }

const SORTS: Record<string, { label: string; by: (a: Person, b: Person) => number }> = {
  seen: { label: 'Last seen', by: (a, b) => (b.lastSeen ?? '').localeCompare(a.lastSeen ?? '') },
  joined: { label: 'Newest', by: (a, b) => b.joined.localeCompare(a.joined) },
  active: { label: 'Most applications', by: (a, b) => b.counts.applications - a.counts.applications },
  issues: { label: 'Most problems', by: (a, b) => b.counts.issues - a.counts.issues },
}

export default async function PeoplePage({ searchParams }: { searchParams: { q?: string; plan?: string; sort?: string } }) {
  await requireAdmin('/admin/people')
  const d = await loadPeople()
  const q = (searchParams.q || '').trim().toLowerCase()
  const plan = searchParams.plan || ''
  const sort = SORTS[searchParams.sort || ''] ? (searchParams.sort as string) : 'seen'
  const shown = d.people
    .filter(p => !plan || p.plan === plan)
    .filter(p => !q || [p.email, p.name, p.target, p.city, p.country].some(v => v?.toLowerCase().includes(q)))
    .sort(SORTS[sort].by)
  const link = (over: Record<string, string>) => {
    const params = new URLSearchParams({ ...(q ? { q } : {}), ...(plan ? { plan } : {}), sort, ...over })
    for (const [k, v] of [...params.entries()]) if (!v) params.delete(k)
    return `/admin/people?${params}`
  }

  return (
    <AdminShell active="/admin/people" title="People" note="Every customer account: who they are, which plan, where they are, what they are looking for and what they have used. Team, review and demo accounts are left out.">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <Kpi label="Customers" value={d.total} sub={d.plans.map(([p, n]) => `${n} ${p}`).join(' · ')} />
        <Kpi label="Active today" value={d.activeToday} sub={`${d.active7} in 7 days`} tone="green" />
        <Kpi label="Paying" value={d.paying} sub="through Stripe" tone="purple" />
        <Kpi label="Uploaded a resume" value={d.withResume} sub={`of ${d.total}`} tone="accent" />
        <Kpi label="Finished onboarding" value={d.onboarded} sub={`of ${d.total}`} />
        <Kpi label="Top country" value={d.countries[0] ? countryName(d.countries[0][0]) : '—'} sub={d.countries.slice(0, 4).map(([c, n]) => `${countryName(c)} ${n}`).join(' · ') || 'fills in as people visit'} />
      </div>

      <Card>
        <SectionHead
          title={`${shown.length} ${shown.length === 1 ? 'person' : 'people'}`}
          right={
            <form className="flex flex-wrap gap-2 items-center" action="/admin/people">
              <input
                name="q"
                defaultValue={q}
                placeholder="Search email, name, role, city"
                aria-label="Search people"
                className="px-3 py-1.5 rounded-lg text-[12.5px] theme-input w-[220px]"
              />
              <input type="hidden" name="sort" value={sort} />
              {plan && <input type="hidden" name="plan" value={plan} />}
              <button className="px-3 py-1.5 rounded-lg text-[12px] font-semibold" style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>
                Search
              </button>
            </form>
          }
        />
        <div className="flex flex-wrap gap-1.5 px-5 pb-3 text-[11.5px]">
          {['', 'free', 'pro', 'elite', 'lifetime'].map(p => (
            <Link
              key={p || 'all'}
              href={link({ plan: p })}
              className="px-2.5 py-1 rounded-full font-semibold"
              style={p === plan ? { background: 'var(--text)', color: 'var(--bg)' } : { background: 'var(--bg-overlay)', color: 'var(--text-muted)' }}
            >
              {p ? p[0].toUpperCase() + p.slice(1) : 'All plans'}
            </Link>
          ))}
          <span className="w-px mx-1" style={{ background: 'var(--border)' }} />
          {Object.entries(SORTS).map(([k, s]) => (
            <Link
              key={k}
              href={link({ sort: k })}
              className="px-2.5 py-1 rounded-full font-semibold"
              style={k === sort ? { background: 'var(--text)', color: 'var(--bg)' } : { background: 'var(--bg-overlay)', color: 'var(--text-muted)' }}
            >
              {s.label}
            </Link>
          ))}
        </div>
        {shown.length === 0 ? (
          <Empty>Nobody matches.</Empty>
        ) : (
          <div className="overflow-x-auto pb-2">
            <table className="w-full text-[12.5px] min-w-[1100px]">
              <thead>
                <tr style={{ color: 'var(--text-faint)' }} className="text-left text-[10.5px] uppercase tracking-wider">
                  <th className="px-5 py-2 font-semibold">Person</th>
                  <th className="px-3 py-2 font-semibold">Plan</th>
                  <th className="px-3 py-2 font-semibold">Where</th>
                  <th className="px-3 py-2 font-semibold">Looking for</th>
                  <th className="px-3 py-2 font-semibold">Has used</th>
                  <th className="px-3 py-2 font-semibold text-right">Problems</th>
                  <th className="px-3 py-2 font-semibold">Joined</th>
                  <th className="px-5 py-2 font-semibold">Last seen</th>
                </tr>
              </thead>
              <tbody>
                {shown.map(p => (
                  <tr key={p.id} style={{ borderTop: '1px solid var(--border)' }}>
                    <td className="px-5 py-2.5 max-w-[260px]">
                      <Link href={`/admin/people/${p.id}`} className="font-medium truncate block hover:underline" style={{ color: 'var(--text)' }}>
                        {p.name || p.email}
                      </Link>
                      <div className="truncate" style={{ color: 'var(--text-muted)' }}>
                        {p.name ? p.email : ''} <span style={{ color: 'var(--text-faint)' }}>{p.provider}</span>
                        {!p.confirmed && <span style={{ color: 'var(--red)' }}> · not confirmed</span>}
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <Pill tone={PLAN_TONE[p.plan] ?? 'text-muted'}>{p.plan}</Pill>
                      {p.paying && (
                        <div className="text-[10.5px] mt-1" style={{ color: 'var(--green)' }}>
                          paying
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                      {p.country ? `${p.city ? `${p.city}, ` : ''}${countryName(p.country)}` : '—'}
                      {p.device && (
                        <div className="text-[10.5px]" style={{ color: 'var(--text-faint)' }}>
                          {p.device}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2.5 max-w-[220px]" style={{ color: 'var(--text-secondary)' }}>
                      <div className="truncate">{p.target || '—'}</div>
                      <div className="truncate text-[11px]" style={{ color: 'var(--text-faint)' }}>
                        {[p.locations, p.experience].filter(Boolean).join(' · ')}
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-wrap gap-1 max-w-[300px]">
                        {p.counts.resumes > 0 && <Pill tone="accent">resume</Pill>}
                        {p.counts.applications > 0 && <Pill tone="blue">{p.counts.applications} jobs tracked</Pill>}
                        {p.counts.applied > 0 && <Pill tone="green">{p.counts.applied} applied</Pill>}
                        {p.extension && <Pill tone="purple">extension</Pill>}
                        {p.counts.receipts > 0 && <Pill tone="green">{p.counts.receipts} receipts</Pill>}
                        {p.counts.coverLetters > 0 && <Pill tone="yellow">{p.counts.coverLetters} letters</Pill>}
                        {p.counts.interviews > 0 && <Pill tone="yellow">{p.counts.interviews} interviews</Pill>}
                        {p.counts.contacts > 0 && <Pill tone="blue">{p.counts.contacts} contacts</Pill>}
                        {p.autoApply && p.autoApply !== 'off' && <Pill tone="purple">auto: {p.autoApply}</Pill>}
                        {p.counts.searches > 0 && <Pill tone="text-muted">{p.counts.searches} searches</Pill>}
                      </div>
                      {p.topSection && (
                        <div className="text-[10.5px] mt-1" style={{ color: 'var(--text-faint)' }}>
                          mostly {p.topSection}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums" style={{ color: p.counts.issues ? 'var(--red)' : 'var(--text-faint)' }}>
                      {p.counts.issues || '—'}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                      {ago(p.joined)}
                    </td>
                    <td className="px-5 py-2.5 whitespace-nowrap" style={{ color: p.lastSeen ? 'var(--text-secondary)' : 'var(--red)' }}>
                      {ago(p.lastSeen)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </AdminShell>
  )
}
