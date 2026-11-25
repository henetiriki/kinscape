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

const withScale = (settings: Record<string, unknown>) => ({
  scale: { space: { $extensions: { kinscape: settings } } },
  space: { '4': { $type: 'dimension', $value: '{scale.space.100}' } },
});

it('writes the steps into the token file, and the outputs hold the value of a step', async () => {
  writeSource(withScale({ grid: 4, mode: 'grid', steps: 2, unit: 'px' }));

  expect(await run(root)).toBe(0);

  const written = JSON.parse(
    readFileSync(join(root, 'design/kinscape.tokens.json'), 'utf8')
  );

  expect(written.scale.space['200'].$value).toEqual({ unit: 'px', value: 8 });
  expect(readFileSync(join(root, OUTPUTS.css), 'utf8')).toContain(
    '--space-4: 4px;'
  );
});

it('fails on settings that give a name below 100, and names the group', async () => {
  writeSource(
    withScale({
      above: 0,
      base: 16,
      below: 4,
      mode: 'ratio',
      ratio: 1.25,
      round: 1,
      unit: 'px',
    })
  );

  await expect(generate(root)).rejects.toThrow(
    'scale.space: the settings give a step below 100'
  );
});

it('fails on a file that breaks the DTCG rules, and names the token', async () => {
  writeSource({ colour: { brand: { $value: '#264f29' } } });

  await expect(generate(root)).rejects.toThrow('colour.brand: no $type');
});
