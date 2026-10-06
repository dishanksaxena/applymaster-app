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

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: PRIVATE },
      { userAgent: AI_CRAWLERS, allow: '/', disallow: PRIVATE },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
