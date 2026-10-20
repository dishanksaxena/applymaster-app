import type { Metadata } from 'next'
import Link from 'next/link'
import { Crumbs, JsonLd } from '@/components/marketing/Landing'
import { SITE_URL, breadcrumbs } from '@/lib/seo/site'
import { ROLES, roleOf } from '@/lib/role-insights'
import { getAllBoards } from '@/lib/public-jobs'

export const revalidate = 21600

const title = 'Skills, Pay and Hiring by Role'
const description = 'For each role, the skills employers ask for, the pay ranges they publish and who is hiring, counted from thousands of live job postings.'

export const metadata: Metadata = {
  title: { absolute: `${title} | ApplyMaster` },
  description,
  alternates: { canonical: `${SITE_URL}/roles` },
  openGraph: { title, description, url: `${SITE_URL}/roles`, type: 'website', siteName: 'ApplyMaster' },
  twitter: { card: 'summary_large_image', title, description },
}

export default async function Roles() {
  const counts = new Map<string, number>()
  for (const b of await getAllBoards()) for (const j of b.jobs) {
    const r = roleOf(j.title)
    if (r) counts.set(r.slug, (counts.get(r.slug) ?? 0) + 1)
  }
  return (
    <div>
      <JsonLd
        data={breadcrumbs([
          { name: 'Home', path: '/' },
          { name: 'Roles', path: '/roles' },
        ])}
      />
      <section className="pt-14 pb-16">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <Crumbs items={[{ name: 'Home', href: '/' }, { name: 'Roles' }]} />
          <h1 className="font-display text-[clamp(2.3rem,5vw,3.5rem)] leading-[1.05] mb-4">Skills, pay and hiring by role</h1>
          <p className="max-w-2xl text-lg leading-relaxed mb-10" style={{ color: 'var(--text-secondary)' }}>
            Counted from live postings at the companies we track, refreshed every few hours: what employers ask for, what they
            publish as pay, and who is hiring.
          </p>
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {ROLES.map(r => (
              <li key={r.slug}>
                <Link href={`/roles/${r.slug}`} className="flex justify-between gap-3 rounded-2xl px-5 py-4 transition-transform hover:-translate-y-0.5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                  <span className="text-[15.5px] font-semibold" style={{ color: 'var(--text)' }}>
                    {r.name}
                  </span>
                  <span className="text-[13px] tabular-nums shrink-0" style={{ color: 'var(--text-muted)' }}>
                    {(counts.get(r.slug) ?? 0).toLocaleString('en-US')} open
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
