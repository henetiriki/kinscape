import { render, screen, within } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

import Page, { metadata } from '@ks/app/screens/map-pin-count/page';

vi.mock('@ks/server/auth/current.mts', () => ({ requireDevPage: vi.fn() }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ prefetch: vi.fn(), push: vi.fn() }),
}));

// PIN-06. Data is synthetic.
it('shows the count marker at Example Farm, and a card of its five looks', async () => {
  render(await Page());

  const looks = screen.getByRole('region', { name: 'Count marker looks' });
  const markers = screen.getAllByRole('button', { name: '3 Pins' });

  expect(markers).toHaveLength(6);
  expect(markers[0].parentElement!.style.left).toBe('940px');
  expect(markers[0].parentElement!.style.top).toBe('400px');
  expect(
    within(looks)
      .getAllByRole('button', { name: '3 Pins' })
      .map(({ dataset }) => dataset.state)
  ).toEqual([undefined, 'hover', 'focus', 'active', undefined]);
  expect(looks.querySelectorAll('[data-ring]')).toHaveLength(1);
  screen.getByRole('complementary', { name: 'Layers and filters' });
});

it('titles the page', () => {
  expect(metadata.title).toBe('Pins, count marker');
});
