/** @type {import('next').NextConfig} */
const nextConfig = {
  // Compress responses
  compress: true,

  // Production source maps off for smaller bundles
  productionBrowserSourceMaps: false,

  // Strict mode for better React practices
  reactStrictMode: true,

  /* pdf-parse (and the pdf.js it wraps) resolves its worker at runtime with
     a relative require of './pdf.worker.mjs'. Webpack cannot trace that, so
     bundling it produces "Setting up fake worker failed: Cannot find module
     './pdf.worker.mjs'" on every resume upload — local text extraction
     silently fails and every CV falls through to a Claude call that is
     slower and costs money to do what the library does offline.

     Left external, it is required from node_modules at runtime with its
     worker sitting where it expects to find it. */
  /* Playwright is the same story: coreBundle.js requires chromium-bidi
     through a path webpack cannot resolve, so bundling it fails the whole
     route with "Module not found: chromium-bidi/lib/cjs/bidiMapper". These
     are Node-only packages that must be loaded from node_modules at
     runtime, not bundled. */
  experimental: {
    serverComponentsExternalPackages: [
      'pdf-parse',
      'mammoth',
      'playwright',
      'playwright-core',
      '@sparticuz/chromium',
    ],
  },

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },

  // SEO-critical security + performance headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Security
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          // Performance — tells Google your site is fast
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
        ],
      },
      {
        // Long cache for static assets
        source: '/(.*)\\.(svg|png|jpg|jpeg|gif|ico|webp|avif|woff|woff2)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ]
  },

  // Trailing slash handling
  trailingSlash: false,
}

export default nextConfig
