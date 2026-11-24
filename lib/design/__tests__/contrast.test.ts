import { describe, expect, it } from 'vitest';

import type { DtcgTree } from '@ks/lib/design/types.ts';

import tokens from '@ks/design/kinscape.tokens.json';
import {
  contrastRatio,
  formatRatio,
  parseColour,
  ratioOf,
  valueAt,
} from '@ks/lib/design/contrast.mts';

// NFR-06
describe('parseColour', () => {
  it('reads hex and rgb() with or without opacity', () => {
    expect(parseColour('#18211b')).toEqual([24, 33, 27]);
    expect(parseColour('rgb(24 33 27 / 0.45)')).toEqual([24, 33, 27]);
    expect(parseColour('rgb(24, 33, 27)')).toEqual([24, 33, 27]);
  });

  it('rejects anything else', () => {
    expect(() => parseColour('green')).toThrow('Not a colour: green');
  });
});

describe('contrastRatio', () => {
  it('is 21 for black on white, 1 for a colour on itself, in either order', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 5);
    expect(contrastRatio('#264f29', '#264f29')).toBe(1);
  });

  it('matches a known pair', () => {
    expect(contrastRatio('#264f29', '#ffffff')).toBeCloseTo(9.4, 1);
  });
});

describe('formatRatio', () => {
  it('rounds to the nearest 0.1', () => {
    expect(formatRatio(3.02)).toBe('3.0:1');
    expect(formatRatio(4.63)).toBe('4.6:1');
    expect(formatRatio(4.46)).toBe('4.5:1');
  });
});

describe('valueAt', () => {
  it('resolves a colour token and a map token by its path', () => {
    expect(valueAt(tokens, 'colour.surface')).toBe('#ffffff');
    expect(valueAt(tokens, 'map.hatch.colour')).toBe('#8b4a1c');
  });
});

describe('ratioOf', () => {
  const colour = (hex: string) => ({
    $type: 'color',
    $value: { colorSpace: 'srgb', components: [0, 0, 0], hex },
  });
  const fixture: DtcgTree = {
    colour: {
      a: colour('#000000'),
      b: colour('#ffffff'),
      surface: colour('#ffffff'),
    },
  };

  it('measures on surface unless told otherwise', () => {
    expect(ratioOf(fixture, 'colour.a')).toBeCloseTo(21, 5);
    expect(ratioOf(fixture, 'colour.b', 'colour.a')).toBeCloseTo(21, 5);
  });
});
