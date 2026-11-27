import { describe, expect, it } from 'vitest';

import { shotFor } from '@ks/lib/design/shots.mts';

describe('shotFor', () => {
  it.each([
    ['map-phone', 390, 844, 2, false],
    ['sign-in-phone-error', 390, 844, 2, false],
    ['map-style-phone', 390, 844, 2, true],
    ['map-style', 1440, 900, 1, true],
    ['fuzzy-date-readings', 1440, 900, 1, true],
    ['type-scale', 1440, 900, 1, true],
    ['spacing-and-controls', 1440, 900, 1, true],
    ['map-desktop', 1440, 900, 1, false],
  ])('%s', (name, width, height, scale, fullPage) => {
    expect(shotFor(name)).toEqual({ fullPage, height, scale, width });
  });
});
