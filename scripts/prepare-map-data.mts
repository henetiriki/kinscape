import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { toDay } from '../lib/boundaries/model.mts';

// Pinned releases: bump the tag, run `npm run map:prepare`, review the diff.
export const NATURAL_EARTH_TAG = 'v5.1.2';
export const PUBLIC_SANS_TAG = 'v2.001';

/** Holds the lines from before the Twelfth Amendment: M1.3 chose it for 1994 to 2006. */
export const NATURAL_EARTH_1994_TAG = 'v4.1.0';

const NATURAL_EARTH_REPO =
  'https://raw.githubusercontent.com/nvkelso/natural-earth-vector';
const PUBLIC_SANS_URL = `https://raw.githubusercontent.com/uswds/public-sans/${PUBLIC_SANS_TAG}`;

const PROVINCES = 'ne_10m_admin_1_states_provinces';
const PROVINCES_1994 = 'ne_10m_admin_1_v4_1_0';
const PROVINCES_1910 = 'provinces_1910';
const OUTLINE = 'south_africa_outline';
const NEIGHBOURS = 'lesotho_eswatini';

/** afrith/historical-boundary-data, pinned (M1.4). */
export const AFRITH_COMMIT = 'fbdf94d8a561814510f5d62ec552d6d67f3488e6';
const AFRITH_URL = `https://raw.githubusercontent.com/afrith/historical-boundary-data/${AFRITH_COMMIT}/provinces-1910.geojson`;

/** `name` is the file in the repo; `layer` is its name in mapshaper. */
const LAYERS = [
  { dir: '10m_physical', layer: 'ne_10m_land', name: 'ne_10m_land' },
  { dir: '10m_physical', layer: 'ne_10m_coastline', name: 'ne_10m_coastline' },
  {
    dir: '10m_physical',
    layer: 'ne_10m_rivers_lake_centerlines',
    name: 'ne_10m_rivers_lake_centerlines',
  },
  { dir: '10m_cultural', layer: PROVINCES, name: PROVINCES },
  {
    dir: '10m_cultural',
    layer: PROVINCES_1994,
    name: PROVINCES,
    tag: NATURAL_EARTH_1994_TAG,
  },
] as const;

/** West, south, east, north: `MAX_BOUNDS` in `MapView` plus a margin. */
const BBOX = '5,-45,45,-10';

/** Metres. Every layer is simplified in one run so shared edges stay identical. */
const TOLERANCE = 500;

/** Four decimals is about 11 m. */
const PRECISION = 0.0001;

const GLYPH_FONT = 'Public Sans SemiBold';
const GLYPH_RANGES = [
  [0, 255],
  [256, 511],
] as const;

/** First day of the Interim Constitution's provinces; the Union provinces end on it. */
const FIRST_DATE = '1994-04-27';

/** First day of the Union provinces (proclamation of 2 December 1909), Lesotho and eSwatini. */
const UNION_DATE = '1910-05-31';

/** Twelfth Amendment commencement (Proclamation R. 8 of 2006): today's lines apply. */
const TWELFTH_DATE = '2006-03-01';

/** Sixteenth Amendment commencement (Proclamation R. 20 of 2009). */
const SIXTEENTH_DATE = '2009-04-03';

export const BOUNDARY_SOURCE = 'natural-earth-admin-1';
export const BOUNDARY_SOURCE_1994 = 'natural-earth-admin-1-v4';
export const BOUNDARY_SOURCE_1910 = 'afrith-provinces-1910';

const FOREIGN = ['LSO', 'SWZ'];

