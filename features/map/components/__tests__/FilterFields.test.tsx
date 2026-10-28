import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

import {
  ClearFilters,
  FilterFields,
} from '@ks/features/map/components/FilterFields';

const CHOICES = [
  { label: 'Anyone', value: '' },
  { label: 'J. Rossouw', value: 'p1' },
];

const handlers = () => ({
  onBranchChange: vi.fn(),
  onEventToggle: vi.fn(),
  onPersonChange: vi.fn(),
  onSurnamesChange: vi.fn(),
});

const show = (props = {}) => {
  const on = handlers();

  render(
    <FilterFields
      branch=''
      branches={CHOICES}
      events={[]}
      eventTypes={[{ glyph: 'birth', label: 'Birth', value: 'birth' }]}
      people={CHOICES}
      person=''
      surnames={['Rossouw']}
      {...on}
      {...props}
    />
  );

  return on;
};

// EXP-03
it('draws Person, Surname, Event type and Branch in that order', () => {
  show();

  expect(
    [...document.querySelectorAll('label, legend')].map(
      node => node.textContent
    )
  ).toEqual(['Person', 'Surname', 'Event type', 'Branch']);
});

it('reports each change and shows only the values it is given', () => {
  const on = show({ person: 'p1' });

  expect((screen.getByLabelText('Person') as HTMLSelectElement).value).toBe(
    'p1'
  );
  fireEvent.change(screen.getByLabelText('Person'), { target: { value: '' } });
  fireEvent.change(screen.getByLabelText('Branch'), {
    target: { value: 'p1' },
  });
  fireEvent.click(screen.getByRole('button', { name: /Birth/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Remove Rossouw' }));

  expect(on.onPersonChange).toHaveBeenCalledWith('');
  expect(on.onBranchChange).toHaveBeenCalledWith('p1');
  expect(on.onEventToggle).toHaveBeenCalledWith('birth');
  expect(on.onSurnamesChange).toHaveBeenCalledWith([]);
  // Controlled: the chip stays until the caller changes `surnames`.
  expect(screen.getByRole('button', { name: 'Remove Rossouw' })).toBeTruthy();
});

it('has a Clear filters button', () => {
  const onClear = vi.fn();

  render(<ClearFilters onClear={onClear} />);
  fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
  expect(onClear).toHaveBeenCalledOnce();
});
