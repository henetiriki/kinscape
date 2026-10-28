import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

import config from '../../eslint.config.mjs';

// NFR-09. Lints text against the real config, imported here so that
// scripts/layers.mts loads once: a native copy loaded by ESLint's own config
// loader corrupts its coverage.
const lint = async (filePath: string, code: string): Promise<string[]> => {
  const [result] = await new ESLint({
    overrideConfig: config,
    overrideConfigFile: true,
  }).lintText(code, { filePath });

  return result.messages
    .filter(
      m => m.ruleId === 'layers/imports' || m.ruleId === 'no-restricted-imports'
    )
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
    ['app/components/forms/x.mjs', "import x from '@ks/server/db';"],
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
  ])('fails a relative import in %s: %s', async (path, code) => {
    expect(await lint(path, `${code}\n`)).toEqual([
      expect.stringContaining('Import by full path through @ks/'),
    ]);
  });

  it.each([
    ['lib/domain/boundaries/x.mts', "import { a } from './b.mts';"],
    ['scripts/x.ts', "import { a } from '../b';"],
    ['x/y.mjs', "import { a } from './b.mjs';"],
  ])('passes a relative import in %s: %s', async (path, code) => {
    expect(await lint(path, `${code}\n`)).toEqual([]);
  });

  it('lints eslint.config.mjs with its relative imports', async () => {
    expect(
      await lint(
        'eslint.config.mjs',
        "import { a } from './scripts/a.mts';\nimport { b } from '../b';\n"
      )
    ).toEqual([]);
  });
});
