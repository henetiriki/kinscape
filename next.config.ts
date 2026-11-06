import type { NextConfig } from 'next';

/**
 * Headers every response carries. Next's inline scripts need `'unsafe-inline'` until a nonce
 * comes from `proxy.ts`; React's development tools need `'unsafe-eval'`. MapLibre runs its
 * workers from blob URLs. The app calls no other host.
 */
export const securityHeaders = (isDev: boolean) => [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "worker-src 'self' blob:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
  { key: 'Referrer-Policy', value: 'same-origin' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
];

const nextConfig: NextConfig = {
  headers: async () => [
    {
      headers: [
        // The whole site is private: keep every response out of search indexes.
        { key: 'X-Robots-Tag', value: 'noindex' },
        ...securityHeaders(process.env.NODE_ENV === 'development'),
      ],
      source: '/:path*',
    },
  ],
  // `server/db/database.mts` reads the CA at runtime; the trace doesn't see a readFileSync path.
  // The key is a picomatch route glob: `/**` matches `/` and nested routes, `/*` would not.
  outputFileTracingIncludes: { '/**': ['server/db/root-ca.crt'] },
  poweredByHeader: false,
};

export default nextConfig;
