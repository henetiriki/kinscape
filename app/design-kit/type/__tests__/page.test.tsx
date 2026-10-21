import { render, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';

const notFound = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  })
);

vi.mock('next/navigation', () => ({ notFound }));

import TypeKit from '../page';

afterEach(() => vi.unstubAllEnvs());

// NFR-03
it('is a 404 in production', () => {
  vi.stubEnv('VERCEL_ENV', 'production');
  expect(() => render(<TypeKit />)).toThrow('NEXT_NOT_FOUND');
  expect(notFound).toHaveBeenCalled();
});

// NFR-06
it('shows the 14 styles outside production, with one level 1 heading', () => {
  vi.stubEnv('VERCEL_ENV', 'preview');
  render(<TypeKit />);

  const scale = screen.getByRole('table', { name: 'Type scale' });

  // The header row and one row per style.
  expect(within(scale).getAllByRole('row')).toHaveLength(15);
  expect(scale.querySelectorAll('[data-variant]')).toHaveLength(14);
  expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  expect(screen.getByRole('heading', { name: 'Rules' })).toBeTruthy();
});
