import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

import { Panel } from '@/app/components/map/Panel';

const TABS = [
  { controls: 'body', label: 'Layers', value: 'layers' },
  { controls: 'body', count: 1, label: 'Filters', value: 'filters' },
];

const show = (props: Partial<Parameters<typeof Panel>[0]> = {}) =>
  render(
    <Panel
      bodyId='body'
      label='Map panel'
      selected='layers'
      tabs={TABS}
      {...props}>
      Rows
    </Panel>
  );

// NFR-05, MAP-07
it('shows a badge on the Filters tab and calls onSelect', () => {
  const onSelect = vi.fn();

  show({ onSelect });

  const filters = screen.getByRole('tab', { name: 'Filters, 1 active' });

  expect(filters.textContent).toBe('Filters1');
  fireEvent.click(filters);
  expect(onSelect).toHaveBeenCalledWith('filters');
});

it('is an aside with a tablist, a scrolling tabpanel body and an optional footer', () => {
  const { rerender } = show({ footer: <button type='button'>Clear</button> });

  expect(screen.getByRole('complementary', { name: 'Map panel' })).toBeTruthy();
  expect(
    screen.getByRole('tablist', { name: 'Map panel sections' })
  ).toBeTruthy();

  const body = screen.getByRole('tabpanel');

  expect(body.id).toBe('body');
  expect(body.textContent).toBe('Rows');
  expect(body.dataset.gap).toBe('14');
  expect(screen.getByRole('button', { name: 'Clear' })).toBeTruthy();

  rerender(
    <Panel gap={20} label='Map panel' selected='layers' tabs={TABS}>
      Rows
    </Panel>
  );
  expect(screen.getByRole('tabpanel').dataset.gap).toBe('20');
  expect(screen.queryByRole('button', { name: 'Clear' })).toBeNull();
});
