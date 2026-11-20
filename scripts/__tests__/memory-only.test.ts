import { describe, expect, it } from 'vitest';

import { memoryOnlyBreaks } from '@ks/scripts/safety.mts';
import { readSources } from '@ks/scripts/sources.mts';

// NFR-03, NFR-10. Tree data stays in memory: no browser storage, no query persistence. The
// repo first, then fixtures.
describe('the repo', () => {
  it('names no browser storage and imports no persistence package', () => {
    const files = readSources([
      'app',
      'design',
      'features',
      'lib',
      'server',
      'types',
    ]);

    expect(Object.keys(files)).toContain('app/layout.tsx');
    expect(Object.keys(files)).toContain('lib/design/bundle.mts');
    expect(memoryOnlyBreaks(files)).toEqual([]);
  });
});

describe('memoryOnlyBreaks', () => {
  it.each(['localStorage', 'sessionStorage', 'indexedDB'])(
    'names a file that reads %s',
    name => {
      expect(
        memoryOnlyBreaks({
          'features/map/a.ts': `const x = window.${name}.getItem('a');\nconst y = ${name};`,
        })
      ).toEqual([`features/map/a.ts: Memory rule: no file names ${name}.`]);
    }
  );

  it('names a string key', () => {
    expect(
      memoryOnlyBreaks({ 'app/a.ts': "const s = window['localStorage'];" })
    ).toEqual(['app/a.ts: Memory rule: no file names localStorage.']);
  });

  it.each([
    '@tanstack/react-query-persist-client',
    '@tanstack/query-sync-storage-persister',
  ])('names a file that imports %s', specifier => {
    expect(
      memoryOnlyBreaks({ 'app/a.tsx': `import { x } from '${specifier}';` })
    ).toEqual([
      `app/a.tsx: Memory rule: no file imports a persistence package (${specifier}).`,
    ]);
  });

  it('names a persistence import outside app/ and features/', () => {
    expect(
      memoryOnlyBreaks({
        'lib/d.ts': "import { x } from '@tanstack/query-persist-client-core';",
      })
    ).toEqual([
      'lib/d.ts: Memory rule: no file imports a persistence package (@tanstack/query-persist-client-core).',
    ]);
  });

  it('passes a test, a storage name outside app/ and features/, a comment and another TanStack package', () => {
    expect(
      memoryOnlyBreaks({
        'app/__tests__/a.test.ts': 'localStorage.clear();',
        'app/b.tsx':
          "import { useQuery } from '@tanstack/react-query';\n// localStorage\nconst a = 'cache';",
        'lib/c.ts': 'localStorage.clear();',
        'server/__tests__/d.test.ts':
          "import { x } from '@tanstack/query-persist-client-core';",
      })
    ).toEqual([]);
  });
});
