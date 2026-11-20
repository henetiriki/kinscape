import { describe, expect, it } from 'vitest';

import { alphaToSdf, squaredDistances } from '@ks/lib/domain/map/sdf.mts';

// PIN-03: the Event glyphs are SDF icons, so a halo can be drawn around each.
describe('squaredDistances', () => {
  it('gives the squared distance to the nearest target in a row', () => {
    expect([
      ...squaredDistances([false, false, true, false, false], 5, 1),
    ]).toEqual([4, 1, 0, 1, 4]);
  });

  it('measures a diagonal in both axes', () => {
    const targets = [
      false,
      false,
      false,
      false,
      true,
      false,
      false,
      false,
      false,
    ];

    expect([...squaredDistances(targets, 3, 3)]).toEqual([
      2, 1, 2, 1, 0, 1, 2, 1, 2,
    ]);
  });

  it('gives a very large value when there is no target', () => {
    expect(squaredDistances([false, false], 2, 1)[0]).toBeGreaterThan(1e10);
  });
});

describe('alphaToSdf', () => {
  // A 3 x 3 solid square in the middle of a 9 x 9 image.
  const alpha = Uint8Array.from({ length: 81 }, (_, index) => {
    const x = index % 9;
    const y = Math.floor(index / 9);

    return x >= 3 && x <= 5 && y >= 3 && y <= 5 ? 255 : 0;
  });
  const sdf = alphaToSdf(alpha, 9, 9, 4);
  const at = (x: number, y: number) => sdf[y * 9 + x];

  it('puts the edge near 0.75 of the range, which MapLibre reads', () => {
    expect(at(3, 4)).toBeGreaterThan(191);
    expect(at(2, 4)).toBeLessThan(191);
  });

  it('rises toward the inside and falls to 0 outside the radius', () => {
    expect(at(4, 4)).toBeGreaterThan(at(3, 4));
    expect(at(2, 4)).toBeGreaterThan(at(1, 4));
    expect(at(0, 0)).toBe(0);
  });

  it('keeps the size of the image', () => {
    expect(sdf).toHaveLength(81);
  });
});
