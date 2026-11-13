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
  const { container } = render(
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
  expect(screen.getByRole('link', { name: 'Cancel' })).toBeTruthy();
  expect(container.querySelectorAll('[data-spacer]')).toHaveLength(1);
  expect(container.querySelector('[data-spacer]')!.textContent).toBe('');
  expect(
    container.querySelector('[data-spacer]')!.hasAttribute('aria-hidden')
  ).toBe(true);
});

// PPL-01
it('is fixed to the bottom, takes its height and stacking from tokens, and adds the safe area', () => {
  expect(css).toContain('position: fixed');
  expect(css).toContain('bottom: 0');
  expect(css).toContain('var(--layout-action-bar)');
  expect(css).toContain('z-index: var(--z-action-bar)');
  expect(css).toContain('env(safe-area-inset-bottom)');
  expect(css).not.toMatch(/\b72px/);
});

// PPL-01
it('uses the phone media query for the safe area', () => {
  const phone = css.slice(css.indexOf('@media'));

  expect(phone).toMatch(
    /@media \(max-width: 639\.98px\), \(max-height: 499\.98px\)/
  );
  expect(phone).toContain('env(safe-area-inset-bottom)');
});
