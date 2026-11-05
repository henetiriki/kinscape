import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import {
  ADAPTERS_PATTERN,
  APP_SERVER_PATTERN,
  scopingBreaks,
  TOP_LEVEL,
  treeMethods,
} from '@ks/scripts/safety.mts';
import { readSources } from '@ks/scripts/sources.mts';

// NFR-10. Tree data is reached only through server/trees/: the repo first, then fixtures.
const ROOTS = ['app', 'features', 'lib', 'server'];
const METHODS = treeMethods(readFileSync('lib/domain/trees/types.ts', 'utf8'));

const ADAPTERS =
  'Scoping rule: only server/action.mts, server/auth/current.mts and server/trees/ import appAdapters.';
const APP_SERVER =
  'Scoping rule: app/ and features/ take values from server/ only through server/action, server/auth/current, server/boundaries/app-data, server/trees/repository.';

/** A route that reads a Tree with ids from the query string: the shape the rule exists to catch. */
const THROWAWAY = {
  'app/trees/route.ts': [
    "import { appAdapters } from '@ks/server/adapters.mts';",
    'export const GET = async (request: Request) => {',
    '  const { searchParams } = new URL(request.url);',
    '  const tree = await appAdapters().store.findTree(',
    "    searchParams.get('account') ?? '',",
    "    searchParams.get('tree') ?? ''",
    '  );',
    '  return Response.json(tree);',
    '};',
  ].join('\n'),
};

describe('the repo', () => {
  it('reaches Tree data only through server/trees/', () => {
    const files = {
      ...readSources(ROOTS),
      ...Object.fromEntries(
        TOP_LEVEL.map(path => [path, readFileSync(path, 'utf8')])
      ),
    };

    expect(Object.keys(files)).toEqual(
      expect.arrayContaining([
        'proxy.ts',
        'app/sign-in/actions.ts',
        'server/trees/repository.mts',
      ])
    );
    expect(scopingBreaks(files, METHODS)).toEqual([]);
  });
});

describe('treeMethods', () => {
  it('reads the Tree methods from the type, not the Account ones', () => {
    expect(METHODS).toEqual(['findTree', 'findTrees']);
  });

  it('skips an index signature and any other type', () => {
    expect(
      treeMethods(
        [
          'export type Other = { findPin: () => void };',
          'export type TreeStore = { [key: string]: unknown; findAccount: () => void; findPin: () => void };',
          'export type Alias = TreeStore;',
        ].join('\n')
      )
    ).toEqual(['findPin']);
  });

  it('reads a method-style member', () => {
    expect(
      treeMethods(
        'export type TreeStore = { findPins(treeId: string): Promise<string[]>; findAccount(): void };'
      )
    ).toEqual(['findPins']);
  });
});

