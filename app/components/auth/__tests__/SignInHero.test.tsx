import { render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';

import rawTokens from '@/design/tokens.json';
import { resolveTokens } from '@/lib/design/tokens.mts';

import { HERO_VARS, SignInHero } from '../SignInHero';

const { breakpoint, map } = resolveTokens(rawTokens);

const css = readFileSync(
  join(import.meta.dirname, '../SignInHero.module.css'),
  'utf8'
);
const media = css.slice(css.indexOf('@media'));

// NFR-06
it('hides both drawings from assistive tech', () => {
  const { container } = render(<SignInHero />);
  const art = [...container.querySelectorAll('svg')];

  expect(art.map(svg => svg.dataset.art)).toEqual(['wide', 'phone']);
  for (const svg of art) expect(svg.getAttribute('aria-hidden')).toBe('true');
});

it('keeps the headline, tagline and caption as text', () => {
  const { container } = render(<SignInHero />);

  expect(screen.getByRole('heading', { level: 2 }).textContent).toBe(
    "Borders move.Places don't."
  );
  expect(
    screen.getByText(
      'South Africa as it was on any date from 1652 to today, with your family where they were.'
    )
  ).toBeTruthy();
  expect(
    screen.getByText('Map date 1901-01-01 · borders as recorded')
  ).toBeTruthy();
  expect(screen.getByText('approximate')).toBeTruthy();
  expect(container.querySelectorAll('span[aria-hidden="true"]')).toHaveLength(
    2
  );
});

it('draws the approximate line dashed and the recorded line solid', () => {
  expect(css).toMatch(/\.dash \{\s*border-top-style: dashed/);
  expect(css).toMatch(/\.key \{\s*border-top: 1\.5px solid/);
});

// NFR-03
it('refers to nothing outside the page', () => {
  const { container } = render(<SignInHero />);
  const refs = [...container.querySelectorAll('*')].flatMap(element =>
    [...element.attributes]
      .filter(({ name }) => ['href', 'src', 'xlink:href'].includes(name))
      .map(({ value }) => value)
  );
  const urls = [...container.innerHTML.matchAll(/url\(([^)]*)\)/g)].map(
    ([, value]) => value
  );

  expect(container.querySelector('img, image, use, script')).toBeNull();
  expect(refs).toEqual([]);
  expect(urls.length).toBeGreaterThan(0);
  for (const url of urls) expect(url).toMatch(/^#/);
  expect(css).not.toMatch(/url\(|@import/);
});

it('gives each hero its own filter and clip ids', () => {
  const { container } = render(
    <>
      <SignInHero />
      <SignInHero />
    </>
  );
  const ids = [...container.querySelectorAll('[id]')].map(el => el.id);

  expect(ids).toHaveLength(6);
  expect(new Set(ids).size).toBe(6);
});

// NFR-05
it('shows the phone crop and no text on a phone', () => {
  expect(media.slice(0, media.indexOf('{'))).toBe(
    `@media (max-width: ${breakpoint['phone-width']}), (max-height: ${breakpoint['phone-height']}) `
  );
  expect(media).toMatch(/\.wide,\s*\.copy,\s*\.caption \{\s*display: none/);
  expect(media).toMatch(/\.phone \{\s*display: block/);
});

// NFR-05
it('reads its colours from the map tokens', () => {
  const vars = HERO_VARS as Record<string, unknown>;

  expect(vars['--hero-land']).toBe(map.land);
  expect(vars['--hero-river']).toBe(map.river.colour);
  expect(vars['--hero-border']).toBe(map.border.colour);
  expect(vars['--hero-pin']).toBe(map.pin.colour);
});
