import { SITE_URL } from '@/lib/seo/site'
import { POSTS, postUrl } from '@/lib/blog/posts'

/**
 * RSS 2.0 feed of every post. Feed readers and aggregators pick new posts up
 * within hours, and Google accepts an RSS feed as a sitemap — submitted in
 * Search Console it is the fastest way to tell Google a post exists.
 */
export const dynamic = 'force-static'

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export function GET() {
  const items = POSTS.map(
    p => `    <item>
      <title>${esc(p.title)}</title>
      <link>${postUrl(p)}</link>
      <guid isPermaLink="true">${postUrl(p)}</guid>
      <description>${esc(p.description)}</description>
      <category>${esc(p.category)}</category>
      <pubDate>${new Date(p.published).toUTCString()}</pubDate>
    </item>`
  ).join('\n')
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>ApplyMaster Blog</title>
    <link>${SITE_URL}/blog</link>
    <atom:link href="${SITE_URL}/blog/rss.xml" rel="self" type="application/rss+xml" />
    <description>Honest job-search advice: AI tools, applications, layoffs, visas and interviews.</description>
    <language>en</language>
    <lastBuildDate>${new Date(POSTS[0].modified).toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>
`
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8', 'Cache-Control': 'public, s-maxage=3600' } })
}
