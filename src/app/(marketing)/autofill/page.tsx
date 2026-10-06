import type { Metadata } from 'next'
import Link from 'next/link'
import { livePortals, portalNames } from '@/lib/seo/portals'
import { SITE_URL, breadcrumbs, extensionSchema } from '@/lib/seo/site'
import { Crumbs, Ctas, JsonLd, Section } from '@/components/marketing/Landing'

const title = 'Job Application Autofill Extension for Chrome'
const description =
  `Fill job applications on ${portalNames()} from your resume. Free Chrome extension; you check every answer and press Submit yourself.`

export const metadata: Metadata = {
  title: { absolute: `${title} | ApplyMaster` },
  description,
  alternates: { canonical: `${SITE_URL}/autofill` },
  openGraph: { title, description, url: `${SITE_URL}/autofill`, type: 'website', siteName: 'ApplyMaster' },
  twitter: { card: 'summary_large_image', title, description },
}

export default function AutofillHub() {
  const portals = livePortals()
  return (
    <div>
      <JsonLd
        data={[
          breadcrumbs([
            { name: 'Home', path: '/' },
            { name: 'Autofill', path: '/autofill' },
          ]),
          extensionSchema,
          {
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            itemListElement: portals.map((p, i) => ({ '@type': 'ListItem', position: i + 1, name: `${p.name} autofill`, url: `${SITE_URL}/autofill/${p.slug}` })),
          },
        ]}
      />
      <section className="pt-14 pb-12">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <Crumbs items={[{ name: 'Home', href: '/' }, { name: 'Autofill' }]} />
          <h1 className="font-display text-[clamp(2.3rem,5vw,3.5rem)] leading-[1.05] mb-5" style={{ textWrap: 'balance' }}>
            Stop typing your resume into <em className="font-display-italic" style={{ color: 'var(--accent)' }}>every</em> application
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            The ApplyMaster Chrome extension fills job applications on the employer’s own site from your resume and
            profile: contact details, links, resume upload and the questions most forms ask. You read every answer and
            press Submit yourself, and ApplyMaster keeps a receipt of what you sent.
          </p>
          <Ctas />
        </div>
      </section>

      <Section kicker="Application systems" title="Pick the system you are applying through">
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {portals.map(p => (
            <li key={p.slug}>
              <Link
                href={`/autofill/${p.slug}`}
                className="block h-full rounded-2xl p-5 transition-transform hover:-translate-y-0.5"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
              >
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-[17px] font-semibold" style={{ color: 'var(--text)' }}>
                    {p.name}
                  </h2>
                  <span className="text-[12px] font-semibold" style={{ color: 'var(--accent)' }} aria-hidden="true">
                    →
                  </span>
                </div>
                <p className="mt-2 text-[13.5px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {p.multiStep ? 'Multi-page: each page is filled as you reach it.' : 'Single page: filled in one click.'}
                  {p.slug === 'workday' ? ' Includes your work history and education.' : ''}
                </p>
                <p className="mt-2 text-[12px]" style={{ color: 'var(--text-muted)' }}>
                  {p.hosts}
                </p>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-[14px]" style={{ color: 'var(--text-muted)' }}>
          On any other job site, click the ApplyMaster button in Chrome’s toolbar and it fills what it recognises.
        </p>
      </Section>
    </div>
  )
}
