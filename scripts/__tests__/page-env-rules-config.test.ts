import { ESLint } from 'eslint';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import config, { TEST_ONLY_VARIABLES } from '@ks/eslint.config.mjs';

const PAGE_MESSAGE = 'A page composes components and has no look of its own';
const ENV_MESSAGE = 'Read a KINSCAPE_ variable only in server/env.mts';

// Lints text against the real config, as test-modifiers-config.test.ts does.
const lint = async (code: string, filePath: string): Promise<string[]> => {
  const [result] = await new ESLint({
    overrideConfig: config,
    overrideConfigFile: true,
  }).lintText(`${code}\n`, { filePath });

  return result.messages
    .filter(m => m.ruleId === 'no-restricted-syntax')
    .map(m => m.message);
};

describe('the page look rule', () => {
  const SAMPLES = [
    "export const Page = () => <div className='a' />;",
    "export const Page = () => <div style={{ color: 'red' }} />;",
    "import './x.css';",
  ];

  it.each(SAMPLES)('flags %s in a page', async code => {
    expect(await lint(code, 'app/people/new/page.tsx')).toEqual([
      expect.stringContaining(PAGE_MESSAGE),
    ]);
  });

  it.each(SAMPLES)('allows %s under app/screens/', async code => {
    expect(await lint(code, 'app/screens/x/page.tsx')).toEqual([]);
  });

  it('allows a className in a component', async () => {
    expect(
      await lint(
        "export const X = () => <div className='a' />;",
        'app/components/foundation/X.tsx'
      )
    ).toEqual([]);
  });
});

describe('the KINSCAPE_ variable rule', () => {
  const READS = [
    'export const a = process.env.KINSCAPE_X;',
    "export const a = process.env['KINSCAPE_X'];",
    'export const a = process.env[`KINSCAPE_X`];',
    'const { KINSCAPE_X } = process.env;\nexport const a = KINSCAPE_X;',
    "const { 'KINSCAPE_X': x } = process.env;\nexport const a = x;",
  ];

  it.each(READS)('flags %s in a features/ file', async code => {
    expect(await lint(code, 'features/map/x.ts')).toEqual([
      expect.stringContaining(ENV_MESSAGE),
    ]);
  });

  it.each(READS)('allows %s in server/env.mts', async code => {
    expect(await lint(code, 'server/env.mts')).toEqual([]);
  });

  it.each(['features/map/x.ts', 'server/x.mts', 'app/page.tsx'])(
    'allows parseEnv(process.env) in %s',
    async path => {
      expect(
        await lint('export const a = parseEnv(process.env);', path)
      ).toEqual([]);
    }
  );

  it.each([
    'export const a = process.env.NODE_ENV;',
    'const { NODE_ENV } = process.env;\nexport const a = NODE_ENV;',
    "export const a = process.env['NODE_ENV'];",
    'export const a = process.env[name];',
    'export const a = env.KINSCAPE_X;',
  ])('allows %s', async code => {
    expect(await lint(code, 'features/map/x.ts')).toEqual([]);
  });

  it.each(['server/__tests__/x.test.ts', 'e2e/x.spec.ts'])(
    'allows a Test-only variable in %s and flags another',
    async path => {
      expect(
        await lint(
          'export const a = process.env.KINSCAPE_MEMORY_ADAPTERS;',
          path
        )
      ).toEqual([]);
      expect(
        await lint('export const a = process.env.KINSCAPE_DATABASE_URL;', path)
      ).toEqual([expect.stringContaining(ENV_MESSAGE)]);
    }
  );

  it.each(['playwright.config.ts', 'vitest.config.mts'])(
    'allows a Test-only variable in %s',
    async path => {
      expect(
        await lint('export const a = process.env.KINSCAPE_DEV_PAGES;', path)
      ).toEqual([]);
    }
  );
});

describe('TEST_ONLY_VARIABLES', () => {
  it('lists the Test-only KINSCAPE_ rows of docs/infrastructure.md', () => {
    const rows = readFileSync('docs/infrastructure.md', 'utf8')
      .split('\n')
      .flatMap(line => {
        const row = /^\| `(KINSCAPE_\w+)`\s*\|.*\|\s*Test-only/.exec(line);

        return row ? [row[1]] : [];
      });

    expect([...TEST_ONLY_VARIABLES].sort()).toEqual(rows.sort());
  });
});
