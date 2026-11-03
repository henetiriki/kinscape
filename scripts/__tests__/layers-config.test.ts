import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

import config from '@ks/eslint.config.mjs';

// NFR-09. Lints text against the real config, imported here so that
// scripts/layers.mts loads once: a native copy loaded by ESLint's own config
// loader corrupts its coverage.
const IMPORT_RULES = ['layers/imports', 'no-restricted-imports'];

const lint = async (
  filePath: string,
  code: string,
  ruleIds: string[] = IMPORT_RULES
): Promise<string[]> => {
  const [result] = await new ESLint({
    overrideConfig: config,
    overrideConfigFile: true,
  }).lintText(code, { filePath });

  return result.messages
    .filter(m => m.fatal || (m.ruleId !== null && ruleIds.includes(m.ruleId)))
    .map(m => `${m.ruleId}: ${m.message}`);
};

describe('the real lint config', () => {
  it('fails a kit file that imports lib/', async () => {
    expect(
      await lint(
        'app/components/forms/X.tsx',
        "import { a } from '@ks/lib/domain/a';\n"
      )
    ).toEqual([expect.stringContaining('layers/imports: Layer rule')]);
  });

  it('fails a route importing below features/map/ and passes its index', async () => {
    expect(
      await lint(
        'app/page.tsx',
        "import { a } from '@ks/features/map/components/MapView';\n"
      )
    ).toEqual([
      'layers/imports: Layer rule: import features/map through its index.ts.',
    ]);
    expect(
      await lint('app/page.tsx', "import { a } from '@ks/features/map';\n")
    ).toEqual([]);
  });

  it('fails features/map importing features/pins', async () => {
    expect(
      await lint(
        'features/map/A.tsx',
        "import { a } from '@ks/features/pins/a';\n"
      )
    ).toEqual([expect.stringContaining('features never import each other')]);
  });

  it('fails a file directly in features/', async () => {
    expect(await lint('features/index.ts', 'export const a = 1;\n')).toEqual([
      'layers/imports: Layer rule: features/ holds only feature folders.',
    ]);
  });

  it.each([
    [
      'app/components/forms/X.tsx',
      "export type R = import('@ks/server/db').Row;",
    ],
    [
      'app/components/forms/X.tsx',
      "export type R = typeof import('@ks/server/db');",
    ],
    ['app/components/forms/X.tsx', "import x = require('@ks/server/db');"],
    ['app/components/forms/x.js', "const x = require('@ks/server/db');"],
    ['app/components/forms/x.mjs', "import x from '#ks/server/db';"],
  ])('fails %s containing %s', async (path, code) => {
    expect(await lint(path, `${code}\n`)).toEqual([
      expect.stringContaining('app/components may not import server'),
    ]);
  });

  it('keeps the component import rules', async () => {
    expect(
      await lint(
        'app/components/forms/X.tsx',
        "import { a } from '../actions/Button';\n"
      )
    ).toEqual([expect.stringContaining('no-restricted-imports')]);
    expect(
      await lint('app/route/page.tsx', "import { a } from './components/A';\n")
    ).toEqual([expect.stringContaining('no-restricted-imports')]);
  });

  it('names @ks/ in the component import messages', async () => {
    expect(
      await lint(
        'app/components/forms/X.tsx',
        "import { a } from '../actions/Button';\n"
      )
    ).toEqual([expect.stringContaining('@ks/app/components/<folder>/<Name>')]);
    expect(
      await lint('app/route/page.tsx', "import { a } from './components/A';\n")
    ).toEqual([expect.stringContaining('@ks/app/components/<folder>/<Name>')]);
  });

  it('fails lib/ui importing the kit and passes the kit importing lib/ui', async () => {
    expect(
      await lint(
        'lib/ui/X.tsx',
        "import { a } from '@ks/app/components/foundation/Text';\n"
      )
    ).toEqual([
      expect.stringContaining('lib/ui may not import app/components'),
    ]);
    expect(
      await lint(
        'app/components/actions/X.tsx',
        "import { a } from '@ks/lib/ui/EventGlyph';\n"
      )
    ).toEqual([]);
  });

  it.each([
    ['lib/map/a.ts', "import { a } from './b';"],
    ['lib/map/a.ts', "import { a } from '../b';"],
    ['scripts/x.ts', "import { a } from '../b';"],
    ['lib/map/a.js', "import { a } from './b';"],
    ['lib/map/a.jsx', "import { a } from '../b';"],
  ])('fails a relative import in %s: %s', async (path, code) => {
    expect(await lint(path, `${code}\n`)).toEqual([
      expect.stringContaining('Import by full path through @ks/'),
    ]);
  });

  it.each([
    ['lib/domain/boundaries/x.mts', "import { a } from './b.mts';"],
    ['lib/domain/boundaries/x.mts', "import { a } from '../b.mts';"],
    ['x/y.mjs', "import { a } from './b.mjs';"],
    ['scripts/x.mts', "import type { A } from './types.ts';"],
  ])('fails a relative import in %s: %s', async (path, code) => {
    expect(await lint(path, `${code}\n`)).toEqual([
      expect.stringContaining('Import by full path through #ks/'),
    ]);
  });

  it.each([
    ['lib/domain/boundaries/x.mts', "import { a } from '@ks/lib/map/a';"],
    ['scripts/x.mts', "import type { A } from '@ks/lib/domain/map/types';"],
    ['x/y.mjs', "import { a } from '@ks/lib/map/a';"],
  ])('fails an @ks/ import in %s: %s', async (path, code) => {
    expect(await lint(path, `${code}\n`)).toEqual([
      expect.stringContaining('Node loads this file'),
    ]);
  });

  it.each([
    ['scripts/x.mts', "import { a } from '#ks/lib/ui/hatch.ts';"],
    ['scripts/x.mts', "export { a } from '#ks/lib/ui/hatch.ts';"],
    ['scripts/x.mts', "import { a } from '#ks/lib/ui/Hatch.tsx';"],
    ['x/y.mjs', "import { a } from '#ks/lib/ui/hatch.ts';"],
    ['x/y.mjs', "export { a } from '#ks/lib/ui/hatch.ts';"],
  ])('fails a value import of a .ts file in %s: %s', async (path, code) => {
    expect(await lint(path, `${code}\n`)).toEqual([
      expect.stringContaining('Node can’t run .ts'),
    ]);
  });

  it.each([
    ['lib/map/a.ts', "import { a } from '#ks/lib/map/b';"],
    [
      'app/components/forms/X.tsx',
      "import { a } from '#ks/design/tokens.mts';",
    ],
    ['lib/map/a.js', "import { a } from '#ks/lib/map/b';"],
  ])('fails a #ks/ import in %s: %s', async (path, code) => {
    expect(await lint(path, `${code}\n`)).toEqual([
      expect.stringContaining('Use @ks/'),
    ]);
  });

  it.each([
    [
      'lib/domain/boundaries/x.mts',
      "import { a } from '#ks/lib/domain/b.mts';",
    ],
    ['scripts/x.mts', "import type { A } from '#ks/lib/domain/map/types.ts';"],
    ['x/y.mjs', "import { a } from '#ks/lib/b.mjs';"],
    ['scripts/x.mts', "import { a } from '#ks/lib/ui/hatch.mts';"],
    ['x/y.mjs', "import { a } from '#ks/lib/ui/hatch.mts';"],
    ['x/y.mjs', "import type { A } from '#ks/lib/ui/hatch.ts';"],
    ['lib/map/a.ts', "import { a } from '@ks/lib/map/b';"],
    ['scripts/__tests__/x.test.ts', "import { a } from '@ks/scripts/a.mts';"],
  ])('passes %s: %s', async (path, code) => {
    expect(await lint(path, `${code}\n`)).toEqual([]);
  });

  it('applies the layer map to a #ks/ import', async () => {
    expect(
      await lint('lib/domain/x.mts', "import { a } from '#ks/server/db.mts';\n")
    ).toEqual([expect.stringContaining('lib/domain may not import server')]);
  });

  it('lints eslint.config.mjs with #ks/ imports', async () => {
    expect(
      await lint(
        'eslint.config.mjs',
        "import { a } from '#ks/scripts/a.mts';\n"
      )
    ).toEqual([]);
    expect(
      await lint('eslint.config.mjs', "import { a } from './scripts/a.mts';\n")
    ).toEqual([expect.stringContaining('Import by full path through #ks/')]);
  });
});

