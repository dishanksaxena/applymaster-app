import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Crumbs, Ctas, JsonLd, Section } from '@/components/marketing/Landing'
import { SITE_URL, breadcrumbs, faqPage } from '@/lib/seo/site'
import { ROLES, roleBySlug, roleInsights } from '@/lib/role-insights'

export const revalidate = 86400 // daily: job pages are crawled heavily, and roles rarely change faster
export const dynamicParams = false
export function generateStaticParams() {
  return ROLES.map(r => ({ role: r.slug }))
}

const month = () => new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
const usd = (n: number) => `$${Math.round(n / 1000)}K`

export async function generateMetadata({ params }: { params: { role: string } }): Promise<Metadata> {
  const role = roleBySlug(params.role)
  if (!role) return {}
  const d = await roleInsights(role)
  const title = `${role.name} Jobs: Skills, Pay and Who’s Hiring (${month()})`
  const description = `${d.total} open ${role.name.toLowerCase()} roles at ${d.companyCount} companies right now${d.pay ? `, typically paying ${usd(d.pay.low)}–${usd(d.pay.high)}` : ''}. The skills employers ask for most, counted from live postings.`
  const url = `${SITE_URL}/roles/${role.slug}`
  return {
    title: { absolute: `${title} | ApplyMaster` },
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: 'article', siteName: 'ApplyMaster' },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default async function RolePage({ params }: { params: { role: string } }) {
  const role = roleBySlug(params.role)
  if (!role) notFound()
  const d = await roleInsights(role)
  const faqs = [
    {
      q: `What skills do ${role.plural.toLowerCase()} need?`,
      a: d.skills.length
        ? `In the ${d.read} most recent postings we read, the most requested were ${d.skills.slice(0, 6).map(([s]) => s).join(', ')}.`
        : `Too few postings were readable to rank skills right now.`,
    },
    {
      q: `How much do ${role.plural.toLowerCase()} earn?`,
      a: d.pay
        ? `Of the postings we read, ${d.pay.postings} published a US pay range. The typical range was ${usd(d.pay.low)} to ${usd(d.pay.high)} a year, with the full spread running from ${usd(d.pay.min)} to ${usd(d.pay.max)}. Pay varies a lot with level and location.`
        : `Too few of the postings we read published a pay range to give a figure.`,
    },
    {
      q: `Which companies are hiring ${role.plural.toLowerCase()}?`,
      a: `Right now: ${d.topCompanies.slice(0, 6).map(c => `${c.company} (${c.n})`).join(', ')}, among ${d.companyCount} companies we track.`,
    },
  ]

  return (
    <div>
      <JsonLd
        data={[
          breadcrumbs([
            { name: 'Home', path: '/' },
            { name: 'Roles', path: '/roles' },
            { name: role.name, path: `/roles/${role.slug}` },
          ]),
          faqPage(faqs),
          {
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: `Open ${role.name} jobs`,
            numberOfItems: d.total,
            itemListElement: d.latest.slice(0, 20).map((j, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE_URL}${j.href}`, name: `${j.title} at ${j.company}` })),
          },
        ]}
      />
      <section className="pt-14 pb-8">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <Crumbs items={[{ name: 'Roles', href: '/roles' }, { name: role.name }]} />
          <h1 className="font-display text-[clamp(2.2rem,4.8vw,3.3rem)] leading-[1.05] mb-4" style={{ textWrap: 'balance' }}>
            {role.name} jobs: skills, pay and who’s hiring
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {d.total.toLocaleString('en-US')} open {role.name.toLowerCase()} roles at {d.companyCount} companies right now
            {d.remote ? `, ${d.remote} of them remote` : ''}. Skills and pay below come from reading the {d.read} newest postings
            in full; nothing is estimated.
          </p>
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              ['Open roles', d.total.toLocaleString('en-US')],
              ['Companies hiring', String(d.companyCount)],
              ['Typical pay (US)', d.pay ? `${usd(d.pay.low)}–${usd(d.pay.high)}` : '—'],
              ['Remote', d.total ? `${Math.round((d.remote / d.total) * 100)}%` : '—'],
            ].map(([k, v]) => (
              <div key={k} className="rounded-2xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <div className="text-[11px] font-semibold uppercase tracking-[0.07em]" style={{ color: 'var(--text-muted)' }}>
                  {k}
                </div>
                <div className="font-display text-[1.7rem] leading-tight mt-1 tabular-nums" style={{ color: 'var(--text)' }}>
                  {v}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {d.skills.length > 0 && (
        <Section kicker="Skills" title={`What employers ask ${role.plural.toLowerCase()} for`}>
          <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-3">
            {d.skills.map(([s, n]) => (
              <li key={s}>
                <div className="flex justify-between text-[14.5px]">
                  <span style={{ color: 'var(--text)' }}>{s}</span>
                  <span className="tabular-nums" style={{ color: 'var(--text-muted)' }}>
                    {Math.round((n / d.read) * 100)}% of postings
                  </span>
                </div>
                <div className="h-1.5 rounded-full mt-1.5 overflow-hidden" style={{ background: 'var(--bg-overlay)' }}>
                  <div className="h-full rounded-full" style={{ width: `${(n / d.read) * 100}%`, background: 'var(--accent-solid)' }} />
                </div>
              </li>
            ))}
          </ul>
          {d.soft.length > 0 && (
            <p className="mt-6 text-[14.5px]" style={{ color: 'var(--text-secondary)' }}>
              Soft skills mentioned most: {d.soft.map(([s]) => s).join(', ')}.
            </p>
          )}
          <p className="mt-4 text-[13px]" style={{ color: 'var(--text-muted)' }}>
            Share of the {d.read} newest postings that name each skill. Check your resume against a real posting with the{' '}
            <Link prefetch={false} href="/tools/ats-resume-checker" className="underline" style={{ color: 'var(--accent)' }}>
              free ATS resume checker
            </Link>
            .
          </p>
        </Section>
      )}

      {d.pay && (
        <Section kicker="Pay" title={`What ${role.plural.toLowerCase()} are paid`}>
          <p className="text-[16px] leading-relaxed max-w-3xl" style={{ color: 'var(--text-secondary)' }}>
            {d.pay.postings} of the postings we read publish a US pay range, as many states now require. The typical posted range
            is <strong style={{ color: 'var(--text)' }}>{usd(d.pay.low)} to {usd(d.pay.high)}</strong> a year (the median low and
            median high), and the full spread runs from {usd(d.pay.min)} to {usd(d.pay.max)}. Seniority and location explain most
            of the difference; equity and bonus are not included.
          </p>
        </Section>
      )}

      <Section kicker="Who’s hiring" title={`Companies hiring ${role.plural.toLowerCase()}`}>
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {d.topCompanies.map(c => (
            <li key={c.board}>
              <Link prefetch={false} href={`/companies/${c.board}`} className="flex justify-between rounded-2xl px-4 py-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <span className="font-medium" style={{ color: 'var(--text)' }}>
                  {c.company}
                </span>
                <span className="tabular-nums text-[13px]" style={{ color: 'var(--text-muted)' }}>
                  {c.n} open
                </span>
              </Link>
            </li>
          ))}
        </ul>
        {d.topCities.length > 0 && (
          <p className="mt-5 text-[14.5px]" style={{ color: 'var(--text-secondary)' }}>
            Most roles are in {d.topCities.slice(0, 6).map(([c]) => c).join(', ')}.
          </p>
        )}
      </Section>

      <Section kicker="Open now" title={`Latest ${role.name.toLowerCase()} jobs`}>
        <ul className="divide-y rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
          {d.latest.map(j => (
            <li key={j.href} style={{ borderColor: 'var(--border)' }}>
              <Link prefetch={false} href={j.href} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 px-5 py-3 hover:bg-[var(--bg-overlay)]">
                <span className="text-[15px] font-medium" style={{ color: 'var(--text)' }}>
                  {j.title} <span style={{ color: 'var(--text-muted)' }}>· {j.company}</span>
                </span>
                <span className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
                  {j.location}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <Ctas />
      </Section>

      <Section kicker="Questions" title={`${role.name} jobs: common questions`}>
        <div className="space-y-5 max-w-3xl">
          {faqs.map(f => (
            <div key={f.q}>
              <h3 className="text-[16px] font-semibold" style={{ color: 'var(--text)' }}>
                {f.q}
              </h3>
              <p className="mt-1 text-[15px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {f.a}
              </p>
            </div>
          ))}
        </div>
      </Section>
    </div>
  )
}
