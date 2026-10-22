import { expect, it } from 'vitest';

import tokens from '../../../../design/tokens.json';
import { ICONS, MOTION, RADII, SHADOWS, SPACE } from '../values';

// NFR-06: every row is a token the board reads.
it('names a token for each row', () => {
  expect(SPACE.map(row => row.step)).toEqual(Object.keys(tokens.space));
  expect(RADII.every(row => row.name in tokens.radius)).toBe(true);
  expect(SHADOWS.every(row => row.name in tokens.shadow)).toBe(true);
  expect(MOTION.every(row => row.name in tokens.motion)).toBe(true);
});

it('lists the twelve icons once each', () => {
  expect(ICONS).toHaveLength(12);
  expect(new Set(ICONS.map(icon => icon.name)).size).toBe(12);
});
