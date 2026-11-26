import { fireEvent, render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it, vi } from 'vitest';

import { BottomSheet } from '@ks/app/components/overlays/BottomSheet';

const css = readFileSync(
  join(process.cwd(), 'app/components/overlays/BottomSheet.module.css'),
  'utf8'
);

// NFR-05, NFR-06
it('gives the grabber a centred touch-size hit area and keeps its 64 × 20px box', () => {
  const grabber = /\.grabber \{[^}]*\}/.exec(css)![0];
  const before = /\.grabber::before \{[^}]*\}/.exec(css)?.[0] ?? '';

  expect(grabber).toContain('position: relative');
  expect(grabber).toContain('height: 20px');
  expect(grabber).toContain('width: 64px');
  expect(grabber).toContain('margin-bottom: calc(-1 * var(--space-inset-2xs))');
  expect(before).toContain('height: var(--size-touch)');
  expect(before).toContain('width: max(100%, var(--size-touch))');
  expect(before).toContain('translate: -50% -50%');
});

// NFR-06 (#988): the date row starts inside the hit area and is positioned, so it takes the tap unless the grabber stacks above it.
it('stacks the grabber above the content, inside the sheet only', () => {
  expect(/\.grabber \{[^}]*\}/.exec(css)![0]).toContain(
    'z-index: var(--z-furniture)'
  );
  expect(/\.sheet \{[^}]*\}/.exec(css)![0]).toContain('isolation: isolate');
});

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
