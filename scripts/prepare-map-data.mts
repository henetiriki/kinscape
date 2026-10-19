import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { toDay } from '../lib/boundaries/model.mts';

// Pinned releases: bump the tag, run `npm run map:prepare`, review the diff.
export const NATURAL_EARTH_TAG = 'v5.1.2';
export const PUBLIC_SANS_TAG = 'v2.001';

const NATURAL_EARTH_URL = `https://raw.githubusercontent.com/nvkelso/natural-earth-vector/${NATURAL_EARTH_TAG}`;
const PUBLIC_SANS_URL = `https://raw.githubusercontent.com/uswds/public-sans/${PUBLIC_SANS_TAG}`;

const LAYERS = [
  { dir: '10m_physical', name: 'ne_10m_land' },
  { dir: '10m_physical', name: 'ne_10m_coastline' },
  { dir: '10m_physical', name: 'ne_10m_rivers_lake_centerlines' },
  { dir: '10m_cultural', name: 'ne_10m_admin_1_states_provinces' },
] as const;

const PROVINCES = 'ne_10m_admin_1_states_provinces';

/** Southern Africa: west, south, east, north. */
const BBOX = '15,-36,34,-21';

/** Metres. Every layer is simplified in one run so shared edges stay identical. */
const TOLERANCE = 500;

/** Four decimals is about 11 m. */
const PRECISION = 0.0001;

const GLYPH_FONT = 'Public Sans SemiBold';
const GLYPH_RANGES = [
  [0, 255],
  [256, 511],
] as const;

/** Sixteenth Amendment commencement (Proclamation R. 20 of 2009). */
const START_DATE = '2009-04-03';

export const BOUNDARY_SOURCE = 'natural-earth-admin-1';

/** Natural Earth admin-1 name (or country code) to Polity id. */
export const POLITY_IDS: Record<string, string> = {
  'Eastern Cape': 'eastern-cape',
  'Free State': 'free-state',
  Gauteng: 'gauteng',
  'KwaZulu-Natal': 'kwazulu-natal',
  Limpopo: 'limpopo',
  LSO: 'lesotho',
  Mpumalanga: 'mpumalanga',
  'Northern Cape': 'northern-cape',
  'North West': 'north-west',
  SWZ: 'eswatini',
  'Western Cape': 'western-cape',
};

export type Deps = {
  applyCommands: (
    commands: string,
    input: Record<string, string | Uint8Array>
  ) => Promise<Record<string, string | Uint8Array>>;
  download: (url: string) => Promise<Uint8Array>;
  glyphRange: (
    font: Uint8Array,
    start: number,
    end: number
  ) => Promise<Uint8Array>;
};

type Feature = {
  geometry: { coordinates: unknown; type: string };
  properties: Record<string, unknown>;
  type: 'Feature';
};

const SHAPE_PARTS = ['shp', 'dbf', 'prj'] as const;

export const buildCommands = (): string =>
  [
    `-i ${LAYERS.map(({ name }) => `${name}.shp`).join(' ')} combine-files`,
    `-filter 'scalerank <= 7' target=ne_10m_rivers_lake_centerlines`,
    `-filter 'adm0_a3 == "ZAF" || adm0_a3 == "LSO" || adm0_a3 == "SWZ"' target=${PROVINCES}`,
    `-each 'key = adm0_a3 == "ZAF" ? name : adm0_a3' target=${PROVINCES}`,
    `-dissolve key target=${PROVINCES}`,
    `-clip bbox=${BBOX} target=*`,
    `-simplify interval=${TOLERANCE} keep-shapes`,
    ...LAYERS.map(
      ({ name }) =>
        `-o ${name}.json format=geojson precision=${PRECISION} target=${name}`
    ),
  ].join(' ');

const asText = (content: string | Uint8Array): string =>
  typeof content === 'string' ? content : Buffer.from(content).toString();

const writeFile = (
  root: string,
  path: string,
  content: string | Uint8Array
): void => {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), content);
};

const writeJson = (root: string, path: string, content: unknown): void =>
  writeFile(root, path, `${JSON.stringify(content)}\n`);

