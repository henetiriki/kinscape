import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  boundaryVersions,
  buildCommands,
  type Deps,
  POLITY_IDS,
  prepare,
} from '../prepare-map-data.mts';

const ring = [
  [0, 0],
  [1, 0],
  [1, 1],
  [0, 0],
];

const province = (key: string, type = 'Polygon') => ({
  geometry: {
    coordinates: type === 'Polygon' ? [ring] : [[ring]],
    type,
  },
  properties: { key },
  type: 'Feature' as const,
});

const allProvinces = () =>
  Object.keys(POLITY_IDS).map((key, index) =>
    province(key, index % 2 === 0 ? 'Polygon' : 'MultiPolygon')
  );

describe('buildCommands', () => {
  it('imports the four layers and simplifies them in one run', () => {
    const commands = buildCommands();

    expect(commands).toContain(
      '-i ne_10m_land.shp ne_10m_coastline.shp ne_10m_rivers_lake_centerlines.shp ne_10m_admin_1_states_provinces.shp combine-files'
    );
    expect(commands).toContain("'scalerank <= 7'");
    expect(commands).toContain('-clip bbox=5,-45,45,-10 target=*');
    expect(commands.match(/-simplify interval=500 keep-shapes/g)).toHaveLength(
      1
    );
    expect(commands.match(/precision=0\.0001/g)).toHaveLength(4);
  });
});

describe('boundaryVersions', () => {
  it('makes one MultiPolygon Boundary version per Polity from 2009-04-03', () => {
    const { features } = boundaryVersions(allProvinces());

    expect(features).toHaveLength(11);
    expect(features.map(f => f.properties.polity)).toEqual(
      Object.values(POLITY_IDS).toSorted()
    );
    expect(features.every(f => f.geometry.type === 'MultiPolygon')).toBe(true);
    expect(features[0].geometry.coordinates).toEqual([[ring]]);
    expect(features[0].properties).toEqual({
      confidence: 'high',
      contested: false,
      level: 'polity',
      polity: 'eastern-cape',
      source: 'natural-earth-admin-1',
      validFrom: 130_484,
      validTo: null,
    });
  });

  it('stops when Natural Earth names differ from the expected Polities', () => {
    expect(() =>
      boundaryVersions([...allProvinces().slice(1), province('Atlantis')])
    ).toThrow('missing [Eastern Cape], unexpected [Atlantis]');
  });
});

describe('prepare', () => {
  let root: string;

  const outputs = (): Record<string, string | Uint8Array> => ({
    'ne_10m_admin_1_states_provinces.json': JSON.stringify({
      features: allProvinces(),
    }),
    'ne_10m_coastline.json': new TextEncoder().encode('coast'),
    'ne_10m_land.json': 'land',
    'ne_10m_rivers_lake_centerlines.json': 'rivers',
  });

  const deps = (output = outputs()): Deps => ({
    applyCommands: vi.fn(async () => output),
    download: vi.fn(async (url: string) => new TextEncoder().encode(url)),
    glyphRange: vi.fn(async (_font, start, end) =>
      new TextEncoder().encode(`${start}-${end}`)
    ),
  });

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'prepare-'));
  });

  afterEach(() => {
    rmSync(root, { force: true, recursive: true });
  });

  it('downloads the pinned data and writes every committed file', async () => {
    const fake = deps();

    await prepare(root, fake);

    const urls = vi.mocked(fake.download).mock.calls.map(([url]) => url);

    expect(urls).toHaveLength(14);
    expect(urls[0]).toBe(
      'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/10m_physical/ne_10m_land.shp'
    );
    expect(urls).toContain(
      'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/10m_cultural/ne_10m_admin_1_states_provinces.dbf'
    );
    expect(urls).toContain(
      'https://raw.githubusercontent.com/uswds/public-sans/v2.001/fonts/ttf/PublicSans-SemiBold.ttf'
    );

    const [commands, input] = vi.mocked(fake.applyCommands).mock.calls[0];

    expect(commands).toBe(buildCommands());
    expect(Object.keys(input)).toHaveLength(12);
    expect(typeof input['ne_10m_land.prj']).toBe('string');
    expect(typeof input['ne_10m_land.shp']).toBe('object');

    const read = (path: string) => readFileSync(join(root, path), 'utf8');

    expect(read('public/map/land.geojson')).toBe('land');
    expect(read('public/map/coastline.geojson')).toBe('coast');
    expect(read('public/map/rivers.geojson')).toBe('rivers');
    expect(read('public/glyphs/OFL.txt')).toContain(
      'public-sans/v2.001/OFL.txt'
    );
    expect(read('public/glyphs/Public Sans SemiBold/0-255.pbf')).toBe('0-255');
    expect(read('public/glyphs/Public Sans SemiBold/256-511.pbf')).toBe(
      '256-511'
    );
    expect(
      JSON.parse(read('data/boundaries/today.geojson')).features
    ).toHaveLength(11);
    expect(readdirSync(join(root, 'public/glyphs'))).toHaveLength(2);
  });

  it('fails clearly when mapshaper writes no output for a layer', async () => {
    const output = outputs();

    delete output['ne_10m_land.json'];

    await expect(prepare(root, deps(output))).rejects.toThrow(
      'mapshaper wrote no ne_10m_land.json'
    );
  });
});
