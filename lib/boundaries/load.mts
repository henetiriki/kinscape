import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import type {
  BoundaryData,
  BoundaryVersion,
  Polity,
  PolityName,
  Source,
} from './model.mts';

export type LoadResult = { data: BoundaryData; errors: string[] };

type Row = Record<string, unknown>;

const isRecord = (value: unknown): value is Row =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isText = (value: unknown): value is string =>
  typeof value === 'string' && value !== '';

const isDay = (value: unknown): value is number => Number.isInteger(value);

const isEndDay = (value: unknown): value is null | number =>
  value === null || isDay(value);

const SOURCE_FIELDS = [
  'attribution',
  'author',
  'dateChecked',
  'id',
  'layer',
  'licence',
  'licenceLink',
  'title',
] as const;

/** Reads a JSON file; a missing file reads as undefined. */
const readJson = (path: string): { error: string } | { json: unknown } => {
  if (!existsSync(path)) {
    return { json: undefined };
  }

  try {
    return { json: JSON.parse(readFileSync(path, 'utf8')) };
  } catch {
    return { error: `${path}: not valid JSON` };
  }
};

const readRows = <T,>(
  path: string,
  json: unknown,
  key: string,
  parse: (row: Row) => T | undefined
): { errors: string[]; rows: T[] } => {
  if (json === undefined) {
    return { errors: [], rows: [] };
  }

  const list = isRecord(json) ? json[key] : undefined;

  if (!Array.isArray(list)) {
    return { errors: [`${path}: "${key}" must be an array`], rows: [] };
  }

  const rows: T[] = [];
  const errors: string[] = [];

  list.forEach((item, index) => {
    const row = isRecord(item) ? parse(item) : undefined;

    if (row) {
      rows.push(row);
    } else {
      errors.push(`${path}: ${key}[${index}] is not a valid row`);
    }
  });

  return { errors, rows };
};

const parsePolity = (row: Row): Polity | undefined =>
  isText(row.id) ? { id: row.id } : undefined;

const parseName = (row: Row): PolityName | undefined =>
  isText(row.name) &&
  isText(row.polity) &&
  isDay(row.validFrom) &&
  isEndDay(row.validTo)
    ? {
        name: row.name,
        polity: row.polity,
        validFrom: row.validFrom,
        validTo: row.validTo,
      }
    : undefined;

const parseSource = (row: Row): Source | undefined =>
  SOURCE_FIELDS.every(field => isText(row[field]))
    ? (Object.fromEntries(
        SOURCE_FIELDS.map(field => [field, row[field]])
      ) as Source)
    : undefined;

const isMultiPolygon = (
  geometry: unknown
): geometry is BoundaryVersion['geometry'] =>
  isRecord(geometry) &&
  geometry.type === 'MultiPolygon' &&
  Array.isArray(geometry.coordinates);

const parseFeature = (
  path: string,
  feature: unknown,
  index: number
): BoundaryVersion | string => {
  const label = `${path}: features[${index}]`;

  if (!isRecord(feature) || feature.type !== 'Feature') {
    return `${label} must be a "Feature"`;
  }

  const props = isRecord(feature.properties) ? feature.properties : {};

  if (
    !isText(props.polity) ||
    !isText(props.source) ||
    !isDay(props.validFrom) ||
    !isEndDay(props.validTo) ||
    (props.level !== 'polity' && props.level !== 'district') ||
    (props.confidence !== 'high' && props.confidence !== 'low') ||
    typeof props.contested !== 'boolean'
  ) {
    return `${label} has invalid properties`;
  }

  if (!isMultiPolygon(feature.geometry)) {
    return `${label} geometry must be a MultiPolygon`;
  }

  return {
    confidence: props.confidence,
    contested: props.contested,
    file: path,
    geometry: feature.geometry,
    level: props.level,
    polity: props.polity,
    source: props.source,
    validFrom: props.validFrom,
    validTo: props.validTo,
  };
};

const readBoundaryFile = (
  path: string
): { errors: string[]; versions: BoundaryVersion[] } => {
  const read = readJson(path);

  if ('error' in read) {
    return { errors: [read.error], versions: [] };
  }

  const { features, type } = isRecord(read.json) ? read.json : ({} as Row);

  if (type !== 'FeatureCollection') {
    return {
      errors: [`${path}: type must be "FeatureCollection"`],
      versions: [],
    };
  }

  if (!Array.isArray(features)) {
    return { errors: [`${path}: features must be an array`], versions: [] };
  }

  const errors: string[] = [];
  const versions: BoundaryVersion[] = [];

  features.forEach((feature, index) => {
    const parsed = parseFeature(path, feature, index);

    if (typeof parsed === 'string') {
      errors.push(parsed);
    } else {
      versions.push(parsed);
    }
  });

  return { errors, versions };
};

/** Reads `polities.json`, `sources.json` and every `.geojson` under `boundaries/` in `root`. */
export const loadBoundaryData = (root: string): LoadResult => {
  const politiesPath = join(root, 'polities.json');
  const sourcesPath = join(root, 'sources.json');
  const politiesRead = readJson(politiesPath);
  const sourcesRead = readJson(sourcesPath);
  const errors: string[] = [];
  const data: BoundaryData = {
    boundaries: [],
    names: [],
    polities: [],
    sources: [],
  };

  for (const [read, path, key, parse, target] of [
    [politiesRead, politiesPath, 'polities', parsePolity, 'polities'],
    [politiesRead, politiesPath, 'names', parseName, 'names'],
    [sourcesRead, sourcesPath, 'sources', parseSource, 'sources'],
  ] as const) {
    if ('error' in read) {
      if (!errors.includes(read.error)) {
        errors.push(read.error);
      }
    } else {
      const rows = readRows(path, read.json, key, parse as never);

      errors.push(...rows.errors);
      (data[target] as unknown[]).push(...rows.rows);
    }
  }

  const dir = join(root, 'boundaries');
  const files = existsSync(dir)
    ? readdirSync(dir, { recursive: true, withFileTypes: true }).filter(
        entry => entry.isFile() && entry.name.endsWith('.geojson')
      )
    : [];

  for (const entry of files) {
    const result = readBoundaryFile(join(entry.parentPath, entry.name));

    errors.push(...result.errors);
    data.boundaries.push(...result.versions);
  }

  return { data, errors };
};
