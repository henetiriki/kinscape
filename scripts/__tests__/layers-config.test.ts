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
});
