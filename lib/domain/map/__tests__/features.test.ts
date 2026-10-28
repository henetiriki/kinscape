import { describe, expect, it } from 'vitest';

import type {
  BoundaryData,
  BoundaryVersion,
} from '@ks/lib/domain/boundaries/types.ts';

import { polityCollection } from '@ks/lib/domain/map/features';

const polygon = (x: number, y: number, size: number) => [
  [
    [x, y],
    [x + size, y],
    [x + size, y + size],
    [x, y + size],
    [x, y],
  ],
];

const version = (
  polity: string,
  validFrom: number,
  validTo: null | number,
  coordinates = [polygon(0, 0, 2)]
): BoundaryVersion => ({
  confidence: 'high',
  contested: false,
  file: 'f',
  geometry: { coordinates, type: 'MultiPolygon' },
  level: 'polity',
  polity,
  source: 's',
  validFrom,
  validTo,
});

const data = (overrides: Partial<BoundaryData>): BoundaryData => ({
  boundaries: [],
  names: [],
  polities: [],
  sources: [],
  ...overrides,
});

describe('polityCollection', () => {
  it('has a boundary feature per Boundary version, dated', () => {
    const { features } = polityCollection(
      data({ boundaries: [version('a', 10, 20)] })
    );

    expect(features).toEqual([
      {
        geometry: expect.objectContaining({ type: 'MultiPolygon' }),
        properties: {
          confidence: 'high',
          contested: false,
          kind: 'boundary',
          polity: 'a',
          validFrom: 10,
          validTo: 20,
        },
        type: 'Feature',
      },
    ]);
  });

  it('puts one dated label point per name row inside the largest polygon', () => {
    const { features } = polityCollection(
      data({
        boundaries: [
          version('a', 0, null, [
            polygon(0, 0, 1),
            polygon(10, 10, 4),
            polygon(20, 20, 2),
          ]),
        ],
        names: [{ name: 'Alpha', polity: 'a', validFrom: 5, validTo: null }],
      })
    );
    const label = features.find(f => f.properties.kind === 'label');

    expect(label?.properties).toEqual({
      kind: 'label',
      name: 'Alpha',
      polity: 'a',
      validFrom: 5,
      validTo: null,
    });
    expect(label?.geometry).toEqual({
      coordinates: [12, 12],
      type: 'Point',
    });
  });

  it('labels each name row from a Boundary version of its own dates', () => {
    const { features } = polityCollection(
      data({
        boundaries: [
          version('a', 0, 10, [polygon(0, 0, 2)]),
          version('a', 10, null, [polygon(50, 50, 2)]),
          version('b', 0, null, [polygon(80, 80, 2)]),
        ],
        names: [
          { name: 'Old', polity: 'a', validFrom: 0, validTo: 10 },
          { name: 'New', polity: 'a', validFrom: 10, validTo: null },
          { name: 'Orphan', polity: 'c', validFrom: 0, validTo: null },
        ],
      })
    );
    const labels = features.filter(f => f.properties.kind === 'label');

    expect(labels.map(f => [f.properties.name, f.geometry])).toEqual([
      ['Old', { coordinates: [1, 1], type: 'Point' }],
      ['New', { coordinates: [51, 51], type: 'Point' }],
    ]);
  });

  it('moves one name to each Boundary version it overlaps, dated to the overlap', () => {
    const { features } = polityCollection(
      data({
        boundaries: [
          version('a', 0, 10, [polygon(0, 0, 2)]),
          version('a', 10, 30, [polygon(50, 50, 2)]),
          version('a', 30, null, [polygon(70, 70, 2)]),
        ],
        names: [
          { name: 'Same', polity: 'a', validFrom: 5, validTo: 40 },
          { name: 'Open', polity: 'a', validFrom: 20, validTo: null },
        ],
      })
    );
    const labels = features.filter(f => f.properties.kind === 'label');

    expect(
      labels.map(f => [
        f.properties.name,
        f.properties.validFrom,
        f.properties.validTo,
        f.geometry,
      ])
    ).toEqual([
      ['Same', 5, 10, { coordinates: [1, 1], type: 'Point' }],
      ['Same', 10, 30, { coordinates: [51, 51], type: 'Point' }],
      ['Same', 30, 40, { coordinates: [71, 71], type: 'Point' }],
      ['Open', 20, 30, { coordinates: [51, 51], type: 'Point' }],
      ['Open', 30, null, { coordinates: [71, 71], type: 'Point' }],
    ]);
  });
});
