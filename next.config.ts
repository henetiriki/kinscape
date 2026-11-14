import type { NextConfig } from 'next';

/** Where the Vercel Toolbar and its comments load from, on Preview deployments only. */
const TOOLBAR = 'https://vercel.live';

/**
 * Headers every response carries. Next's inline scripts need `'unsafe-inline'` until a nonce
 * comes from `proxy.ts`; React's development tools need `'unsafe-eval'`. MapLibre runs its
 * workers from blob URLs. The app calls no other host; a Preview deployment also allows the
 * Vercel Toolbar's sources, as Vercel's docs list them.
 */
export const securityHeaders = ({
  dev,
  preview,
}: {
  dev: boolean;
  preview: boolean;
}) => {
  const add = (sources: string) => (preview ? ` ${sources}` : '');

  return [
    {
      key: 'Content-Security-Policy',
      value: [
        "default-src 'self'",
        `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ''}${add(TOOLBAR)}`,
        `style-src 'self' 'unsafe-inline'${add(TOOLBAR)}`,
        `img-src 'self' data: blob:${add(`${TOOLBAR} https://vercel.com`)}`,
        ...(preview
          ? [`font-src 'self' ${TOOLBAR} https://assets.vercel.com`]
          : []),
        "worker-src 'self' blob:",
        `connect-src 'self'${add(`${TOOLBAR} wss://ws-us3.pusher.com`)}`,
        ...(preview ? [`frame-src ${TOOLBAR}`] : []),
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
};

const nextConfig: NextConfig = {
  headers: async () => [
    {
      headers: [
        // The whole site is private: keep every response out of search indexes.
        { key: 'X-Robots-Tag', value: 'noindex' },
        ...securityHeaders({
          dev: process.env.NODE_ENV === 'development',
          preview: process.env.VERCEL_ENV === 'preview',
        }),
      ],
      source: '/:path*',
    },
    {
      // Tree data: no shared cache may keep it (docs/security.md). `:path*` covers `/people`,
      // `/people/new` and `/people/{id}`.
      headers: [{ key: 'Cache-Control', value: 'private, no-store' }],
      source: '/people/:path*',
    },
  ],
  // `server/db/database.mts` reads the CA at runtime; the trace doesn't see a readFileSync path.
  // The key is a picomatch route glob: `/**` matches `/` and nested routes, `/*` would not.
  outputFileTracingIncludes: { '/**': ['server/db/root-ca.crt'] },
  poweredByHeader: false,
};

export default nextConfig;
