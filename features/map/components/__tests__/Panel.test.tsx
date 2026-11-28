import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

import { Panel } from '@ks/features/map/components/Panel';

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

it('is an aside with a tablist and a scrolling tabpanel body', () => {
  const { rerender } = show();

  screen.getByRole('complementary', { name: 'Map panel' });
  screen.getByRole('tablist', { name: 'Map panel sections' });

  const body = screen.getByRole('tabpanel');

  expect(body.id).toBe('body');
  expect(body.textContent).toBe('Rows');
  expect(body.dataset.gap).toBe('l');

  rerender(
    <Panel gap='m' label='Map panel' selected='layers' tabs={TABS}>
      Rows
    </Panel>
  );
  expect(screen.getByRole('tabpanel').dataset.gap).toBe('m');
});

it('puts the end node inside the tabpanel, after the children', () => {
  show({ end: <p>Legend</p> });

  const body = screen.getByRole('tabpanel');
  const end = screen.getByText('Legend');

  expect(body.textContent).toBe('RowsLegend');
  // eslint-disable-next-line testing-library/no-node-access -- the test checks that the end node is the last block in the tabpanel
  expect(body.lastElementChild!.contains(end)).toBe(true);
  // eslint-disable-next-line testing-library/no-node-access -- the test checks that the tabpanel is the last child of the aside
  expect(screen.getByRole('complementary').lastElementChild).toBe(body);
});

it('puts a Clear filters button inside the tabpanel, after the fields', () => {
  render(
    <Panel
      bodyId='body'
      end={<button type='button'>Clear filters</button>}
      label='Map panel'
      selected='filters'
      tabs={TABS}>
      <input aria-label='Field' />
    </Panel>
  );

  const body = screen.getByRole('tabpanel');
  const clear = screen.getByRole('button', { name: 'Clear filters' });

  expect(body.contains(clear)).toBe(true);
  expect(screen.getByLabelText('Field').compareDocumentPosition(clear)).toBe(
    Node.DOCUMENT_POSITION_FOLLOWING
  );
});

it('has no end block without an end node', () => {
  show();
  // eslint-disable-next-line testing-library/no-node-access -- the test checks that the tabpanel has no end block, which has no role
  expect(screen.getByRole('tabpanel').children).toHaveLength(0);
});
