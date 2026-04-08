/** @type {import('next').NextConfig} */
const nextConfig = {
  // Compress responses
  compress: true,

  // Production source maps off for smaller bundles
  productionBrowserSourceMaps: false,

  // Strict mode for better React practices
  reactStrictMode: true,

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

  // SEO redirects — canonical URL enforcement + old domain redirect
  async redirects() {
    return [
      // Force www to non-www (canonical)
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.applymaster.ai' }],
        destination: 'https://applymaster.ai/:path*',
        permanent: true,
      },
      // Redirect old domain
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'owzify.com' }],
        destination: 'https://applymaster.ai/:path*',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.owzify.com' }],
        destination: 'https://applymaster.ai/:path*',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
