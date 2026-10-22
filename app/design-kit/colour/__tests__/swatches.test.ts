import { expect, it } from 'vitest';

import { resolveTokens } from '@/lib/design/tokens.mts';

import rawTokens from '../../../../design/tokens.json';
import { ratioOf, valueAt } from '../describe';
import { GROUPS, MINIMUM, SYSTEM } from '../swatches';

const tokens = resolveTokens(rawTokens);

const shown = [
  ...GROUPS.flatMap(group => group.swatches),
  ...SYSTEM.flatMap(system => system.lines),
];

// NFR-06: text 4.5:1, borders and icons 3:1, on unrounded ratios.
it('gives every text and border colour the contrast its role needs', () => {
  for (const { on, path, role } of shown) {
    const minimum = MINIMUM[role];

    if (minimum !== undefined) {
      expect(
        ratioOf(tokens, path, on),
        `${path} as ${role}`
      ).toBeGreaterThanOrEqual(minimum);
    }
  }
});

// NFR-06: a new colour token cannot miss the board.
it('shows every colour token as a swatch or a system line', () => {
  const listed = new Set(shown.map(({ path }) => path));
  const missing = Object.keys(tokens.colour)
    .map(name => `colour.${name}`)
    .filter(path => !listed.has(path));

  expect(missing).toEqual([]);
});

it('lists 28 swatches in six groups, then 4 system colours', () => {
  expect(GROUPS.map(group => group.swatches.length)).toEqual([
    6, 2, 13, 2, 2, 3,
  ]);
  expect(SYSTEM).toHaveLength(4);
});

it('resolves a map token by its path', () => {
  expect(valueAt(tokens, 'map.hatch.colour')).toBe('#8b4a1c');
});
