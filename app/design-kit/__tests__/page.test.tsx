import { render, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';

const notFound = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  })
);

vi.mock('next/navigation', () => ({ notFound }));

import DesignKit from '../page';

afterEach(() => vi.unstubAllEnvs());

// NFR-03
it('is a 404 in production', () => {
  vi.stubEnv('VERCEL_ENV', 'production');
  expect(() => render(<DesignKit />)).toThrow('NEXT_NOT_FOUND');
  expect(notFound).toHaveBeenCalled();
});

// NFR-06
it('shows every control in five states outside production', () => {
  vi.stubEnv('VERCEL_ENV', 'preview');
  render(<DesignKit />);

  const matrix = screen.getByRole('figure', { name: 'State matrix' });

  expect(within(matrix).getAllByText('Sign in')).toHaveLength(5);
  expect(
    matrix.querySelectorAll('.kitCell:not([inert]) .btnPrimary')
  ).toHaveLength(2);
  expect(matrix.querySelectorAll('.kitRow:not(.kitColumns)')).toHaveLength(9);
});

it('keeps the pointer-state cells out of the tab order and the accessibility tree', () => {
  vi.stubEnv('VERCEL_ENV', 'development');
  render(<DesignKit />);

  const inert = document.querySelectorAll('.kitCell[inert]');

  // Hover, Focus and Pressed in each of the nine rows.
  expect(inert).toHaveLength(9 * 3);
  expect(
    [...inert].every(
      cell =>
        cell.querySelector('[data-state]') !== null ||
        cell.children.length === 0
    )
  ).toBe(true);
});

it('leaves the Text field row empty until DM.5', () => {
  vi.stubEnv('VERCEL_ENV', 'development');
  render(<DesignKit />);

  const row = screen.getByText('Text field').closest('.kitRow')!;

  expect(row.querySelectorAll('input, button')).toHaveLength(0);
});
