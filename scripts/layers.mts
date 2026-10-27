import { posix, relative, sep } from 'node:path';

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

const DOMAIN_FORBIDDEN_PACKAGES = /^(?:node:|maplibre-gl(?:\/|$))/;
const TEST_FILE = /(?:^|\/)__tests__\/|\.(?:test|spec)\./;

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

  if (path.startsWith('design/') || path === 'lib/design/tokens.mts') {
    return 'design';
  }

  if (path.startsWith('lib/design/')) {
    return undefined;
  }

  if (path.startsWith('lib/')) {
    return 'domain';
  }

  if (path.startsWith('server/')) {
    return 'server';
  }

  if (path.startsWith('features/')) {
    return path.split('/').slice(0, 2).join('/');
  }

  if (path.startsWith('app/components/')) {
    return 'kit';
  }

  if (path.startsWith('app/design-kit/')) {
    return undefined;
  }

  return path.startsWith('app/') ? 'routes' : undefined;
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
  from === 'domain' && DOMAIN_FORBIDDEN_PACKAGES.test(specifier)
    ? `Layer rule: lib/domain may not import ${specifier}.`
    : undefined;

const pathBreak = (from: string, to: string | undefined): string | undefined =>
  to === undefined ||
  to === from ||
  MAY_IMPORT[kindOf(from)].includes(kindOf(to))
    ? undefined
    : kindOf(from) === 'feature' && kindOf(to) === 'feature'
      ? `Layer rule: features never import each other (${from} → ${to}).`
      : `Layer rule: ${named(from)} may not import ${named(to)}.`;

/** The layer rule an import breaks, or undefined if it is allowed. */
export const layerBreak = (
  file: string,
  specifier: string
): string | undefined => {
  const from = layerOf(file);
  const path = targetOf(file, specifier);

  return from === undefined
    ? undefined
    : path === undefined
      ? packageBreak(from, specifier)
      : pathBreak(from, layerOf(path));
};

/** Whether the allowlist covers a file. */
export const allowed = (file: string): boolean =>
  Object.keys(ALLOWLIST).some(
    entry => file === entry || file.startsWith(`${entry}/`)
  );

/** The ESLint rule `layers/imports`. */
export const importsRule = {
  create: (context: {
    filename: string;
    report: (problem: { message: string; node: unknown }) => void;
  }) => {
    const file = relative(process.cwd(), context.filename).split(sep).join('/');

    const check = (node: { source?: { value?: unknown } | null }): void => {
      const specifier = node.source?.value;

      if (typeof specifier !== 'string' || allowed(file)) {
        return;
      }

      const message = layerBreak(file, specifier);

      if (message !== undefined) {
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
