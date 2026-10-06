import type { MetadataRoute } from 'next'
import fs from 'node:fs'
import path from 'node:path'
import { livePortals } from '@/lib/seo/portals'
import { COMPETITORS } from '@/lib/seo/competitors'
import { SITE_URL } from '@/lib/seo/site'

/**
 * Every public page, on the www host the site is served from. Built from the
 * routes themselves, so a new blog post, portal page or comparison is listed
 * without anyone editing an XML file.
 */

type Entry = MetadataRoute.Sitemap[number]
const page = (p: string, priority: number, changeFrequency: Entry['changeFrequency'] = 'weekly'): Entry => ({
  url: `${SITE_URL}${p === '/' ? '' : p}`,
  changeFrequency,
  priority,
})

function blogPosts(): string[] {
  try {
    const dir = path.join(process.cwd(), 'src/app/(marketing)/blog')
    return fs.readdirSync(dir).filter(d => fs.existsSync(path.join(dir, d, 'page.tsx')))
  } catch {
    return []
  }
}

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    page('/', 1, 'daily'),
    page('/autofill', 0.9),
    ...livePortals().map(p => page(`/autofill/${p.slug}`, 0.85)),
    page('/compare', 0.8),
    ...COMPETITORS.map(c => page(`/compare/${c.slug}`, 0.8)),
    page('/features', 0.8),
    ...['auto-apply', 'resume-optimizer', 'cover-letter-generator', 'interview-coach', 'job-matching'].map(f => page(`/features/${f}`, 0.75)),
    page('/pricing', 0.8),
    page('/integrations', 0.6),
    page('/blog', 0.7, 'daily'),
    ...blogPosts().map(slug => page(`/blog/${slug}`, 0.7, 'monthly')),
    page('/signup', 0.6, 'monthly'),
    page('/login', 0.3, 'monthly'),
    page('/support', 0.4, 'monthly'),
    page('/privacy', 0.3, 'yearly'),
    page('/terms', 0.3, 'yearly'),
  ]
}
