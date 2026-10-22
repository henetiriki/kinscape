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

it('labels every cell with its state for a phone', () => {
  render(<StatesKit />);

  const rows = document.querySelectorAll('.kitRow:not(.kitColumns)');

  expect(rows).toHaveLength(9);

  for (const row of rows) {
    expect(
      [...row.querySelectorAll('.kitStateLabel')].map(
        label => label.textContent
      )
    ).toEqual(['Default', 'Hover', 'Focus (keyboard)', 'Pressed', 'Disabled']);
  }
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

it('shows the Text field with a placeholder at rest, text when typed and filled, and disabled', () => {
  render(<StatesKit />);

  const row = screen.getByText('Text field').closest('.kitRow')!;
  const values = [...row.querySelectorAll('input')].map(
    input => (input as HTMLInputElement).value
  );

  expect(values).toEqual(['', '', 'Kimberl', 'Kimberley', '']);
  expect(
    row.querySelectorAll('.kitCell:not([inert]) input:not(:disabled)')
  ).toHaveLength(1);
  expect(row.querySelectorAll('input:disabled')).toHaveLength(1);
});
