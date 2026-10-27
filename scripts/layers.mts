import { builtinModules } from 'node:module';
import { join, posix, relative, sep } from 'node:path';

// The layer map from docs/architecture.md. ESLint and the fitness test both read it.
// Test files, app/design-kit, scripts, e2e and lib/design tooling are outside the map.

/** Today's breaks, each with where the code moves. A path covers the folder under it. Delete an entry when its break is fixed. */
export const ALLOWLIST: Record<string, string> = {
  'app/components/forms/DateField.tsx': 'features/map',
  'app/components/map': 'features/map',
  'app/components/overlays/SourcesDialog.tsx': 'features/map',
  'lib/boundaries/app-data.ts': 'server/',
  'lib/boundaries/load.mts': 'server/',
  'lib/map/filter.ts': 'features/map',
  'lib/map/style.ts': 'features/map',
};

const ROOT = join(import.meta.dirname, '..');
const MAPLIBRE = /^maplibre-gl(?:\/|$)/;
const TEST_FILE = /(?:^|\/)__tests__\/|\.(?:test|spec)\./;
const DEV_ONLY = /^(?:scripts|e2e|lib\/design)\/|^app\/design-kit\//;
const SOURCE_EXTENSION = /\.[cm]?[jt]sx?$/;

const isBuiltin = (specifier: string): boolean =>
  specifier.startsWith('node:') || builtinModules.includes(specifier);

const MAY_IMPORT: Record<string, string[]> = {
  design: [],
  domain: ['domain'],
  feature: ['design', 'domain', 'server', 'kit'],
  kit: ['design', 'kit'],
  routes: ['design', 'domain', 'server', 'kit', 'feature', 'routes'],
  server: ['domain', 'server'],
};

/** The layer a repo path belongs to: `features/<name>` for a feature, undefined outside the map. */
export const layerOf = (path: string): string | undefined => {
  if (TEST_FILE.test(path)) {
    return undefined;
  }

  // Without the extension or trailing slash, so `@/server` and `@/lib/design/tokens` resolve.
  const stem = path.replace(SOURCE_EXTENSION, '').replace(/\/$/, '');
  const dir = `${stem}/`;

  if (dir.startsWith('design/') || stem === 'lib/design/tokens') {
    return 'design';
  }

  if (dir.startsWith('lib/design/')) {
    return undefined;
  }

  if (dir.startsWith('lib/')) {
    return 'domain';
  }

  if (dir.startsWith('server/')) {
    return 'server';
  }

  if (dir.startsWith('features/')) {
    const name = dir.split('/')[1];

    return name === '' ? undefined : `features/${name}`;
  }

  if (dir.startsWith('app/components/')) {
    return 'kit';
  }

  if (dir.startsWith('app/design-kit/')) {
    return undefined;
  }

  return dir.startsWith('app/') ? 'routes' : undefined;
};

/** The repo path an import points at, or undefined for a package or built-in. */
const targetOf = (file: string, specifier: string): string | undefined => {
  if (specifier.startsWith('@/')) {
    return specifier.slice(2);
  }

  if (!specifier.startsWith('.')) {
    return undefined;
  }

  const path = posix.join(posix.dirname(file), specifier);

  return path.startsWith('..') ? undefined : path;
};

const kindOf = (layer: string): string =>
  layer.startsWith('features/') ? 'feature' : layer;

const named = (layer: string): string =>
  layer === 'domain'
    ? 'lib/domain'
    : layer === 'kit'
      ? 'app/components'
      : layer;

const packageBreak = (from: string, specifier: string): string | undefined =>
  from === 'domain' && (isBuiltin(specifier) || MAPLIBRE.test(specifier))
    ? `Layer rule: lib/domain may not import ${specifier}.`
    : undefined;

const pathBreak = (
  from: string,
  path: string,
  to: string | undefined
): string | undefined =>
  to === undefined
    ? DEV_ONLY.test(`${path}/`) || TEST_FILE.test(path)
      ? `Layer rule: ${named(from)} may not import dev-only code (${path}).`
      : undefined
    : to === from || MAY_IMPORT[kindOf(from)].includes(kindOf(to))
      ? undefined
      : kindOf(from) === 'feature' && kindOf(to) === 'feature'
        ? `Layer rule: features never import each other (${from} → ${to}).`
        : `Layer rule: ${named(from)} may not import ${named(to)}.`;

/** The layer rule an import breaks, or undefined if it is allowed. `as` judges the file as if it sat in another layer. */
export const layerBreak = (
  file: string,
  specifier: string,
  as?: string
): string | undefined => {
  const from = as ?? layerOf(file);
  const path = targetOf(file, specifier);

  return from === undefined
    ? undefined
    : path === undefined
      ? packageBreak(from, specifier)
      : pathBreak(from, path, layerOf(path));
};

/** Whether an allowlist entry covers a file. */
export const covers = (entry: string, file: string): boolean =>
  file === entry || file.startsWith(`${entry}/`);

/** Whether the allowlist lists this break: its file is covered and the import is fine in the layer the entry moves to. */
export const listed = (
  file: string,
  specifier: string,
  allowlist: Record<string, string> = ALLOWLIST
): boolean => {
  const entry = Object.keys(allowlist).find(e => covers(e, file));

  return (
    entry !== undefined &&
    layerBreak(file, specifier, layerOf(allowlist[entry])) === undefined
  );
};

/** The ESLint rule `layers/imports`. */
export const importsRule = {
  create: (context: {
    filename: string;
    report: (problem: { message: string; node: unknown }) => void;
  }) => {
    // Relative to the repo root, not the directory ESLint runs from.
    const file = relative(ROOT, context.filename).split(sep).join('/');

    const check = (node: {
      source?: {
        expressions?: unknown[];
        quasis?: { value: { cooked?: null | string } }[];
        type?: string;
        value?: unknown;
      } | null;
    }): void => {
      const source = node.source;
      // A template literal with no substitutions, as in import(`@/server/db`).
      const specifier =
        source?.type === 'TemplateLiteral' && source.expressions?.length === 0
          ? source.quasis?.[0].value.cooked
          : source?.value;

      if (typeof specifier !== 'string') {
        return;
      }

      const message = layerBreak(file, specifier);

      if (message !== undefined && !listed(file, specifier)) {
        context.report({ message, node });
      }
    };

    return {
      ExportAllDeclaration: check,
      ExportNamedDeclaration: check,
      ImportDeclaration: check,
      ImportExpression: check,
    };
  },
  meta: {
    docs: { description: 'Enforce the layer map in docs/architecture.md.' },
    schema: [],
    type: 'problem' as const,
  },
};

export const plugin = { rules: { imports: importsRule } };
