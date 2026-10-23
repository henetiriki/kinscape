import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';

const pathname = vi.hoisted(() => ({ current: '/design-kit/type' }));

vi.mock('next/navigation', () => ({ usePathname: () => pathname.current }));

import { KitMenu } from '../KitMenu';

// jsdom has no showModal or close: stand in for them with the `open` attribute.
beforeEach(() => {
  pathname.current = '/design-kit/type';
  HTMLDialogElement.prototype.showModal = () =>
    document.querySelector('dialog')!.setAttribute('open', '');
  HTMLDialogElement.prototype.close = () =>
    document.querySelector('dialog')!.removeAttribute('open');
});

const sheet = () => screen.getByRole('dialog', { hidden: true });

// NFR-06
it('has a Boards button that announces a dialog', () => {
  render(<KitMenu />);

  expect(
    screen.getByRole('button', { name: 'Boards' }).getAttribute('aria-haspopup')
  ).toBe('dialog');
});

it('opens a dialog named Boards with seven rows in order and All boards', () => {
  render(<KitMenu />);
  fireEvent.click(screen.getByRole('button', { name: 'Boards' }));

  expect(sheet().hasAttribute('open')).toBe(true);
  expect(
    screen.getByRole('heading', { hidden: true, name: 'Boards' })
  ).toBeTruthy();

  const rows = within(sheet()).getAllByRole('link', { hidden: true });

  expect(rows.map(row => [row.textContent, row.getAttribute('href')])).toEqual([
    ['Style guide · 01Typography and hierarchy', '/design-kit/type'],
    ['Style guide · 02Colour', '/design-kit/colour'],
    [
      'Style guide · 03Spacing, shape, depth, icons, motion',
      '/design-kit/foundations',
    ],
    ['Style guide · 04Component states', '/design-kit/states'],
    ['Style guide · 05Feedback and validation', '/design-kit/feedback'],
    ['Style guide · 06Inputs and actions', '/design-kit/inputs'],
    ['Map styleMapLibre layer stack', '/design-kit/map-style'],
    ['All boards', '/design-kit'],
  ]);
});

it('marks only the current board', () => {
  render(<KitMenu />);

  const current = within(sheet())
    .getAllByRole('link', { hidden: true })
    .filter(row => row.getAttribute('aria-current') === 'page');

  expect(current.map(row => row.getAttribute('href'))).toEqual([
    '/design-kit/type',
  ]);
});

it('marks All boards on the index', () => {
  pathname.current = '/design-kit';
  render(<KitMenu />);

  const current = within(sheet())
    .getAllByRole('link', { hidden: true })
    .filter(row => row.getAttribute('aria-current') === 'page');

  expect(current.map(row => row.textContent)).toEqual(['All boards']);
});

it.each(['Close', 'Colour', 'All boards'])('closes on %s', name => {
  render(<KitMenu />);
  fireEvent.click(screen.getByRole('button', { name: 'Boards' }));

  const target =
    name === 'Close'
      ? screen.getByRole('button', { hidden: true, name })
      : within(sheet()).getByRole('link', {
          hidden: true,
          name: new RegExp(name),
        });

  fireEvent.click(target);

  expect(sheet().hasAttribute('open')).toBe(false);
});
