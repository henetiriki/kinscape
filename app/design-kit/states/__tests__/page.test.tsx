import { render, screen, within } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

import StatesKit from '@ks/app/design-kit/states/page';

vi.mock('@ks/server/auth/current.mts', () => ({ requireDevPage: vi.fn() }));

// NFR-06
it('shows every control in five states', async () => {
  render(await StatesKit());

  const matrix = screen.getByRole('figure', { name: 'State matrix' });

  expect(within(matrix).getAllByText('Sign in')).toHaveLength(5);
  expect(
    matrix.querySelectorAll('.kitCell:not([inert]) .btnPrimary')
  ).toHaveLength(2);
  expect(matrix.querySelectorAll('.kitRow:not(.kitColumns)')).toHaveLength(11);
});

it('labels every cell with its state for a phone', async () => {
  render(await StatesKit());

  const rows = document.querySelectorAll('.kitRow:not(.kitColumns)');

  expect(rows).toHaveLength(11);

  for (const row of rows) {
    expect(
      [...row.querySelectorAll('.kitStateLabel')].map(
        label => label.textContent
      )
    ).toEqual(['Default', 'Hover', 'Focus', 'Pressed', 'Disabled']);
  }
});

it('keeps the pointer-state cells out of the tab order and the accessibility tree', async () => {
  render(await StatesKit());

  const inert = document.querySelectorAll('.kitCell[inert]');

  // Hover, Focus and Pressed in each of the eleven rows.
  expect(inert).toHaveLength(11 * 3);
  expect(
    [...inert].every(
      cell =>
        cell.querySelector('[data-state]') !== null ||
        cell.children.length === 0
    )
  ).toBe(true);
});

it('shows the Text field with a placeholder at rest, text when typed and filled, and disabled', async () => {
  render(await StatesKit());

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

it('shows the raised icon button in each of the five columns', async () => {
  render(await StatesKit());

  const row = screen.getByText('Raised icon button').closest('.kitRow')!;

  expect(row.querySelectorAll('button[data-variant="raised"]')).toHaveLength(5);
  expect(row.querySelectorAll('button:disabled')).toHaveLength(1);
  // The board's hint and icon, word for word (SG-Controls).
  expect(
    screen.getByText('Over the map: the phone Layers button')
  ).toBeTruthy();
  expect(
    row.querySelectorAll('button[data-variant="raised"] svg[width="24"]')
  ).toHaveLength(5);
});

// PPL-01
it('shows the Arrow link as a link in four columns and as a label in Disabled', async () => {
  render(await StatesKit());

  const row = screen.getByText('Arrow link').closest('.kitRow')!;

  expect(
    [...row.querySelectorAll('.kitCell')].map(
      cell => cell.querySelector('a')?.dataset.state ?? cell.tagName
    )
  ).toEqual(['SPAN', 'hover', 'focus', 'active', 'SPAN']);
  expect(row.querySelectorAll('a')).toHaveLength(4);
  expect(row.querySelectorAll('svg[data-icon="forward"]')).toHaveLength(5);
});
