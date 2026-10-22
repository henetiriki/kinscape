import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';

const DIR = join(__dirname, '..');

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
  for (const file of readdirSync(DIR).filter(f => f.endsWith('.module.css')))
    expect([file, looseHover(readFileSync(join(DIR, file), 'utf8'))]).toEqual([
      file,
      [],
    ]);
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
