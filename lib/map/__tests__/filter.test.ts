import { describe, expect, it } from 'vitest';

import { toDay } from '@ks/lib/boundaries/model.mts';
import { dateFilter, dayOf } from '@ks/lib/map/filter';

describe('dayOf', () => {
  it('counts UTC days since 1652-01-01', () => {
    expect(dayOf(new Date('2009-04-03T23:59:59Z'))).toBe(toDay('2009-04-03'));
    expect(dayOf(new Date('1652-01-01T00:00:00Z'))).toBe(0);
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
