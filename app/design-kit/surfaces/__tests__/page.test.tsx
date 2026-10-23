import { render, screen, within } from '@testing-library/react';
import { expect, it } from 'vitest';

import SurfacesKit from '../page';

const show = async (part?: string | string[]) =>
  render(await SurfacesKit({ searchParams: Promise.resolve({ part }) }));

// NFR-06
it('shows the four sections in board order, each with Measurements and Accessibility', async () => {
  await show();

  expect(
    screen.getByRole('heading', { level: 1, name: 'Surfaces and overlays' })
  ).toBeTruthy();
  expect(
    screen.getAllByRole('heading', { level: 2 }).map(h => h.textContent)
  ).toEqual(['Surface', 'Notice card', 'Progress bar', 'Callout']);
  expect(
    screen.getAllByRole('heading', { level: 3 }).map(h => h.textContent)
  ).toEqual(Array(4).fill(['Measurements', 'Accessibility']).flat());
});

it('draws every variant board 07 shows, in the order drawn', async () => {
  await show();

  const surface = screen.getByRole('region', { name: 'Surface' });

  expect(
    [...surface.querySelectorAll('.levelTitle')].map(level => level.textContent)
  ).toEqual(['Raised', 'Floating', 'Modal', 'Sheet']);

  const notices = within(
    screen.getByRole('region', { name: 'Notice card' })
  ).getAllByRole('status');

  expect(
    notices.map(card => card.querySelector('.title')!.textContent)
  ).toEqual([
    'No pins in 1901',
    'No pins in 1901',
    'No pins in 1901',
    'Loading the map',
    'No pins yet',
  ]);
  expect(notices[3].getAttribute('aria-live')).toBe('polite');
  expect(notices[4].getAttribute('data-size')).toBe('large');

  const bars = within(
    screen.getByRole('region', { name: 'Progress bar' })
  ).getAllByRole('progressbar');

  expect(bars.map(bar => bar.getAttribute('aria-valuenow'))).toEqual([
    '0',
    '45',
    '100',
  ]);

  const callouts = within(
    screen.getByRole('region', { name: 'Callout' })
  ).getAllByRole('alert');

  expect(callouts.map(callout => callout.id)).toEqual([
    'callout-offset',
    'callout-centred',
    'callout-phone',
  ]);
});

it('splits into two parts on a phone, with a link to the other', async () => {
  await show();
  expect(screen.getByRole('main').getAttribute('data-part')).toBe('1');
  expect(
    screen.getByRole('link', { name: 'Part 2: callout' }).getAttribute('href')
  ).toBe('/design-kit/surfaces?part=2');
  expect(
    screen.getByRole('region', { name: 'Callout' }).getAttribute('data-part')
  ).toBe('2');
});

it('shows part 2 for ?part=2 and part 1 for anything else', async () => {
  const { unmount } = await show('2');

  expect(screen.getByRole('main').getAttribute('data-part')).toBe('2');
  expect(
    screen
      .getByRole('link', {
        name: 'Part 1: surface, notice card, progress bar',
      })
      .getAttribute('href')
  ).toBe('/design-kit/surfaces');
  unmount();

  await show(['2', '3']);
  expect(screen.getByRole('main').getAttribute('data-part')).toBe('1');
});
