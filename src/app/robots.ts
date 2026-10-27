import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo/site'

/**
 * Search engines and AI assistants may read every public page. The signed-in
 * app and the API are kept out: they hold nothing public and only waste crawl.
 *
 * /_next/ is deliberately NOT blocked. It holds the site's JavaScript and CSS;
 * blocking it stops Google rendering the pages, and the home page is built in
 * the browser.
 */

const PRIVATE = [
  '/api/',
  '/admin',
  '/auth/',
  '/dashboard',
  '/onboarding',
  '/jobs',
  '/saved-jobs',
  '/applications',
  '/resume',
  '/cover-letters',
  '/interview-coach',
  '/network',
  '/auto-apply',
  '/extension',
  '/profile',
  '/settings',
  '/notifications',
  '/reset-password',
  '/forgot-password',
]

// Named so it is explicit that answer engines are welcome to read and cite the public pages.
const AI_CRAWLERS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-SearchBot',
  'Claude-User',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'Applebot',
  'Applebot-Extended',
  'Amazonbot',
  'DuckAssistBot',
  'meta-externalagent',
  'MistralAI-User',
  'CCBot',
]

/* SEO-tool and scraper bots: they crawl every page for their own databases
   and send no visitors. Shut out entirely; Google and Bing are unaffected. */
const NO_VALUE_BOTS = [
  'AhrefsBot', 'SemrushBot', 'MJ12bot', 'DotBot', 'PetalBot', 'Bytespider', 'DataForSeoBot', 'BLEXBot', 'Barkrowler', 'serpstatbot',
  'SeekportBot', 'MauiBot', 'Awario', 'ImagesiftBot', 'Timpibot', 'omgili', 'Diffbot',
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: PRIVATE },
      // AI assistants may read and cite the site, but not crawl the 17,000 job pages: those are for search engines' job listings.
      { userAgent: AI_CRAWLERS, allow: '/', disallow: [...PRIVATE, '/companies/'] },
      { userAgent: NO_VALUE_BOTS, disallow: '/' },
    ],
    sitemap: [`${SITE_URL}/sitemap.xml`, `${SITE_URL}/sitemap-jobs.xml`],
    host: SITE_URL,
  }
}
