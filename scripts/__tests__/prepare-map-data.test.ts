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
  UNION_IDS,
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

const unionProvinces = () =>
  [...Object.keys(UNION_IDS), 'LSO', 'SWZ'].map((key, index) =>
    province(key, index % 2 === 0 ? 'Polygon' : 'MultiPolygon')
  );

describe('buildCommands', () => {
  it('imports the six layers and simplifies them in one run', () => {
    const commands = buildCommands();

    expect(commands).toContain(
      '-i ne_10m_land.shp ne_10m_coastline.shp ne_10m_rivers_lake_centerlines.shp ne_10m_admin_1_states_provinces.shp ne_10m_admin_1_v4_1_0.shp provinces_1910.geojson combine-files'
    );
    expect(commands).toContain(
      '-erase lesotho_eswatini target=provinces_1910,free_state_1910'
    );
    expect(commands).toContain('-clip ne_10m_land target=provinces_1910');
    expect(commands).toContain(
      '-merge-layers target=provinces_1910,free_state_1910,lesotho_eswatini_1910 name=provinces_1910 -clean gap-fill-area=300km2 target=provinces_1910'
    );
  });

  it("takes the 1910 Free State from Natural Earth v4.1.0 and keeps Walvis Bay and the outline's edge", () => {
    const commands = buildCommands();

    expect(commands).toContain(
      `-filter 'key == "Free State"' + name=free_state_1910 target=ne_10m_admin_1_v4_1_0`
    );
    expect(commands).toContain(
      `-filter 'key != "Orange Free State"' target=provinces_1910 -buffer 5km topological target=provinces_1910 -erase free_state_1910 target=provinces_1910`
    );
    expect(commands).toContain(
      '-merge-layers target=union_edge,walvis_bay name=union_edge -dissolve target=union_edge -clip union_edge target=provinces_1910'
    );
    expect(commands).toContain("'scalerank <= 7'");
    expect(commands).toContain('-clip bbox=5,-45,45,-10 target=*');
    expect(commands).toContain(
      '-clip south_africa_outline target=ne_10m_admin_1_v4_1_0'
    );
    expect(commands.match(/-simplify interval=500 keep-shapes/g)).toHaveLength(
      1
    );
    expect(commands.match(/precision=0\.0001/g)).toHaveLength(6);
  });
});

describe('boundaryVersions', () => {
  it('makes the Union provinces low confidence from 1910-05-31 to 1994-04-27', () => {
    const { union } = boundaryVersions(
      allProvinces(),
      oldProvinces(),
      unionProvinces()
    );

    expect(union.features.map(f => f.properties.polity)).toEqual([
      'cape-of-good-hope',
      'natal',
      'orange-free-state',
      'transvaal',
    ]);
    expect(union.features[0].geometry.coordinates).toEqual([[ring]]);
    expect(union.features[0].properties).toEqual({
      confidence: 'low',
      contested: false,
      level: 'polity',
      polity: 'cape-of-good-hope',
      source: 'afrith-provinces-1910',
      validFrom: 94_382,
      validTo: 125_029,
    });
  });

  it('cites Natural Earth v4.1.0 for the Orange Free State only', () => {
    const { union } = boundaryVersions(
      allProvinces(),
      oldProvinces(),
      unionProvinces()
    );

    expect(
      union.features.map(f => [f.properties.polity, f.properties.source])
    ).toEqual([
      ['cape-of-good-hope', 'afrith-provinces-1910'],
      ['natal', 'afrith-provinces-1910'],
      ['orange-free-state', 'natural-earth-admin-1-v4'],
      ['transvaal', 'afrith-provinces-1910'],
    ]);
  });

  it('makes the 1994 provinces low confidence from 1994-04-27 to 2006-03-01', () => {
    const { old } = boundaryVersions(
      allProvinces(),
      oldProvinces(),
      unionProvinces()
    );

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

  it('splits today at 2006-03-01 and 2009-04-03, with Lesotho and eSwatini low until 1994', () => {
    const { today } = boundaryVersions(
      allProvinces(),
      oldProvinces(),
      unionProvinces()
    );
    const range = (polity: string) =>
      today.features
        .filter(f => f.properties.polity === polity)
        .map(f => [
          f.properties.confidence,
          f.properties.validFrom,
          f.properties.validTo,
        ]);

    expect(today.features).toHaveLength(22);
    expect(today.features.every(f => f.geometry.type === 'MultiPolygon')).toBe(
      true
    );
    expect(range('eastern-cape')).toEqual([
      ['low', 129_355, 130_484],
      ['high', 130_484, null],
    ]);
    for (const polity of ['lesotho', 'eswatini']) {
      expect(range(polity)).toEqual([
        ['low', 94_382, 125_029],
        ['high', 125_029, null],
      ]);
    }
  });

  it('draws Lesotho and eSwatini before 1994 from the gap-filled 1910 layer', () => {
    const filled = [
      [2, 2],
      [3, 2],
      [3, 3],
      [2, 2],
    ];
    const { today, union } = boundaryVersions(
      allProvinces(),
      oldProvinces(),
      unionProvinces().map(feature =>
        feature.properties.key === 'LSO'
          ? { ...feature, geometry: { coordinates: [filled], type: 'Polygon' } }
          : feature
      )
    );
    const lesotho = today.features.filter(
      f => f.properties.polity === 'lesotho'
    );

    expect(lesotho.map(f => f.geometry.coordinates)).toEqual([
      [[filled]],
      [[ring]],
    ]);
    expect(union.features.map(f => f.properties.polity)).not.toContain(
      'lesotho'
    );
  });

  it('stops when the source names differ from the expected Polities', () => {
    expect(() =>
      boundaryVersions(
        [...allProvinces().slice(1), province('Atlantis')],
        oldProvinces(),
        unionProvinces()
      )
    ).toThrow('missing [Eastern Cape], unexpected [Atlantis]');
    expect(() =>
      boundaryVersions(
        allProvinces(),
        [...oldProvinces(), province('LSO')],
        unionProvinces()
      )
    ).toThrow('unexpected [LSO]');
    expect(() =>
      boundaryVersions(allProvinces(), oldProvinces(), [
        ...unionProvinces().slice(1),
        province('Griqualand'),
      ])
    ).toThrow(
      'afrith provinces-1910 names differ from UNION_IDS: missing [Cape of Good Hope], unexpected [Griqualand]'
    );
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
    'provinces_1910.json': JSON.stringify({ features: unionProvinces() }),
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

    expect(urls).toHaveLength(18);
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
      'https://raw.githubusercontent.com/afrith/historical-boundary-data/fbdf94d8a561814510f5d62ec552d6d67f3488e6/provinces-1910.geojson'
    );
    expect(urls).toContain(
      'https://raw.githubusercontent.com/uswds/public-sans/v2.001/fonts/ttf/PublicSans-SemiBold.ttf'
    );

    const [commands, input] = vi.mocked(fake.applyCommands).mock.calls[0];

    expect(commands).toBe(buildCommands());
    expect(Object.keys(input)).toHaveLength(16);
    expect(typeof input['provinces_1910.geojson']).toBe('string');
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
    ).toHaveLength(22);
    expect(
      JSON.parse(read('data/boundaries/1910.geojson')).features
    ).toHaveLength(4);
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
