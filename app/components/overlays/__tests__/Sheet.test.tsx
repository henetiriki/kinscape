import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

import { Sheet } from '../Sheet';

const sheet = () => screen.getByRole('dialog', { hidden: true });

const close = () => screen.getByRole('button', { hidden: true, name: 'Close' });

// NFR-05
it('has a title head: named by its title, with the children and a Close', () => {
  const onClose = vi.fn();

  render(
    <Sheet onClose={onClose} open title='Menu'>
      <p>Content</p>
    </Sheet>
  );

  expect(sheet().getAttribute('aria-labelledby')).toBe(
    screen.getByRole('heading', { hidden: true, name: 'Menu' }).id
  );
  expect(sheet().hasAttribute('open')).toBe(true);
  expect(screen.getByText('Content')).toBeTruthy();
  fireEvent.click(close());
  expect(onClose).toHaveBeenCalledTimes(1);
});

it('has a title and subtitle head', () => {
  const onClose = vi.fn();

  render(
    <Sheet onClose={onClose} open subtitle='Under it' title='Menu'>
      <p>Content</p>
    </Sheet>
  );

  expect(screen.getByText('Under it')).toBeTruthy();
  fireEvent.click(close());
  expect(onClose).toHaveBeenCalledTimes(1);
});

it('has a tabs head named by the tabs, which switch by click and arrow key', () => {
  const onSelect = vi.fn();
  const onClose = vi.fn();

  render(
    <Sheet
      onClose={onClose}
      open
      tabs={{
        label: 'Layers and filters',
        onSelect,
        selected: 'layers',
        tabs: [
          { label: 'Layers', value: 'layers' },
          { label: 'Filters', value: 'filters' },
        ],
      }}>
      <p>Content</p>
    </Sheet>
  );

  expect(sheet().getAttribute('aria-label')).toBe('Layers and filters');
  expect(sheet().hasAttribute('aria-labelledby')).toBe(false);
  expect(screen.queryByRole('heading', { hidden: true })).toBeNull();
  fireEvent.click(screen.getByRole('tab', { hidden: true, name: 'Filters' }));
  expect(onSelect).toHaveBeenLastCalledWith('filters');
  fireEvent.keyDown(screen.getByRole('tab', { hidden: true, name: 'Layers' }), {
    key: 'ArrowRight',
  });
  expect(onSelect).toHaveBeenCalledTimes(2);
  fireEvent.click(close());
  expect(onClose).toHaveBeenCalledTimes(1);
});
