import { render, screen, within } from '@testing-library/react';
import { expect, it } from 'vitest';

import StatesKit from '../page';

// NFR-06
it('shows every control in five states', () => {
  render(<StatesKit />);

  const matrix = screen.getByRole('figure', { name: 'State matrix' });

  expect(within(matrix).getAllByText('Sign in')).toHaveLength(5);
  expect(
    matrix.querySelectorAll('.kitCell:not([inert]) .btnPrimary')
  ).toHaveLength(2);
  expect(matrix.querySelectorAll('.kitRow:not(.kitColumns)')).toHaveLength(9);
});

it('keeps the pointer-state cells out of the tab order and the accessibility tree', () => {
  render(<StatesKit />);

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
  render(<StatesKit />);

  const row = screen.getByText('Text field').closest('.kitRow')!;

  expect(row.querySelectorAll('input, button')).toHaveLength(0);
});
