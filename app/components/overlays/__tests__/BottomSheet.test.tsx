import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

import { BottomSheet } from '@ks/app/components/overlays/BottomSheet';

// NFR-05
it('expands the sheet from the grabber, and is not a dialog', () => {
  const onExpandedChange = vi.fn();

  render(
    <BottomSheet expanded={false} onExpandedChange={onExpandedChange}>
      <p>Inside</p>
    </BottomSheet>
  );

  const region = screen.getByRole('region', { name: 'Map date' });
  const grabber = screen.getByRole('button', { name: 'Expand the sheet' });

  expect(screen.queryByRole('dialog')).toBeNull();
  expect(region.getAttribute('aria-modal')).toBeNull();
  expect(region.hasAttribute('inert')).toBe(false);
  expect(grabber.getAttribute('aria-expanded')).toBe('false');
  expect(region.hasAttribute('data-expanded')).toBe(false);
  fireEvent.click(grabber);
  expect(onExpandedChange).toHaveBeenCalledWith(true);
});

it('collapses an expanded sheet', () => {
  const onExpandedChange = vi.fn();

  render(
    <BottomSheet expanded onExpandedChange={onExpandedChange}>
      <p>Inside</p>
    </BottomSheet>
  );
  expect(screen.getByRole('region').hasAttribute('data-expanded')).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'Expand the sheet' }));
  expect(onExpandedChange).toHaveBeenCalledWith(false);
});
