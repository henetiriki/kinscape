import { describe, expect, it } from 'vitest';

import { isVersion } from '@ks/server/trees/version.mts';

describe('isVersion', () => {
  it.each([1, 2, 2_147_483_647])('accepts %s', version => {
    expect(isVersion(version)).toBe(true);
  });

  it.each([0, -1, 1.5, Number.NaN, 2 ** 31, Number.POSITIVE_INFINITY])(
    'refuses %s',
    version => {
      expect(isVersion(version)).toBe(false);
    }
  );
});
