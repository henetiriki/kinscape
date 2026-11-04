import { expect, it } from 'vitest';

import nextConfig from '@ks/next.config';

// NFR-03
it('marks every response noindex', async () => {
  expect(await nextConfig.headers?.()).toEqual([
    {
      headers: [{ key: 'X-Robots-Tag', value: 'noindex' }],
      source: '/:path*',
    },
  ]);
});
