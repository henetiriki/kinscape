import { render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';

import { SignInLayout } from '@ks/app/components/layout/SignInLayout';
import { breakpoint, layout } from '@ks/design/tokens.generated.ts';

const css = readFileSync(
  join(import.meta.dirname, '../SignInLayout.module.css'),
  'utf8'
);
const media = css.slice(css.indexOf('@media'));
const desktop = css.slice(0, css.indexOf('@media'));

// NFR-05
it('shows the hero and the form', () => {
  render(
    <SignInLayout hero={<p>hero</p>}>
      <form>form</form>
    </SignInLayout>
  );

  screen.getByText('hero');
  expect(screen.getByText('form').tagName).toBe('FORM');
});

// jsdom computes no CSS, so these read the stylesheet.
// NFR-05
it('sizes the desktop halves and form from the sign-in tokens', () => {
  for (const token of [
    'hero',
    'hero-min',
    'pane',
    'form',
    'pane-y',
    'pane-x',
  ]) {
    expect(desktop).toContain(`var(--layout-sign-in-${token})`);
  }
  expect(desktop).not.toMatch(/\d(?:\.\d+)?px/);
  expect(layout['sign-in'].form).toBe('360px');
  expect(layout['sign-in'].pane).toBe('440px');
});

it('stacks a 188px hero above the form at the phone breakpoint', () => {
  expect(media.slice(0, media.indexOf('{'))).toBe(
    `@media (max-width: ${breakpoint['phone-width']}), (max-height: ${breakpoint['phone-height']}) `
  );
  expect(media).toContain('height: var(--layout-sign-in-hero-phone)');
  expect(layout['sign-in']['hero-phone']).toBe('188px');
  expect(media).toContain('flex-direction: column');
});

it('shows one wordmark per form', () => {
  expect(desktop).toMatch(/\.phoneMark \{\s*display: none/);
  expect(media).toMatch(/\.phoneMark \{\s*display: block/);
  expect(media).toMatch(/\.deskMark \{\s*display: none/);
});
