import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // The whole site is private: keep every response out of search indexes.
  headers: async () => [
    {
      headers: [{ key: 'X-Robots-Tag', value: 'noindex' }],
      source: '/:path*',
    },
  ],
  // `server/db/database.mts` reads the CA at runtime; the trace doesn't see a readFileSync path.
  outputFileTracingIncludes: { '/*': ['server/db/root-ca.crt'] },
};

export default nextConfig;
