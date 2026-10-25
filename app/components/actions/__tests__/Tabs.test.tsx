import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

import { Tabs } from '../Tabs';

const tabs = [
  { controls: 'layers-panel', label: 'Layers', value: 'layers' },
  { controls: 'filters-panel', count: 1, label: 'Filters', value: 'filters' },
  { label: 'More', value: 'more' },
];

// EXP-03
it('names a tab with its count and hides the badge from assistive tech', () => {
  render(<Tabs label='Panels' selected='layers' tabs={tabs} />);

  const filters = screen.getByRole('tab', { name: 'Filters, 1 active' });

  expect(filters.getAttribute('aria-controls')).toBe('filters-panel');
  expect(filters.querySelector('[aria-hidden]')!.textContent).toBe('1');
  expect(screen.getByRole('tab', { name: 'Layers' })).toBeTruthy();
});

it('leaves out the badge when nothing is active', () => {
  render(
    <Tabs
      label='Panels'
      selected='a'
      tabs={[{ count: 0, label: 'A', value: 'a' }]}
    />
  );

  expect(screen.getByRole('tab', { name: 'A' }).textContent).toBe('A');
});

it('shares the row between the tabs with fill', () => {
  const { rerender } = render(
    <Tabs label='Panels' selected='layers' tabs={tabs} />
  );

  expect(screen.getByRole('tablist').className).not.toContain('fill');
  rerender(<Tabs fill label='Panels' selected='layers' tabs={tabs} />);
  expect(screen.getByRole('tablist').className).toContain('fill');
});

it('keeps only the selected tab in the tab order', () => {
  render(<Tabs label='Panels' selected='filters' tabs={tabs} />);

  expect(
    screen.getAllByRole('tab').map(tab => tab.getAttribute('tabindex'))
  ).toEqual(['-1', '0', '-1']);
});

it('selects and focuses the next or previous tab on Left and Right, wrapping at the ends', () => {
  const onSelect = vi.fn();

  render(
    <Tabs label='Panels' onSelect={onSelect} selected='layers' tabs={tabs} />
  );

  const [layers, filters, more] = screen.getAllByRole('tab');

  fireEvent.keyDown(layers, { key: 'ArrowRight' });
  expect(onSelect).toHaveBeenLastCalledWith('filters');
  expect(document.activeElement).toBe(filters);

  fireEvent.keyDown(layers, { key: 'ArrowLeft' });
  expect(onSelect).toHaveBeenLastCalledWith('more');
  expect(document.activeElement).toBe(more);

  fireEvent.keyDown(more, { key: 'ArrowRight' });
  expect(onSelect).toHaveBeenLastCalledWith('layers');
  expect(document.activeElement).toBe(layers);
});

it('ignores other keys, and arrows work without a handler', () => {
  render(<Tabs label='Panels' selected='layers' tabs={tabs} />);

  const [layers, filters] = screen.getAllByRole('tab');

  fireEvent.keyDown(layers, { key: 'a' });
  expect(document.activeElement).not.toBe(filters);
  fireEvent.keyDown(layers, { key: 'ArrowRight' });
  expect(document.activeElement).toBe(filters);
});
