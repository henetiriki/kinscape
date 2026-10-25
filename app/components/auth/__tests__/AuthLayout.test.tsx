import { render } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';

import rawTokens from '@/design/tokens.json';
import { resolveTokens } from '@/lib/design/tokens.mts';

import { AuthLayout } from '@/app/components/auth/AuthLayout';

const { breakpoint, layout, map } = resolveTokens(rawTokens);

const css = readFileSync(
  join(import.meta.dirname, '../AuthLayout.module.css'),
  'utf8'
);
const media = css.slice(css.indexOf('@media'));
const desktop = css.slice(0, css.indexOf('@media'));

// NFR-05
it('puts the hero before the form and the desktop wordmark above the form', () => {
  const { container } = render(
    <AuthLayout hero={<p>hero</p>}>
      <form>form</form>
    </AuthLayout>
  );
  const slots = [...container.querySelectorAll('[data-slot]')];

  expect(slots.map(slot => (slot as HTMLElement).dataset.slot)).toEqual([
    'hero',
    'form',
  ]);
  expect(slots[0]?.textContent).toContain('hero');
  expect(slots[1]?.querySelector('form')).toBeTruthy();
  expect(slots[1]?.querySelector('img')?.getAttribute('height')).toBe('44');
});

it('draws a 36px wordmark in the hero for a phone', () => {
  const { container } = render(
    <AuthLayout hero='hero'>
      <form />
    </AuthLayout>
  );

  expect(
    container.querySelector('[data-slot="hero"] img')?.getAttribute('height')
  ).toBe('36');
});

it('sets the sea colour from the map tokens', () => {
  const { container } = render(
    <AuthLayout hero='hero'>
      <form />
    </AuthLayout>
  );

  expect(
    (container.firstElementChild as HTMLElement).style.getPropertyValue(
      '--auth-sea'
    )
  ).toBe(map.sea);
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
