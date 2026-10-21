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

import { generate, run } from '../tokens.mts';

let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'tokens-'));
  mkdirSync(join(root, 'design'));
  mkdirSync(join(root, 'app'));
  writeFileSync(
    join(root, 'design/tokens.json'),
    JSON.stringify({ colour: { brand: '#264f29' } })
  );
});

afterEach(() => rmSync(root, { force: true, recursive: true }));

it('generates the CSS from design/tokens.json', () => {
  expect(generate(root)).toContain('--brand: #264f29;');
});

it('writes app/tokens.css', () => {
  expect(run(root)).toBe(0);
  expect(readFileSync(join(root, 'app/tokens.css'), 'utf8')).toBe(
    generate(root)
  );
});
