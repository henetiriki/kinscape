import { join, relative, sep } from 'node:path';
import ts from 'typescript';

import type { AppRoute, HeaderRule } from '#ks/scripts/types.ts';

import { SOURCE_EXTENSION, targetOf } from '#ks/scripts/layers.mts';
import { parse, specifiersOf, TEST_FILE } from '#ks/scripts/sources.mts';
import { isDevPage } from '#ks/server/dev-pages.mts';

// The four safety rows of docs/architecture.md › Patterns:
// - Tree scoping
// - the sign-in gate
// - the client/server boundary
// - Tree data stays private (cache, addresses, memory only)
// The fitness tests run them over the repo. eslint.config.mjs reads the lists of the
// scoping and boundary rows, so lint and test agree on those.

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
const SESSION_CHECK =
  /(?:^|\.)(?:currentSession|openTree|requireDevPage|requireSession)$/;

/** The call every route under `/screens` makes, so each hides itself too. */
const DEV_PAGE_CHECK = /(?:^|\.)requireDevPage$/;

const ADAPTERS_MESSAGE =
  'Scoping rule: only server/action.mts, server/auth/current.mts and server/trees/ import appAdapters.';
const APP_SERVER_MESSAGE = `Scoping rule: app/, features/ and lib/ take values from server/ only through ${APP_SERVER_MODULES.join(', ')}.`;

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
      : ts.isElementAccessExpression(node)
        ? node.argumentExpression
        : ts.isBindingElement(node)
          ? (node.propertyName ?? node.name)
          : undefined;

    if (
      name !== undefined &&
      (ts.isIdentifier(name) ||
        ts.isStringLiteral(name) ||
        ts.isNoSubstitutionTemplateLiteral(name)) &&
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
            : /^(?:app|features|lib)\//.test(path) &&
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
  /^app\/(?:(.*)\/)?((?:page|route)\.[jt]sx?|robots\.ts|sitemap\.ts|manifest\.ts|(?:icon|apple-icon|opengraph-image|twitter-image)\.tsx)$/;
const METADATA: Record<string, string> = {
  'manifest.ts': 'manifest.webmanifest',
  'robots.ts': 'robots.txt',
  'sitemap.ts': 'sitemap.xml',
};

/** The URL a route file serves: a `[param]` becomes `x`; a `(group)` and an `@slot` drop out. */
export const routeOf = (file: string): AppRoute | undefined => {
  const match = ROUTE_FILE.exec(file);

  if (match === null) {
    return undefined;
  }

  const [, dir = '', name] = match;
  const segments = dir
    .split('/')
    .filter(
      segment =>
        segment !== '' && !/^\(.*\)$/.test(segment) && !segment.startsWith('@')
    )
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

/** Whether a source calls a function whose name matches `check`. */
const calls = (check: RegExp, path: string, source: string): boolean => {
  let found = false;
  const visit = (node: ts.Node): void => {
    found ||=
      ts.isCallExpression(node) && check.test(node.expression.getText());
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
          ...(calls(SESSION_CHECK, file, files[file])
            ? []
            : [`${file}: Gate rule: ${path} checks no session.`]),
          ...(isDevPage(path) && !calls(DEV_PAGE_CHECK, file, files[file])
            ? [`${file}: Gate rule: ${path} does not call requireDevPage().`]
            : []),
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

/** The route handlers that may send JSON without `privateJson()`, each with its reason. */
export const JSON_EXEMPT: Record<string, string> = {
  'app/data/polities/route.ts': 'Reference data: no Tree data in the body.',
};

/** The dynamic folders `app/` may hold. */
export const ADDRESS_FOLDERS = ['[id]'];

/** The search parameters a file under `app/` may read. */
export const SEARCH_PARAMS = ['edit', 'returnTo'];

/** The files under `app/` or `features/` that may name browser storage, each with its reason. */
export const STORAGE_EXEMPT: Record<string, string> = {};

const STORAGE_NAMES = ['localStorage', 'sessionStorage', 'indexedDB'];
const SEARCH_METHODS = ['get', 'getAll', 'has'];
const TREE_CALL = /(?:^|\.)(?:openTree|treeAction)$/;
const NO_STORE = 'private, no-store';
const EXTENSIONS = ['.ts', '.tsx', '.mts', '.js', '.jsx'];

/** Each `file: rule` line where a route handler sends JSON without `privateJson()`. */
export const jsonRouteBreaks = (files: Record<string, string>): string[] =>
  Object.entries(files)
    .filter(
      ([path]) =>
        /^app\/(?:.*\/)?route\.[jt]sx?$/.test(path) && !(path in JSON_EXEMPT)
    )
    .filter(([path, source]) =>
      calls(/^(?:Next)?Response\.json$/, path, source)
    )
    .map(
      ([path]) =>
        `${path}: Cache rule: a route handler sends JSON through privateJson().`
    );

/** The file a module target names, with an extension or as a folder's `index`. */
const fileOf = (
  files: Record<string, string>,
  target: string
): string | undefined =>
  [
    target,
    ...EXTENSIONS.map(extension => `${target}${extension}`),
    ...EXTENSIONS.map(extension => `${target}/index${extension}`),
  ].find(candidate => candidate in files);

/** Whether a file calls `treeAction` or `openTree`, or takes a value from an `app/` or `features/` file that does. */
const readsTree = (
  files: Record<string, string>,
  path: string,
  seen: Set<string> = new Set()
): boolean => {
  if (seen.has(path)) {
    return false;
  }

  seen.add(path);

  return (
    calls(TREE_CALL, path, files[path]) ||
    specifiersOf(path, files[path])
      .filter(({ typeOnly }) => !typeOnly)
      .flatMap(({ specifier }) => {
        const target = targetOf(path, specifier);
        const file = target === undefined ? undefined : fileOf(files, target);

        return file !== undefined &&
          /^(?:app|features)\//.test(file) &&
          !TEST_FILE.test(file)
          ? [file]
          : [];
      })
      .some(file => readsTree(files, file, seen))
  );
};

/**
 * Whether a `next.config.ts` header `source` covers a route path: literal segments, `:name` and
 * a last `:name*`. Any other syntax covers nothing, so the check fails closed.
 */
export const covers = (source: string, path: string): boolean => {
  const open = /\/:\w+\*$/.test(source);
  const rule = source.split('/').filter(Boolean);
  const fixed = open ? rule.slice(0, -1) : rule;
  const target = path.split('/').filter(Boolean);

  return (
    (open ? target.length >= fixed.length : target.length === fixed.length) &&
    fixed.every(
      (segment, index) =>
        /^:\w+$/.test(segment) ||
        (/^[\w.~-]+$/.test(segment) && segment === target[index])
    )
  );
};

/** Each `file: rule` line where a page that reads Tree data has no `private, no-store` header rule. */
export const noStoreBreaks = (
  files: Record<string, string>,
  rules: HeaderRule[]
): string[] => {
  const global = rules.filter(
    ({ has, headers, missing }) =>
      has === undefined &&
      missing === undefined &&
      headers.some(
        ({ key, value }) => key === 'Cache-Control' && value === NO_STORE
      )
  );

  return appRoutes(Object.keys(files))
    .filter(
      ({ file }) =>
        /\/page\.[jt]sx?$/.test(file) &&
        !TEST_FILE.test(file) &&
        readsTree(files, file)
    )
    .filter(({ path }) => !global.some(rule => covers(rule.source, path)))
    .map(
      ({ file, path }) =>
        `${file}: Cache rule: ${path} reads Tree data, and no next.config.ts header rule sets Cache-Control: ${NO_STORE} there.`
    );
};

/** Whether an identifier is a read of its name, not a declaration or a property name. */
const isRead = (node: ts.Identifier): boolean => {
  const { parent } = node;
  const named = parent as { name?: ts.Node; propertyName?: ts.Node };

  return (
    ts.isShorthandPropertyAssignment(parent) ||
    (named.name !== node && named.propertyName !== node)
  );
};

/** The names a read of `searchParams` takes, or undefined if the read has a form the check cannot see. */
const namesOf = (read: ts.Node): string[] | undefined => {
  const outer = ts.isAwaitExpression(read.parent) ? read.parent : read;
  const { parent } = outer;

  if (
    ts.isVariableDeclaration(parent) &&
    parent.initializer === outer &&
    ts.isObjectBindingPattern(parent.name)
  ) {
    const names = parent.name.elements.map(
      ({ dotDotDotToken, name, propertyName }) => {
        const key = propertyName ?? name;

        return dotDotDotToken === undefined &&
          (ts.isIdentifier(key) || ts.isStringLiteral(key))
          ? key.text
          : undefined;
      }
    );

    return names.every(name => name !== undefined) ? names : undefined;
  }

  if (
    ts.isVariableDeclaration(parent) &&
    ts.isCallExpression(read) &&
    ts.isIdentifier(parent.name)
  ) {
    return [];
  }

  const [argument] = ts.isCallExpression(parent.parent)
    ? parent.parent.arguments
    : [];

  return ts.isPropertyAccessExpression(parent) &&
    parent.expression === outer &&
    SEARCH_METHODS.includes(parent.name.text) &&
    ts.isCallExpression(parent.parent) &&
    parent.parent.expression === parent &&
    argument !== undefined &&
    ts.isStringLiteralLike(argument)
    ? [argument.text]
    : undefined;
};

const isUseSearchParams = (node: ts.Node): node is ts.CallExpression =>
  ts.isCallExpression(node) &&
  ts.isIdentifier(node.expression) &&
  node.expression.text === 'useSearchParams';

/** Each `file: rule` line for a dynamic folder under `app/` that is not on the list. */
const folderBreaks = (appFiles: [string, string][]): string[] =>
  [
    ...new Set(
      appFiles.flatMap(([path]) => {
        const parts = path.split('/').slice(0, -1);

        return parts.flatMap((part, index) =>
          part.startsWith('[') && !ADDRESS_FOLDERS.includes(part)
            ? [parts.slice(0, index + 1).join('/')]
            : []
        );
      })
    ),
  ].map(
    folder =>
      `${folder}: Address rule: a dynamic folder under app/ is one of ${ADDRESS_FOLDERS.join(', ')}.`
  );

/** The local names that hold `searchParams` or a `useSearchParams()` result in a file. */
const boundNames = (tree: ts.Node): Set<string> => {
  const bound = new Set(['searchParams']);
  const collect = (node: ts.Node): void => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.initializer !== undefined &&
      isUseSearchParams(node.initializer)
    ) {
      bound.add(node.name.text);
    }

    if (
      ts.isBindingElement(node) &&
      ts.isIdentifier(node.name) &&
      node.propertyName !== undefined &&
      ts.isIdentifier(node.propertyName) &&
      node.propertyName.text === 'searchParams'
    ) {
      bound.add(node.name.text);
    }

    ts.forEachChild(node, collect);
  };

  collect(tree);

  return bound;
};

/** Each `file: rule` line for a search parameter read that is off the list or has a form the check cannot see. */
const searchParamBreaks = (path: string, source: string): string[] => {
  const tree = parse(path, source);
  const bound = boundNames(tree);
  const found: (string[] | undefined)[] = [];
  const visit = (node: ts.Node): void => {
    if (
      isUseSearchParams(node) ||
      (ts.isPropertyAccessExpression(node) &&
        node.name.text === 'searchParams') ||
      (ts.isIdentifier(node) && bound.has(node.text) && isRead(node))
    ) {
      found.push(namesOf(node));
    }

    ts.forEachChild(node, visit);
  };

  visit(tree);

  return found.flatMap(names =>
    names === undefined
      ? [
          `${path}: Address rule: read a search parameter by name, from searchParams or useSearchParams().`,
        ]
      : names
          .filter(name => !SEARCH_PARAMS.includes(name))
          .map(
            name =>
              `${path}: Address rule: the search parameter ${name} is not one of ${SEARCH_PARAMS.join(', ')}.`
          )
  );
};

/** Each `file: rule` line for a dynamic folder or a search parameter off the lists. */
export const addressBreaks = (files: Record<string, string>): string[] => {
  const appFiles = Object.entries(files).filter(
    ([path]) => path.startsWith('app/') && !TEST_FILE.test(path)
  );

  return [
    ...folderBreaks(appFiles),
    ...appFiles.flatMap(([path, source]) => searchParamBreaks(path, source)),
  ];
};

/** The storage names in a file under `app/` or `features/`. */
const storageNames = (path: string, source: string): string[] => {
  if (!/^(?:app|features)\//.test(path)) {
    return [];
  }

  const names = new Set<string>();
  const visit = (node: ts.Node): void => {
    if (
      (ts.isIdentifier(node) || ts.isStringLiteralLike(node)) &&
      STORAGE_NAMES.includes(node.text)
    ) {
      names.add(node.text);
    }

    ts.forEachChild(node, visit);
  };

  visit(parse(path, source));

  return [...names];
};

/**
 * Each `file: rule` line where a file keeps Tree data outside memory. The storage names count
 * only under `app/` and `features/`. A persistence import counts in any source file.
 */
export const memoryOnlyBreaks = (files: Record<string, string>): string[] =>
  Object.entries(files)
    .filter(([path]) => !TEST_FILE.test(path) && !(path in STORAGE_EXEMPT))
    .flatMap(([path, source]) => [
      ...storageNames(path, source).map(
        name => `${path}: Memory rule: no file names ${name}.`
      ),
      ...specifiersOf(path, source)
        .filter(({ specifier }) => /^@tanstack\/.*persist/.test(specifier))
        .map(
          ({ specifier }) =>
            `${path}: Memory rule: no file imports a persistence package (${specifier}).`
        ),
    ]);

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