/** The names in the Act (South Africa Act 1909, s. 6) to Polity id. */
export const UNION_IDS: Record<string, string> = {
  'Cape of Good Hope': 'cape-of-good-hope',
  Natal: 'natal',
  'Orange Free State': 'orange-free-state',
  Transvaal: 'transvaal',
};

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
    `-i ${[...LAYERS.map(({ layer }) => `${layer}.shp`), `${PROVINCES_1910}.geojson`].join(' ')} combine-files`,
    `-filter 'scalerank <= 7' target=ne_10m_rivers_lake_centerlines`,
    `-filter 'adm0_a3 == "ZAF" || adm0_a3 == "LSO" || adm0_a3 == "SWZ"' target=${PROVINCES}`,
    `-each 'key = adm0_a3 == "ZAF" ? name : adm0_a3' target=${PROVINCES}`,
    `-dissolve key target=${PROVINCES}`,
    `-filter 'adm0_a3 == "ZAF"' target=${PROVINCES_1994}`,
    `-each 'key = name' target=${PROVINCES_1994}`,
    `-dissolve key target=${PROVINCES_1994}`,
    `-filter '${FOREIGN.map(code => `key != "${code}"`).join(' && ')}' + name=${OUTLINE} target=${PROVINCES}`,
    `-dissolve target=${OUTLINE}`,
    `-clip ${OUTLINE} target=${PROVINCES_1994}`,
    `-filter '${FOREIGN.map(code => `key == "${code}"`).join(' || ')}' + name=${NEIGHBOURS} target=${PROVINCES}`,
    `-each 'key = name' target=${PROVINCES_1910}`,
    `-dissolve key target=${PROVINCES_1910}`,
    `-erase ${NEIGHBOURS} target=${PROVINCES_1910}`,
    `-clip ne_10m_land target=${PROVINCES_1910}`,
    `-clip bbox=${BBOX} target=*`,
    `-simplify interval=${TOLERANCE} keep-shapes`,
    ...[...LAYERS.map(({ layer }) => layer), PROVINCES_1910].map(
      layer =>
        `-o ${layer}.json format=geojson precision=${PRECISION} target=${layer}`
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

const geometries = (
  provinces: Feature[],
  expected: string[],
  label = 'Natural Earth admin-1 keys differ from POLITY_IDS'
) => {
  const found = new Map(
    provinces.map(({ geometry, properties }) => [
      String(properties.key),
      geometry,
    ])
  );
  const missing = expected.filter(key => !found.has(key));
  const unknown = [...found.keys()].filter(key => !expected.includes(key));

  if (missing.length > 0 || unknown.length > 0) {
    throw new Error(`${label}: missing [${missing}], unexpected [${unknown}]`);
  }

  return found;
};

type Range = {
  confidence: 'high' | 'low';
  source: string;
  validFrom: string;
  validTo: null | string;
};

const version = (geometry: Feature['geometry'], key: string, range: Range) => ({
  geometry: asMultiPolygon(geometry),
  properties: {
    confidence: range.confidence,
    contested: false,
    level: 'polity',
    polity: POLITY_IDS[key] ?? UNION_IDS[key],
    source: range.source,
    validFrom: toDay(range.validFrom),
    validTo: range.validTo === null ? null : toDay(range.validTo),
  },
  type: 'Feature',
});

const collection = (features: ReturnType<typeof version>[]) => ({
  features: features.toSorted(
    (a, b) =>
      a.properties.polity.localeCompare(b.properties.polity) ||
      a.properties.validFrom - b.properties.validFrom
  ),
  type: 'FeatureCollection',
});

/**
 * `union` holds the four Union provinces to the Interim Constitution. `old`
 * holds the v4.1.0 provinces to the Twelfth Amendment. `today` holds Lesotho
 * and eSwatini from the Union (low confidence until the first day of the
 * Interim Constitution), and today's provinces from the Twelfth Amendment, low
 * confidence until the Sixteenth.
 */
export const boundaryVersions = (
  provinces: Feature[],
  provinces1994: Feature[],
  provinces1910: Feature[]
) => {
  const today = geometries(provinces, Object.keys(POLITY_IDS));
  const old = geometries(
    provinces1994,
    Object.keys(POLITY_IDS).filter(key => !FOREIGN.includes(key))
  );
  const union = geometries(
    provinces1910,
    Object.keys(UNION_IDS),
    'afrith provinces-1910 names differ from UNION_IDS'
  );

  return {
    old: collection(
      [...old].map(([key, geometry]) =>
        version(geometry, key, {
          confidence: 'low',
          source: BOUNDARY_SOURCE_1994,
          validFrom: FIRST_DATE,
          validTo: TWELFTH_DATE,
        })
      )
    ),
    today: collection(
      [...today].flatMap(([key, geometry]) =>
        FOREIGN.includes(key)
          ? [
              version(geometry, key, {
                confidence: 'low',
                source: BOUNDARY_SOURCE,
                validFrom: UNION_DATE,
                validTo: FIRST_DATE,
              }),
              version(geometry, key, {
                confidence: 'high',
                source: BOUNDARY_SOURCE,
                validFrom: FIRST_DATE,
                validTo: null,
              }),
            ]
          : [
              version(geometry, key, {
                confidence: 'low',
                source: BOUNDARY_SOURCE,
                validFrom: TWELFTH_DATE,
                validTo: SIXTEENTH_DATE,
              }),
              version(geometry, key, {
                confidence: 'high',
                source: BOUNDARY_SOURCE,
                validFrom: SIXTEENTH_DATE,
                validTo: null,
              }),
            ]
      )
    ),
    union: collection(
      [...union].map(([key, geometry]) =>
        version(geometry, key, {
          confidence: 'low',
          source: BOUNDARY_SOURCE_1910,
          validFrom: UNION_DATE,
          validTo: FIRST_DATE,
        })
      )
    ),
  };
};

/** Downloads Natural Earth, afrith's 1910 provinces and Public Sans, then writes the committed map data under `root`. */
export const prepare = async (root: string, deps: Deps): Promise<void> => {
  const input: Record<string, string | Uint8Array> = {};

  for (const layer of LAYERS) {
    const tag = 'tag' in layer ? layer.tag : NATURAL_EARTH_TAG;

    for (const part of SHAPE_PARTS) {
      const bytes = await deps.download(
        `${NATURAL_EARTH_REPO}/${tag}/${layer.dir}/${layer.name}.${part}`
      );

      // Mapshaper reads the projection file as text.
      input[`${layer.layer}.${part}`] = part === 'prj' ? asText(bytes) : bytes;
    }
  }

  // GeoJSON is read as text, like the projection files.
  input[`${PROVINCES_1910}.geojson`] = asText(await deps.download(AFRITH_URL));

  const output = await deps.applyCommands(buildCommands(), input);

  const versions = boundaryVersions(
    JSON.parse(readOutput(output, PROVINCES)).features,
    JSON.parse(readOutput(output, PROVINCES_1994)).features,
    JSON.parse(readOutput(output, PROVINCES_1910)).features
  );

  writeJson(root, 'data/boundaries/1910.geojson', versions.union);
  writeJson(root, 'data/boundaries/1994.geojson', versions.old);
  writeJson(root, 'data/boundaries/today.geojson', versions.today);

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
