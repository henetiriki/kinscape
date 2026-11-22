import { render, within } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';

import { SignInLayout } from '@ks/app/components/layout/SignInLayout';
import rawTokens from '@ks/design/tokens.json';
import { resolveTokens } from '@ks/design/tokens.mts';

const { breakpoint, layout, map } = resolveTokens(rawTokens);

const css = readFileSync(
  join(import.meta.dirname, '../SignInLayout.module.css'),
  'utf8'
);
const media = css.slice(css.indexOf('@media'));
const desktop = css.slice(0, css.indexOf('@media'));

// NFR-05
it('puts the hero before the form and the desktop wordmark above the form', () => {
  const { container } = render(
    <SignInLayout hero={<p>hero</p>}>
      <form>form</form>
    </SignInLayout>
  );
  // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- the slot divs have no role; the test checks their order
  const slots = [...container.querySelectorAll<HTMLElement>('[data-slot]')];

  expect(slots.map(slot => slot.dataset.slot)).toEqual(['hero', 'form']);
  expect(slots[0]?.textContent).toContain('hero');
  expect(within(slots[1]!).getByText('form').tagName).toBe('FORM');
  expect(within(slots[1]!).getByAltText('').getAttribute('height')).toBe('44');
});

it('draws a 36px wordmark in the hero for a phone', () => {
  const { container } = render(
    <SignInLayout hero='hero'>
      <form />
    </SignInLayout>
  );

  // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- the hero slot div has no role; the test checks the size of its wordmark
  const icon = container.querySelector('[data-slot="hero"] img');

  expect(icon?.getAttribute('height')).toBe('36');
});

it('sets the sea colour from the map tokens', () => {
  const { container } = render(
    <SignInLayout hero='hero'>
      <form />
    </SignInLayout>
  );

  // eslint-disable-next-line testing-library/no-node-access -- the layout div has no role; the test checks its inline style
  const layoutDiv = container.firstElementChild as HTMLElement;

  expect(layoutDiv.style.getPropertyValue('--auth-sea')).toBe(map.sea);
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
