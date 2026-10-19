import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { toDay } from '../../lib/boundaries/model.mts';
import { run, validateBoundaries } from '../validate-boundaries.mts';

const D1950 = toDay('1950-01-01');

const box = (w: number, s: number, e: number, n: number) => [
  [
    [
      [w, s],
      [e, s],
      [e, n],
      [w, n],
      [w, s],
    ],
  ],
];

const source = {
  attribution: 'a',
  author: 'b',
  dateChecked: '2026-01-01',
  id: 's1',
  layer: 'l',
  licence: 'CC0',
  licenceLink: 'https://example.com',
  title: 't',
};

type Version = {
  contested?: boolean;
  coordinates?: unknown;
  level?: string;
  polity?: string;
  source?: string;
  validFrom?: number;
  validTo?: null | number;
};

const version = (v: Version) => ({
  geometry: {
    coordinates: v.coordinates ?? box(0, 0, 1, 1),
    type: 'MultiPolygon',
  },
  properties: {
    confidence: 'high',
    contested: v.contested ?? false,
    level: v.level ?? 'polity',
    polity: v.polity ?? 'p1',
    source: v.source ?? 's1',
    validFrom: v.validFrom ?? 0,
    validTo: v.validTo === undefined ? null : v.validTo,
  },
  type: 'Feature',
});

