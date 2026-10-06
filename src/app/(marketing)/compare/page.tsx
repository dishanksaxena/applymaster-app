import type { Metadata } from 'next'
import Link from 'next/link'
import { CHECKED, COMPETITORS } from '@/lib/seo/competitors'
import { SITE_URL, breadcrumbs } from '@/lib/seo/site'
import { Crumbs, Ctas, JsonLd, Section } from '@/components/marketing/Landing'

const title = 'ApplyMaster Alternatives and Comparisons'
const description = `How ApplyMaster compares with ${COMPETITORS.map(c => c.name).join(', ')}: who submits your applications, prices, and when each is the better choice.`

export const metadata: Metadata = {
  title: { absolute: `${title} | ApplyMaster` },
  description,
  alternates: { canonical: `${SITE_URL}/compare` },
  openGraph: { title, description, url: `${SITE_URL}/compare`, type: 'website', siteName: 'ApplyMaster' },
  twitter: { card: 'summary_large_image', title, description },
}

export default function CompareHub() {
  return (
    <div>
      <JsonLd
        data={breadcrumbs([
          { name: 'Home', path: '/' },
          { name: 'Compare', path: '/compare' },
        ])}
      />
      <section className="pt-14 pb-12">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <Crumbs items={[{ name: 'Home', href: '/' }, { name: 'Compare' }]} />
          <h1 className="font-display text-[clamp(2.3rem,5vw,3.5rem)] leading-[1.05] mb-5" style={{ textWrap: 'balance' }}>
            Job application tools, <em className="font-display-italic" style={{ color: 'var(--accent)' }}>compared honestly</em>
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            The biggest difference between these tools is who presses Submit. Some send applications for you;
            ApplyMaster fills them on the employer’s site and you send them. Each comparison uses what the other company
            publishes about itself, and says when it is the better choice.
          </p>
        </div>
      </section>

      <Section kicker={`Checked ${CHECKED}`} title="Comparisons">
        <ul className="grid sm:grid-cols-2 gap-4">
          {COMPETITORS.map(c => (
            <li key={c.slug}>
              <Link
                href={`/compare/${c.slug}`}
                className="block h-full rounded-2xl p-5 transition-transform hover:-translate-y-0.5"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
              >
                <h2 className="text-[17px] font-semibold" style={{ color: 'var(--text)' }}>
                  ApplyMaster vs {c.name}
                </h2>
                <p className="mt-2 text-[13.5px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {c.summary}
                </p>
              </Link>
            </li>
          ))}
        </ul>
        <Ctas />
      </Section>
    </div>
  )
}
