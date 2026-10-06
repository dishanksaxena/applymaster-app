import type { Metadata } from 'next'
import Link from 'next/link'
import { requireAdmin } from '@/lib/admin-data'
import { loadIssues, rangeOf } from '@/lib/admin-insights'
import { AutoRefresh } from '../AdminActions'
import { AdminShell, Card, DayBars, Empty, Kpi, Pill, RangePicker, Ranked, SectionHead, ago, when } from '../ui'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Issues — Admin', robots: { index: false, follow: false } }

const KIND_TONE: Record<string, string> = {
  'Error message shown': 'yellow',
  'Request failed': 'red',
  'Page crashed or script error': 'red',
  'Payment problem': 'purple',
}

export default async function IssuesPage({ searchParams }: { searchParams: { days?: string } }) {
  await requireAdmin('/admin/issues')
  const days = rangeOf(searchParams.days)
  const d = await loadIssues(days)

  return (
    <AdminShell
      active="/admin/issues"
      title="Issues"
      note="Problems customers ran into, grouped so the same problem shows once: error messages they saw, requests that failed, pages that crashed, sign-in failures and payment problems."
      right={
        <div className="flex flex-col items-end gap-2">
          <RangePicker base="/admin/issues" days={days} />
          <AutoRefresh />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi label="Problems" value={d.total} sub={`last ${days} days`} tone={d.total ? 'red' : undefined} />
        <Kpi label="People affected" value={d.people} tone={d.people ? 'yellow' : undefined} />
        <Kpi label="Different problems" value={d.groups.length} />
        <Kpi
          label="Searches with no results"
          value={d.emptySearches}
          sub={d.searches ? `of ${d.searches} searches` : 'no searches recorded yet'}
          tone={d.emptySearches ? 'yellow' : undefined}
        />
      </div>

      <Card>
        <SectionHead title="Problems per day" />
        <DayBars data={d.series} label="problems" tone="red" />
      </Card>

      <Card>
        <SectionHead title="Problems, most people affected first" note="Numbers, ids and email addresses are folded together, so one bug is one row." />
        {d.groups.length === 0 ? (
          <Empty>No problems recorded in this period. Errors shown to customers are recorded from this release on.</Empty>
        ) : (
          <div className="overflow-x-auto pb-2">
            <table className="w-full text-[12.5px] min-w-[900px]">
              <thead>
                <tr style={{ color: 'var(--text-faint)' }} className="text-left text-[10.5px] uppercase tracking-wider">
                  <th className="px-5 py-2 font-semibold">What happened</th>
                  <th className="px-3 py-2 font-semibold">Where</th>
                  <th className="px-3 py-2 font-semibold text-right">People</th>
                  <th className="px-3 py-2 font-semibold text-right">Times</th>
                  <th className="px-5 py-2 font-semibold">Last seen</th>
                </tr>
              </thead>
              <tbody>
                {d.groups.map(g => (
                  <tr key={g.key} style={{ borderTop: '1px solid var(--border)' }}>
                    <td className="px-5 py-2.5 max-w-[520px]">
                      <div className="flex items-center gap-2">
                        <Pill tone={KIND_TONE[g.kind] ?? 'blue'}>{g.kind}</Pill>
                        {g.status ? <span className="text-[10.5px] tabular-nums" style={{ color: 'var(--text-faint)' }}>HTTP {g.status}</span> : null}
                      </div>
                      <div className="mt-1 break-words" style={{ color: 'var(--text)' }}>
                        {g.message}
                      </div>
                      {g.emails.length > 0 && (
                        <div className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                          {g.emails.join(', ')}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[11.5px]" style={{ color: 'var(--text-secondary)' }}>
                      {g.pages.join(', ') || '—'}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums font-semibold" style={{ color: 'var(--text)' }}>
                      {g.people}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                      {g.count}
                    </td>
                    <td className="px-5 py-2.5 whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                      {ago(g.last)}
                      <div className="text-[10.5px]" style={{ color: 'var(--text-faint)' }}>
                        first {ago(g.first)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="grid lg:grid-cols-2 gap-5">
        <Card>
          <SectionHead title="Kinds of problem" />
          <Ranked rows={d.byKind.map(([k, n]) => ({ key: k, label: k, n }))} unit="" tone="red" empty="None." />
        </Card>
        <Card>
          <SectionHead title="People who hit the most problems" note="Worth a personal note." />
          {d.affected.length === 0 ? (
            <Empty>Nobody.</Empty>
          ) : (
            <ul className="pb-2">
              {d.affected.map(a => (
                <li key={a.email} className="flex items-center justify-between gap-3 px-5 py-2" style={{ borderTop: '1px solid var(--border)' }}>
                  <div className="min-w-0">
                    {a.id ? (
                      <Link href={`/admin/people/${a.id}`} className="text-[12.5px] font-medium hover:underline truncate block" style={{ color: 'var(--text)' }}>
                        {a.email}
                      </Link>
                    ) : (
                      <span className="text-[12.5px] font-medium truncate block" style={{ color: 'var(--text)' }}>
                        {a.email}
                      </span>
                    )}
                    <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      {a.n} problems · last {ago(a.last)}
                    </div>
                  </div>
                  <a
                    href={`mailto:${a.email}?subject=${encodeURIComponent('Sorry about the trouble in ApplyMaster')}`}
                    className="px-2.5 py-1 rounded-md text-[11.5px] font-semibold shrink-0"
                    style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}
                  >
                    Email
                  </a>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <Card>
          <SectionHead title="Support messages" note={`Last ${days} days. Reply and resolve them on the Overview tab.`} />
          {d.support.length === 0 ? (
            <Empty>None in this period.</Empty>
          ) : (
            <ul className="pb-2">
              {d.support.map(m => (
                <li key={m.id} className="px-5 py-2.5" style={{ borderTop: '1px solid var(--border)' }}>
                  <div className="flex gap-2 items-center text-[12px]">
                    <span className="font-medium" style={{ color: 'var(--text)' }}>
                      {m.email}
                    </span>
                    <Pill tone={m.status === 'open' ? 'yellow' : 'green'}>{m.status}</Pill>
                    <span style={{ color: 'var(--text-faint)' }}>{ago(m.created_at)}</span>
                  </div>
                  <p className="text-[12.5px] mt-1 line-clamp-3" style={{ color: 'var(--text-secondary)' }}>
                    {m.message}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <SectionHead title="Latest problems" note="As they happened." />
          {d.recent.length === 0 ? (
            <Empty>None.</Empty>
          ) : (
            <ul className="pb-2 max-h-[520px] overflow-y-auto">
              {d.recent.map(e => (
                <li key={e.id} className="px-5 py-2" style={{ borderTop: '1px solid var(--border)' }}>
                  <div className="text-[12.5px] break-words" style={{ color: 'var(--red)' }}>
                    {e.error_message || e.event}
                  </div>
                  <div className="text-[11px]" style={{ color: 'var(--text-faint)' }}>
                    {e.email ?? 'visitor'} · {String(e.meta?.page ?? e.path ?? '')} · {when(e.created_at)}
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
