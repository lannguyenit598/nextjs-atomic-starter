import type { NextConfig } from 'next'

const isDev = process.env.NODE_ENV === 'development'

/**
 * CSP without nonces (docs: 02-guides/content-security-policy.md, "Without Nonces").
 * Nonces would force every page to render dynamically and are incompatible with Partial
 * Prerendering, which /dashboard and /tasks use. 'unsafe-inline' is required for Next.js' own
 * inline scripts and the theme script in app/layout.tsx; everything else is locked to 'self'.
 * Add third-party origins (analytics, CDN, API called from the browser) here when you need them.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data:",
  "font-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  // 'upgrade-insecure-requests' is left out on purpose: it breaks plain-HTTP intranet deployments.
  // Behind HTTPS, add it (or better, HSTS at your proxy/CDN).
].join('; ')

const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Legacy equivalent of frame-ancestors 'none' for older browsers.
  { key: 'X-Frame-Options', value: 'DENY' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
  },
]

const nextConfig: NextConfig = {
  // Next.js 16 defaults: Cache Components (explicit caching with 'use cache', streaming with <Suspense>).
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }]
  },
  async redirects() {
    return [{ source: '/', destination: '/dashboard', permanent: false }]
  },
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
}

export default nextConfig
