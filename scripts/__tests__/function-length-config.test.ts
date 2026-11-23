import { describe, expect, it } from 'vitest';

import { lintConfig } from '@ks/scripts/__tests__/lint-config.ts';

const RULE = '@eslint-community/eslint-comments/no-restricted-disable';

const lint = async (code: string, filePath: string): Promise<string[]> =>
  (await lintConfig(`${code}\n`, filePath, [RULE])).map(m => m.message);

describe('the max-lines-per-function disable ban', () => {
  it.each([
    '/* eslint-disable max-lines-per-function -- x */',
    'const a = 1; // eslint-disable-line max-lines-per-function -- x',
    '// eslint-disable-next-line max-lines-per-function -- x\nconst a = 1;',
    '// eslint-disable-next-line no-console, max-lines-per-function -- x\nconst a = 1;',
  ])('flags %s', async code => {
    expect(await lint(code, 'lib/x.mts')).toEqual([
      "Disabling 'max-lines-per-function' is not allowed.",
    ]);
  });

  it('allows the disable in a test file', async () => {
    expect(
      await lint(
        '// eslint-disable-next-line max-lines-per-function -- x\nconst a = 1;',
        'lib/__tests__/x.test.ts'
      )
    ).toEqual([]);
  });
});
