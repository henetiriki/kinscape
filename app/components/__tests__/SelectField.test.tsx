import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

import { SelectField } from '../SelectField';

// EXP-03
it('is a native select named by its label, with a state', () => {
  const onChange = vi.fn();

  render(
    <SelectField
      label='Person'
      onChange={onChange}
      options={[
        { label: 'Anyone', value: 'any' },
        { label: 'Maria', value: 'maria' },
      ]}
      state='hover'
    />
  );

  const select = screen.getByRole('combobox', { name: 'Person' });

  expect(screen.getAllByRole('option').map(o => o.textContent)).toEqual([
    'Anyone',
    'Maria',
  ]);
  expect(select.parentElement!.dataset.state).toBe('hover');
  fireEvent.change(select, { target: { value: 'maria' } });
  expect(onChange).toHaveBeenCalledOnce();
});

it('names a select whose label is hidden', () => {
  render(
    <SelectField
      hideLabel
      label='Person, hover'
      options={[{ label: 'Anyone', value: 'any' }]}
    />
  );

  expect(screen.getByRole('combobox', { name: 'Person, hover' })).toBeTruthy();
  expect(screen.queryByText('Person, hover')).toBeNull();
});
