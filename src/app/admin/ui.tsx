import Link from 'next/link'

/* Shared pieces for the owner's dashboard. Server components: no client JS. */

const IST: Intl.DateTimeFormatOptions = { timeZone: 'Asia/Kolkata' }
export const when = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('en-IN', { ...IST, day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'

export function ago(iso: string | null) {
  if (!iso) return 'never'
  const s = (Date.now() - new Date(iso).getTime()) / 1000
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

export const pct = (x: number) => `${Math.round(x * 100)}%`

const regions = new Intl.DisplayNames(['en'], { type: 'region' })
/** "IN" → "India". Flag emoji are not drawn on Windows, so names it is. */
export function countryName(code: string | null | undefined) {
  if (!code) return ''
  try {
    return regions.of(code.toUpperCase()) ?? code
  } catch {
    return code
  }
}

function plural(unit: string, n: number) {
  if (n !== 1) return unit
  if (unit === 'people') return 'person'
  if (/(ch|sh|x)es$/.test(unit)) return unit.slice(0, -2)
  return unit.endsWith('s') ? unit.slice(0, -1) : unit
}

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <section
      className={`rounded-2xl ${className}`}
      style={{ background: 'var(--card-face)', boxShadow: 'var(--card-lift), inset 0 1px 0 var(--card-edge-top), 0 0 0 1px var(--card-ring)' }}
    >
      {children}
    </section>
  )
}

export function SectionHead({ title, note, right }: { title: string; note?: string; right?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 px-5 pt-5 pb-3">
      <div>
        <h2 className="font-display text-[1.3rem] leading-tight" style={{ color: 'var(--text)' }}>
          {title}
        </h2>
        {note && (
          <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {note}
          </p>
        )}
      </div>
      {right}
    </div>
  )
}

export function Kpi({ label, value, sub, tone }: { label: string; value: number | string; sub?: string; tone?: string }) {
  return (
    <Card className="p-4">
      <div className="text-[10.5px] font-semibold uppercase tracking-[0.07em]" style={{ color: 'var(--text-muted)' }}>
        {label}
      </div>
      <div className="font-display text-[2.2rem] leading-none mt-2 tabular-nums" style={{ color: tone ? `var(--${tone})` : 'var(--text)' }}>
        {value}
      </div>
      {sub && (
        <div className="text-[11.5px] mt-1.5" style={{ color: 'var(--text-muted)' }}>
          {sub}
        </div>
      )}
    </Card>
  )
}

export function Pill({ children, tone }: { children: React.ReactNode; tone: string }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-semibold whitespace-nowrap"
      style={{ background: `rgb(var(--${tone}-rgb) / calc(0.12 * var(--tint-scale)))`, color: `var(--${tone})` }}
    >
      {children}
    </span>
  )
}

export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-5 pb-6 pt-1 text-[13px]" style={{ color: 'var(--text-muted)' }}>
      {children}
    </p>
  )
}

export const PLAN_TONE: Record<string, string> = { free: 'text-muted', pro: 'blue', elite: 'purple', lifetime: 'green' }

