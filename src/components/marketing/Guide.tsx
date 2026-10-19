import Link from 'next/link'
import { SITE_URL, breadcrumbs } from '@/lib/seo/site'
import { Crumbs, Ctas, JsonLd } from './Landing'

/* Long-form guides (/guides/*): one readable column, Article structured data,
   and a byline linking to /about so readers and search engines know who is behind it. */

export type GuideMeta = {
  slug: string
  title: string
  description: string
  published: string // YYYY-MM-DD
  updated?: string
}

export function guideSchema(g: GuideMeta) {
  const url = `${SITE_URL}/guides/${g.slug}`
  return [
    breadcrumbs([
      { name: 'Home', path: '/' },
      { name: 'Guides', path: '/guides' },
      { name: g.title, path: `/guides/${g.slug}` },
    ]),
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: g.title,
      description: g.description,
      url,
      mainEntityOfPage: url,
      datePublished: g.published,
      dateModified: g.updated ?? g.published,
      image: `${SITE_URL}/og-image.png`,
      author: { '@type': 'Organization', name: 'ApplyMaster', url: `${SITE_URL}/about` },
      publisher: { '@type': 'Organization', name: 'ApplyMaster', url: SITE_URL, logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` } },
    },
  ]
}

export function Guide({ meta, children, extraSchema = [] }: { meta: GuideMeta; children: React.ReactNode; extraSchema?: object[] }) {
  const date = (d: string) => new Date(d + 'T12:00:00Z').toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
  return (
    <article className="pt-14 pb-16">
      <JsonLd data={[...guideSchema(meta), ...extraSchema]} />
      <div className="mx-auto max-w-[720px] px-6">
        <Crumbs items={[{ name: 'Guides', href: '/guides' }, { name: meta.title }]} />
        <h1 className="font-display text-[clamp(2.1rem,4.6vw,3.1rem)] leading-[1.08] mb-4" style={{ textWrap: 'balance' }}>
          {meta.title}
        </h1>
        <p className="text-[13.5px] mb-8" style={{ color: 'var(--text-muted)' }}>
          By the{' '}
          <Link href="/about" className="underline underline-offset-2">
            ApplyMaster team
          </Link>{' '}
          · {meta.updated ? `Updated ${date(meta.updated)}` : date(meta.published)}
        </p>
        <div className="guide-body space-y-5 text-[16.5px] leading-[1.75]" style={{ color: 'var(--text-secondary)' }}>
          {children}
        </div>
        <div className="mt-12 rounded-2xl p-6" style={{ background: 'var(--accent-dim)' }}>
          <p className="font-display text-[1.35rem] leading-snug" style={{ color: 'var(--text)' }}>
            Let ApplyMaster do the typing
          </p>
          <p className="mt-1.5 text-[14.5px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            The free ApplyMaster extension fills applications on Workday, Greenhouse, Lever and more from your resume. You check
            every answer and press Submit, and it keeps a receipt of what you sent.
          </p>
          <Ctas />
        </div>
      </div>
    </article>
  )
}

/** Section heading inside a guide, with an anchor. */
export function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="font-display text-[1.65rem] leading-tight pt-6 scroll-mt-24" style={{ color: 'var(--text)', textWrap: 'balance' }}>
      {children}
    </h2>
  )
}
