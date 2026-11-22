import { describe, expect, it } from 'vitest';

import { lintConfig } from '@ks/scripts/__tests__/lint-config.ts';

// Follows the failing-tests rule (plans/BUILD.md#failing-tests).
const lint = async (code: string): Promise<string[]> =>
  (
    await lintConfig(`${code}\n`, 'lib/map/__tests__/x.test.ts', [
      'no-restricted-syntax',
    ])
  ).map(m => m.message);

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
    "it.concurrent.skip('a', () => {});",
    "describe.sequential.todo('a');",
    "test.describe.serial.only('a', () => {});",
    "it.skipIf(true)('a', () => {});",
    "describe.runIf(false)('a', () => {});",
    "it('a', { skip: true }, () => {});",
    "describe('a', { only: true }, () => {});",
    "it('a', { todo: true }, () => {});",
    "it('a', { fails: true }, () => {});",
    "test.step.skip('a', async () => {});",
    "it.concurrent('a', { skip: true }, () => {});",
    "describe.sequential('a', { skip: true }, () => {});",
    "it.each([1])('a', { only: true }, () => {});",
    "it.concurrent.each([1])('a', { skip: true }, () => {});",
    "describe.sequential.for([1])('a', { only: true }, () => {});",
    "suite.only('a', () => {});",
    "suite.skip('a', () => {});",
    "suite('a', { skip: true }, () => {});",
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
    "it.concurrent('a', () => {});",
    "it('a', { timeout: 5 }, () => {});",
    "test.describe.configure({ mode: 'serial' });",
    'test.extend({ page: 1 });',
    "it('a', () => { expect({ skip: true }).toBeDefined(); });",
  ])('allows %s', async code => {
    expect(await lint(code)).toEqual([]);
  });
});
