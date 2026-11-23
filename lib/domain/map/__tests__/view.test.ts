import { describe, expect, it } from 'vitest';

import { centreOf } from '@ks/e2e/view';
import { FIRST_VIEW } from '@ks/lib/domain/map/view.mts';
import { mercatorY } from '@ks/lib/domain/map/zoom.mts';

// MAP-01
describe('centreOf', () => {
  it('gives the middle longitude', () => {
    expect(centreOf(FIRST_VIEW)[0]).toBe(24.75);
  });

  it('gives the latitude whose Mercator y is midway between the edges', () => {
    const [, latitude] = centreOf(FIRST_VIEW);

    expect(mercatorY(latitude)).toBeCloseTo(
      (mercatorY(-35.5) + mercatorY(-21.5)) / 2,
      10
    );
  });

  it('gives the equator for bounds that are symmetric about it', () => {
    expect(
      centreOf([
        [-10, -20],
        [30, 20],
      ])
    ).toEqual([10, 0]);
  });
});
