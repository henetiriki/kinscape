import { join, relative, sep } from 'node:path';
import ts from 'typescript';

import type { AppRoute } from '#ks/scripts/types.ts';

import { SOURCE_EXTENSION, targetOf } from '#ks/scripts/layers.mts';
import { parse, specifiersOf, TEST_FILE } from '#ks/scripts/sources.mts';

// The three safety rows of docs/architecture.md › Patterns: Tree scoping, the sign-in gate and
// the client/server boundary. The fitness tests run them over the repo; eslint.config.mjs reads
// the same lists, so lint and test agree.

const ROOT = join(import.meta.dirname, '..');

/** The top-level files that run on the server and are held to the scoping and boundary rules. */
export const TOP_LEVEL = ['instrumentation.ts', 'proxy.ts'];

/** The files that may import `server/adapters.mts`: the request entry points and the Tree repository. */
export const ADAPTER_IMPORTERS =
  /^server\/(?:action\.mts|auth\/current\.mts|trees\/)/;

/** The `server/` modules `app/` and `features/` may take values from; types may come from any. */
export const APP_SERVER_MODULES = [
  'server/action',
  'server/auth/current',
  'server/boundaries/app-data',
  'server/trees/repository',
];

/** The `TreeStore` methods any server file may call: Account lookups, not Tree data. */
const ACCOUNT_METHODS = ['addAccount', 'findAccount'];

/** The server entry points that open with `import 'server-only'`. */
export const SERVER_ONLY = [
  'server/action.mts',
  'server/adapters.mts',
  'server/auth/current.mts',
  'server/boundaries/app-data.ts',
];

/** The routes served without a session. */
export const PUBLIC_PATHS = ['/sign-in', '/robots.txt'];

/**
 * The calls that check the session. Each page and route handler makes one itself: a layout's
 * redirect doesn't stop its page from rendering into the response. The check is per file.
 */
const SESSION_CHECK = /(?:^|\.)(?:currentSession|openTree|requireSession)$/;

const ADAPTERS_MESSAGE =
  'Scoping rule: only server/action.mts, server/auth/current.mts and server/trees/ import appAdapters.';
const APP_SERVER_MESSAGE = `Scoping rule: app/ and features/ take values from server/ only through ${APP_SERVER_MODULES.join(', ')}.`;

const escape = (text: string): string =>
  text.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);

/** `no-restricted-imports`: `appAdapters` stays in its importers. */
export const ADAPTERS_PATTERN = {
  message: ADAPTERS_MESSAGE,
  regex: String.raw`^[@#]ks/server/adapters\.mts$`,
};

/** `no-restricted-imports`: `app/` and `features/` take values from `server/` only through `APP_SERVER_MODULES`. */
export const APP_SERVER_PATTERN = {
  allowTypeImports: true,
  message: APP_SERVER_MESSAGE,
  regex: String.raw`^[@#]ks/server/(?!(?:${APP_SERVER_MODULES.map(path => escape(path.slice('server/'.length))).join('|')})(?:\.[cm]?[jt]sx?)?$)`,
};

const stemOf = (path: string): string => path.replace(SOURCE_EXTENSION, '');

/** The `TreeStore` methods that reach Tree data, read from the type in `lib/domain/trees/types.ts`. */
export const treeMethods = (typesSource: string): string[] =>
  parse('types.ts', typesSource)
    .statements.flatMap(node =>
      ts.isTypeAliasDeclaration(node) &&
      node.name.text === 'TreeStore' &&
      ts.isTypeLiteralNode(node.type)
        ? node.type.members
        : []
    )
    .flatMap(member =>
      (ts.isPropertySignature(member) || ts.isMethodSignature(member)) &&
      ts.isIdentifier(member.name)
        ? [member.name.text]
        : []
    )
    .filter(name => !ACCOUNT_METHODS.includes(name));

