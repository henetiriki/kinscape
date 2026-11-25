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

import { LIST, run } from '@ks/scripts/sizes.mts';

let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'sizes-'));
  mkdirSync(join(root, 'design'));
  mkdirSync(join(root, 'lib/design'), { recursive: true });
  writeFileSync(
    join(root, 'design/kinscape.tokens.json'),
    JSON.stringify({
      space: {
        '8': {
          $type: 'dimension',
          $value: { unit: 'px', value: 8 },
        },
      },
    })
  );
  writeFileSync(
    join(root, 'a.module.css'),
    '.a {\n  gap: 7px;\n  margin: 8px;\n}\n'
  );
  writeFileSync(join(root, 'b.ts'), 'export const gap = 7;\n');
});

afterEach(() => rmSync(root, { force: true, recursive: true }));

it('writes the off-token sizes of the size files', () => {
  expect(run(root, ['a.module.css', 'b.ts'])).toBe(0);
  expect(JSON.parse(readFileSync(join(root, LIST), 'utf8'))).toEqual([
    { count: 1, file: 'a.module.css', property: 'gap', value: '7px' },
  ]);
});

it('ends the file with a newline', () => {
  run(root, ['a.module.css']);
  expect(readFileSync(join(root, LIST), 'utf8')).toMatch(/\]\n$/);
});
