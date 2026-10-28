import { ESLint } from 'eslint';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import config from '../../eslint.config.mjs';
import { NODE_MESSAGE, nodeLoadedFiles } from '../node-loaded.mts';

// Lints text against the real config, imported here so that scripts/layers.mts
// loads once (see layers-config.test.ts).
const lint = async (
  filePath: string,
  code: string,
  ruleId: string
): Promise<string[]> => {
  const [result] = await new ESLint({
    overrideConfig: config,
    overrideConfigFile: true,
  }).lintText(code, { filePath });

  return result.messages.filter(m => m.ruleId === ruleId).map(m => m.message);
};

const NODE_RULE = '@typescript-eslint/no-restricted-imports';

describe('nodeLoadedFiles', () => {
  const dirs: string[] = [];

  afterEach(() => {
    dirs
      .splice(0)
      .forEach(dir => rmSync(dir, { force: true, recursive: true }));
  });

  it('names every .mts, scripts/, and the types.ts beside an .mts', () => {
    const files = nodeLoadedFiles();

    expect(files).toEqual(
      expect.arrayContaining([
        '**/*.mts',
        '**/*.mjs',
        'scripts/**',
        'lib/domain/boundaries/types.ts',
        'scripts/types.ts',
      ])
    );
    expect(files).not.toContain('lib/domain/map/types.ts');
  });

  it('skips node_modules and other ignored folders', () => {
    const root = mkdtempSync(join(tmpdir(), 'node-loaded-'));

    dirs.push(root);
    mkdirSync(join(root, 'node_modules/pkg'), { recursive: true });
    mkdirSync(join(root, 'src'));
    writeFileSync(join(root, 'node_modules/pkg/a.mts'), '');
    writeFileSync(join(root, 'src/b.mts'), '');

    expect(nodeLoadedFiles(root)).toEqual([
      '**/*.mts',
      '**/*.mjs',
      'scripts/**',
      'src/types.ts',
    ]);
  });
});

describe('the Node rule in the real lint config', () => {
  it.each([
    ['lib/domain/boundaries/x.mts', "import { a } from '@ks/lib/map/a';"],
    ['lib/domain/boundaries/x.mts', "import { a } from '@/lib/map/a';"],
    ['lib/domain/boundaries/types.ts', "import { a } from '@ks/lib/map/a';"],
    ['lib/domain/boundaries/types.ts', "import { a } from '@/lib/map/a';"],
    ['scripts/x.ts', "import { a } from '@ks/lib/map/a';"],
    ['scripts/x.ts', "import { a } from '@/lib/map/a';"],
  ])('fails a value import in %s: %s', async (path, code) => {
    expect(await lint(path, `${code}\n`, NODE_RULE)).toEqual([
      expect.stringContaining(NODE_MESSAGE),
    ]);
  });

  it.each([
    [
      'lib/domain/boundaries/x.mts',
      "import type { A } from '@ks/lib/domain/map/types';",
    ],
    [
      'lib/domain/boundaries/types.ts',
      "import type { A } from '@/lib/domain/map/types';",
    ],
    ['scripts/x.ts', "import type { A } from '@ks/lib/domain/map/types';"],
    ['lib/map/a.ts', "import { a } from '@ks/lib/map/b';"],
    ['scripts/__tests__/x.test.ts', "import { a } from '@ks/lib/map/b';"],
  ])('passes %s: %s', async (path, code) => {
    expect(await lint(path, `${code}\n`, NODE_RULE)).toEqual([]);
  });
});

describe('the import sorter in the real lint config', () => {
  const sorter = 'perfectionist/sort-imports';

  it('groups @ks/ with the internal imports, after the packages', async () => {
    expect(
      await lint(
        'lib/map/a.ts',
        "import { b } from 'react';\n\nimport { a } from '@ks/lib/map/a';\n",
        sorter
      )
    ).toEqual([]);
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
