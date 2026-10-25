import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

import { LayerGroup } from '../LayerGroup';

// MAP-05
it('is a group named by its heading, with a described checkbox per row', () => {
  const onChange = vi.fn();

  render(
    <LayerGroup
      heading='Boundaries'
      rows={[
        {
          checked: true,
          description: 'Fills and borders.',
          id: 'polities',
          label: 'Polity borders',
          onChange,
        },
        {
          checked: false,
          id: 'districts',
          label: 'Districts',
          onChange,
          size: 'm',
        },
      ]}
    />
  );

  const group = screen.getByRole('group', { name: 'Boundaries' });
  const [polities, districts] = screen.getAllByRole(
    'checkbox'
  ) as HTMLInputElement[];

  expect(group.contains(polities)).toBe(true);
  expect(polities.checked).toBe(true);
  expect(polities.getAttribute('aria-describedby')).toBe(
    screen.getByText('Fills and borders.').id
  );
  expect(screen.getByRole('checkbox', { name: 'Districts' })).toBe(districts);
  expect(districts.parentElement!.dataset.size).toBe('m');
});

it('reports a toggle with the new value', () => {
  const onChange = vi.fn();

  render(
    <LayerGroup
      heading='Pins'
      rows={[{ checked: false, id: 'a', label: 'Residence', onChange }]}
    />
  );
  fireEvent.click(screen.getByRole('checkbox', { name: 'Residence' }));
  expect(onChange).toHaveBeenCalledWith(true);
});
