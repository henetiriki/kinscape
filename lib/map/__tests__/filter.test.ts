import { describe, expect, it } from 'vitest';

import { dateFilter } from '@ks/lib/map/filter';

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
