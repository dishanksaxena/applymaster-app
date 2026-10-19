import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE_URL, breadcrumbs } from '@/lib/seo/site'
import { Crumbs, JsonLd } from '@/components/marketing/Landing'

const title = 'Job Application Guides'
const description = 'Practical guides to applying for jobs: getting through Workday applications faster, and using a job description’s keywords on your resume.'

export const metadata: Metadata = {
  title: { absolute: `${title} | ApplyMaster` },
  description,
  alternates: { canonical: `${SITE_URL}/guides` },
  openGraph: { title, description, url: `${SITE_URL}/guides`, type: 'website', siteName: 'ApplyMaster' },
  twitter: { card: 'summary_large_image', title, description },
}

const GUIDES = [
  {
    href: '/guides/workday-application-tips',
    name: 'How to apply on Workday faster',
    body: 'What each Workday page asks, what you can skip, and nine ways to finish in minutes.',
  },
  {
    href: '/guides/resume-keywords',
    name: 'Finding and using resume keywords',
    body: 'Which words in a posting matter, where to put them, and the keyword mistakes that backfire.',
  },
]

export default function GuidesHub() {
  return (
    <div>
      <JsonLd
        data={breadcrumbs([
          { name: 'Home', path: '/' },
          { name: 'Guides', path: '/guides' },
        ])}
      />
      <section className="pt-14 pb-16">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <Crumbs items={[{ name: 'Home', href: '/' }, { name: 'Guides' }]} />
          <h1 className="font-display text-[clamp(2.3rem,5vw,3.5rem)] leading-[1.05] mb-4">Guides</h1>
          <p className="max-w-2xl text-lg leading-relaxed mb-10" style={{ color: 'var(--text-secondary)' }}>
            Practical, honest help with applying for jobs.
          </p>
          <ul className="grid sm:grid-cols-2 gap-4">
            {GUIDES.map(g => (
              <li key={g.href}>
                <Link href={g.href} className="block h-full rounded-2xl p-5 transition-transform hover:-translate-y-0.5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                  <h2 className="text-[17px] font-semibold" style={{ color: 'var(--text)' }}>
                    {g.name}
                  </h2>
                  <p className="mt-2 text-[14px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {g.body}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  )
}
