import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

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

describe('the marked @media conditions', () => {
  const MARKED = '@media (max-width: 1px) /* breakpoint: phone */ {\n}\n';

  const withBreakpoints = (width: number) => ({
    breakpoint: {
      $extensions: {
        kinscape: { queries: { phone: '(max-width: {breakpoint.width})' } },
      },
      width: { $type: 'dimension', $value: { unit: 'px', value: width } },
    },
  });

  it('rewrites the condition of a marked @media from the token file', async () => {
    writeSource(withBreakpoints(600));
    writeFileSync(join(root, 'app/a.module.css'), MARKED);

    await run(root, ['app/a.module.css']);

    expect(readFileSync(join(root, 'app/a.module.css'), 'utf8')).toBe(
      '@media (max-width: 600px) /* breakpoint: phone */ {\n}\n'
    );
  });

  it('leaves a file that is not a style file, and a file with no marker, as it is', async () => {
    writeSource(withBreakpoints(600));
    writeFileSync(join(root, 'app/b.css'), MARKED);
    writeFileSync(join(root, 'app/c.module.css'), '.a { x: y; }\n');

    await run(root, ['app/b.css', 'app/c.module.css']);

    expect(readFileSync(join(root, 'app/b.css'), 'utf8')).toBe(MARKED);
    expect(readFileSync(join(root, 'app/c.module.css'), 'utf8')).toBe(
      '.a { x: y; }\n'
    );
  });

  it('throws on an unknown marker, and names it', async () => {
    writeSource(withBreakpoints(600));
    writeFileSync(
      join(root, 'app/d.module.css'),
      '@media (max-width: 1px) /* breakpoint: tablet */ {\n}\n'
    );

    await expect(run(root, ['app/d.module.css'])).rejects.toThrow(
      'unknown breakpoint marker "tablet"'
    );
  });
});

it('fails on a file that breaks the DTCG rules, and names the token', async () => {
  writeSource({ colour: { brand: { $value: '#264f29' } } });

  await expect(generate(root)).rejects.toThrow('colour.brand: no $type');
});
