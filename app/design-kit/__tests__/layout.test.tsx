import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const notFound = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  })
);
const redirect = vi.hoisted(() =>
  vi.fn((to: string) => {
    throw new Error(`redirect:${to}`);
  })
);
const session = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({
  notFound,
  redirect,
  usePathname: () => '/design-kit/type',
}));
vi.mock('@ks/server/auth/current.mts', () => ({ currentSession: session }));

import DesignKitLayout, { metadata } from '@ks/app/design-kit/layout';

beforeEach(() => {
  session.mockResolvedValue({ accountId: 'a', email: 'a@example.test' });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

// NFR-03
it('is a 404 in production, for every kit page', async () => {
  vi.stubEnv('VERCEL_ENV', 'production');
  await expect(DesignKitLayout({ children: <p>board</p> })).rejects.toThrow(
    'NEXT_NOT_FOUND'
  );
  expect(notFound).toHaveBeenCalled();
});

// NFR-03
it('sends a visitor with no valid session to the sign-in page', async () => {
  vi.stubEnv('VERCEL_ENV', 'preview');
  session.mockResolvedValue(undefined);

  await expect(DesignKitLayout({ children: <p>board</p> })).rejects.toThrow(
    'redirect:/sign-in'
  );
});

// NFR-06
it('shows the banner, then the page outside production', async () => {
  vi.stubEnv('VERCEL_ENV', 'preview');
  render(await DesignKitLayout({ children: <h1>Board</h1> }));

  const banner = screen.getByRole('banner');

  expect(banner.textContent).toContain('KinScape design kit');
  expect(screen.getByRole('navigation', { name: 'Boards' })).toBeTruthy();
  expect(
    screen
      .getByRole('link', { name: 'KinScape design kit' })
      .getAttribute('href')
  ).toBe('/design-kit');
  expect(
    screen.getByRole('button', { name: 'Boards' }).getAttribute('aria-haspopup')
  ).toBe('dialog');
  // The kit's name is not a heading: the page's title is the only h1.
  expect(screen.getAllByRole('heading')).toHaveLength(1);
  expect(
    banner.compareDocumentPosition(
      screen.getByRole('heading', { name: 'Board' })
    )
  ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
});

it('titles each page after its board', () => {
  expect(metadata.title).toEqual({
    default: 'KinScape design kit',
    template: '%s · KinScape design kit',
  });
});
