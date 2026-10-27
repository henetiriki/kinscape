import { expect, it } from 'vitest';

import robots from '@ks/app/robots';

// NFR-03
it('disallows everything for every crawler', () => {
  expect(robots().rules).toEqual({ disallow: '/', userAgent: '*' });
});
