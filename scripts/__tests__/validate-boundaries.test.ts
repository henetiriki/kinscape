import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { run, validateBoundaries } from '../validate-boundaries.mts';

const collection = { features: [], type: 'FeatureCollection' };

describe('validateBoundaries', () => {
  let dir: string;

  const write = (name: string, content: unknown) => {
    const path = join(dir, name);

    mkdirSync(join(path, '..'), { recursive: true });
    writeFileSync(
      path,
      typeof content === 'string' ? content : JSON.stringify(content)
    );

    return path;
  };

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'boundaries-'));
  });

  afterEach(() => {
    rmSync(dir, { force: true, recursive: true });
  });

  it('passes when the folder does not exist', () => {
    expect(validateBoundaries(join(dir, 'missing'))).toEqual([]);
  });

  it('passes when there are no boundary files', () => {
    write('notes.txt', 'not a boundary file');

    expect(validateBoundaries(dir)).toEqual([]);
  });

  it('passes valid FeatureCollections, including nested ones', () => {
    write('a.geojson', collection);
    write('level/b.geojson', {
      features: [{ type: 'Feature' }],
      type: 'FeatureCollection',
    });

    expect(validateBoundaries(dir)).toEqual([]);
  });

  it('fails a file that is not JSON', () => {
    const path = write('a.geojson', '{ not json');

    expect(validateBoundaries(dir)).toEqual([`${path}: not valid JSON`]);
  });

  it('fails JSON null', () => {
    const path = write('a.geojson', 'null');

    expect(validateBoundaries(dir)).toEqual([
      `${path}: type must be "FeatureCollection"`,
    ]);
  });

  it('fails a bare Feature', () => {
    const path = write('a.geojson', { type: 'Feature' });

    expect(validateBoundaries(dir)).toEqual([
      `${path}: type must be "FeatureCollection"`,
    ]);
  });

  it('fails when features is not an array', () => {
    const path = write('a.geojson', {
      features: {},
      type: 'FeatureCollection',
    });

    expect(validateBoundaries(dir)).toEqual([
      `${path}: features must be an array`,
    ]);
  });

  it('fails each member that is not a Feature', () => {
    const path = write('a.geojson', {
      features: [{ type: 'Feature' }, { type: 'Point' }, null],
      type: 'FeatureCollection',
    });

    expect(validateBoundaries(dir)).toEqual([
      `${path}: features[1] must be a "Feature"`,
      `${path}: features[2] must be a "Feature"`,
    ]);
  });
});

describe('run', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'boundaries-'));
  });

  afterEach(() => {
    rmSync(dir, { force: true, recursive: true });
    vi.restoreAllMocks();
  });

  it('returns 0 and prints nothing when valid', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(run(dir)).toBe(0);
    expect(error).not.toHaveBeenCalled();
  });

  it('returns 1 and prints each error when invalid', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});

    writeFileSync(join(dir, 'a.geojson'), '{ not json');

    expect(run(dir)).toBe(1);
    expect(error).toHaveBeenCalledWith(
      `${join(dir, 'a.geojson')}: not valid JSON`
    );
  });
});
