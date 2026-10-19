import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Crumbs, Ctas, JsonLd } from '@/components/marketing/Landing'
import { SITE_URL, breadcrumbs } from '@/lib/seo/site'
import { BOARDS, companyName, getBoardJobs, isBoard, jobPath, parseLocation } from '@/lib/public-jobs'

export const revalidate = 21600
export function generateStaticParams() {
  return BOARDS.map(board => ({ board }))
}

export async function generateMetadata({ params }: { params: { board: string } }): Promise<Metadata> {
  if (!isBoard(params.board)) return {}
  const jobs = (await getBoardJobs(params.board)) ?? []
  const company = companyName(params.board)
  const title = `${company} Jobs: ${jobs.length} Open Roles`
  const description = `All ${jobs.length} open roles at ${company}, updated every few hours from ${company}’s own job board, with what each posting asks for and a free tool to fill the application.`
  const url = `${SITE_URL}/companies/${params.board}`
  return {
    title: { absolute: `${title} | ApplyMaster` },
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: 'website', siteName: 'ApplyMaster' },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default async function CompanyJobs({ params }: { params: { board: string } }) {
  if (!isBoard(params.board)) notFound()
  const jobs = await getBoardJobs(params.board)
  if (!jobs) notFound()
  const company = companyName(params.board)
  const remote = jobs.filter(j => parseLocation(j.location).remote).length
  const places = new Map<string, number>()
  for (const j of jobs) for (const p of parseLocation(j.location).places) if (p.city) places.set(p.city, (places.get(p.city) ?? 0) + 1)
  const topPlaces = [...places.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6)

  return (
    <div>
      <JsonLd
        data={[
          breadcrumbs([
            { name: 'Home', path: '/' },
            { name: 'Companies', path: '/companies' },
            { name: `${company} jobs`, path: `/companies/${params.board}` },
          ]),
          {
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: `${company} jobs`,
            numberOfItems: jobs.length,
            itemListElement: jobs.slice(0, 100).map((j, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE_URL}${jobPath(params.board, j)}`, name: j.title })),
          },
        ]}
      />
      <section className="pt-14 pb-8">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <Crumbs items={[{ name: 'Companies', href: '/companies' }, { name: `${company} jobs` }]} />
          <h1 className="font-display text-[clamp(2.2rem,4.8vw,3.3rem)] leading-[1.05] mb-4">
            {company} jobs <span style={{ color: 'var(--text-muted)' }}>· {jobs.length} open</span>
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Every open role at {company}, read from {company}’s own Greenhouse job board and refreshed every few hours.
            {remote ? ` ${remote} of them can be done remotely.` : ''}
            {topPlaces.length ? ` Most are in ${topPlaces.slice(0, 3).map(([c]) => c).join(', ')}.` : ''}
          </p>
          <Ctas />
          <p className="mt-3 text-[13px]" style={{ color: 'var(--text-muted)' }}>
            {company} applications run on Greenhouse, which the free ApplyMaster extension fills from your resume.
          </p>
        </div>
      </section>
      <section className="pb-16">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <ul className="divide-y rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
            {jobs.map(j => (
              <li key={j.id} style={{ borderColor: 'var(--border)' }}>
                <Link href={jobPath(params.board, j)} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 px-5 py-3.5 hover:bg-[var(--bg-overlay)]">
                  <span className="text-[15px] font-medium" style={{ color: 'var(--text)' }}>
                    {j.title}
                  </span>
                  <span className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
                    {j.location}
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
