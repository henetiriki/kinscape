import { fireEvent, render, screen, within } from '@testing-library/react';
import { expect, it } from 'vitest';

import MapFurnitureKit from '../page';

// NFR-06
it('shows the five sections in board order, each with Measurements and Accessibility', () => {
  render(<MapFurnitureKit />);

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
  ]);
  expect(
    screen
      .getAllByRole('heading', { level: 3 })
      .map(h => h.textContent)
      .filter(text => text === 'Measurements' || text === 'Accessibility')
  ).toEqual(Array(5).fill(['Measurements', 'Accessibility']).flat());
});

it('draws every variant board 08 shows, in the order drawn', () => {
  render(<MapFurnitureKit />);

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
});

it('names the Wordmark icons: decoration beside the name, "KinScape" alone', () => {
  render(<MapFurnitureKit />);

  const region = within(screen.getByRole('region', { name: 'Wordmark' }));

  expect(region.getAllByRole('img', { name: 'KinScape' })).toHaveLength(1);
  expect(region.getAllByText('KinScape')).toHaveLength(3);
});

it('shows all nine Event glyphs at three sizes, and the four-glyph row in the Legend', () => {
  render(<MapFurnitureKit />);

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
it('lets the zoom card reach its limits, where Zoom out stays focusable and inert', () => {
  render(<MapFurnitureKit />);

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

it('draws the Disabled column with Zoom in at its limit and the layers button disabled', () => {
  render(<MapFurnitureKit />);

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
