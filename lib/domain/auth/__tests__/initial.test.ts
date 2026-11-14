import { describe, expect, it } from 'vitest';

import { accountInitial } from '@ks/lib/domain/auth/initial.mts';

describe('accountInitial', () => {
  it.each([
    ['louw@example.test', 'L'],
    ['Zed@example.test', 'Z'],
    ['', ''],
  ])('gives the initial of %j as %j', (email, initial) => {
    expect(accountInitial(email)).toBe(initial);
  });
});
