import { describe, expect, it } from 'vitest';

import { coverZoom } from '@ks/lib/domain/map/zoom.mts';

const BOUNDS: [[number, number], [number, number]] = [
  [8, -42],
  [42, -14],
];

const mercatorY = (lat: number) =>
  Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));

// MAP-01
describe('coverZoom', () => {
  it('gives the zoom at which the bounds just fill the width when the width is the tight side', () => {
    const zoom = coverZoom(BOUNDS, 1440, 100);

    expect(512 * 2 ** zoom * ((42 - 8) / 360)).toBeCloseTo(1440, 6);
  });

  it('gives the zoom at which the bounds just fill the height when the height is the tight side', () => {
    const zoom = coverZoom(BOUNDS, 100, 900);
    const span = mercatorY(-14) - mercatorY(-42);

    expect(512 * 2 ** zoom * (span / (2 * Math.PI))).toBeCloseTo(900, 6);
  });

  it('takes the larger zoom of the two sides', () => {
    const both = coverZoom(BOUNDS, 1440, 900);

    expect(both).toBe(
      Math.max(coverZoom(BOUNDS, 1440, 1), coverZoom(BOUNDS, 1, 900))
    );
    expect(both).toBeGreaterThan(4.5);
    expect(both).toBeLessThan(5.5);
  });

  it('gives no zoom for an empty window', () => {
    expect(coverZoom(BOUNDS, 0, 0)).toBe(-Infinity);
  });
});
