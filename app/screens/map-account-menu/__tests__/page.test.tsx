import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';

import Page, { metadata } from '@ks/app/screens/map-account-menu/page';

vi.mock('@ks/server/auth/current.mts', () => ({ requireDevPage: vi.fn() }));

const desktop = window.matchMedia;

afterEach(() => {
  window.matchMedia = desktop;
});

const open = () =>
  fireEvent.click(screen.getByRole('button', { name: 'Account menu' }));

it('puts the menu in the account slot on desktop, with no Layers button', async () => {
  const { container } = render(await Page());

  expect(
    container
      .querySelector('[data-slot="account"]')!
      .contains(screen.getByRole('button', { name: 'Account menu' }))
  ).toBe(true);
  expect(
    screen.queryByRole('button', { name: 'Layers and filters' })
  ).toBeNull();
  open();
  expect(screen.getByText('researcher@example.com')).toBeTruthy();
  expect(screen.getAllByRole('menuitem')).toHaveLength(2);
  // The items do nothing on this sample screen.
  fireEvent.click(
    screen.getByRole('menuitem', { name: 'Sources and attributions' })
  );
  open();
  fireEvent.click(screen.getByRole('menuitem', { name: 'Sign out' }));
});

it('puts the menu in the search pill on a phone, with the Layers button', async () => {
  window.matchMedia = (() => ({
    addEventListener: () => {},
    matches: true,
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia;

  const { container } = render(await Page());

  expect(
    container
      .querySelector('[data-slot="search"]')!
      .contains(screen.getByRole('search'))
  ).toBe(true);
  expect(
    screen.getByRole('button', { name: 'Layers and filters' })
  ).toBeTruthy();
});

it('titles the page', () => {
  expect(metadata.title).toBe('Account menu');
});
