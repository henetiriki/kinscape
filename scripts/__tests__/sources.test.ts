import { describe, expect, it } from 'vitest';

import { readSources, specifiersOf, TEST_FILE } from '@ks/scripts/sources.mts';

// NFR-09. The import reader the fitness tests share.
describe('specifiersOf', () => {
  it('tells type-only imports from the rest', () => {
    expect(
      specifiersOf(
        'a.ts',
        [
          "import type { A } from '@ks/a';",
          "import { b } from '@ks/b';",
          "export type { C } from '@ks/c';",
          "export { d } from '@ks/d';",
          "type E = import('@ks/e').E;",
          "const f = await import('@ks/f');",
          "import g = require('@ks/g');",
          "vi.mock('@ks/h');",
          "import '@ks/i';",
        ].join('\n')
      )
    ).toEqual([
      { specifier: '@ks/a', typeOnly: true },
      { specifier: '@ks/b', typeOnly: false },
      { specifier: '@ks/c', typeOnly: true },
      { specifier: '@ks/d', typeOnly: false },
      { specifier: '@ks/e', typeOnly: true },
      { specifier: '@ks/f', typeOnly: false },
      { specifier: '@ks/g', typeOnly: false },
      { specifier: '@ks/h', typeOnly: false },
      { specifier: '@ks/i', typeOnly: false },
    ]);
  });

  it('ignores calls and types that name no module', () => {
    expect(
      specifiersOf(
        'a.ts',
        'import Y = Z.Y;\ntype U = typeof import(name);\nconst a = require();\nconst b = other();'
      )
    ).toEqual([]);
  });
});

describe('readSources', () => {
  it('reads the source files under a root and skips a missing one', () => {
    const files = readSources(['scripts/__tests__', 'nowhere']);

    expect(files['scripts/__tests__/sources.test.ts']).toContain('readSources');
    expect(Object.keys(files).every(path => TEST_FILE.test(path))).toBe(true);
  });

  it('keeps only the files the pattern names', () => {
    expect(Object.keys(readSources(['public'], /\.txt$/))).toEqual([
      'public/glyphs/OFL.txt',
    ]);
  });
});
