import { render } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';

import { ColumnLayout } from '@ks/app/components/layout/ColumnLayout';
import rawTokens from '@ks/design/tokens.json';
import { resolveTokens } from '@ks/design/tokens.mts';

const { breakpoint, layout } = resolveTokens(rawTokens);

const css = readFileSync(
  join(import.meta.dirname, '../ColumnLayout.module.css'),
  'utf8'
);
const split = css.indexOf('@media');
const desktop = css.slice(0, split);
const media = css.slice(split);

/** The declarations of the rule for `selector` in `text`, or undefined. */
const rule = (text: string, selector: string) =>
  new RegExp(
    `${selector.replace(/[[\]]/g, String.raw`\$&`)} \\{([^}]*)\\}`
  ).exec(text)?.[1];

const COLUMNS = [
  {
    column: 'list',
    desktop: [
      'gap: var(--space-24)',
      'padding: var(--space-32) 0 var(--space-48)',
      'width: min(var(--layout-list-width), 100%)',
    ],
    phone: [
      'gap: var(--space-16)',
      'padding: var(--space-20) var(--space-16) var(--space-48)',
      'width: 100%',
    ],
  },
  {
    column: 'detail',
    desktop: [
      'gap: var(--space-16)',
      'padding: var(--space-24) 0 var(--space-32)',
      'width: min(var(--layout-list-width), 100%)',
    ],
    phone: [],
  },
  {
    column: 'form',
    desktop: [
      'gap: var(--space-16)',
      'padding: var(--space-20) 0 var(--space-24)',
      'width: min(var(--layout-content-width), 100%)',
    ],
    phone: [],
  },
  {
    column: 'notice',
    desktop: [
      'padding: calc(var(--space-64) + var(--space-48) + var(--space-8)) 0 0',
    ],
    phone: [],
  },
  {
    column: 'phone-notice',
    desktop: ['padding: var(--space-64) var(--space-16) 0'],
    phone: [],
  },
] as const;

// NFR-05
it('puts the header, the column and the action bar in slots, in that order', () => {
  const { container } = render(
    <ColumnLayout
      actions={<button>Save</button>}
      column='form'
      header={<div>head</div>}>
      <p>body</p>
    </ColumnLayout>
  );
  const root = container.firstElementChild as HTMLElement;

  expect([...root.children].map(child => child.tagName)).toEqual([
    'DIV',
    'MAIN',
    'DIV',
  ]);
  expect(root.children[0]?.textContent).toBe('head');
  expect(root.querySelector('main p')?.textContent).toBe('body');
  expect(root.children[2]?.querySelector('[data-spacer]')).toBeTruthy();
  expect(root.querySelector('button')?.textContent).toBe('Save');
});

it('draws no action bar without actions, and sets data-column on the frame', () => {
  const { container } = render(
    <ColumnLayout column='notice' header={<div>head</div>}>
      <p>body</p>
    </ColumnLayout>
  );
  const root = container.firstElementChild as HTMLElement;

  expect(root.dataset.column).toBe('notice');
  expect(root.querySelector('[data-spacer]')).toBeNull();
  expect(root.children).toHaveLength(2);
});

// jsdom computes no CSS, so these read the stylesheet.
// NFR-05
it('sizes the list and detail columns from the list-width token', () => {
  expect(layout['list-width']).toBe('960px');
  expect(css).not.toContain('960px');
  expect(rule(desktop, '.page')).toContain('height: 100dvh');
});

it('changes only the list column at the phone breakpoint', () => {
  expect(media.match(/data-column='(\w|-)+'\]/g)).toEqual([
    "data-column='list']",
    "data-column='list']",
  ]);
});

it.each(COLUMNS)(
  'gives the $column column its desktop gap, padding and width',
  ({ column, desktop: lines }) => {
    const body = rule(desktop, `[data-column='${column}'] .content`) ?? '';

    for (const line of lines) {
      expect(body).toContain(line);
    }
  }
);

it.each(COLUMNS)(
  'gives the $column column its phone gap, padding and width',
  ({ column, phone: lines }) => {
    const body = rule(media, `[data-column='${column}'] .content`) ?? '';

    for (const line of lines) {
      expect(body).toContain(line);
    }
  }
);

it('uses the phone query of the breakpoint tokens, and a surface phone background for the list', () => {
  expect(media.slice(0, media.indexOf('{'))).toBe(
    `@media (max-width: ${breakpoint['phone-width']}), (max-height: ${breakpoint['phone-height']}) `
  );
  expect(rule(media, "[data-column='list']")).toContain(
    'background: var(--surface)'
  );
  expect(rule(desktop, '.page')).toContain('background: var(--surface-2)');
});
