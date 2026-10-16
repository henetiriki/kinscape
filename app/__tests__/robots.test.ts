import { expect, it } from 'vitest';

import robots from '../robots';

// NFR-03
it('disallows everything for every crawler', () => {
  expect(robots().rules).toEqual({ disallow: '/nope', userAgent: '*' });
});
