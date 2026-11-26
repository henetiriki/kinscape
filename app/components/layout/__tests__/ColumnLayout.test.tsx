import { render, screen, within } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';

import { ColumnLayout } from '@ks/app/components/layout/ColumnLayout';
import { breakpointQuery, layout } from '@ks/design/tokens.generated.ts';

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
      'gap: var(--space-gap-xl)',
      'padding: var(--space-inset-2xl) 0 var(--space-inset-4xl)',
      'width: min(var(--layout-list-width), 100%)',
    ],
    phone: [
      'gap: var(--space-gap-m)',
      'padding: var(--space-inset-l) var(--space-inset-m) var(--space-inset-4xl)',
      'width: 100%',
    ],
  },
  {
    column: 'detail',
    desktop: [
      'gap: var(--space-gap-m)',
      'padding: var(--space-inset-xl) 0 var(--space-inset-2xl)',
      'width: min(var(--layout-list-width), 100%)',
    ],
    phone: [],
  },
  {
    column: 'form',
    desktop: [
      'gap: var(--space-gap-m)',
      'padding: var(--space-inset-l) 0 var(--space-inset-xl)',
      'width: min(var(--layout-content-width), 100%)',
    ],
    phone: [],
  },
  {
    column: 'notice',
    desktop: [
      'padding: calc(\n      var(--space-inset-5xl) + var(--space-inset-4xl) + var(--space-inset-xs)\n    )\n    0 0',
    ],
    phone: [],
  },
  {
    column: 'phone-notice',
    desktop: ['padding: var(--space-inset-5xl) var(--space-inset-m) 0'],
    phone: [],
  },
] as const;

// NFR-05
it('puts the header, the column and the action bar in slots, in that order', () => {
  render(
    <ColumnLayout
      actions={<button>Save</button>}
      column='form'
      header={<div>head</div>}>
      <p>body</p>
    </ColumnLayout>
  );

  screen.getByText('head');
  expect(within(screen.getByRole('main')).getByText('body').textContent).toBe(
    'body'
  );
  // eslint-disable-next-line testing-library/no-node-access -- the spacer div has no role; the test checks that it is in the slot after main
  const bar = screen.getByRole('main').nextElementSibling!;

  expect(within(bar as HTMLElement).getByTestId('spacer').tagName).toBe('DIV');
  expect(screen.getByRole('button').textContent).toBe('Save');
});

it('draws no action bar without actions, and sets data-column on the frame', () => {
  render(
    <ColumnLayout column='notice' header={<div>head</div>}>
      <p>body</p>
    </ColumnLayout>
  );

  const root = screen.getByTestId('column-frame');

  expect(root.dataset.column).toBe('notice');
  expect(screen.queryByTestId('spacer')).toBeNull();
  // eslint-disable-next-line testing-library/no-node-access -- the test checks that the frame has no action bar slot
  expect(root.children).toHaveLength(2);
});

// jsdom computes no CSS, so these read the stylesheet.
// NFR-05
it('sizes the list and detail columns from the list-width token', () => {
  expect(layout['list-width']).toBe('960px');
  expect(css).not.toContain('960px');
  expect(rule(desktop, '.page')).toContain('height: 100dvh');
});

// The design system ships no global reset, so a 100% wide column with padding must size itself.
it('sizes the column by its border box, with no global reset', () => {
  expect(rule(desktop, '.content')).toContain('box-sizing: border-box');
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

it.each(COLUMNS.filter(({ phone }) => phone.length > 0))(
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
    `@media ${breakpointQuery.phone} /* breakpoint: phone */ `
  );
  expect(rule(media, "[data-column='list']")).toContain(
    'background: var(--surface)'
  );
  expect(rule(desktop, '.page')).toContain('background: var(--surface-2)');
});
