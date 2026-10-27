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
        "import { a } from '@/lib/map/a';\n"
      )
    ).toEqual([expect.stringContaining('layers/imports: Layer rule')]);
  });

  it('fails features/map importing features/pins', async () => {
    expect(
      await lint(
        'features/map/A.tsx',
        "import { a } from '@/features/pins/a';\n"
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
      "export type R = import('@/server/db').Row;",
    ],
    [
      'app/components/forms/X.tsx',
      "export type R = typeof import('@/server/db');",
    ],
    ['app/components/forms/X.tsx', "import x = require('@/server/db');"],
    ['app/components/forms/x.js', "const x = require('@/server/db');"],
    ['app/components/forms/x.mjs', "import x from '@/server/db';"],
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
});