/** The names in `methods` a source reaches as `x.<name>` or takes out as `{ <name> }`. */
const methodUses = (
  path: string,
  source: string,
  methods: string[]
): string[] => {
  const found: string[] = [];
  const visit = (node: ts.Node): void => {
    const name = ts.isPropertyAccessExpression(node)
      ? node.name
      : ts.isBindingElement(node)
        ? (node.propertyName ?? node.name)
        : undefined;

    if (
      name !== undefined &&
      ts.isIdentifier(name) &&
      methods.includes(name.text)
    ) {
      found.push(name.text);
    }

    ts.forEachChild(node, visit);
  };

  visit(parse(path, source));

  return found;
};

/** Each `file: rule` line where Tree data is reached outside `server/trees/`. */
export const scopingBreaks = (
  files: Record<string, string>,
  methods: string[]
): string[] =>
  Object.entries(files)
    .filter(([path]) => !TEST_FILE.test(path))
    .flatMap(([path, source]) => {
      const imports = specifiersOf(path, source)
        .filter(({ typeOnly }) => !typeOnly)
        .flatMap(({ specifier }) => {
          const target = targetOf(path, specifier);

          return target === undefined ? [] : [stemOf(target)];
        })
        .flatMap(target =>
          target === 'server/adapters' && !ADAPTER_IMPORTERS.test(path)
            ? [`${path}: ${ADAPTERS_MESSAGE}`]
            : /^(?:app|features)\//.test(path) &&
                target.startsWith('server/') &&
                !APP_SERVER_MODULES.includes(target)
              ? [`${path}: ${APP_SERVER_MESSAGE}`]
              : []
        );
      const uses = path.startsWith('server/trees/')
        ? []
        : methodUses(path, source, methods).map(
            name =>
              `${path}: Scoping rule: only server/trees/ reads or writes store.${name}.`
          );

      return [...imports, ...uses];
    });

const ROUTE_FILE =
  /^app\/(?:(.*)\/)?(page\.tsx|route\.[jt]sx?|robots\.ts|sitemap\.ts|manifest\.ts|(?:icon|apple-icon|opengraph-image|twitter-image)\.tsx)$/;
const METADATA: Record<string, string> = {
  'manifest.ts': 'manifest.webmanifest',
  'robots.ts': 'robots.txt',
  'sitemap.ts': 'sitemap.xml',
};

/** The URL a route file serves: a `[param]` becomes `x`, a `(group)` drops out. */
export const routeOf = (file: string): AppRoute | undefined => {
  const match = ROUTE_FILE.exec(file);

  if (match === null) {
    return undefined;
  }

  const [, dir = '', name] = match;
  const segments = dir
    .split('/')
    .filter(segment => segment !== '' && !/^\(.*\)$/.test(segment))
    .map(segment => (segment.startsWith('[') ? 'x' : segment));
  // A metadata image is served under its own name; a page or route handler at its folder.
  const image = /^(icon|apple-icon|opengraph-image|twitter-image)\.tsx$/.exec(
    name
  );
  const tail = METADATA[name] ?? image?.[1];

  return {
    file,
    path: `/${[...segments, ...(tail === undefined ? [] : [tail])].join('/')}`,
  };
};

/** The routes among the paths. */
export const appRoutes = (paths: string[]): AppRoute[] =>
  paths.flatMap(path => {
    const route = routeOf(path);

    return route === undefined ? [] : [route];
  });

/** Whether a source calls `currentSession`, `openTree` or `requireSession`. */
const checksSession = (path: string, source: string): boolean => {
  let found = false;
  const visit = (node: ts.Node): void => {
    found ||=
      ts.isCallExpression(node) &&
      SESSION_CHECK.test(node.expression.getText());
    ts.forEachChild(node, visit);
  };

  visit(parse(path, source));

  return found;
};

/**
 * Each `file: rule` line where a route is off the public list and not behind both halves of
 * the gate, or where the gate would catch a static file.
 */
