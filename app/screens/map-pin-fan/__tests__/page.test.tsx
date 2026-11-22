import { render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';

import Page, { metadata } from '@ks/app/screens/map-pin-fan/page';

vi.mock('@ks/server/auth/current.mts', () => ({ requireDevPage: vi.fn() }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ prefetch: vi.fn(), push: vi.fn() }),
}));

const desktop = window.matchMedia;

afterEach(() => {
  window.matchMedia = desktop;
});

const NAMES = [
  'Marriage, in 1899',
  'Residence, from 1890 to 1905',
  'Birth, in 1901',
];

// PIN-06. Data is synthetic.
it('fans the three Pins of Example Farm out, with the pointer on Birth', async () => {
  render(await Page());

  const marker = screen.getByRole('button', { name: '3 Pins' });

  expect(
    NAMES.map(name => screen.getByRole('button', { name }).dataset.state)
  ).toEqual([undefined, undefined, 'hover']);
  expect(
    // eslint-disable-next-line testing-library/no-node-access -- the placed wrapper div has no role; the test checks its position
    (marker.parentElement!.parentElement!.parentElement as HTMLElement).style
      .left
  ).toBe('940px');
});

// NFR-05
it('fans them out at the phone point with no hover look on a phone', async () => {
  window.matchMedia = (() => ({
    addEventListener: () => {},
    matches: true,
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia;
  render(await Page());

  const marker = screen.getByRole('button', { name: '3 Pins' });

  expect(
    NAMES.map(name => screen.getByRole('button', { name }).dataset.state)
  ).toEqual([undefined, undefined, undefined]);
  expect(
    // eslint-disable-next-line testing-library/no-node-access -- the placed wrapper div has no role; the test checks its position
    (marker.parentElement!.parentElement!.parentElement as HTMLElement).style
      .left
  ).toBe('264px');
  screen.getByRole('button', { name: 'Layers and filters' });
});

it('titles the page', () => {
  expect(metadata.title).toBe('Pins, fan-out');
});
