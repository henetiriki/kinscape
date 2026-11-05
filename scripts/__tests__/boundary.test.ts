import { RuleTester } from 'eslint';
import { describe, expect, it } from 'vitest';

import {
  boundaryBreaks,
  clientImportsRule,
  isClient,
  SERVER_ONLY,
} from '@ks/scripts/safety.mts';
import { readSources } from '@ks/scripts/sources.mts';

// NFR-10. The server entry points open with `server-only`, and a `'use client'` file imports no
// value from server/: the repo first, then fixtures.
const ROOTS = ['app', 'features', 'lib', 'server'];

const ENTRY = "import 'server-only';\nexport const a = 1;";

/** Every entry point in place, for fixtures that test the client half alone. */
const entries = (): Record<string, string> =>
  Object.fromEntries(SERVER_ONLY.map(path => [path, ENTRY]));

const CLIENT =
  "Boundary rule: a 'use client' file imports no value from server/ (@ks/server/auth/sessions.mts).";

describe('the repo', () => {
  it('keeps the boundary', () => {
    const files = readSources(ROOTS);

    expect(Object.keys(files)).toEqual(
      expect.arrayContaining([
        'server/adapters.mts',
        'features/map/components/MapShell.tsx',
      ])
    );
    expect(boundaryBreaks(files)).toEqual([]);
  });
});

describe('boundaryBreaks', () => {
  it('names an entry point that does not start with server-only', () => {
    expect(
      boundaryBreaks({
        ...entries(),
        'server/adapters.mts':
          "import { db } from '#ks/server/db/database.mts';",
        'server/auth/current.mts':
          "import { cookies } from 'next/headers';\nimport 'server-only';",
      })
    ).toEqual([
      "server/adapters.mts: Boundary rule: the entry point starts with import 'server-only'.",
      "server/auth/current.mts: Boundary rule: the entry point starts with import 'server-only'.",
    ]);
  });

  it('names a missing entry point', () => {
    expect(boundaryBreaks({})).toHaveLength(SERVER_ONLY.length);
  });

  it.each([
    ['an import', "import { x } from '@ks/server/auth/sessions.mts';"],
    ['a re-export', "export { x } from '@ks/server/auth/sessions.mts';"],
    ['a dynamic import', "const m = import('@ks/server/auth/sessions.mts');"],
  ])('names %s from server/ in a client file', (_name, source) => {
    expect(
      boundaryBreaks({
        ...entries(),
        'features/map/components/A.tsx': `'use client';\n${source}`,
      })
    ).toEqual([`features/map/components/A.tsx: ${CLIENT}`]);
  });

  it('passes a type import, a server file, a test and a client file that stays out of server/', () => {
    expect(
      boundaryBreaks({
        ...entries(),
        'app/__tests__/A.test.tsx':
          "'use client';\nimport { x } from '@ks/server/auth/sessions.mts';",
        'app/page.tsx': "import { x } from '@ks/server/auth/current.mts';",
        'features/map/components/A.tsx':
          "'use client';\nimport type { Session } from '@ks/server/trees/types.ts';\nimport { useState } from 'react';\nimport { a } from '@ks/lib/domain/a';",
      })
    ).toEqual([]);
  });
});

describe('isClient', () => {
  it.each([
    ["'use client';", true],
    ['"use client";\nimport a from "b";', true],
    ["'use strict';\n'use client';", true],
    ["import a from 'b';\n'use client';", false],
    ["const a = 'use client';", false],
    ['', false],
  ])('reads %s as %s', (source, client) => {
    expect(isClient('a.tsx', source)).toBe(client);
  });
});

describe('the lint rule', () => {
  const tester = new RuleTester({
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  });
  const client = `${process.cwd()}/features/map/components/A.tsx`;

  it('reports each kind of value import from server/ in a client file, and passes the rest', () => {
    tester.run('safety/client-imports', clientImportsRule as never, {
      invalid: [
        {
          code: "'use client';\nimport { a } from '@ks/server/auth/sessions.mts';",
          errors: [{ message: CLIENT }],
          filename: client,
        },
        {
          code: "'use client';\nexport { a } from '@ks/server/auth/sessions.mts';",
          errors: 1,
          filename: client,
        },
        {
          code: "'use client';\nexport * from '@ks/server/auth/sessions.mts';",
          errors: 1,
          filename: client,
        },
        {
          code: "'use client';\nconst m = import('@ks/server/auth/sessions.mts');",
          errors: 1,
          filename: client,
        },
      ],
      valid: [
        {
          code: "import { a } from '@ks/server/auth/current.mts';",
          filename: `${process.cwd()}/app/page.tsx`,
        },
        {
          code: "'use client';\nimport { a } from '@ks/lib/domain/a';\nimport { b } from 'react';\nconst m = import(name);",
          filename: client,
        },
      ],
    });
  });
});