describe('validateBoundaries', () => {
  let root: string;

  const write = (name: string, content: unknown) => {
    const path = join(root, name);

    mkdirSync(join(path, '..'), { recursive: true });
    writeFileSync(path, JSON.stringify(content));

    return path;
  };

  const setup = (
    versions: Version[],
    names: unknown[] = [],
    polities: string[] = ['p1', 'p2']
  ) => {
    write('polities.json', { names, polities: polities.map(id => ({ id })) });
    write('sources.json', { sources: [source] });

    return write('boundaries/a.geojson', {
      features: versions.map(version),
      type: 'FeatureCollection',
    });
  };

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'validate-'));
  });

  afterEach(() => {
    rmSync(root, { force: true, recursive: true });
  });

  it('passes when the data folder does not exist or has no boundary files', () => {
    expect(validateBoundaries(join(root, 'missing'))).toEqual([]);
    expect(validateBoundaries(root)).toEqual([]);
  });

  it('passes the shipped empty data files', () => {
    expect(validateBoundaries('data')).toEqual([]);
  });

  it('passes versions that meet end to start', () => {
    setup([
      { validFrom: 0, validTo: 10 },
      { validFrom: 10, validTo: null },
    ]);

    expect(validateBoundaries(root)).toEqual([]);
  });

  it('passes Polities that follow one another over the same area', () => {
    setup([
      { polity: 'p1', validFrom: 0, validTo: 10 },
      { polity: 'p2', validFrom: 10 },
    ]);

    expect(validateBoundaries(root)).toEqual([]);
  });

  it('fails an unflagged overlap, naming both Polities and the date', () => {
    setup([
      { polity: 'p1', validFrom: D1950 },
      { coordinates: box(0.5, 0, 1.5, 1), polity: 'p2', validFrom: D1950 },
    ]);

    expect(validateBoundaries(root)).toEqual([
      'p1 and p2 overlap on 1950-01-01 and are not both contested',
    ]);
  });

  it('passes the same overlap when both are contested', () => {
    setup([
      { contested: true, polity: 'p1', validFrom: D1950 },
      {
        contested: true,
        coordinates: box(0.5, 0, 1.5, 1),
        polity: 'p2',
        validFrom: D1950,
      },
    ]);

    expect(validateBoundaries(root)).toEqual([]);
  });

  it('fails when only one of the overlapping features is contested', () => {
    setup([
      { contested: true, polity: 'p1' },
      { coordinates: box(0.5, 0, 1.5, 1), polity: 'p2' },
    ]);

    expect(validateBoundaries(root)).toHaveLength(1);
  });

  it('passes Polities that only share an edge', () => {
    setup([{ polity: 'p1' }, { coordinates: box(1, 0, 2, 1), polity: 'p2' }]);

    expect(validateBoundaries(root)).toEqual([]);
  });

  it('passes an overlap under the tolerance', () => {
    setup([
      { polity: 'p1' },
      { coordinates: box(0.99999, 0, 2, 1), polity: 'p2' },
    ]);

    expect(validateBoundaries(root)).toEqual([]);
  });

  it('passes Polities whose bounding boxes miss each other', () => {
    setup([{ polity: 'p1' }, { coordinates: box(5, 5, 6, 6), polity: 'p2' }]);

    expect(validateBoundaries(root)).toEqual([]);
  });

  it('passes Polities whose bounding boxes meet but shapes do not', () => {
    const a = [
      [
        [
          [0, 0],
          [2, 0],
          [0, 2],
          [0, 0],
        ],
      ],
    ];
    const b = [
      [
        [
          [2, 2],
          [2, 1.5],
          [1.5, 2],
          [2, 2],
        ],
      ],
    ];

    setup([
      { coordinates: a, polity: 'p1' },
      { coordinates: b, polity: 'p2' },
    ]);

    expect(validateBoundaries(root)).toEqual([]);
  });

  it('ignores overlaps between different levels', () => {
    setup([{ polity: 'p1' }, { level: 'district', polity: 'p2' }]);

    expect(validateBoundaries(root)).toEqual([]);
  });

  it('fails a gap between two Boundary versions', () => {
    setup([
      { validFrom: 0, validTo: 10 },
      { validFrom: 20, validTo: null },
    ]);

    expect(validateBoundaries(root)).toEqual([
      'Boundary versions for p1 have a gap from 1652-01-11 to 1652-01-21',
    ]);
  });

  it('fails overlapping Boundary versions of one Polity', () => {
    setup([
      { validFrom: 0, validTo: 10 },
      { validFrom: 5, validTo: null },
    ]);

    expect(validateBoundaries(root)).toEqual([
      'Boundary versions for p1 overlap on 1652-01-06',
    ]);
  });

  it('fails a self-intersecting polygon', () => {
    const path = setup([
      {
        coordinates: [
          [
            [
              [0, 0],
              [1, 1],
              [1, 0],
              [0, 1],
              [0, 0],
            ],
          ],
        ],
      },
    ]);

    expect(validateBoundaries(root)).toEqual([
      `${path}: p1 from 1652-01-01: invalid geometry`,
    ]);
  });

  it('fails geometry that cannot be read as polygons', () => {
    setup([{ coordinates: [null] }]);

    expect(validateBoundaries(root)).toEqual([
      expect.stringContaining('invalid geometry'),
    ]);
  });

  it('fails an unknown Polity', () => {
    setup([{ polity: 'ghost' }]);

    expect(validateBoundaries(root)).toEqual([
      expect.stringContaining('ghost from 1652-01-01: unknown Polity'),
    ]);
  });

  it('fails an unknown source', () => {
    setup([{ source: 'nope' }]);

    expect(validateBoundaries(root)).toEqual([
      expect.stringContaining('unknown source "nope"'),
    ]);
  });

  it('fails valid-from that is not before valid-to', () => {
    setup(
      [{ validFrom: 5, validTo: 5 }],
      [{ name: 'N', polity: 'p1', validFrom: 9, validTo: 3 }]
    );

    expect(validateBoundaries(root)).toEqual([
      'Boundary version p1 from 1652-01-06: valid-from must be before valid-to',
      'Name p1 from 1652-01-10: valid-from must be before valid-to',
    ]);
  });

  it('passes a name history that meets end to start', () => {
    setup(
      [],
      [
        { name: 'Old', polity: 'p1', validFrom: 0, validTo: 10 },
        { name: 'New', polity: 'p1', validFrom: 10, validTo: null },
      ]
    );

    expect(validateBoundaries(root)).toEqual([]);
  });

  it('fails a gap in a name history', () => {
    setup(
      [],
      [
        { name: 'Old', polity: 'p1', validFrom: 0, validTo: 10 },
        { name: 'New', polity: 'p1', validFrom: 12, validTo: null },
      ]
    );

    expect(validateBoundaries(root)).toEqual([
      'Names for p1 have a gap from 1652-01-11 to 1652-01-13',
    ]);
  });

  it('fails an overlap in a name history', () => {
    setup(
      [],
      [
        { name: 'Old', polity: 'p1', validFrom: 0, validTo: null },
        { name: 'New', polity: 'p1', validFrom: 12, validTo: null },
      ]
    );

    expect(validateBoundaries(root)).toEqual([
      'Names for p1 overlap on 1652-01-13',
    ]);
  });

  it('fails a name for an unknown Polity', () => {
    setup([], [{ name: 'N', polity: 'ghost', validFrom: 0, validTo: null }]);

    expect(validateBoundaries(root)).toEqual([
      'Name "N": unknown Polity ghost',
    ]);
  });

  it('reports loader errors', () => {
    const path = write('boundaries/bad.geojson', { type: 'Feature' });

    expect(validateBoundaries(root)).toEqual([
      `${path}: type must be "FeatureCollection"`,
    ]);
  });
});

describe('run', () => {
  let root: string;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'validate-'));
  });

  afterEach(() => {
    rmSync(root, { force: true, recursive: true });
    vi.restoreAllMocks();
  });

  it('returns 0 and prints nothing when valid', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(run(root)).toBe(0);
    expect(error).not.toHaveBeenCalled();
  });

  it('returns 1 and prints each error when invalid', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});

    writeFileSync(join(root, 'polities.json'), '{ nope');

    expect(run(root)).toBe(1);
    expect(error).toHaveBeenCalledWith(
      `${join(root, 'polities.json')}: not valid JSON`
    );
  });
});
