import { expect, it } from 'vitest';

import {
  ICONS,
  MOTION,
  RADII,
  SHADOWS,
  SPACE,
} from '@ks/app/design-kit/foundations/values';
import tokens from '@ks/design/tokens.json';

// NFR-06: every row is a token the board reads.
it('names a token for each row', () => {
  expect(SPACE.map(row => row.step)).toEqual(Object.keys(tokens.space));
  expect(RADII.every(row => row.name in tokens.radius)).toBe(true);
  expect(SHADOWS.every(row => row.name in tokens.shadow)).toBe(true);
  expect(MOTION.every(row => row.name in tokens.motion)).toBe(true);
});

it('lists the nineteen icons once each', () => {
  expect(ICONS).toHaveLength(19);
  expect(new Set(ICONS.map(icon => icon.name)).size).toBe(19);
});
