import { render, screen, within } from '@testing-library/react';
import { expect, it } from 'vitest';

import TypeKit from '../page';

// NFR-06
it('shows the 14 styles, with natural heading elements', () => {
  render(<TypeKit />);

  const scale = screen.getByRole('table', { name: 'Type scale' });

  // The header row and one row per style.
  expect(within(scale).getAllByRole('row')).toHaveLength(15);
  expect(scale.querySelectorAll('[data-variant]')).toHaveLength(14);
  expect(within(scale).getAllByRole('heading', { level: 1 })).toHaveLength(1);
  expect(within(scale).getAllByRole('heading', { level: 2 })).toHaveLength(1);
  expect(within(scale).getAllByRole('heading', { level: 3 })).toHaveLength(1);
  expect(screen.getByRole('heading', { name: 'Rules' })).toBeTruthy();
});