/** Daily bars; the second series (if any) is drawn as a darker inner bar. */
export function DayBars({
  data,
  label,
  secondary,
  tone = 'accent-solid',
}: {
  data: { day: string; n: number; m?: number }[]
  label: string
  secondary?: string
  tone?: string
}) {
  const max = Math.max(1, ...data.map(d => d.n))
  const total = data.reduce((a, d) => a + d.n, 0)
  const fmt = (day: string) => new Date(day).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  return (
    <div className="px-5 pb-5">
      <div className="flex items-end gap-[2px] h-[130px]" role="img" aria-label={`${label}: ${total} in ${data.length} days`}>
        {data.map(d => (
          <div key={d.day} className="flex-1 flex flex-col justify-end h-full relative group">
            <div
              className="rounded-t-[3px] min-h-[2px] relative overflow-hidden"
              style={{ height: `${(d.n / max) * 100}%`, background: d.n ? `var(--${tone})` : 'var(--bg-overlay)', opacity: d.n ? 0.85 : 1 }}
              title={`${fmt(d.day)}: ${d.n} ${label}${secondary && d.m !== undefined ? ` · ${d.m} ${secondary}` : ''}`}
            >
              {secondary && d.m ? (
                <div className="absolute bottom-0 left-0 right-0" style={{ height: `${(d.m / Math.max(1, d.n)) * 100}%`, background: 'var(--text)', opacity: 0.35 }} />
              ) : null}
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-2 text-[10.5px] tabular-nums" style={{ color: 'var(--text-faint)' }}>
        <span>{fmt(data[0].day)}</span>
        {secondary && (
          <span className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm" style={{ background: `var(--${tone})` }} />
              {label}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm" style={{ background: 'var(--text)', opacity: 0.5 }} />
              {secondary}
            </span>
          </span>
        )}
        <span>today</span>
      </div>
    </div>
  )
}

/** A ranked list with proportional bars. */
export function Ranked({
  rows,
  empty = 'Nothing yet.',
  tone = 'accent-solid',
  unit,
  limit = 12,
}: {
  rows: { label: React.ReactNode; n: number; sub?: React.ReactNode; key?: string }[]
  empty?: string
  tone?: string
  unit?: string
  limit?: number
}) {
  if (!rows.length) return <Empty>{empty}</Empty>
  const max = Math.max(1, ...rows.map(r => r.n))
  return (
    <ul className="px-5 pb-5 space-y-2.5">
      {rows.slice(0, limit).map((r, i) => (
        <li key={r.key ?? i}>
          <div className="flex justify-between gap-4 text-[12.5px]">
            <span className="truncate min-w-0" style={{ color: 'var(--text-secondary)' }}>
              {r.label}
              {r.sub ? <span style={{ color: 'var(--text-faint)' }}> · {r.sub}</span> : null}
            </span>
            <span className="tabular-nums font-semibold shrink-0" style={{ color: 'var(--text)' }}>
              {r.n}
              {unit ? <span className="font-normal" style={{ color: 'var(--text-faint)' }}> {plural(unit, r.n)}</span> : null}
            </span>
          </div>
          <div className="h-1.5 rounded-full mt-1 overflow-hidden" style={{ background: 'var(--bg-overlay)' }}>
            <div className="h-full rounded-full" style={{ width: `${(r.n / max) * 100}%`, background: `var(--${tone})`, opacity: 0.8 }} />
          </div>
        </li>
      ))}
    </ul>
  )
}

const TABS = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/traffic', label: 'Visitors' },
  { href: '/admin/people', label: 'People' },
  { href: '/admin/usage', label: 'Features & jobs' },
  { href: '/admin/issues', label: 'Issues' },
]

export function AdminShell({
  active,
  title,
  note,
  right,
  children,
}: {
  active: string
  title: string
  note?: string
  right?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-8 space-y-5">
        <header className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <Link href="/dashboard" className="text-[12px] font-semibold" style={{ color: 'var(--text-muted)' }}>
                ← ApplyMaster
              </Link>
              <h1 className="font-display text-[clamp(1.9rem,3vw,2.5rem)] leading-tight mt-1" style={{ color: 'var(--text)' }}>
                {title}
              </h1>
              {note && (
                <p className="text-[13px] mt-1" style={{ color: 'var(--text-muted)' }}>
                  {note}
                </p>
              )}
            </div>
            {right}
          </div>
          <nav className="flex gap-1 overflow-x-auto p-1 rounded-xl w-fit max-w-full" style={{ background: 'var(--bg-overlay)' }} aria-label="Admin sections">
            {TABS.map(tab => {
              const on = tab.href === active
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  aria-current={on ? 'page' : undefined}
                  className="px-3.5 py-1.5 rounded-lg text-[12.5px] font-semibold whitespace-nowrap"
                  style={on ? { background: 'var(--card-face)', color: 'var(--text)', boxShadow: 'var(--shadow-sm)' } : { color: 'var(--text-muted)' }}
                >
                  {tab.label}
                </Link>
              )
            })}
          </nav>
        </header>
        {children}
      </div>
    </div>
  )
}

export function RangePicker({ base, days }: { base: string; days: number }) {
  return (
    <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'var(--bg-overlay)' }}>
      {[7, 30, 90].map(d => (
        <Link
          key={d}
          href={`${base}?days=${d}`}
          className="px-2.5 py-1 rounded-md text-[11.5px] font-semibold tabular-nums"
          style={d === days ? { background: 'var(--card-face)', color: 'var(--text)' } : { color: 'var(--text-muted)' }}
        >
          {d} days
        </Link>
      ))}
    </div>
  )
}
