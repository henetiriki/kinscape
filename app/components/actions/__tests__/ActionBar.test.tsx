import { render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';

import { ActionBar } from '@ks/app/components/actions/ActionBar';
import { Button } from '@ks/app/components/actions/Button';

const css = readFileSync(
  join(process.cwd(), 'app/components/actions/ActionBar.module.css'),
  'utf8'
);

// PPL-01
it('holds its buttons and an in-flow spacer of its own height', () => {
  render(
    <ActionBar>
      <Button form='person' type='submit' variant='primary'>
        Save
      </Button>
      <Button href='/people'>Cancel</Button>
    </ActionBar>
  );

  const save = screen.getByRole('button', { name: 'Save' });

  expect(save.getAttribute('type')).toBe('submit');
  expect(save.getAttribute('form')).toBe('person');
  expect(
    screen.getByRole('link', { name: 'Cancel' }).getAttribute('href')
  ).toBe('/people');
  const spacers = screen.getAllByTestId('spacer');

  expect(spacers).toHaveLength(1);
  expect(spacers[0].textContent).toBe('');
  expect(spacers[0].hasAttribute('aria-hidden')).toBe(true);
});

// PPL-01
it('is fixed to the bottom, takes its height and stacking from tokens, and adds the safe area', () => {
  expect(css).toContain('position: fixed');
  expect(css).toContain('bottom: 0');
  expect(css).toContain('var(--layout-action-bar)');
  expect(css).toContain('z-index: var(--z-action-bar)');
  expect(css).toContain('env(safe-area-inset-bottom)');
  expect(css).toContain(
    'max-width: calc(var(--layout-content-width) + 2 * var(--size-gutter))'
  );
  expect(css).not.toMatch(/\b1088px/);
  expect(css).not.toMatch(/\b72px/);
});

// PPL-01
it('uses the phone media query for the safe area', () => {
  const phone = css.slice(css.indexOf('@media'));

  expect(phone).toMatch(/@media[^{]*\/\* breakpoint: phone \*\//);
  expect(phone).toContain('env(safe-area-inset-bottom)');
});
