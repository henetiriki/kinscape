import { render } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';

import { freeArea, Stage } from '@/app/components/map/Stage';

const css = readFileSync(
  join(import.meta.dirname, '../Stage.module.css'),
  'utf8'
);
const media = css.slice(css.indexOf('@media'));
const desktop = css.slice(0, css.indexOf('@media'));

// NFR-05
it('places each slot it is given, with the map as children', () => {
  const { container } = render(
    <Stage
      account='a'
      credits='c'
      dock='d'
      layers='l'
      overlay='o'
      panel='p'
      search='s'
      zoom='z'>
      <canvas />
    </Stage>
  );

  expect(container.querySelector('canvas')).toBeTruthy();
  expect(
    [...container.querySelectorAll('[data-slot]')].map(
      slot => `${(slot as HTMLElement).dataset.slot}:${slot.textContent}`
    )
  ).toEqual([
    'search:s',
    'account:a',
    'zoom:z',
    'layers:l',
    'panel:p',
    'dock:d',
    'credits:c',
    'overlay:o',
  ]);
});

it('top-aligns the overlay only when asked', () => {
  const { container, rerender } = render(<Stage overlay='o' search='s' />);
  const at = () =>
    [...container.querySelectorAll('[data-slot]')].map(slot =>
      slot.getAttribute('data-at')
    );

  expect(at()).toEqual([null, null]);
  rerender(<Stage overlay='o' overlayAt='top' search='s' />);
  expect(at()).toEqual([null, 'top']);
  expect(css).toMatch(
    /\.overlay\[data-at='top'\] \{[^}]*align-items: flex-start/
  );
});

it('draws no box for a slot left empty', () => {
  const { container } = render(<Stage search='s' />);

  expect(container.querySelectorAll('[data-slot]')).toHaveLength(1);
});

// jsdom computes no CSS, so these read the stylesheet.
it('writes no pixel value outside the phone media block', () => {
  expect(desktop).not.toMatch(/\d(?:\.\d+)?px/);
});

it('takes every edge from a layout or size token', () => {
  const edges = [
    ...desktop.matchAll(/(?:top|right|bottom|left|width): ([^;]+);/g),
  ];

  expect(edges.length).toBeGreaterThan(10);
  for (const [, value] of edges) {
    expect(value).toMatch(/^(?:0|auto|100%|calc\(|var\(--(?:layout|size)-)/);
  }
});

// NFR-05
it('turns the overlay slot into map padding from the same tokens', () => {
  expect(freeArea(false)).toEqual({
    bottom: 28 + 176,
    left: 368,
    right: 24,
    top: 88,
  });
  expect(freeArea(true)).toEqual({
    bottom: 152,
    left: 16,
    right: 16,
    top: 144,
  });
});

it('puts the phone Layers button on the right and lets the dock grow', () => {
  expect(media).toMatch(/\.layers \{[^}]*right: var\(--size-gutter-phone\)/);
  expect(media).not.toMatch(/\.dock \{[^}]*height/);
});

it('positions the phone slots from the phone tokens', () => {
  for (const token of [
    'pill-top',
    'layers-top',
    'sheet-top',
    'overlay-top',
    'sheet-collapsed',
  ]) {
    expect(media).toContain(`var(--layout-phone-${token})`);
  }
  expect(media).toContain('var(--size-gutter-phone)');
});
