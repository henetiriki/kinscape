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

vi.mock('next/navigation', () => ({ notFound, redirect }));
vi.mock('@ks/server/auth/current.mts', () => ({ currentSession: session }));

import ScreensLayout, { metadata } from '@ks/app/screens/layout';

beforeEach(() => {
  session.mockResolvedValue({ accountId: 'a', email: 'a@example.test' });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

// NFR-03
it('is a 404 in production, for every screen', async () => {
  vi.stubEnv('VERCEL_ENV', 'production');
  await expect(ScreensLayout({ children: <p>screen</p> })).rejects.toThrow(
    'NEXT_NOT_FOUND'
  );
  expect(notFound).toHaveBeenCalled();
});

// NFR-03
it('sends a visitor with no valid session to the sign-in page', async () => {
  vi.stubEnv('VERCEL_ENV', 'preview');
  session.mockResolvedValue(undefined);

  await expect(ScreensLayout({ children: <p>screen</p> })).rejects.toThrow(
    'redirect:/sign-in'
  );
});

it('shows the screen outside production', async () => {
  vi.stubEnv('VERCEL_ENV', 'preview');
  render(await ScreensLayout({ children: <p>screen</p> }));

  expect(screen.getByText('screen')).toBeTruthy();
});

it('titles each screen after its page', () => {
  expect(metadata.title).toEqual({
    default: 'KinScape screens',
    template: '%s · KinScape screens',
  });
});
