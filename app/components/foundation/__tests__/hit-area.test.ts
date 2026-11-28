import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';

const css = readFileSync(
  join(process.cwd(), 'app/components/foundation/hit-area.module.css'),
  'utf8'
);

const rule = (selector: string) =>
  new RegExp(`\\n\\n${selector}::before \\{[^}]*\\}`).exec(css)![0];

// NFR-05, NFR-06
it('draws a 44px area centred on each variant', () => {
  const shared = /\.hitArea::before,[^{]*\{[^}]*\}/.exec(css)![0];

  for (const variant of [
    'hitArea',
    'hitAreaBordered',
    'hitAreaFill',
    'hitAreaBox',
  ]) {
    expect(shared).toContain(`.${variant}::before`);
  }

  expect(shared).toContain("content: ''");
  expect(shared).toContain('height: var(--size-touch)');
  expect(shared).toContain('position: absolute');
  expect(shared).toContain('translate: -50% -50%');
});

// NFR-05, NFR-06
it('gives each variant its width, and the fill variant follows the bordered one', () => {
  expect(rule('\\.hitArea')).toContain('width: var(--size-touch)');
  expect(rule('\\.hitAreaBordered')).toContain(
    'width: max(calc(100% + 2px), var(--size-touch))'
  );
  expect(rule('\\.hitAreaFill')).toContain(
    'width: max(100%, var(--size-touch))'
  );
  expect(rule('\\.hitAreaBox')).toContain('width: 100%');
  expect(css.indexOf('.hitAreaFill::before {')).toBeGreaterThan(
    css.indexOf('.hitAreaBordered::before {')
  );
});
