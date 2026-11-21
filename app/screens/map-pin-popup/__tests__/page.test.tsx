import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';

import FailedPage, {
  metadata as failed,
} from '@ks/app/screens/map-pin-popup/failed/page';
import LoadingPage, {
  metadata as loading,
} from '@ks/app/screens/map-pin-popup/loading/page';
import Page, { metadata } from '@ks/app/screens/map-pin-popup/page';

vi.mock('@ks/server/auth/current.mts', () => ({ requireDevPage: vi.fn() }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ prefetch: vi.fn(), push: vi.fn() }),
}));

const desktop = window.matchMedia;

afterEach(() => {
  window.matchMedia = desktop;
});

const show = async (page: typeof Page) => render(await page());

// PIN-02. Data is synthetic.
it('shows the loaded popup at Example Farm, with the panel of the boards, on a desktop', async () => {
  await show(Page);

  const popup = screen.getByRole('dialog', { name: 'Pin details' });

  expect(popup.parentElement?.style.getPropertyValue('--x')).toBe('940px');
  expect(popup.parentElement?.style.getPropertyValue('--y')).toBe('400px');
  expect(
    within(popup).getByRole('heading', { name: 'Example Person' })
  ).toBeTruthy();
  expect(within(popup).getByText('From 1890 to 1905')).toBeTruthy();
  expect(within(popup).getByText('FROM 1890 TO 1905')).toBeTruthy();
  expect(
    within(popup).getByRole('button', { name: 'Add a pin here' })
  ).toBeTruthy();
  expect(
    screen.getByRole('complementary', { name: 'Layers and filters' })
  ).toBeTruthy();
  expect(screen.getByRole('region', { name: 'Map date' })).toBeTruthy();
});

it('does nothing but close the account menu on each of its items', async () => {
  await show(Page);
  fireEvent.click(screen.getByRole('button', { name: 'Account menu' }));
  fireEvent.click(
    screen.getByRole('menuitem', { name: 'Sources and attributions' })
  );
  expect(screen.queryByRole('menu')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Account menu' }));
  fireEvent.click(screen.getByRole('menuitem', { name: 'Sign out' }));
  expect(screen.queryByRole('menu')).toBeNull();
});

it('shows the loading state on its own route', async () => {
  await show(LoadingPage as typeof Page);

  const popup = screen.getByRole('dialog', { name: 'Pin details' });

  expect(popup.getAttribute('aria-busy')).toBe('true');
  expect(within(popup).queryByRole('heading')).toBeNull();
});

it('shows the failed state on its own route', async () => {
  await show(FailedPage as typeof Page);
  expect(screen.getByText("Couldn't load this Pin")).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();
});

// NFR-05
it('puts the details in the date sheet on a phone, with the Layers button and no Add button', async () => {
  window.matchMedia = (() => ({
    addEventListener: () => {},
    matches: true,
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia;
  await show(Page);

  expect(
    within(screen.getByRole('region', { name: 'Map date' })).getByRole(
      'group',
      { name: 'Pin details' }
    )
  ).toBeTruthy();
  expect(
    screen.getByRole('button', { name: 'Layers and filters' })
  ).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Add a pin here' })).toBeNull();
  expect(screen.queryByRole('dialog')).toBeNull();
});

it('titles each page', () => {
  expect([metadata.title, loading.title, failed.title]).toEqual([
    'Pin popup',
    'Pin popup, loading',
    'Pin popup, failed',
  ]);
});
