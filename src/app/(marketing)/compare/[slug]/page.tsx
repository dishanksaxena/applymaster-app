import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CHECKED, COMPETITORS, US_NEVER, competitorBySlug } from '@/lib/seo/competitors'
import { SITE_URL, breadcrumbs, faqPage } from '@/lib/seo/site'
import { Checks, Crumbs, Ctas, Faqs, JsonLd, Section } from '@/components/marketing/Landing'

export const dynamicParams = false

export function generateStaticParams() {
  return COMPETITORS.map(c => ({ slug: c.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const c = competitorBySlug(params.slug)
  if (!c) return {}
  const title = `ApplyMaster vs ${c.name}: An Honest Comparison`
  const description = `${c.name} or ApplyMaster? Who submits your applications, what each costs, where each works, and when ${c.name} is the better choice. Checked ${CHECKED}.`
  const url = `${SITE_URL}/compare/${c.slug}`
  return {
    title: { absolute: `${title} | ApplyMaster` },
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: 'article', siteName: 'ApplyMaster' },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default function ComparePage({ params }: { params: { slug: string } }) {
  const c = competitorBySlug(params.slug)
  if (!c) notFound()
  const others = COMPETITORS.filter(o => o.slug !== c.slug)

  return (
    <div>
      <JsonLd
        data={[
          breadcrumbs([
            { name: 'Home', path: '/' },
            { name: 'Compare', path: '/compare' },
            { name: `ApplyMaster vs ${c.name}`, path: `/compare/${c.slug}` },
          ]),
          faqPage(c.faqs),
        ]}
      />

      <section className="pt-14 pb-12">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <Crumbs items={[{ name: 'Compare', href: '/compare' }, { name: `ApplyMaster vs ${c.name}` }]} />
          <h1 className="font-display text-[clamp(2.3rem,5vw,3.5rem)] leading-[1.05] mb-5" style={{ textWrap: 'balance' }}>
            ApplyMaster vs <em className="font-display-italic" style={{ color: 'var(--accent)' }}>{c.name}</em>
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {c.summary} ApplyMaster fills applications on the employer’s own site and leaves Submit to you. Here is how they
            differ, using what {c.name} publishes about itself.
          </p>
          <p className="mt-4 text-[13px]" style={{ color: 'var(--text-muted)' }}>
            Checked {CHECKED}. Prices and features change; follow the links under the table for {c.name}’s current terms.
          </p>
        </div>
      </section>

      <Section kicker="Side by side" title={`${c.name} and ApplyMaster at a glance`}>
        {/* Phones: one card per question, both answers stacked, so neither column is off-screen. */}
        <ul className="md:hidden grid gap-3">
          {c.rows.map(r => (
            <li key={r.label} className="rounded-2xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <h3 className="text-[15px] font-semibold mb-3" style={{ color: 'var(--text)' }}>
                {r.label}
              </h3>
              <p className="text-[12px] font-semibold uppercase tracking-[0.06em]" style={{ color: 'var(--text-muted)' }}>
                {c.name}
              </p>
              <p className="text-[14px] leading-relaxed mt-1" style={{ color: 'var(--text-secondary)' }}>
                {r.them}
              </p>
              <p className="text-[12px] font-semibold uppercase tracking-[0.06em] mt-3" style={{ color: 'var(--accent)' }}>
                ApplyMaster
              </p>
              <p className="text-[14px] leading-relaxed mt-1" style={{ color: 'var(--text-secondary)' }}>
                {r.us}
              </p>
            </li>
          ))}
        </ul>
        <div className="hidden md:block overflow-x-auto rounded-2xl" style={{ border: '1px solid var(--border)' }}>
          <table className="w-full text-left text-[14px]">
            <thead>
              <tr style={{ background: 'var(--bg-overlay)' }}>
                <th scope="col" className="px-5 py-3 font-semibold w-[22%]" style={{ color: 'var(--text-muted)' }}>
                  &nbsp;
                </th>
                <th scope="col" className="px-5 py-3 font-semibold" style={{ color: 'var(--text)' }}>
                  {c.name}
                </th>
                <th scope="col" className="px-5 py-3 font-semibold" style={{ color: 'var(--accent)' }}>
                  ApplyMaster
                </th>
              </tr>
            </thead>
            <tbody>
              {c.rows.map(r => (
                <tr key={r.label} style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-card)' }}>
                  <th scope="row" className="px-5 py-4 align-top font-semibold" style={{ color: 'var(--text)' }}>
                    {r.label}
                  </th>
                  <td className="px-5 py-4 align-top leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {r.them}
                  </td>
                  <td className="px-5 py-4 align-top leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {r.us}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-[13px]" style={{ color: 'var(--text-muted)' }}>
          {c.name} sources:{' '}
          {c.sources.map((s, i) => (
            <span key={s.url}>
              {i > 0 && ' · '}
              <a href={s.url} target="_blank" rel="noopener nofollow" className="underline" style={{ color: 'var(--text-secondary)' }}>
                {s.label}
              </a>
            </span>
          ))}
        </p>
      </Section>

      <Section kicker="Which one fits" title="When each is the better choice">
        <div className="grid md:grid-cols-2 gap-5">
          <div className="rounded-2xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <h3 className="text-[16px] font-semibold mb-4" style={{ color: 'var(--text)' }}>
              Choose {c.name} if
            </h3>
            <Checks items={c.chooseThem} />
          </div>
          <div className="rounded-2xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-accent, var(--border))' }}>
            <h3 className="text-[16px] font-semibold mb-4" style={{ color: 'var(--accent)' }}>
              Choose ApplyMaster if
            </h3>
            <Checks items={c.chooseUs} />
          </div>
        </div>
        <p className="mt-6 text-[14.5px] leading-relaxed max-w-3xl" style={{ color: 'var(--text-secondary)' }}>
          Whichever you use, ApplyMaster’s rule is the same: it {US_NEVER.charAt(0).toLowerCase() + US_NEVER.slice(1)}
        </p>
        <Ctas />
      </Section>

      <Section kicker="Questions" title={`ApplyMaster vs ${c.name}: common questions`}>
        <Faqs items={c.faqs} />
      </Section>

      <Section kicker="More comparisons" title="ApplyMaster compared with">
        <ul className="flex flex-wrap gap-2.5">
          {others.map(o => (
            <li key={o.slug}>
              <Link
                href={`/compare/${o.slug}`}
                className="inline-block rounded-full px-4 py-2 text-[14px] font-medium"
                style={{ border: '1px solid var(--border)', color: 'var(--text)', background: 'var(--bg-card)' }}
              >
                ApplyMaster vs {o.name}
              </Link>
            </li>
          ))}
          <li>
            <Link
              href="/autofill"
              className="inline-block rounded-full px-4 py-2 text-[14px] font-medium"
              style={{ border: '1px solid var(--border)', color: 'var(--accent)', background: 'var(--bg-card)' }}
            >
              Where the extension works
            </Link>
          </li>
        </ul>
      </Section>
    </div>
  )
}