export const gateBreaks = (
  files: Record<string, string>,
  matcher: string,
  staticPaths: string[]
): string[] => {
  const matches = (path: string): boolean =>
    new RegExp(`^${matcher}$`).test(path);
  const routes = appRoutes(Object.keys(files)).flatMap(({ file, path }) =>
    PUBLIC_PATHS.includes(path)
      ? matches(path)
        ? [`${file}: Gate rule: the public route ${path} is behind the gate.`]
        : []
      : [
          ...(matches(path)
            ? []
            : [`${file}: Gate rule: the matcher skips ${path}.`]),
          ...(checksSession(file, files[file])
            ? []
            : [`${file}: Gate rule: ${path} checks no session.`]),
        ]
  );
  const statics = staticPaths.flatMap(path =>
    matches(path)
      ? [`${path}: Gate rule: the gate would redirect a static file.`]
      : []
  );

  return [...routes, ...statics];
};

/** Whether a source starts with the `'use client'` directive. */
export const isClient = (path: string, source: string): boolean => {
  for (const statement of parse(path, source).statements) {
    if (
      !ts.isExpressionStatement(statement) ||
      !ts.isStringLiteral(statement.expression)
    ) {
      return false;
    }

    if (statement.expression.text === 'use client') {
      return true;
    }
  }

  return false;
};

/** Whether a source's first statement is `import 'server-only'`. */
const opensServerOnly = (path: string, source: string): boolean => {
  const [first] = parse(path, source).statements;

  return (
    first !== undefined &&
    ts.isImportDeclaration(first) &&
    ts.isStringLiteral(first.moduleSpecifier) &&
    first.moduleSpecifier.text === 'server-only'
  );
};

const clientMessage = (specifier: string): string =>
  `Boundary rule: a 'use client' file imports no value from server/ (${specifier}).`;

/** Each `file: rule` line where the client/server boundary is crossed. */
export const boundaryBreaks = (files: Record<string, string>): string[] => [
  ...SERVER_ONLY.flatMap(path =>
    path in files && opensServerOnly(path, files[path])
      ? []
      : [
          `${path}: Boundary rule: the entry point starts with import 'server-only'.`,
        ]
  ),
  ...Object.entries(files)
    .filter(([path, source]) => !TEST_FILE.test(path) && isClient(path, source))
    .flatMap(([path, source]) =>
      specifiersOf(path, source)
        .filter(
          ({ specifier, typeOnly }) =>
            !typeOnly &&
            targetOf(path, specifier)?.startsWith('server/') === true
        )
        .map(({ specifier }) => `${path}: ${clientMessage(specifier)}`)
    ),
];

/** A node that names a module, as ESLint hands it over. */
interface Sourced {
  exportKind?: string;
  importKind?: string;
  source?: { value?: unknown } | null;
}

/** The ESLint rule `safety/client-imports`: a `'use client'` file imports no value from `server/`. */
export const clientImportsRule = {
  create: (context: {
    filename: string;
    report: (problem: { message: string; node: unknown }) => void;
  }) => {
    // Relative to the repo root, not the directory ESLint runs from.
    const file = relative(ROOT, context.filename).split(sep).join('/');
    let client = false;

    const check = (node: Sourced): void => {
      const specifier = node.source?.value;

      if (
        client &&
        node.importKind !== 'type' &&
        node.exportKind !== 'type' &&
        typeof specifier === 'string' &&
        targetOf(file, specifier)?.startsWith('server/') === true
      ) {
        context.report({ message: clientMessage(specifier), node });
      }
    };

    return {
      ExportAllDeclaration: check,
      ExportNamedDeclaration: check,
      ImportDeclaration: check,
      ImportExpression: check,
      Program: (node: { body: { directive?: string }[] }) => {
        client = node.body.some(
          statement => statement.directive === 'use client'
        );
      },
    };
  },
  meta: {
    docs: { description: "A 'use client' file imports no value from server/." },
    schema: [],
    type: 'problem' as const,
  },
};

export const plugin = { rules: { 'client-imports': clientImportsRule } };
