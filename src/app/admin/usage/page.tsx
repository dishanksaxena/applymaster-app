import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/admin-data'
import { loadUsage, rangeOf } from '@/lib/admin-insights'
import { AdminShell, Card, Empty, RangePicker, Ranked, SectionHead } from '../ui'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Features & jobs — Admin', robots: { index: false, follow: false } }

export default async function UsagePage({ searchParams }: { searchParams: { days?: string } }) {
  await requireAdmin('/admin/usage')
  const days = rangeOf(searchParams.days)
  const d = await loadUsage(days)
  const rows = (list: [string, number][]) => list.map(([k, n]) => ({ key: k, label: k, n }))

  return (
    <AdminShell
      active="/admin/usage"
      title="Features & jobs"
      note="What customers actually do in ApplyMaster, and the jobs they look for and act on."
      right={<RangePicker base="/admin/usage" days={days} />}
    >
      <Card>
        <SectionHead title="What people did" note={`Counted from the records each action creates, last ${days} days. Customers only.`} />
        <div className="overflow-x-auto pb-2">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr style={{ color: 'var(--text-faint)' }} className="text-left text-[10.5px] uppercase tracking-wider">
                <th className="px-5 py-2 font-semibold">Action</th>
                <th className="px-3 py-2 font-semibold text-right">People · 7 days</th>
                <th className="px-3 py-2 font-semibold text-right">People · {days} days</th>
                <th className="px-5 py-2 font-semibold text-right">Times</th>
                <th className="px-5 py-2 font-semibold w-[30%]" aria-label="Share of people" />
              </tr>
            </thead>
            <tbody>
              {d.actions.map(a => {
                const max = Math.max(1, ...d.actions.map(x => x.people))
                return (
                  <tr key={a.name} style={{ borderTop: '1px solid var(--border)' }}>
                    <td className="px-5 py-2.5">
                      <div className="font-medium" style={{ color: a.people ? 'var(--text)' : 'var(--text-faint)' }}>
                        {a.name}
                      </div>
                      <div className="text-[11px]" style={{ color: 'var(--text-faint)' }}>
                        {a.what}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                      {a.people7}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums font-semibold" style={{ color: 'var(--text)' }}>
                      {a.people}
                    </td>
                    <td className="px-5 py-2.5 text-right tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                      {a.times}
                    </td>
                    <td className="px-5 py-2.5">
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-overlay)' }}>
                        <div className="h-full rounded-full" style={{ width: `${(a.people / max) * 100}%`, background: 'var(--accent-solid)' }} />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-5">
        <Card>
          <SectionHead title="Parts of the app people open" note="Distinct signed-in customers per section, from page views." />
          <Ranked rows={d.sections.map(s => ({ key: s.section, label: s.section, n: s.people, sub: `${s.views} views` }))} unit="people" empty="Fills in as customers use the app after this release." />
        </Card>
        <Card>
          <SectionHead title="Auto-apply settings" note="Mode each customer has chosen (all time)." />
          <Ranked rows={rows(d.autoModes)} unit="people" tone="purple" />
          <SectionHead title="Interview practice" note={`Sessions by type, last ${days} days.`} />
          <Ranked rows={rows(d.interviewTypes)} unit="sessions" tone="yellow" empty="No practice sessions." />
        </Card>
      </div>

      <h2 className="font-display text-[1.6rem] pt-3" style={{ color: 'var(--text)' }}>
        Jobs
      </h2>

      <div className="grid lg:grid-cols-2 gap-5">
        <Card>
          <SectionHead title="What people search for" note={`${d.searches} searches in ${days} days. Recorded from this release on.`} />
          <Ranked rows={d.topQueries.map(q => ({ key: q.query, label: q.query, n: q.times, sub: `${q.people} ${q.people === 1 ? 'person' : 'people'}` }))} unit="searches" empty="No searches recorded yet." />
        </Card>
        <Card>
          <SectionHead title="Where they want to work" note="Location typed into the search." />
          <Ranked rows={rows(d.topLocations)} unit="searches" tone="blue" empty="No searches recorded yet." />
          <SectionHead title="Searches that found nothing" note="Worth a better job source, or a better suggestion." />
          {d.empty.length === 0 ? <Empty>None.</Empty> : <Ranked rows={rows(d.empty)} unit="times" tone="red" />}
        </Card>
        <Card>
          <SectionHead title="Roles people save and apply to" note={`Jobs added to trackers, last ${days} days.`} />
          <Ranked rows={d.topTitles.map(x => ({ key: x.name, label: x.name, n: x.times, sub: `${x.people} people` }))} unit="jobs" tone="green" empty="No jobs tracked in this period." />
        </Card>
        <Card>
          <SectionHead title="Companies" note={`Employers whose jobs were tracked, last ${days} days.`} />
          <Ranked rows={d.topCompanies.map(x => ({ key: x.name, label: x.name, n: x.times, sub: `${x.people} people` }))} unit="jobs" tone="green" empty="No jobs tracked in this period." />
        </Card>
        <Card>
          <SectionHead title="Jobs actually applied to" note={`Marked applied in the last ${days} days.`} />
          <Ranked rows={rows(d.appliedJobs)} unit="" tone="accent-solid" empty="Nothing marked applied in this period." />
        </Card>
        <Card>
          <SectionHead title="Where applications went" note="Employer portal recorded on each receipt." />
          <Ranked rows={rows(d.destinations)} unit="receipts" tone="purple" empty="No receipts in this period." />
          <SectionHead title="Where the jobs came from" note="Job source of tracked jobs." />
          <Ranked rows={rows(d.jobSources)} unit="jobs" tone="blue" />
        </Card>
      </div>

      <Card>
        <SectionHead title="Every tracked job by stage" note="All customers, all time." />
        <Ranked rows={rows(d.statuses)} unit="jobs" tone="text-muted" limit={20} />
      </Card>
    </AdminShell>
  )
}
