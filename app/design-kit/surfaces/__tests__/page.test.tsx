import { render, screen, within } from '@testing-library/react';
import { expect, it } from 'vitest';

import SurfacesKit from '../page';

const show = async (part?: string | string[]) =>
  render(await SurfacesKit({ searchParams: Promise.resolve({ part }) }));

// NFR-06
it('shows the eight sections in board order, each with Measurements and Accessibility', async () => {
  await show();

  expect(
    screen.getByRole('heading', { level: 1, name: 'Surfaces and overlays' })
  ).toBeTruthy();
  expect(
    // The Dialog and sheet samples carry their own titles, so only each section's own h2 counts.
    [...document.querySelectorAll('section > div:first-child > h2')].map(
      h => h.textContent
    )
  ).toEqual([
    'Surface',
    'Notice card',
    'Progress bar',
    'Dialog',
    'Phone sheet header',
    'Menu',
    'Popup',
    'Callout',
  ]);
  // The Popup samples carry their own place name, an h3 too.
  const facts = screen
    .getAllByRole('heading', { level: 3 })
    .map(h => h.textContent)
    .filter(text => text === 'Measurements' || text === 'Accessibility');

  expect(facts.filter(text => text === 'Measurements').length).toBe(8);
  expect(facts.filter(text => text === 'Accessibility').length).toBe(8);
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

  const dialog = screen.getByRole('region', { name: 'Dialog' });

  expect(
    [...dialog.querySelectorAll('[data-form]')].map(panel =>
      panel.getAttribute('data-form')
    )
  ).toEqual(['centred', 'sheet']);
  // The kit lists the real sources, in the table and in the list.
  expect(
    within(dialog).getAllByRole('link', { name: 'Public domain' }).length
  ).toBeGreaterThan(0);
  // One sample per board: the centred dialog on a desktop, the sheet on a phone.
  expect(
    [...dialog.querySelectorAll('figure')].map(figure => [
      figure.hasAttribute('data-desktop'),
      figure.hasAttribute('data-phone'),
    ])
  ).toEqual([
    [true, false],
    [false, true],
  ]);
  expect(
    within(
      within(dialog).getByRole('table', { name: 'Dialog measurements' })
    ).getAllByRole('row').length
  ).toBe(10);

  const heads = screen.getByRole('region', { name: 'Phone sheet header' });

  expect(
    [...heads.querySelectorAll('[data-head]')].map(head =>
      head.getAttribute('data-head')
    )
  ).toEqual(['title', 'tabs', 'subtitle']);

  const menu = screen.getByRole('region', { name: 'Menu' });

  // The drawn menu is only a look; the matrices show every state of an item and of the Avatar.
  expect(menu.querySelector('[inert] [role=menu]')).toBeTruthy();
  expect(
    within(menu)
      .getByRole('figure', { name: 'Menu item states' })
      .querySelectorAll('[role=menuitem]').length
  ).toBe(10);
  expect(
    [
      ...within(menu)
        .getByRole('figure', { name: 'Avatar states' })
        .querySelectorAll('[data-state], [aria-expanded]'),
    ].map(avatar => avatar.getAttribute('data-state'))
  ).toEqual([null, 'hover', 'focus', 'active']);
  expect(
    within(menu)
      .getByRole('figure', { name: 'Avatar states' })
      .textContent?.includes('Open')
  ).toBe(true);

  const popup = screen.getByRole('region', { name: 'Popup' });

  expect(
    within(popup).getByRole('dialog', { name: 'Jurisdiction at this point' })
  ).toBeTruthy();
  expect(popup.querySelectorAll('[data-desktop]').length).toBe(2);
  expect(
    within(popup).getByRole('region', { name: 'On this spot in 1901' })
  ).toBeTruthy();
  expect(
    [...popup.querySelectorAll('ol')].map(list => list.children.length)
  ).toEqual([2, 2]);

  const callouts = within(
    screen.getByRole('region', { name: 'Callout' })
  ).getAllByRole('alert');

  expect(callouts.map(callout => callout.id)).toEqual([
    'callout-offset',
    'callout-centred',
    'callout-sheet',
    'callout-phone',
  ]);
});

it('splits into two parts on a phone, with a link to the other', async () => {
  await show();
  expect(screen.getByRole('main').getAttribute('data-part')).toBe('1');
  expect(
    screen
      .getByRole('link', {
        name: 'Part 2: phone sheet headers, menu, popup, callout',
      })
      .getAttribute('href')
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
        name: 'Part 1: surface, notice card, progress bar, dialog',
      })
      .getAttribute('href')
  ).toBe('/design-kit/surfaces');
  unmount();

  await show(['2', '3']);
  expect(screen.getByRole('main').getAttribute('data-part')).toBe('1');
});
