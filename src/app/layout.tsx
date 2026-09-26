import type { Metadata, Viewport } from 'next'
import { FAQ } from '@/lib/faq'
import './globals.css'
import { THEME_INIT_SCRIPT } from '@/lib/theme'

const SITE_URL = 'https://applymaster.ai'
const SITE_NAME = 'ApplyMaster'
const SITE_TITLE = 'ApplyMaster — AI Auto Job Application System | Never Apply Manually Again'
const SITE_DESC = 'ApplyMaster finds matching jobs every morning, tailors your resume for each one, drafts cover letters and fills in the application form — you review and send. Plus referral paths through people you already know.'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  /* Browser chrome colour. Must track the --bg token in globals.css,
     otherwise the address bar disagrees with the page. */
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#12100e' },
    { media: '(prefers-color-scheme: light)', color: '#faf8f5' },
  ],
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: SITE_TITLE,
    template: '%s | ApplyMaster',
  },
  description: SITE_DESC,
  keywords: [
    'AI job application', 'auto apply jobs', 'resume optimizer', 'ATS resume builder',
    'cover letter generator', 'job search automation', 'ATS optimization',
    'automatic job application', 'AI resume', 'job application bot',
    'apply to jobs automatically', 'LinkedIn auto apply', 'Indeed auto apply',
    'job search AI', 'resume ATS checker', 'interview coach AI',
    'AI career assistant', 'job application tracker', 'smart job matching',
    'auto apply LinkedIn', 'auto apply Indeed', 'auto apply Glassdoor',
    'AI interview prep', 'cover letter AI', 'resume keyword optimizer',
    'job application automation tool', 'ApplyMaster', 'applymaster.ai',
  ],

  applicationName: SITE_NAME,
  authors: [{ name: 'ApplyMaster', url: SITE_URL }],
  creator: 'ApplyMaster',
  publisher: 'ApplyMaster',
  category: 'Technology',

  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.svg',
  },

  manifest: '/manifest.json',

  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESC,
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'ApplyMaster — AI Auto Job Application System',
        type: 'image/png',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESC,
    images: [`${SITE_URL}/og-image.png`],
    creator: '@applymaster_ai',
    site: '@applymaster_ai',
  },

  alternates: {
    canonical: SITE_URL,
  },

  verification: {
    // Add your verification codes here once you register:
    // google: 'YOUR_GOOGLE_VERIFICATION_CODE',
    // yandex: 'YOUR_YANDEX_VERIFICATION_CODE',
    // bing: 'YOUR_BING_VERIFICATION_CODE',
  },

  other: {
    'msapplication-TileColor': '#a8325c',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'apple-mobile-web-app-title': SITE_NAME,
  },
}

// JSON-LD Structured Data
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    // Organization
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
      },
      sameAs: [
        'https://twitter.com/applymaster_ai',
        'https://linkedin.com/company/applymaster',
        'https://instagram.com/applymaster.ai',
        'https://github.com/applymaster',
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        url: `${SITE_URL}/#contact`,
      },
    },
    // Website
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      description: SITE_DESC,
      publisher: { '@id': `${SITE_URL}/#organization` },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${SITE_URL}/jobs?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    },
    // SoftwareApplication
    {
      '@type': 'SoftwareApplication',
      name: SITE_NAME,
      url: SITE_URL,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      description: SITE_DESC,
      offers: [
        {
          '@type': 'Offer',
          name: 'Free Plan',
          price: '0',
          priceCurrency: 'USD',
          description: '10 applications/month, resume optimization, job search, application tracking',
        },
        {
          '@type': 'Offer',
          name: 'Pro Plan',
          price: '29',
          priceCurrency: 'USD',
          description: 'Unlimited applications, AI auto-apply, interview coach, priority support',
        },
      ],
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.9',
        ratingCount: '2847',
        bestRating: '5',
        worstRating: '1',
      },
    },
    // FAQPage
    {
      '@type': 'FAQPage',
      mainEntity: FAQ.map(f => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    /* suppressHydrationWarning: the inline script below mutates the class
       list on <html> before React hydrates, so server and client markup
       legitimately differ on this one element. */
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <head>
        {/* Theme must resolve before first paint, otherwise every load
            flashes the wrong theme. Keep this first in <head>. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />

        {/* Scroll-reveal wrappers render at opacity 0 and are un-hidden by
            JS. Without this, a script failure or a no-JS client sees a blank
            page. */}
        <noscript>
          <style>{'[data-reveal]{opacity:1 !important;transform:none !important}'}</style>
        </noscript>

        {/* Preconnect to critical origins */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
