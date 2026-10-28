import type { z } from 'zod';

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { BoundaryData, BoundaryVersion } from './types.ts';

import { boundaryFeature, nameRow, polityRow, sourceRow } from './schemas.mts';

type LoadResult = { data: BoundaryData; errors: string[] };

type Row = Record<string, unknown>;

const isRecord = (value: unknown): value is Row =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

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
  schema: z.ZodType<T>
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
    const parsed = schema.safeParse(item);

    if (parsed.success) {
      rows.push(parsed.data);
    } else {
      errors.push(`${path}: ${key}[${index}] is not a valid row`);
    }
  });

  return { errors, rows };
};

const parseFeature = (
  path: string,
  feature: unknown,
  index: number
): BoundaryVersion | string => {
  const label = `${path}: features[${index}]`;
  const parsed = boundaryFeature.safeParse(feature);

  if (!parsed.success) {
    const roots = parsed.error.issues.map(({ path: [root] }) => root);

    if (roots.some(root => root === undefined || root === 'type')) {
      return `${label} must be a "Feature"`;
    }

    if (roots.includes('properties')) {
      return `${label} has invalid properties`;
    }

    return `${label} geometry must be a MultiPolygon`;
  }

  const { geometry, properties } = parsed.data;

  return { ...properties, file: path, geometry };
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

  for (const [read, path, key, schema, target] of [
    [politiesRead, politiesPath, 'polities', polityRow, 'polities'],
    [politiesRead, politiesPath, 'names', nameRow, 'names'],
    [sourcesRead, sourcesPath, 'sources', sourceRow, 'sources'],
  ] as const) {
    if ('error' in read) {
      if (!errors.includes(read.error)) {
        errors.push(read.error);
      }
    } else {
      const rows = readRows(path, read.json, key, schema as never);

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
