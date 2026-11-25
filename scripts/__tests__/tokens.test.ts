import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, expect, it } from 'vitest';

import { generate, OUTPUTS, run } from '@ks/scripts/tokens.mts';

let root: string;

const writeSource = (tokens: unknown) =>
  writeFileSync(
    join(root, 'design/kinscape.tokens.json'),
    JSON.stringify(tokens)
  );

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'tokens-'));
  mkdirSync(join(root, 'design'));
  mkdirSync(join(root, 'app'));
  writeSource({
    colour: {
      brand: {
        $type: 'color',
        $value: { colorSpace: 'srgb', components: [0, 0, 0], hex: '#264f29' },
      },
    },
  });
});

afterEach(() => rmSync(root, { force: true, recursive: true }));

it('generates the CSS and the TypeScript module from design/kinscape.tokens.json', async () => {
  const outputs = await generate(root);

  expect(outputs[OUTPUTS.css]).toContain('--brand: #264f29;');
  expect(outputs[OUTPUTS.ts]).toContain('"brand": "#264f29"');
});

it('writes app/tokens.css and design/tokens.generated.ts, and no other token file', async () => {
  expect(Object.keys(OUTPUTS)).toEqual(['css', 'ts']);
  expect(await run(root)).toBe(0);

  const outputs = await generate(root);

  expect(Object.keys(outputs).toSorted()).toEqual(
    [OUTPUTS.css, OUTPUTS.ts].toSorted()
  );

  for (const path of [OUTPUTS.css, OUTPUTS.ts]) {
    expect(readFileSync(join(root, path), 'utf8')).toBe(outputs[path]);
  }
});

it('fails on a file that breaks the DTCG rules, and names the token', async () => {
  writeSource({ colour: { brand: { $value: '#264f29' } } });

  await expect(generate(root)).rejects.toThrow('colour.brand: no $type');
});
