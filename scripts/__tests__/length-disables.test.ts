import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { tracked } from '@ks/scripts/__tests__/tracked';

// The test builds the rule name from parts, so this file does not match itself.
const RULE = ['max-lines', 'per-function'].join('-');
const REASON = 'over 60 lines before the rule (C1174)';
const CAP = 22;

// Each ESLint form that can name the rule: block, same line, next line, and a list of rules.
const DIRECTIVE = new RegExp(
  String.raw`eslint-disable(?:-line|-next-line)?\s+(?:[\w@/-]+\s*,\s*)*${RULE}\b`
);

const disable = (reason: string) =>
  `// eslint-disable-next-line ${RULE} -- ${reason}`;

/** Each `path:line` of a disable other than the fixed line, and a line when the count is not `cap`. */
const lengthDisables = (
  files: Record<string, string>,
  cap: number
): string[] => {
  const found = Object.entries(files).flatMap(([path, text]) =>
    text.split('\n').flatMap((line, index) =>
      DIRECTIVE.test(line)
        ? [
            {
              at: `${path}:${index + 1}`,
              ok: line.trim() === disable(REASON),
            },
          ]
        : []
    )
  );
  const bad = found.filter(({ ok }) => !ok).map(({ at }) => at);

  return found.length === cap
    ? bad
    : [...bad, `${found.length} disables, not the cap of ${cap}`];
};

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

  it.each([
    ['a block disable', `/* eslint-disable ${RULE} -- ${REASON} */`],
    ['a same-line disable', `x; // eslint-disable-line ${RULE} -- ${REASON}`],
    ['a rule list', `// eslint-disable-next-line foo, ${RULE} -- ${REASON}`],
  ])('flags %s, even with the fixed reason', (_, line) => {
    expect(
      lengthDisables({ 'a.ts': `${line}\n${disable(REASON)}` }, 2)
    ).toEqual(['a.ts:1']);
  });

  it('flags a count over the cap', () => {
    const text = Array(CAP + 1)
      .fill(disable(REASON))
      .join('\n');

    expect(lengthDisables({ 'a.ts': text }, CAP)).toEqual([
      `${CAP + 1} disables, not the cap of ${CAP}`,
    ]);
    expect(
      lengthDisables({ 'a.ts': text.split('\n').slice(1).join('\n') }, CAP)
    ).toEqual([]);
  });

  it('flags a count under the cap, so the cap goes down with each removal', () => {
    expect(lengthDisables({ 'a.ts': disable(REASON) }, 2)).toEqual([
      '1 disables, not the cap of 2',
    ]);
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
