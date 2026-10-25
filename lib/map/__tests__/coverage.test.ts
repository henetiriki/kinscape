import { describe, expect, it } from 'vitest';

import type { BoundaryData, BoundaryVersion } from '../../boundaries/model.mts';

import { toDay } from '../../boundaries/model.mts';
import { boundaryCoverage, hasBorders } from '../coverage';

const version = (from: string, to: null | string): BoundaryVersion => ({
  confidence: 'high',
  contested: false,
  file: 'f',
  geometry: { coordinates: [], type: 'MultiPolygon' },
  level: 'polity',
  polity: 'p',
  source: 's',
  validFrom: toDay(from),
  validTo: to === null ? null : toDay(to),
});

const dataOf = (...boundaries: BoundaryVersion[]): BoundaryData => ({
  boundaries,
  names: [],
  polities: [],
  sources: [],
});

describe('boundaryCoverage', () => {
  it('is empty without Boundary versions', () => {
    expect(boundaryCoverage(dataOf())).toEqual([]);
  });

  it('merges versions that touch or overlap and keeps a gap', () => {
    const coverage = boundaryCoverage(
      dataOf(
        version('1994-04-27', '2006-03-01'),
        version('1910-05-31', '1920-01-01'),
        version('1919-01-01', '1925-01-01'),
        version('1925-01-01', '1930-01-01'),
        version('1930-01-01', '1931-01-01'),
        version('2006-03-01', null)
      )
    );

    expect(coverage).toEqual([
      { validFrom: toDay('1910-05-31'), validTo: toDay('1931-01-01') },
      { validFrom: toDay('1994-04-27'), validTo: null },
    ]);
  });

  it('lets an open-ended version absorb the ones after it', () => {
    expect(
      boundaryCoverage(
        dataOf(version('1994-04-27', null), version('2000-01-01', '2001-01-01'))
      )
    ).toEqual([{ validFrom: toDay('1994-04-27'), validTo: null }]);
  });

  it('keeps a later, shorter version inside an earlier span', () => {
    expect(
      boundaryCoverage(
        dataOf(
          version('1910-05-31', '1990-01-01'),
          version('1950-01-01', '1960-01-01')
        )
      )
    ).toEqual([
      { validFrom: toDay('1910-05-31'), validTo: toDay('1990-01-01') },
    ]);
  });
});

// MAP-03
describe('hasBorders', () => {
  const coverage = boundaryCoverage(dataOf(version('1910-05-31', null)));

  it('is false the day before the first date and true on it', () => {
    expect(hasBorders(coverage, toDay('1910-05-30'))).toBe(false);
    expect(hasBorders(coverage, toDay('1910-05-31'))).toBe(true);
  });

  it('is false with no spans', () => {
    expect(hasBorders([], toDay('2000-01-01'))).toBe(false);
  });
});
