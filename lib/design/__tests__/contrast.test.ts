import { describe, expect, it } from 'vitest';

import {
  contrastRatio,
  formatColour,
  formatRatio,
  parseColour,
} from '../contrast.mts';

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

describe('formatColour', () => {
  it('capitalises hex and leaves rgb() as written', () => {
    expect(formatColour('#e6eee4')).toBe('#E6EEE4');
    expect(formatColour('rgb(24 33 27 / 0.45)')).toBe('rgb(24 33 27 / 0.45)');
  });
});
