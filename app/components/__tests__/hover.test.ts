import { globSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';

const ROOT = join(__dirname, '../../..');
const STYLESHEETS = globSync(
  [
    'app/components/**/*.module.css',
    'features/*/components/**/*.module.css',
    'lib/ui/**/*.module.css',
  ],
  { cwd: ROOT }
);

/** The selectors of `:hover` rules that are not inside `@media (hover: hover)`. */
const looseHover = (css: string) => {
  const found: string[] = [];
  const inside: boolean[] = [];
  let start = 0;

  for (let i = 0; i < css.length; i++) {
    const char = css[i];

    if (char === '{') {
      const head = css.slice(start, i).trim();

      inside.push(/^@media[^{]*\(hover:\s*hover\)/.test(head));

      if (
        !head.startsWith('@') &&
        /:hover\b/.test(head) &&
        !inside.some(Boolean)
      )
        found.push(head);

      start = i + 1;
    } else if (char === '}') {
      inside.pop();
      start = i + 1;
    } else if (char === ';') start = i + 1;
  }

  return found;
};

// NFR-05: a tap on a touch screen must leave no hover tint.
it('has every :hover rule inside @media (hover: hover)', () => {
  for (const file of STYLESHEETS)
    expect([file, looseHover(readFileSync(join(ROOT, file), 'utf8'))]).toEqual([
      file,
      [],
    ]);
});

// A scan that finds no files passes without checking anything.
it('reads every component stylesheet', () => {
  expect(STYLESHEETS).toHaveLength(49);
});

it('finds a :hover rule outside the media query, and not one inside it', () => {
  expect(looseHover('.a:hover { color: red; }')).toEqual(['.a:hover']);
  expect(
    looseHover('@media (hover: hover) { .a:hover:not(:disabled) { x: y; } }')
  ).toEqual([]);
  expect(
    looseHover(
      '@media (hover: hover) { .a:hover { x: y; } }\n.b:is(:hover) { x: y; }'
    )
  ).toEqual(['.b:is(:hover)']);
  expect(looseHover('.a { color: red; }\n.b:focus { x: y; }')).toEqual([]);
});