const readOutput = (
  output: Record<string, string | Uint8Array>,
  name: string
): string => {
  const content = output[`${name}.json`];

  if (content === undefined) {
    throw new Error(`mapshaper wrote no ${name}.json`);
  }

  return asText(content);
};

const asMultiPolygon = (geometry: Feature['geometry']) => ({
  coordinates:
    geometry.type === 'Polygon'
      ? [geometry.coordinates]
      : (geometry.coordinates as unknown[]),
  type: 'MultiPolygon',
});

/** One Boundary version per Polity, valid from the Sixteenth Amendment to today. */
export const boundaryVersions = (provinces: Feature[]) => {
  const found = new Map(
    provinces.map(({ geometry, properties }) => [
      String(properties.key),
      geometry,
    ])
  );
  const missing = Object.keys(POLITY_IDS).filter(key => !found.has(key));
  const unknown = [...found.keys()].filter(key => !(key in POLITY_IDS));

  if (missing.length > 0 || unknown.length > 0) {
    throw new Error(
      `Natural Earth admin-1 keys differ from POLITY_IDS: missing [${missing}], unexpected [${unknown}]`
    );
  }

  return {
    features: [...found]
      .map(([key, geometry]) => ({
        geometry: asMultiPolygon(geometry),
        properties: {
          confidence: 'high',
          contested: false,
          level: 'polity',
          polity: POLITY_IDS[key],
          source: BOUNDARY_SOURCE,
          validFrom: toDay(START_DATE),
          validTo: null,
        },
        type: 'Feature',
      }))
      .toSorted((a, b) =>
        a.properties.polity.localeCompare(b.properties.polity)
      ),
    type: 'FeatureCollection',
  };
};

/** Downloads Natural Earth and Public Sans, then writes the committed map data under `root`. */
export const prepare = async (root: string, deps: Deps): Promise<void> => {
  const input: Record<string, string | Uint8Array> = {};

  for (const { dir, name } of LAYERS) {
    for (const part of SHAPE_PARTS) {
      const bytes = await deps.download(
        `${NATURAL_EARTH_URL}/${dir}/${name}.${part}`
      );

      // Mapshaper reads the projection file as text.
      input[`${name}.${part}`] = part === 'prj' ? asText(bytes) : bytes;
    }
  }

  const output = await deps.applyCommands(buildCommands(), input);

  writeJson(
    root,
    'data/boundaries/today.geojson',
    boundaryVersions(JSON.parse(readOutput(output, PROVINCES)).features)
  );

  for (const [file, name] of [
    ['land', 'ne_10m_land'],
    ['coastline', 'ne_10m_coastline'],
    ['rivers', 'ne_10m_rivers_lake_centerlines'],
  ]) {
    writeFile(root, `public/map/${file}.geojson`, readOutput(output, name));
  }

  const font = await deps.download(
    `${PUBLIC_SANS_URL}/fonts/ttf/PublicSans-SemiBold.ttf`
  );

  for (const [start, end] of GLYPH_RANGES) {
    writeFile(
      root,
      `public/glyphs/${GLYPH_FONT}/${start}-${end}.pbf`,
      await deps.glyphRange(font, start, end)
    );
  }

  writeFile(
    root,
    'public/glyphs/OFL.txt',
    await deps.download(`${PUBLIC_SANS_URL}/OFL.txt`)
  );
};

/* v8 ignore start -- needs the network and native modules; only runs when invoked directly */
if (import.meta.main) {
  const { default: fontnik } = await import('fontnik');
  const { default: mapshaper } = await import('mapshaper');

  await prepare('.', {
    applyCommands: mapshaper.applyCommands,
    download: async url => {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`${url}: HTTP ${response.status}`);
      }

      return new Uint8Array(await response.arrayBuffer());
    },
    glyphRange: (font, start, end) =>
      new Promise((resolve, reject) => {
        fontnik.range({ end, font, start }, (error, glyphs) =>
          error ? reject(error) : resolve(glyphs)
        );
      }),
  });
}
/* v8 ignore stop */
