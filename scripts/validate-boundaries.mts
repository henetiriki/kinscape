import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const BOUNDARIES_DIR = 'data/boundaries';

const checkFile = (path: string): string[] => {
  let json: unknown;

  try {
    json = JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return [`${path}: not valid JSON`];
  }

  const { features, type } = (json ?? {}) as Record<string, unknown>;

  if (type !== 'FeatureCollection') {
    return [`${path}: type must be "FeatureCollection"`];
  }

  if (!Array.isArray(features)) {
    return [`${path}: features must be an array`];
  }

  return features.flatMap((feature, index) =>
    (feature as null | Record<string, unknown>)?.type === 'Feature'
      ? []
      : [`${path}: features[${index}] must be a "Feature"`]
  );
};

export const validateBoundaries = (dir: string): string[] => {
  if (!existsSync(dir)) {
    return [];
  }

  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter(entry => entry.isFile() && entry.name.endsWith('.geojson'))
    .flatMap(entry => checkFile(join(entry.parentPath, entry.name)));
};

export const run = (dir: string): number => {
  const errors = validateBoundaries(dir);

  errors.forEach(error => console.error(error));

  return errors.length === 0 ? 0 : 1;
};

/* v8 ignore next 3 -- only true when run directly with node, not when imported */
if (import.meta.main) {
  process.exitCode = run(BOUNDARIES_DIR);
}
