import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { loadBoundaryData } from '../load.mts';

const square = {
  coordinates: [
    [
      [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
        [0, 0],
      ],
    ],
  ],
  type: 'MultiPolygon',
};

const props = {
  confidence: 'high',
  contested: false,
  level: 'polity',
  polity: 'p1',
  source: 's1',
  validFrom: 0,
  validTo: null,
};

const feature = { geometry: square, properties: props, type: 'Feature' };

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

describe('loadBoundaryData', () => {
  let root: string;

  const write = (name: string, content: unknown) => {
    const path = join(root, name);

    mkdirSync(join(path, '..'), { recursive: true });
    writeFileSync(
      path,
      typeof content === 'string' ? content : JSON.stringify(content)
    );

    return path;
  };

  const collection = (features: unknown[]) => ({
    features,
    type: 'FeatureCollection',
  });

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'load-'));
  });

  afterEach(() => {
    rmSync(root, { force: true, recursive: true });
  });

  it('returns empty data when no files exist', () => {
    expect(loadBoundaryData(join(root, 'missing'))).toEqual({
      data: { boundaries: [], names: [], polities: [], sources: [] },
      errors: [],
    });
  });

  it('loads rows and nested boundary files, ignoring other files', () => {
    write('polities.json', {
      names: [{ name: 'N', polity: 'p1', validFrom: 0, validTo: 5 }],
      polities: [{ id: 'p1' }],
    });
    write('sources.json', { sources: [source] });
    write('boundaries/a/b.geojson', collection([feature]));
    write('boundaries/notes.txt', 'ignored');

    const { data, errors } = loadBoundaryData(root);

    expect(errors).toEqual([]);
    expect(data.polities).toEqual([{ id: 'p1' }]);
    expect(data.names).toHaveLength(1);
    expect(data.sources).toEqual([source]);
    expect(data.boundaries).toHaveLength(1);
    expect(data.boundaries[0]).toMatchObject({ polity: 'p1', validTo: null });
  });

  it('keeps the optional processing note on a source', () => {
    write('sources.json', {
      sources: [{ ...source, processing: 'Simplified to 500 m.' }],
    });

    const { data, errors } = loadBoundaryData(root);

    expect(errors).toEqual([]);
    expect(data.sources[0].processing).toBe('Simplified to 500 m.');
  });

  it.each([
    ['not a date', 'soon'],
    ['not a real day', '2026-02-30'],
    ['an impossible month', '2026-13-01'],
    ['missing', undefined],
  ])('rejects a source whose check date is %s', (_, dateChecked) => {
    const sources = write('sources.json', {
      sources: [{ ...source, dateChecked }],
    });

    expect(loadBoundaryData(root).errors).toEqual([
      `${sources}: sources[0] is not a valid row`,
    ]);
  });

  it('rejects a source whose processing note is not text', () => {
    const sources = write('sources.json', {
      sources: [{ ...source, processing: 5 }],
    });

    expect(loadBoundaryData(root).errors).toEqual([
      `${sources}: sources[0] is not a valid row`,
    ]);
  });

  it('reports invalid JSON in the data files', () => {
    const polities = write('polities.json', '{ nope');
    const sources = write('sources.json', '{ nope');

    expect(loadBoundaryData(root).errors).toEqual([
      `${polities}: not valid JSON`,
      `${sources}: not valid JSON`,
    ]);
  });

  it('reports a list that is missing or not an array', () => {
    const polities = write('polities.json', { names: {} });
    const sources = write('sources.json', 'null');

    expect(loadBoundaryData(root).errors).toEqual([
      `${polities}: "polities" must be an array`,
      `${polities}: "names" must be an array`,
      `${sources}: "sources" must be an array`,
    ]);
  });

  it('reports invalid rows', () => {
    const polities = write('polities.json', {
      names: [{ name: 'N' }, null],
      polities: [{ id: '' }],
    });
    const sources = write('sources.json', { sources: [{ id: 's1' }] });

    expect(loadBoundaryData(root).errors).toEqual([
      `${polities}: polities[0] is not a valid row`,
      `${polities}: names[0] is not a valid row`,
      `${polities}: names[1] is not a valid row`,
      `${sources}: sources[0] is not a valid row`,
    ]);
  });

  it('reports boundary file shape errors', () => {
    const invalid = write('boundaries/a.geojson', '{ nope');
    const nul = write('boundaries/b.geojson', 'null');
    const bare = write('boundaries/c.geojson', { type: 'Feature' });
    const notArray = write('boundaries/d.geojson', {
      features: {},
      type: 'FeatureCollection',
    });

    expect(loadBoundaryData(root).errors.toSorted()).toEqual(
      [
        `${invalid}: not valid JSON`,
        `${nul}: type must be "FeatureCollection"`,
        `${bare}: type must be "FeatureCollection"`,
        `${notArray}: features must be an array`,
      ].toSorted()
    );
  });

  it('reports each bad feature', () => {
    const path = write(
      'boundaries/a.geojson',
      collection([
        feature,
        null,
        { type: 'Point' },
        { geometry: square, type: 'Feature' },
        {
          geometry: square,
          properties: { ...props, level: 'x' },
          type: 'Feature',
        },
        {
          geometry: square,
          properties: { ...props, confidence: 'x' },
          type: 'Feature',
        },
        { properties: props, type: 'Feature' },
        {
          geometry: { coordinates: [], type: 'Polygon' },
          properties: props,
          type: 'Feature',
        },
        {
          geometry: { coordinates: 1, type: 'MultiPolygon' },
          properties: props,
          type: 'Feature',
        },
      ])
    );

    expect(loadBoundaryData(root).errors).toEqual([
      `${path}: features[1] must be a "Feature"`,
      `${path}: features[2] must be a "Feature"`,
      `${path}: features[3] has invalid properties`,
      `${path}: features[4] has invalid properties`,
      `${path}: features[5] has invalid properties`,
      `${path}: features[6] geometry must be a MultiPolygon`,
      `${path}: features[7] geometry must be a MultiPolygon`,
      `${path}: features[8] geometry must be a MultiPolygon`,
    ]);
  });
});
