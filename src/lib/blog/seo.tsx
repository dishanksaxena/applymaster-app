import type { Metadata } from 'next'
import { SITE_URL, breadcrumbs, faqPage } from '@/lib/seo/site'
import { postBySlug, postImage, postUrl } from './posts'

export const RSS_URL = `${SITE_URL}/blog/rss.xml`

function need(slug: string) {
  const p = postBySlug(slug)
  if (!p) throw new Error(`Blog post "${slug}" is not in src/lib/blog/posts.ts`)
  return p
}

/** Full metadata for a post, from the registry: one source, no drift. */
export function postMetadata(slug: string, keywords: string[] = []): Metadata {
  const p = need(slug)
  const url = postUrl(p)
  const image = { url: postImage(p), width: 1200, height: 630, alt: p.title }
  return {
    title: p.title,
    description: p.description,
    keywords,
    alternates: { canonical: url, types: { 'application/rss+xml': RSS_URL } },
    openGraph: {
      title: p.title,
      description: p.description,
      url,
      type: 'article',
      siteName: 'ApplyMaster',
      publishedTime: p.published,
      modifiedTime: p.modified,
      section: p.category,
      authors: ['ApplyMaster Team'],
      images: [image],
    },
    twitter: { card: 'summary_large_image', title: p.title, description: p.description, images: [image.url] },
  }
}

/**
 * Article (with the image Google requires for article rich results),
 * BreadcrumbList, and FAQPage when the post has a visible FAQ. FAQ text must
 * match what the page shows.
 */
export function PostJsonLd({ slug, faqs }: { slug: string; faqs?: { q: string; a: string }[] }) {
  const p = need(slug)
  const url = postUrl(p)
  const data: object[] = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: p.title,
      description: p.description,
      image: [postImage(p)],
      datePublished: p.published,
      dateModified: p.modified,
      articleSection: p.category,
      inLanguage: 'en',
      author: { '@type': 'Organization', name: 'ApplyMaster', url: SITE_URL },
      publisher: { '@type': 'Organization', name: 'ApplyMaster', logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` } },
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    },
    breadcrumbs([
      { name: 'Home', path: '/' },
      { name: 'Blog', path: '/blog' },
      { name: p.title, path: `/blog/${p.slug}` },
    ]),
  ]
  if (faqs?.length) data.push(faqPage(faqs))
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
}
