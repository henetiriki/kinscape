import { readdirSync, readFileSync } from 'node:fs';
import { sep } from 'node:path';
import { describe, expect, it } from 'vitest';

import { targetOf } from '../layers.mts';
import { invisible } from '../vercel-ignore.mts';

// Vercel skips a deployment when only invisible paths change, so shipped code
// must not depend on one (C291).
const ROOTS = ['app', 'design', 'lib', 'types'];
const SOURCE = /\.(?:[cm]?[jt]sx?|css)$/;
const TEST_FILE = /(?:^|\/)__tests__\/|\.(?:test|spec)\./;
const SPECIFIERS = [
  /\bfrom\s+['"]([^'"]+)['"]/g,
  /\bimport\s*\(\s*['"]([^'"]+)['"]/g,
  /^\s*import\s+['"]([^'"]+)['"]/gm,
  /@import\s+(?:url\()?\s*['"]([^'"]+)['"]/g,
];
const SUFFIXES = [
  '',
  '.ts',
  '.tsx',
  '.mts',
  '.js',
  '.mjs',
  '.json',
  '.css',
  '/index.ts',
  '/index.tsx',
];

/** Each `file: import` pair where non-test code imports an invisible path. */
const violations = (files: Record<string, string>): string[] =>
  Object.entries(files)
    .filter(([path]) => !TEST_FILE.test(path))
    .flatMap(([path, source]) =>
      SPECIFIERS.flatMap(pattern => [...source.matchAll(pattern)])
        .map(match => match[1])
        .filter(specifier => {
          const imported = targetOf(path, specifier);

          return (
            imported !== undefined &&
            SUFFIXES.some(suffix => invisible(`${imported}${suffix}`))
          );
        })
        .map(specifier => `${path}: ${specifier}`)
    );

const sources = (): Record<string, string> =>
  Object.fromEntries(
    ROOTS.flatMap(dir =>
      readdirSync(dir, { recursive: true })
        .map(name => `${dir}/${String(name).split(sep).join('/')}`)
        .filter(path => SOURCE.test(path))
        .map(path => [path, readFileSync(path, 'utf8')])
    )
  );

describe('the shipped code', () => {
  it('imports nothing on the invisible list', () => {
    const files = sources();

    expect(Object.keys(files)).toEqual(
      expect.arrayContaining(['app/layout.tsx', 'lib/design/shots.mts'])
    );
    expect(violations(files)).toEqual([]);
  });
});

describe('violations', () => {
  it.each([
    ['a relative import', 'lib/a.mts', "import { x } from '../scripts/s.mts';"],
    ['an alias import', 'app/a.tsx', "import { x } from '@/e2e/helper';"],
    ['a @ks/ import', 'app/a.tsx', "import { x } from '@ks/e2e/helper';"],
    [
      'a dynamic import',
      'app/a.tsx',
      "const m = await import('../docs/m.md');",
    ],
    ['a side-effect import', 'lib/a.mts', "import '../plans/p';"],
    [
      'an extensionless config',
      'app/a.ts',
      "import c from '../vitest.config';",
    ],
    [
      'a stylesheet import',
      'app/a.css',
      "@import url('../design/source/x.css');",
    ],
    ['a test helper', 'lib/a.ts', "import { t } from './__tests__/helper';"],
  ])('flags %s', (_name, path, source) => {
    expect(violations({ [path]: source })).toHaveLength(1);
  });

  it('names the file and the import', () => {
    expect(
      violations({
        'lib/design/sweep.mts': "import { s } from '../../scripts/d.mts';",
      })
    ).toEqual(['lib/design/sweep.mts: ../../scripts/d.mts']);
  });

  it('allows visible paths, packages and built-ins', () => {
    expect(
      violations({
        'app/a.tsx': [
          "import tokens from '@/design/tokens.json';",
          "import { s } from '../lib/map/style';",
          "import { useState } from 'react';",
          "import { readFileSync } from 'node:fs';",
        ].join('\n'),
      })
    ).toEqual([]);
  });

  it('skips test files', () => {
    expect(
      violations({
        'app/__tests__/a.test.tsx': "import { s } from '../../scripts/s.mts';",
        'lib/b.test.ts': "import { s } from '../scripts/s.mts';",
      })
    ).toEqual([]);
  });
});
