import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

import { LayersPanel } from '../LayersPanel';

it('shows the Polity borders row, checked when the layer is on', () => {
  render(<LayersPanel onShowPolitiesChange={vi.fn()} showPolities />);

  expect(
    (
      screen.getByRole('checkbox', {
        name: /Polity borders/,
      }) as HTMLInputElement
    ).checked
  ).toBe(true);
});

it('reports the new state when the row is clicked', () => {
  const onChange = vi.fn();

  render(<LayersPanel onShowPolitiesChange={onChange} showPolities />);
  fireEvent.click(screen.getByRole('checkbox', { name: /Polity borders/ }));

  expect(onChange).toHaveBeenCalledWith(false);
});
