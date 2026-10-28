import { readFileSync } from 'node:fs';
import { builtinModules } from 'node:module';
import { join, posix, relative, sep } from 'node:path';

// The layer map from docs/architecture.md. ESLint and the fitness test both read it.
// Test files, app/design-kit, scripts, e2e, lib/design tooling and any other lib/ folder are outside the map.

/** Today's breaks, each with where the code moves. A path covers the folder under it. Delete an entry when its break is fixed. */
export const ALLOWLIST: Record<string, string> = {
  'app/components/forms/DateField.tsx': 'features/map',
  'app/components/map': 'features/map',
  'app/components/overlays/SourcesDialog.tsx': 'features/map',
  'lib/map/filter.ts': 'features/map',
  'lib/map/style.ts': 'features/map',
};

const ROOT = join(import.meta.dirname, '..');
const MAPLIBRE = /^maplibre-gl(?:\/|$)/;
const TEST_FILE = /(?:^|\/)__tests__\/|\.(?:test|spec)\./;
const DEV_ONLY = /^(?:scripts|e2e|lib\/design)\/|^app\/design-kit\//;

export const SOURCE_EXTENSION = /\.[cm]?[jt]sx?$/;
/** Calls whose first argument is a module path, matched on the callee's source text. */
export const MODULE_CALL =
  /^(?:require|vi\.(?:doMock|importActual|importMock|mock))$/;

const manifest = JSON.parse(
  readFileSync(join(ROOT, 'package.json'), 'utf8')
) as {
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
};
const PACKAGES = Object.keys({
  ...manifest.dependencies,
  ...manifest.devDependencies,
});

/** A `node:` specifier, or a bare built-in name that no package in package.json shares. */
export const isBuiltin = (
  specifier: string,
  packages: string[] = PACKAGES
): boolean =>
  specifier.startsWith('node:') ||
  (builtinModules.includes(specifier) &&
    !packages.includes(specifier.split('/')[0]));

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

  // Without the extension or trailing slash, so `@/server` resolves.
  const stem = path.replace(SOURCE_EXTENSION, '').replace(/\/$/, '');
  const dir = `${stem}/`;

  if (dir.startsWith('design/')) {
    return 'design';
  }

  if (dir.startsWith('lib/design/')) {
    return undefined;
  }

  // `lib/map/` holds only the MapLibre files until AR.10 (#323).
  if (dir.startsWith('lib/domain/') || dir.startsWith('lib/map/')) {
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
export const targetOf = (
  file: string,
  specifier: string
): string | undefined => {
  const joined = specifier.startsWith('@/')
    ? specifier.slice(2)
    : specifier.startsWith('@ks/')
      ? specifier.slice(4)
      : specifier.startsWith('.')
        ? posix.join(posix.dirname(file), specifier)
        : undefined;

  if (joined === undefined) {
    return undefined;
  }

  // Normalised, so `@/design/../lib/a` is judged as lib/a.
  const path = posix.normalize(joined);

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

/** The rule a file breaks by where it sits: `features/` holds only feature folders. Tests are outside the map. */
export const fileBreak = (file: string): string | undefined =>
  /^features\/[^/]+$/.test(file) && !TEST_FILE.test(file)
    ? 'Layer rule: features/ holds only feature folders.'
    : undefined;

/** Whether an allowlist entry covers a file. */
export const covers = (entry: string, file: string): boolean =>
  file === entry || file.startsWith(`${entry}/`);

/** The allowlist entry that covers a file: the most specific one, so a file entry beats the folder around it. */
export const entryOf = (
  file: string,
  allowlist: Record<string, string> = ALLOWLIST
): string | undefined =>
  Object.keys(allowlist)
    .filter(e => covers(e, file))
    .sort((a, b) => b.length - a.length)[0];

/** Whether the allowlist lists this break: its file is covered and the import is fine in the layer the entry moves to. */
export const listed = (
  file: string,
  specifier: string,
  allowlist: Record<string, string> = ALLOWLIST
): boolean => {
  const entry = entryOf(file, allowlist);

  return (
    entry !== undefined &&
    layerBreak(file, specifier, layerOf(allowlist[entry])) === undefined
  );
};

/** The part of an AST node that names a module: a string literal, or a template literal. */
interface Source {
  expressions?: unknown[];
  quasis?: { value: { cooked?: null | string } }[];
  type?: string;
  value?: unknown;
}

/** The ESLint rule `layers/imports`. */
export const importsRule = {
  create: (context: {
    filename: string;
    report: (problem: { message: string; node: unknown }) => void;
    sourceCode: { getText: (node: unknown) => string };
  }) => {
    // Relative to the repo root, not the directory ESLint runs from.
    const file = relative(ROOT, context.filename).split(sep).join('/');

    const checkSource = (
      source: null | Source | undefined,
      node: unknown
    ): void => {
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

    const check = (node: { source?: null | Source }): void => {
      checkSource(node.source, node);
    };

    return {
      CallExpression: (node: { arguments: Source[]; callee: unknown }) => {
        if (MODULE_CALL.test(context.sourceCode.getText(node.callee))) {
          checkSource(node.arguments[0], node);
        }
      },
      ExportAllDeclaration: check,
      ExportNamedDeclaration: check,
      ImportDeclaration: check,
      ImportExpression: check,
      Program: (node: unknown) => {
        const message = fileBreak(file);

        if (message !== undefined) {
          context.report({ message, node });
        }
      },
      // import x = require('…')
      TSImportEqualsDeclaration: (node: {
        moduleReference: { expression?: Source };
      }) => {
        checkSource(node.moduleReference.expression, node);
      },
      // import('…').T and typeof import('…'), from the TypeScript parser.
      TSImportType: check,
    };
  },
  meta: {
    docs: { description: 'Enforce the layer map in docs/architecture.md.' },
    schema: [],
    type: 'problem' as const,
  },
};

export const plugin = { rules: { imports: importsRule } };
