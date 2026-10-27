import type { Metadata } from 'next'
import Link from 'next/link'
import { Crumbs, JsonLd } from '@/components/marketing/Landing'
import { SITE_URL, breadcrumbs } from '@/lib/seo/site'
import { getAllBoards } from '@/lib/public-jobs'

export const revalidate = 86400 // daily: job pages are crawled heavily, and roles rarely change faster

const title = 'Jobs at Top Tech Companies'
const description = 'Open roles at Stripe, Anthropic, Databricks, Figma, Coinbase, Airbnb and more, read from each company’s own job board and refreshed daily.'

export const metadata: Metadata = {
  title: { absolute: `${title} | ApplyMaster` },
  description,
  alternates: { canonical: `${SITE_URL}/companies` },
  openGraph: { title, description, url: `${SITE_URL}/companies`, type: 'website', siteName: 'ApplyMaster' },
  twitter: { card: 'summary_large_image', title, description },
}

export default async function Companies() {
  const boards = (await getAllBoards()).sort((a, b) => b.jobs.length - a.jobs.length)
  const total = boards.reduce((n, b) => n + b.jobs.length, 0)
  return (
    <div>
      <JsonLd
        data={breadcrumbs([
          { name: 'Home', path: '/' },
          { name: 'Companies', path: '/companies' },
        ])}
      />
      <section className="pt-14 pb-16">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <Crumbs items={[{ name: 'Home', href: '/' }, { name: 'Companies' }]} />
          <h1 className="font-display text-[clamp(2.3rem,5vw,3.5rem)] leading-[1.05] mb-4">Jobs at top tech companies</h1>
          <p className="max-w-2xl text-lg leading-relaxed mb-10" style={{ color: 'var(--text-secondary)' }}>
            {total.toLocaleString('en-US')} open roles at {boards.length} companies, read from each company’s own job board
            and refreshed daily. Each one applies through Greenhouse or Lever, which the free ApplyMaster extension fills
            from your resume.
          </p>
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {boards.map(b => (
              <li key={b.board}>
                <Link prefetch={false} href={`/companies/${b.board}`} className="flex items-center justify-between gap-3 rounded-2xl px-5 py-4 transition-transform hover:-translate-y-0.5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                  <span className="text-[16px] font-semibold" style={{ color: 'var(--text)' }}>
                    {b.company}
                  </span>
                  <span className="text-[13px] tabular-nums" style={{ color: 'var(--text-muted)' }}>
                    {b.jobs.length} jobs
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  )
}
