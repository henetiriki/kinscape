import { describe, expect, it } from 'vitest';

import { fanRings, fanSpots } from '@ks/lib/domain/map/fan.mts';

// PIN-06.
describe('fanRings', () => {
  it('gives ring 1 a radius of 56 px and 7 Pins, and each next ring 48 px more', () => {
    expect(fanRings(3)).toEqual([{ count: 3, radius: 56 }]);
    expect(fanRings(7)).toEqual([{ count: 7, radius: 56 }]);
    expect(fanRings(12)).toEqual([
      { count: 7, radius: 56 },
      { count: 5, radius: 104 },
    ]);
  });

  it('keeps the gap of ring 1 on each ring: ring 2 holds 13, ring 3 holds 19 (#863 plan D3)', () => {
    expect(fanRings(40)).toEqual([
      { count: 7, radius: 56 },
      { count: 13, radius: 104 },
      { count: 19, radius: 152 },
      { count: 1, radius: 200 },
    ]);
  });
});

describe('fanSpots', () => {
  it('spaces three Pins evenly, the first below the Place, then clockwise (#863 plan D4)', () => {
    expect(fanSpots(3)).toEqual([
      { ring: 0, x: 0, y: 56 },
      { ring: 0, x: -48, y: -28 },
      { ring: 0, x: 48, y: -28 },
    ]);
  });

  it('fills the inner ring first, and starts each ring below the Place', () => {
    const spots = fanSpots(12);

    expect(spots.filter(({ ring }) => ring === 0)).toHaveLength(7);
    expect(spots[7]).toEqual({ ring: 1, x: 0, y: 104 });
  });
});
