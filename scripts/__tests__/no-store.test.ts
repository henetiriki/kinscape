import { describe, expect, it } from 'vitest';

import nextConfig from '@ks/next.config';
import { covers, noStoreBreaks } from '@ks/scripts/safety.mts';
import { readSources } from '@ks/scripts/sources.mts';

// NFR-03. A page that reads Tree data has a `private, no-store` header rule: the repo first,
// then fixtures.
const RULE = {
  headers: [{ key: 'Cache-Control', value: 'private, no-store' }],
  source: '/people/:path*',
};
const TREE =
  "import { treeAction } from '@ks/server/action.mts';\nconst a = treeAction(s, f);";
const BREAK = (file: string, path: string): string =>
  `${file}: Cache rule: ${path} reads Tree data, and no next.config.ts header rule sets Cache-Control: private, no-store there.`;

describe('the repo', () => {
  it('has a no-store rule at each page that reads Tree data', async () => {
    const files = readSources(['app', 'features']);
    const rules = (await nextConfig.headers?.()) ?? [];

    expect(Object.keys(files)).toContain('app/people/[id]/page.tsx');
    expect(noStoreBreaks(files, rules)).toEqual([]);
  });
});

describe('noStoreBreaks', () => {
  it('names a page that calls treeAction at an address no rule matches', () => {
    expect(noStoreBreaks({ 'app/trees/page.tsx': TREE }, [RULE])).toEqual([
      BREAK('app/trees/page.tsx', '/trees'),
    ]);
  });

  it('passes a page that a rule matches, and a page that reads no Tree data', () => {
    expect(
      noStoreBreaks(
        {
          'app/people/[id]/page.tsx':
            "import { openTree } from '@ks/server/trees/repository.mts';\nawait openTree(d, t);",
          'app/people/new/page.tsx': TREE,
          'app/sign-in/page.tsx': 'const a = 1;',
        },
        [RULE]
      )
    ).toEqual([]);
  });

  it('follows an import of an app/ or features/ file, at any depth, and a barrel', () => {
    const files = {
      'app/a/b.ts': "import { c } from '@ks/features/people';",
      'app/a/d.ts': "import { e } from './d2.mts';\nconst x = 1;",
      'app/a/d2.mts': 'export const e = 1;',
      'app/a/other/page.tsx': "import { d } from '@ks/app/a/d.ts';",
      'app/a/page.tsx': "import { b } from './b';",
      'features/people/components/c.ts': TREE,
      'features/people/index.ts': "export { c } from './components/c';",
    };

    expect(noStoreBreaks(files, [])).toEqual([BREAK('app/a/page.tsx', '/a')]);
  });

  it('ignores a type import, a package, a missing file, a test file and a file outside app/ and features/', () => {
    const files = {
      'app/a/__tests__/t.ts': TREE,
      'app/a/page.tsx': [
        "import type { T } from './t';",
        "import { z } from 'zod';",
        "import { m } from './missing';",
        "import { t } from './__tests__/t';",
        "import { s } from '@ks/server/action.mts';",
        "import { l } from '../../../outside';",
        'const a = 1;',
      ].join('\n'),
      'app/a/t.ts': TREE,
      'server/action.mts': TREE,
    };

    expect(noStoreBreaks(files, [])).toEqual([]);
  });

  it('stops at an import cycle', () => {
    expect(
      noStoreBreaks(
        {
          'app/a/a.ts': "import { b } from './b';",
          'app/a/b.ts': "import { a } from './a';",
          'app/a/page.tsx': "import { b } from './b';",
        },
        []
      )
    ).toEqual([]);
  });

  it('ignores a layout, a route handler and a test', () => {
    expect(
      noStoreBreaks(
        {
          'app/a/__tests__/page.test.tsx': TREE,
          'app/a/layout.tsx': TREE,
          'app/a/route.ts': TREE,
        },
        []
      )
    ).toEqual([]);
  });

  it('counts only a rule that sets private, no-store with no condition', () => {
    const files = { 'app/people/page.tsx': TREE };

    expect(noStoreBreaks(files, [RULE])).toEqual([]);
    expect(
      noStoreBreaks(files, [
        { ...RULE, has: [{ key: 'x', type: 'header' }] },
        { ...RULE, missing: [{ key: 'x', type: 'header' }] },
        { ...RULE, headers: [{ key: 'Cache-Control', value: 'public' }] },
        { ...RULE, headers: [{ key: 'X-Other', value: 'private, no-store' }] },
        { ...RULE, source: '/:path/:rest' },
      ])
    ).toEqual([BREAK('app/people/page.tsx', '/people')]);
  });
});

describe('covers', () => {
  it.each([
    ['/people/:path*', '/people'],
    ['/people/:path*', '/people/x/relationships'],
    ['/:path*', '/'],
    ['/:path*', '/a/b'],
    ['/people/:id', '/people/x'],
    ['/people/new', '/people/new'],
    ['/', '/'],
  ])('matches %s to %s', (source, path) => {
    expect(covers(source, path)).toBe(true);
  });

  it.each([
    ['/people/:path*', '/'],
    ['/people/:path*', '/peoples'],
    ['/people/:id', '/people'],
    ['/people/:id', '/people/x/y'],
    ['/people/new', '/people/old'],
    ['/people/new', '/people'],
    ['/', '/people'],
    ['/:path*/edit', '/a/edit'],
    ['/people/(.*)', '/people/x'],
    ['/people/:id(\\d+)', '/people/1'],
  ])('does not match %s to %s', (source, path) => {
    expect(covers(source, path)).toBe(false);
  });
});
