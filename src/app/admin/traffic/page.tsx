import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/admin-data'
import { loadTraffic, rangeOf, sourceOf, deviceOf } from '@/lib/admin-insights'
import { AutoRefresh } from '../AdminActions'
import { AdminShell, Card, DayBars, Empty, Kpi, Ranked, RangePicker, SectionHead, ago, countryName, pct } from '../ui'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Visitors — Admin', robots: { index: false, follow: false } }

export default async function TrafficPage({ searchParams }: { searchParams: { days?: string } }) {
  await requireAdmin('/admin/traffic')
  const days = rangeOf(searchParams.days)
  const d = await loadTraffic(days)
  const rows = (list: [string, number][], fmt: (k: string) => React.ReactNode = k => k) => list.map(([k, n]) => ({ key: k, label: fmt(k), n }))

  return (
    <AdminShell
      active="/admin/traffic"
      title="Visitors"
      note="Everyone who opened a page, public site and app, customers only. Browsers that ask not to be tracked are not counted."
      right={
        <div className="flex flex-col items-end gap-2">
          <RangePicker base="/admin/traffic" days={days} />
          <AutoRefresh />
        </div>
      }
    >
      {!d.tracked && (
        <Card className="p-5">
          <p className="text-[13.5px] font-semibold" style={{ color: 'var(--text)' }}>
            Visit tracking started with this release
          </p>
          <p className="text-[13px] mt-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Numbers fill in from the first visit after it went live. Sign-ups and accounts on the Overview tab go back further, because they come from Supabase.
          </p>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <Kpi label="On the site now" value={d.now} sub="last 5 minutes" tone="green" />
        <Kpi label="Visitors today" value={d.today} sub={`${d.last24h} in the last 24 hours`} tone="accent" />
        <Kpi label={`Visitors · ${days} days`} value={d.visitors} sub={`${d.returningVisitors} came back another day`} />
        <Kpi label="Page views" value={d.views} sub={`${d.visits} visits · ${d.pagesPerVisit.toFixed(1)} pages each`} />
        <Kpi label="Left after one page" value={d.visits ? pct(d.bounceRate) : '—'} sub="share of visits" tone={d.bounceRate > 0.7 ? 'yellow' : undefined} />
        <Kpi label="New accounts" value={d.signups} sub={`${d.converted} traced to a tracked visit`} tone="purple" />
      </div>

      <Card>
        <SectionHead title="Visitors per day" note="Each bar is the number of different people; the darker part is signed-in customers." />
        <DayBars data={d.series.map(s => ({ day: s.day, n: s.visitors, m: s.signedIn }))} label="visitors" secondary="signed in" />
      </Card>

      <div className="grid lg:grid-cols-2 gap-5">
        <Card>
          <SectionHead title="Where they come from" note="How each visit started. AI assistants and search engines are named separately." />
          <Ranked rows={rows(d.sources)} unit="visitors" empty="No visits yet." />
        </Card>
        <Card>
          <SectionHead title="Countries" />
          <Ranked rows={rows(d.countries, k => countryName(k))} unit="visitors" tone="blue" empty="No visits yet." />
        </Card>
        <Card>
          <SectionHead title="Cities" note="As the network reports it: approximate, never the street." />
          <Ranked rows={rows(d.cities)} unit="visitors" tone="blue" empty="No visits yet." />
        </Card>
        <Card>
          <SectionHead title="First page they saw" note="Which pages bring people in." />
          <Ranked rows={rows(d.landing)} unit="visitors" tone="purple" empty="No visits yet." />
        </Card>
      </div>

      <Card>
        <SectionHead title="Most viewed pages" />
        {d.pages.length === 0 ? (
          <Empty>No visits yet.</Empty>
        ) : (
          <div className="overflow-x-auto pb-2">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr style={{ color: 'var(--text-faint)' }} className="text-left text-[10.5px] uppercase tracking-wider">
                  <th className="px-5 py-2 font-semibold">Page</th>
                  <th className="px-3 py-2 font-semibold">Part of the site</th>
                  <th className="px-3 py-2 font-semibold text-right">Visitors</th>
                  <th className="px-5 py-2 font-semibold text-right">Views</th>
                </tr>
              </thead>
              <tbody>
                {d.pages.map(p => (
                  <tr key={p.path} style={{ borderTop: '1px solid var(--border)' }}>
                    <td className="px-5 py-2 font-mono text-[12px]" style={{ color: 'var(--text)' }}>
                      {p.path}
                    </td>
                    <td className="px-3 py-2" style={{ color: 'var(--text-muted)' }}>
                      {p.section}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums" style={{ color: 'var(--text)' }}>
                      {p.visitors}
                    </td>
                    <td className="px-5 py-2 text-right tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                      {p.views}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">
        <Card>
          <SectionHead title="Devices" />
          <Ranked rows={rows(d.devices)} unit="" tone="green" />
        </Card>
        <Card>
          <SectionHead title="Browsers" />
          <Ranked rows={rows(d.browsers)} unit="" tone="green" />
        </Card>
        <Card>
          <SectionHead title="Systems" />
          <Ranked rows={rows(d.systems)} unit="" tone="green" />
        </Card>
        <Card>
          <SectionHead title="Campaigns" note="Links tagged with utm_campaign." />
          <Ranked rows={rows(d.campaigns)} unit="" tone="yellow" empty="No tagged links yet." />
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <Card>
          <SectionHead title="Sites that linked here" note="The full address of each referring page." />
          <Ranked rows={rows(d.referrers, k => k.replace(/^https?:\/\/(www\.)?/, ''))} unit="" tone="text-muted" empty="No links from other sites yet." />
        </Card>
        <Card>
          <SectionHead title="Right now" note="Page views in the last 30 minutes." />
          {d.live.length === 0 ? (
            <Empty>Nobody in the last 30 minutes.</Empty>
          ) : (
            <ul className="pb-2">
              {d.live.map(e => (
                <li key={e.id} className="flex items-center justify-between gap-3 px-5 py-2" style={{ borderTop: '1px solid var(--border)' }}>
                  <div className="min-w-0">
                    <div className="font-mono text-[12px] truncate" style={{ color: 'var(--text)' }}>
                      {e.path}
                    </div>
                    <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      {e.user_id ? 'customer' : 'visitor'} · {deviceOf(e)} · from {sourceOf(e.meta || {})}
                    </div>
                  </div>
                  <div className="text-[11px] text-right shrink-0 tabular-nums" style={{ color: 'var(--text-faint)' }}>
                    {ago(e.created_at)}
                    <div>
                      {typeof e.meta?.city === 'string' ? e.meta.city : countryName(e.country)}
                    </div>
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
