import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

import config from '../../eslint.config.mjs';

// Plan rule 10. Lints text against the real config, as layers-config.test.ts does.
const lint = async (code: string): Promise<string[]> => {
  const [result] = await new ESLint({
    overrideConfig: config,
    overrideConfigFile: true,
  }).lintText(`${code}\n`, { filePath: 'lib/map/__tests__/x.test.ts' });

  return result.messages
    .filter(m => m.ruleId === 'no-restricted-syntax')
    .map(m => m.message);
};

describe('the test modifier lint rule', () => {
  it.each([
    "it.only('a', () => {});",
    "describe.skip('a', () => {});",
    "it.todo('a');",
    "it.skip.each([1])('a', () => {});",
    "test.fixme('a', () => {});",
    "test.fail('a', () => {});",
    "test.describe.only('a', () => {});",
    'test.skip(true);',
  ])('flags %s', async code => {
    expect(await lint(code)).toEqual([
      expect.stringContaining('skipped, focused or unfinished'),
    ]);
  });

  it.each([
    "it('a', () => {});",
    "it.each([1])('a', () => {});",
    "test.describe('a', () => {});",
    "test.step('a', async () => {});",
  ])('allows %s', async code => {
    expect(await lint(code)).toEqual([]);
  });
});
