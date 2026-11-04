import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // The whole site is private: keep every response out of search indexes.
  headers: async () => [
    {
      headers: [{ key: 'X-Robots-Tag', value: 'noindex' }],
      source: '/:path*',
    },
  ],
};

export default nextConfig;
