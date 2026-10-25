import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

import { Chip } from '@/app/components/actions/Chip';
import { Segmented } from '@/app/components/actions/Segmented';
import { Tabs } from '@/app/components/actions/Tabs';

// NFR-06
it('reports a chip through aria-pressed', () => {
  render(
    <>
      <Chip on={false}>Birth</Chip>
      <Chip on>Marriage</Chip>
    </>
  );
  expect(
    screen.getByRole('button', { name: 'Birth' }).getAttribute('aria-pressed')
  ).toBe('false');
  expect(
    screen
      .getByRole('button', { name: 'Marriage' })
      .getAttribute('aria-pressed')
  ).toBe('true');
});

const options = [
  { label: 'Year', value: 'year' },
  { label: 'Month', state: 'focus' as const, value: 'month' },
];

it('checks the chosen segment and reports a change', () => {
  const onChange = vi.fn();

  render(
    <Segmented
      label='Precision'
      name='p'
      onChange={onChange}
      options={options}
      value='year'
    />
  );
  expect(
    (screen.getByRole('radio', { name: 'Year' }) as HTMLInputElement).checked
  ).toBe(true);
  fireEvent.click(screen.getByRole('radio', { name: 'Month' }));
  expect(onChange).toHaveBeenCalledWith('month');
});

it('shows a segment state and works without a change handler', () => {
  render(
    <Segmented
      disabled
      label='Precision'
      name='q'
      options={options}
      value='year'
    />
  );
  expect(screen.getByRole('radiogroup', { name: 'Precision' })).toBeTruthy();
  expect(screen.getByText('Month').dataset.state).toBe('focus');
  expect(
    (screen.getByRole('radio', { name: 'Month' }) as HTMLInputElement).disabled
  ).toBe(true);
});

it('marks the selected tab and reports a selection', () => {
  const onSelect = vi.fn();

  render(
    <Tabs
      label='Panels'
      onSelect={onSelect}
      selected='layers'
      tabs={[
        { label: 'Layers', value: 'layers' },
        { label: 'Filters', state: 'hover', value: 'filters' },
      ]}
    />
  );
  expect(
    screen.getByRole('tab', { name: 'Layers' }).getAttribute('aria-selected')
  ).toBe('true');

  const filters = screen.getByRole('tab', { name: 'Filters' });

  expect(filters.getAttribute('aria-selected')).toBe('false');
  expect(filters.dataset.state).toBe('hover');
  fireEvent.click(filters);
  expect(onSelect).toHaveBeenCalledWith('filters');
});

it('lets a tab be disabled and clicked without a handler', () => {
  render(
    <Tabs
      disabled
      label='Panels'
      selected='a'
      tabs={[{ label: 'A', value: 'a' }]}
    />
  );
  expect(
    (screen.getByRole('tab', { name: 'A' }) as HTMLButtonElement).disabled
  ).toBe(true);
});
