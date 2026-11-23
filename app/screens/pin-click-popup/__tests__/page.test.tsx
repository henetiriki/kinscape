import { render, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';

import Page, { metadata } from '@ks/app/screens/pin-click-popup/page';

vi.mock('@ks/server/auth/current.mts', () => ({ requireDevPage: vi.fn() }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ prefetch: vi.fn(), push: vi.fn() }),
}));

const desktop = window.matchMedia;

afterEach(() => {
  window.matchMedia = desktop;
});

// PIN-01. Data is synthetic.
it('shows the click popup at the board point, with the point and the button', async () => {
  render(await Page());

  const popup = screen.getByRole('dialog', { name: 'Add a pin here' });

  expect(popup.parentElement?.style.getPropertyValue('--x')).toBe('760px');
  expect(popup.parentElement?.style.getPropertyValue('--y')).toBe('330px');
  within(popup).getByText('Point on the map');
  within(popup).getByText('-28.740000, 25.310000');
  expect(
    within(popup)
      .getByRole('button', { name: 'Add a pin here' })
      .hasAttribute('disabled')
  ).toBe(false);
  expect(screen.getByRole('button', { name: 'Add a pin' }).textContent).toBe(
    'Add a pin'
  );
});

it('shows no popup on a phone', async () => {
  window.matchMedia = (() => ({
    addEventListener: () => {},
    matches: true,
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia;
  render(await Page());
  expect(screen.queryByRole('dialog')).toBeNull();
});

it('titles the page', () => {
  expect(metadata.title).toBe('Click popup');
});
