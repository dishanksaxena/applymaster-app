import { getAllBoards, jobPath } from '@/lib/public-jobs'
import { SITE_URL } from '@/lib/seo/site'

/**
 * Every open job page, plus each company's jobs page. Built from the live
 * boards, so closed roles drop out at the next refresh. Listed in robots.txt
 * next to the main sitemap.
 */

export const revalidate = 21600

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export async function GET() {
  const boards = await getAllBoards()
  const urls: string[] = [`<url><loc>${SITE_URL}/companies</loc><changefreq>daily</changefreq><priority>0.8</priority></url>`]
  for (const b of boards) {
    const newest = b.jobs.reduce((m, j) => (j.updated > m ? j.updated : m), '')
    urls.push(`<url><loc>${SITE_URL}/companies/${b.board}</loc>${newest ? `<lastmod>${new Date(newest).toISOString()}</lastmod>` : ''}<changefreq>daily</changefreq><priority>0.7</priority></url>`)
    for (const j of b.jobs) urls.push(`<url><loc>${esc(SITE_URL + jobPath(b.board, j))}</loc><lastmod>${new Date(j.updated).toISOString()}</lastmod><priority>0.6</priority></url>`)
  }
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } })
}