describe('the import sorter in the real lint config', () => {
  const sorter = ['perfectionist/sort-imports'];

  it('groups @ks/ with the internal imports, after the packages', async () => {
    expect(
      await lint(
        'lib/map/a.ts',
        "import { b } from 'react';\n\nimport { a } from '@ks/lib/map/a';\n",
        sorter
      )
    ).toEqual([]);
  });

  it('groups #ks/ with the internal imports, after the packages', async () => {
    expect(
      await lint(
        'lib/map/a.mts',
        "import { b } from 'node:fs';\n\nimport { a } from '#ks/lib/map/a.mts';\n",
        sorter
      )
    ).toEqual([]);
    expect(
      await lint(
        'lib/map/a.mts',
        "import { a } from '#ks/lib/map/a.mts';\nimport { b } from 'node:fs';\n",
        sorter
      )
    ).toHaveLength(1);
  });

  it('keeps stylesheets last, the kit’s before a board’s', async () => {
    expect(
      await lint(
        'app/design-kit/colour/page.tsx',
        "import { a } from '@ks/lib/a';\n\nimport kit from '@ks/app/design-kit/kit.module.css';\n\nimport styles from '@ks/app/design-kit/colour/page.module.css';\n",
        sorter
      )
    ).toEqual([]);
    expect(
      await lint(
        'app/design-kit/colour/page.tsx',
        "import styles from '@ks/app/design-kit/colour/page.module.css';\nimport kit from '@ks/app/design-kit/kit.module.css';\n",
        sorter
      )
    ).not.toEqual([]);
  });

  it('fails an @ks/ import sorted among the packages', async () => {
    expect(
      await lint(
        'lib/map/a.ts',
        "import { a } from '@ks/lib/map/a';\nimport { b } from 'react';\n",
        sorter
      )
    ).toHaveLength(1);
  });
});
