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

const oldProvinces = () =>
  allProvinces().filter(
    ({ properties }) => properties.key !== 'LSO' && properties.key !== 'SWZ'
  );

describe('buildCommands', () => {
  it('imports the five layers and simplifies them in one run', () => {
    const commands = buildCommands();

    expect(commands).toContain(
      '-i ne_10m_land.shp ne_10m_coastline.shp ne_10m_rivers_lake_centerlines.shp ne_10m_admin_1_states_provinces.shp ne_10m_admin_1_v4_1_0.shp combine-files'
    );
    expect(commands).toContain("'scalerank <= 7'");
    expect(commands).toContain('-clip bbox=5,-45,45,-10 target=*');
    expect(commands).toContain(
      '-clip south_africa_outline target=ne_10m_admin_1_v4_1_0'
    );
    expect(commands.match(/-simplify interval=500 keep-shapes/g)).toHaveLength(
      1
    );
    expect(commands.match(/precision=0\.0001/g)).toHaveLength(5);
  });
});

describe('boundaryVersions', () => {
  it('makes the 1994 provinces low confidence from 1994-04-27 to 2006-03-01', () => {
    const { old } = boundaryVersions(allProvinces(), oldProvinces());

    expect(old.features).toHaveLength(9);
    expect(old.features.map(f => f.properties.polity)).not.toContain('lesotho');
    expect(old.features[0].geometry.coordinates).toEqual([[ring]]);
    expect(old.features[0].properties).toEqual({
      confidence: 'low',
      contested: false,
      level: 'polity',
      polity: 'eastern-cape',
      source: 'natural-earth-admin-1-v4',
      validFrom: 125_029,
      validTo: 129_355,
    });
  });

  it('splits today at 2006-03-01 and 2009-04-03, with Lesotho and eSwatini from 1994', () => {
    const { today } = boundaryVersions(allProvinces(), oldProvinces());
    const range = (polity: string) =>
      today.features
        .filter(f => f.properties.polity === polity)
        .map(f => [
          f.properties.confidence,
          f.properties.validFrom,
          f.properties.validTo,
        ]);

    expect(today.features).toHaveLength(20);
    expect(today.features.every(f => f.geometry.type === 'MultiPolygon')).toBe(
      true
    );
    expect(range('eastern-cape')).toEqual([
      ['low', 129_355, 130_484],
      ['high', 130_484, null],
    ]);
    expect(range('lesotho')).toEqual([['high', 125_029, null]]);
    expect(range('eswatini')).toEqual([['high', 125_029, null]]);
  });

  it('stops when Natural Earth names differ from the expected Polities', () => {
    expect(() =>
      boundaryVersions(
        [...allProvinces().slice(1), province('Atlantis')],
        oldProvinces()
      )
    ).toThrow('missing [Eastern Cape], unexpected [Atlantis]');
    expect(() =>
      boundaryVersions(allProvinces(), [...oldProvinces(), province('LSO')])
    ).toThrow('unexpected [LSO]');
  });
});

describe('prepare', () => {
  let root: string;

  const outputs = (): Record<string, string | Uint8Array> => ({
    'ne_10m_admin_1_states_provinces.json': JSON.stringify({
      features: allProvinces(),
    }),
    'ne_10m_admin_1_v4_1_0.json': JSON.stringify({
      features: oldProvinces(),
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

    expect(urls).toHaveLength(17);
    expect(urls[0]).toBe(
      'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/10m_physical/ne_10m_land.shp'
    );
    expect(urls).toContain(
      'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/10m_cultural/ne_10m_admin_1_states_provinces.dbf'
    );
    expect(urls).toContain(
      'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v4.1.0/10m_cultural/ne_10m_admin_1_states_provinces.shp'
    );
    expect(urls).toContain(
      'https://raw.githubusercontent.com/uswds/public-sans/v2.001/fonts/ttf/PublicSans-SemiBold.ttf'
    );

    const [commands, input] = vi.mocked(fake.applyCommands).mock.calls[0];

    expect(commands).toBe(buildCommands());
    expect(Object.keys(input)).toHaveLength(15);
    expect(typeof input['ne_10m_admin_1_v4_1_0.dbf']).toBe('object');
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
    ).toHaveLength(20);
    expect(
      JSON.parse(read('data/boundaries/1994.geojson')).features
    ).toHaveLength(9);
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
