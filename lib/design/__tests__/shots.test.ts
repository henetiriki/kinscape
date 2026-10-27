import { describe, expect, it } from 'vitest';

import { shotFor } from '@ks/lib/design/shots.mts';

describe('shotFor', () => {
  it.each([
    ['map-phone', 390, 844, 2, false],
    ['sign-in-phone-error', 390, 844, 2, false],
    ['design-kit-menu-phone', 390, 844, 2, false],
    ['style-2-colour-phone', 390, 844, 2, true],
    ['map-style-phone', 390, 844, 2, true],
    ['design-kit-phone', 390, 844, 2, true],
    ['style-4-states', 1440, 900, 1, true],
    ['map-style', 1440, 900, 1, true],
    ['map-desktop', 1440, 900, 1, false],
  ])('%s', (name, width, height, scale, fullPage) => {
    expect(shotFor(name)).toEqual({ fullPage, height, scale, width });
  });
});
