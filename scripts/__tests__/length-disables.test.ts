import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { tracked } from '@ks/scripts/__tests__/tracked';

// The test builds the rule name from parts, so this file does not match itself.
const RULE = ['max-lines', 'per-function'].join('-');
const REASON = 'over 60 lines before the rule (C1174)';
const CAP = 47;

// A one-line disable, or a block disable where Prettier moves a one-line disable off its line.
const DISABLE = new RegExp(String.raw`eslint-disable(?:-next-line)? ${RULE}\b`);
const ENDS = [`-- ${REASON}`, `-- ${REASON} */`];

/** Each `path:line` of a disable with another reason, and a line when there are more than `cap`. */
const lengthDisables = (
  files: Record<string, string>,
  cap: number
): string[] => {
  const found = Object.entries(files).flatMap(([path, text]) =>
    text.split('\n').flatMap((line, index) =>
      DISABLE.test(line)
        ? [
            {
              at: `${path}:${index + 1}`,
              ok: ENDS.some(end => line.endsWith(end)),
            },
          ]
        : []
    )
  );
  const bad = found.filter(({ ok }) => !ok).map(({ at }) => at);

  return found.length > cap
    ? [...bad, `${found.length} disables, over the cap of ${cap}`]
    : bad;
};

const disable = (reason: string) =>
  `// eslint-disable-next-line ${RULE} -- ${reason}`;

describe('lengthDisables', () => {
  it('flags a disable with another reason', () => {
    expect(lengthDisables({ 'a.ts': `x\n${disable('later')}` }, 1)).toEqual([
      'a.ts:2',
    ]);
  });

  it('flags a disable with no reason', () => {
    expect(
      lengthDisables({ 'a.ts': `// eslint-disable-next-line ${RULE}` }, 1)
    ).toEqual(['a.ts:1']);
  });

  it('accepts the fixed reason', () => {
    expect(lengthDisables({ 'a.ts': disable(REASON) }, 1)).toEqual([]);
  });

  it('counts a block disable and checks its reason', () => {
    const block = (reason: string) =>
      `/* eslint-disable ${RULE} -- ${reason} */\nx\n/* eslint-enable ${RULE} */`;

    expect(lengthDisables({ 'a.ts': block(REASON) }, 1)).toEqual([]);
    expect(lengthDisables({ 'a.ts': block('later') }, 1)).toEqual(['a.ts:1']);
    expect(
      lengthDisables({ 'a.ts': `${block(REASON)}\n${disable(REASON)}` }, 1)
    ).toEqual(['2 disables, over the cap of 1']);
  });

  it('flags a count over the cap', () => {
    const text = Array(48).fill(disable(REASON)).join('\n');

    expect(lengthDisables({ 'a.ts': text }, CAP)).toEqual([
      '48 disables, over the cap of 47',
    ]);
    expect(
      lengthDisables({ 'a.ts': text.split('\n').slice(1).join('\n') }, CAP)
    ).toEqual([]);
  });
});

describe('the tracked source', () => {
  it('gives each disable the fixed reason, up to the cap', () => {
    const files = Object.fromEntries(
      tracked().map(path => [path, readFileSync(path, 'utf8')])
    );

    expect(Object.keys(files)).toContain('server/env.mts');
    expect(lengthDisables(files, CAP)).toEqual([]);
  });
});
