import { fireEvent, render, screen, within } from '@testing-library/react';
import { expect, it } from 'vitest';

import MapFurnitureKit from '../page';

const show = async (part?: string | string[]) =>
  render(await MapFurnitureKit({ searchParams: Promise.resolve({ part }) }));

// NFR-06
it('shows the six sections in board order, each with Measurements and Accessibility', async () => {
  await show();

  expect(
    screen.getByRole('heading', { level: 1, name: 'Map furniture' })
  ).toBeTruthy();
  expect(
    [...document.querySelectorAll('section > div:first-child > h2')].map(
      h => h.textContent
    )
  ).toEqual([
    'Wordmark',
    'Search bar',
    'Map controls',
    'Event glyphs',
    'Legend',
    'Date dock',
  ]);
  expect(
    screen
      .getAllByRole('heading', { level: 3 })
      .map(h => h.textContent)
      .filter(text => text === 'Measurements' || text === 'Accessibility')
  ).toEqual(Array(6).fill(['Measurements', 'Accessibility']).flat());
});

it('draws every variant board 08 shows, in the order drawn', async () => {
  await show();

  const captions = (name: string) =>
    [
      ...screen.getByRole('region', { name }).querySelectorAll('figcaption'),
    ].map(caption => caption.textContent);

  expect(captions('Wordmark').map(text => text!.split(' · ')[0])).toEqual([
    'Sign-in, desktop',
    'Sign-in, phone',
    'Map search bar',
    'Icon only',
  ]);
  expect(captions('Search bar').map(text => text!.split('.')[0])).toEqual([
    'Desktop, default',
    'Desktop, with text',
    'Phone pill, default',
    'Phone pill, with text',
  ]);
  expect(
    captions('Map controls')
      .slice(0, 2)
      .map(text => text!.split(' · ')[0])
  ).toEqual(['Desktop', 'Phone']);
  expect(captions('Legend').map(text => text!.split(' · ')[0])).toEqual([
    'Desktop',
    'Phone',
  ]);
  expect(captions('Date dock').map(text => text!.split(' · ')[0])).toEqual([
    'Desktop',
    'Phone',
  ]);
});

it('draws the Date dock and the collapsed sheet as regions named "Map date"', async () => {
  await show();

  const dock = within(screen.getByRole('region', { name: 'Date dock' }));

  expect(dock.getAllByRole('group', { name: 'Map date' })).toHaveLength(2);
  expect(dock.getAllByText('1901')).toHaveLength(2);
  expect(dock.getByText('2 contested claims on this date')).toBeTruthy();
  expect(
    within(dock.getAllByRole('group', { name: 'Map date' })[0]).getByText(
      'Jump to'
    )
  ).toBeTruthy();
});

it('pages the board on a phone: part 2 holds the glyphs, legend and dock, and links back to part 1', async () => {
  await show('2');

  expect(document.querySelector('main')?.getAttribute('data-part')).toBe('2');
  expect(
    [...document.querySelectorAll('section[data-part="2"] > div > h2')].map(
      h => h.textContent
    )
  ).toEqual(['Event glyphs', 'Legend', 'Date dock']);
  expect(
    screen.getByRole('link', { name: /^Part 1: wordmark/ }).getAttribute('href')
  ).toBe('/design-kit/map-furniture');
});

it('links part 1 to part 2', async () => {
  await show();

  expect(
    screen
      .getByRole('link', { name: /^Part 2: event glyphs/ })
      .getAttribute('href')
  ).toBe('/design-kit/map-furniture?part=2');
});

it('names the Wordmark icons: decoration beside the name, "KinScape" alone', async () => {
  await show();

  const region = within(screen.getByRole('region', { name: 'Wordmark' }));

  expect(region.getAllByRole('img', { name: 'KinScape' })).toHaveLength(1);
  expect(region.getAllByText('KinScape')).toHaveLength(3);
});

it('shows all nine Event glyphs at three sizes, and the four-glyph row in the Legend', async () => {
  await show();

  const glyphs = within(screen.getByRole('region', { name: 'Event glyphs' }));

  expect(
    glyphs.getAllByText(
      /^(Baptism|Birth|Burial|Death|Land|Marriage|Occupation|Other|Residence)$/
    ).length
  ).toBeGreaterThanOrEqual(9);
  expect(
    within(screen.getByRole('region', { name: 'Legend' })).getAllByRole(
      'heading',
      { level: 3, name: 'Reading the map' }
    )
  ).toHaveLength(2);
});

// MAP-05
it('lets the zoom card reach its limits, where Zoom out stays focusable and inert', async () => {
  await show();

  const card = within(screen.getByRole('region', { name: 'Map controls' }));
  const [zoomOut] = card.getAllByRole('button', { name: 'Zoom out' });
  const [zoomIn] = card.getAllByRole('button', { name: 'Zoom in' });

  fireEvent.click(zoomOut);

  expect(zoomOut.getAttribute('aria-disabled')).toBe('true');

  zoomOut.focus();
  fireEvent.click(zoomOut);

  expect(document.activeElement).toBe(zoomOut);

  fireEvent.click(zoomIn);
  fireEvent.click(zoomIn);

  expect(zoomIn.getAttribute('aria-disabled')).toBe('true');
  expect(zoomOut.getAttribute('aria-disabled')).toBeNull();

  fireEvent.click(card.getAllByRole('button', { name: 'Fit South Africa' })[0]);

  expect(zoomIn.getAttribute('aria-disabled')).toBeNull();
});

it('draws the Disabled column with Zoom in at its limit and the layers button disabled', async () => {
  await show();

  const matrix = within(
    screen.getByRole('figure', { name: 'Map control states' })
  );

  expect(
    matrix
      .getAllByRole('button', { hidden: true, name: 'Zoom in' })
      .some(button => button.getAttribute('aria-disabled') === 'true')
  ).toBe(true);
  expect(
    matrix
      .getAllByRole('button', { hidden: true, name: 'Layers and filters' })
      .some(button => button.hasAttribute('disabled'))
  ).toBe(true);
});
