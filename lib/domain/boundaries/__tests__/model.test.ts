import { describe, expect, it } from 'vitest';

import type { BoundaryData } from '@ks/lib/domain/boundaries/types.ts';

import {
  boundaryOn,
  current,
  fromDay,
  nameOn,
  toDay,
} from '@ks/lib/domain/boundaries/model.mts';

const geometry = {
  coordinates: [
    [
      [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 0],
      ],
    ],
  ],
  type: 'MultiPolygon' as const,
};

const renamed = toDay('1910-05-31');

const data: BoundaryData = {
  boundaries: [
    {
      confidence: 'high',
      contested: false,
      file: 'a.geojson',
      geometry,
      level: 'polity',
      polity: 'p1',
      source: 's1',
      validFrom: 0,
      validTo: null,
    },
  ],
  names: [
    { name: 'Old', polity: 'p1', validFrom: 0, validTo: renamed },
    { name: 'New', polity: 'p1', validFrom: renamed, validTo: null },
  ],
  polities: [{ id: 'p1' }],
  sources: [],
};

describe('day conversion', () => {
  it('counts days since 1652-01-01', () => {
    expect(toDay('1652-01-01')).toBe(0);
    expect(toDay('1652-01-02')).toBe(1);
    expect(toDay('1950-01-01')).toBe(108_842);
  });

  it('round-trips', () => {
    expect(fromDay(toDay('1950-01-01'))).toBe('1950-01-01');
    expect(fromDay(0)).toBe('1652-01-01');
  });
});

describe('current', () => {
  const rows = [
    { id: 'a', validFrom: 0, validTo: 10 },
    { id: 'b', validFrom: 5, validTo: null },
  ];

  it('returns the rows whose range holds the day', () => {
    expect(current(rows, 7).map(row => row.id)).toEqual(['a', 'b']);
    expect(current(rows, 10).map(row => row.id)).toEqual(['b']);
  });

  it('returns nothing before every range', () => {
    expect(current(rows, -1)).toEqual([]);
  });
});

describe('lookups on a renamed Polity', () => {
  it('returns the old name before the rename and the new name from it', () => {
    expect(nameOn(data, 'p1', renamed - 1)).toBe('Old');
    expect(nameOn(data, 'p1', renamed)).toBe('New');
  });

  it('returns the same geometry on both sides of the rename', () => {
    expect(boundaryOn(data, 'p1', renamed - 1)?.geometry).toBe(
      boundaryOn(data, 'p1', renamed)?.geometry
    );
  });

  it('returns nothing outside every range or for an unknown Polity', () => {
    expect(nameOn(data, 'p1', -1)).toBeUndefined();
    expect(nameOn(data, 'nope', 0)).toBeUndefined();
    expect(boundaryOn(data, 'nope', 0)).toBeUndefined();
  });

  it('treats validTo as exclusive', () => {
    const closed = {
      ...data,
      boundaries: [{ ...data.boundaries[0], validTo: 10 }],
    };

    expect(boundaryOn(closed, 'p1', 9)).toBeDefined();
    expect(boundaryOn(closed, 'p1', 10)).toBeUndefined();
  });
});
