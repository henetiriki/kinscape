import { featureFilter } from '@maplibre/maplibre-gl-style-spec';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { dateFilter } from '@ks/features/map/filter';
import { isCurrentOn } from '@ks/lib/domain/boundaries/model.mts';

const keeps = (day: number, properties: Record<string, unknown>): boolean =>
  featureFilter(dateFilter(day, 'boundary'), 'filter').filter(
    { zoom: 0 },
    { geometry: [], id: 1, properties, type: 1 }
  );

describe('dateFilter agrees with isCurrentOn', () => {
  const range = { validFrom: 1000, validTo: 2000 };

  it.each([
    [999, false],
    [1000, true],
    [1999, true],
    [2000, false],
  ])('on day %i of 1000–2000', (day, expected) => {
    expect(isCurrentOn(range, day)).toBe(expected);
    expect(keeps(day, { ...range, kind: 'boundary' })).toBe(expected);
  });

  it.each([999, 1000, 1001, 100_000])(
    'on day %i of a range with no end, null or missing',
    day => {
      const open = { validFrom: 1000, validTo: null };
      const expected = day >= open.validFrom;

      expect(isCurrentOn(open, day)).toBe(expected);
      expect(keeps(day, { ...open, kind: 'boundary' })).toBe(expected);
      expect(keeps(day, { kind: 'boundary', validFrom: 1000 })).toBe(expected);
    }
  );

  it('drops a label feature under the boundary filter', () => {
    expect(keeps(1500, { ...range, kind: 'label' })).toBe(false);
  });
});

describe('the style-spec under test', () => {
  it("is the copy maplibre-gl runs, so the test checks the map's version", () => {
    const require = createRequire(import.meta.url);
    // maplibre-gl's "exports" has no CommonJS entry, so resolve from its folder.
    const fromMaplibre = createRequire(
      join(process.cwd(), 'node_modules/maplibre-gl/package.json')
    ).resolve('@maplibre/maplibre-gl-style-spec');

    expect(fromMaplibre).toBe(
      require.resolve('@maplibre/maplibre-gl-style-spec')
    );
  });
});

describe('dateFilter', () => {
  it('keeps one kind of feature that is current on the day', () => {
    expect(dateFilter(100, 'boundary')).toEqual([
      'all',
      ['==', ['get', 'kind'], 'boundary'],
      ['<=', ['get', 'validFrom'], 100],
      ['any', ['==', ['get', 'validTo'], null], ['<', 100, ['get', 'validTo']]],
    ]);
  });

  it('appends extra conditions', () => {
    const extra = ['==', ['get', 'confidence'], 'low'] as never;

    expect(dateFilter(5, 'label', extra).at(-1)).toBe(extra);
  });
});
