/**
 * Site-wide facts the public pages, sitemap and structured data share.
 *
 * The site lives on www: the bare domain redirects there, so canonical URLs,
 * the sitemap and structured data must all name www, or search engines are
 * told the real page is one that redirects.
 */
export const SITE_URL = 'https://www.applymaster.ai'
export const SITE_NAME = 'ApplyMaster'

export const STORE_URL = 'https://chromewebstore.google.com/detail/applymaster-fill-job-appl/jpnbfdkbfgeojdihbolnnipjmkhjnfni'

/**
 * The extension version people get from the Chrome Web Store today. Portal
 * pages for portals added in a later version stay unpublished until this is
 * bumped, so a page never promises what the store version cannot do.
 * Bump it when a new version is live in the store.
 */
export const STORE_VERSION = '1.1.0'

export const newerOrEqual = (a: string, b: string) => {
  const x = a.split('.').map(Number)
  const y = b.split('.').map(Number)
  for (let i = 0; i < 3; i++) if ((x[i] ?? 0) !== (y[i] ?? 0)) return (x[i] ?? 0) > (y[i] ?? 0)
  return true
}

export const abs = (path: string) => `${SITE_URL}${path === '/' ? '' : path}`

export function breadcrumbs(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: abs(it.path) })),
  }
}

export function faqPage(faqs: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  }
}

/** The Chrome extension, as a product. Free to install; works with a free account. */
export const extensionSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'ApplyMaster: Fill job applications',
  applicationCategory: 'BrowserApplication',
  operatingSystem: 'Chrome',
  url: STORE_URL,
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
}