describe('scopingBreaks', () => {
  it('names both breaks in the throwaway route', () => {
    expect(scopingBreaks(THROWAWAY, METHODS)).toEqual([
      `app/trees/route.ts: ${ADAPTERS}`,
      'app/trees/route.ts: Scoping rule: only server/trees/ reads or writes store.findTree.',
    ]);
  });

  it.each([
    [
      'a feature importing the session store',
      'features/map/a.ts',
      "import { sessionOf } from '@ks/server/auth/sessions.mts';",
      APP_SERVER,
    ],
    [
      'a page importing a store',
      'app/people/page.tsx',
      "import { memoryStore } from '@ks/server/trees/memory-store.mts';",
      APP_SERVER,
    ],
    [
      'a server file importing the adapters',
      'server/auth/sign-in.mts',
      "import { appAdapters } from '#ks/server/adapters.mts';",
      ADAPTERS,
    ],
    [
      'a re-export of the adapters',
      'lib/ui/a.ts',
      "export { appAdapters } from '@ks/server/adapters.mts';",
      ADAPTERS,
    ],
    [
      'a dynamic import of the adapters',
      'features/map/a.ts',
      "const { appAdapters } = await import('@ks/server/adapters.mts');",
      ADAPTERS,
    ],
    [
      'a method taken out of the store',
      'server/auth/current.mts',
      'const { findTrees } = appAdapters().store;',
      'Scoping rule: only server/trees/ reads or writes store.findTrees.',
    ],
    [
      'a renamed method taken out of the store',
      'server/auth/current.mts',
      'const { findTree: find } = store;',
      'Scoping rule: only server/trees/ reads or writes store.findTree.',
    ],
    [
      'a method passed on without a call',
      'server/action.mts',
      'const read = store.findTree;',
      'Scoping rule: only server/trees/ reads or writes store.findTree.',
    ],
  ])('flags %s', (_name, path, source, message) => {
    expect(scopingBreaks({ [path]: source }, METHODS)).toEqual([
      `${path}: ${message}`,
    ]);
  });

  it.each([
    [
      'a page importing the session check',
      'app/page.tsx',
      "import { currentSession } from '@ks/server/auth/current.mts';",
    ],
    [
      'a route importing the reference data',
      'app/data/polities/route.ts',
      "import { loadAppData } from '@ks/server/boundaries/app-data';",
    ],
    [
      'an action importing treeAction and openTree',
      'app/people/actions.ts',
      "import { treeAction } from '@ks/server/action.mts';\nimport { openTree } from '@ks/server/trees/repository.mts';",
    ],
    [
      'a type import from anywhere in server/',
      'features/map/a.ts',
      "import type { TreeRepository } from '@ks/server/trees/types.ts';\nexport type { Database } from '@ks/server/db/types.ts';",
    ],
    [
      'the request entry points importing the adapters',
      'server/action.mts',
      "import { appAdapters } from '#ks/server/adapters.mts';",
    ],
    [
      'the Tree repository reading the store',
      'server/trees/repository.mts',
      "import { appAdapters } from '#ks/server/adapters.mts';\nconst tree = await store.findTree(a, b);",
    ],
    [
      'an Account lookup outside server/trees/',
      'server/auth/sign-in.mts',
      'const account = await store.findAccount(issuer, subject);',
    ],
    [
      'a test file',
      'app/__tests__/a.test.ts',
      "import { appAdapters } from '@ks/server/adapters.mts';\nawait appAdapters().store.findTrees(id);",
    ],
    [
      'a name that is not a Tree method',
      'app/page.tsx',
      'const { findTreeView } = props;\nconst x = a.findTreeView;',
    ],
    ['a package import', 'app/page.tsx', "import { z } from 'zod';"],
  ])('passes %s', (_name, path, source) => {
    expect(scopingBreaks({ [path]: source }, METHODS)).toEqual([]);
  });
});

describe('the lint patterns', () => {
  const restricted = (pattern: { regex: string }, specifier: string) =>
    new RegExp(pattern.regex, 'u').test(specifier);

  it.each([
    '@ks/server/adapters.mts',
    '#ks/server/adapters.mts',
    '@ks/server/auth/sessions.mts',
    '@ks/server/trees/memory-store.mts',
    '@ks/server/db/database.mts',
    '@ks/server/boundaries/app-data-x',
  ])('restrict %s in app/ and features/', specifier => {
    expect(restricted(APP_SERVER_PATTERN, specifier)).toBe(true);
  });

  it.each([
    '@ks/server/action.mts',
    '#ks/server/action.mts',
    '@ks/server/auth/current.mts',
    '@ks/server/boundaries/app-data',
    '@ks/server/boundaries/app-data.ts',
    '@ks/server/trees/repository.mts',
    '@ks/lib/domain/trees/types.ts',
  ])('allow %s in app/ and features/', specifier => {
    expect(restricted(APP_SERVER_PATTERN, specifier)).toBe(false);
  });

  it('restrict the adapters module and nothing beside it', () => {
    expect(restricted(ADAPTERS_PATTERN, '#ks/server/adapters.mts')).toBe(true);
    expect(restricted(ADAPTERS_PATTERN, '@ks/server/adapters.mts')).toBe(true);
    expect(restricted(ADAPTERS_PATTERN, '#ks/server/adapters-x.mts')).toBe(
      false
    );
    expect(APP_SERVER_PATTERN.allowTypeImports).toBe(true);
  });
});
