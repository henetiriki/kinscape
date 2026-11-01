import { render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';

const notFound = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  })
);

vi.mock('next/navigation', () => ({ notFound }));

import ScreensLayout, { metadata } from '@ks/app/screens/layout';

afterEach(() => vi.unstubAllEnvs());

// NFR-03
it('is a 404 in production, for every screen', () => {
  vi.stubEnv('VERCEL_ENV', 'production');
  expect(() =>
    render(
      <ScreensLayout>
        <p>screen</p>
      </ScreensLayout>
    )
  ).toThrow('NEXT_NOT_FOUND');
  expect(notFound).toHaveBeenCalled();
});

it('shows the screen outside production', () => {
  vi.stubEnv('VERCEL_ENV', 'preview');
  render(
    <ScreensLayout>
      <p>screen</p>
    </ScreensLayout>
  );

  expect(screen.getByText('screen')).toBeTruthy();
});

it('titles each screen after its page', () => {
  expect(metadata.title).toEqual({
    default: 'KinScape screens',
    template: '%s · KinScape screens',
  });
});
