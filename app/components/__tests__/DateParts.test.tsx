import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

import { BottomSheet } from '../BottomSheet';
import { ContestedNote } from '../ContestedNote';
import { DateKeyHints } from '../DateKeyHints';
import { JumpTo } from '../JumpTo';
import { PlayButton } from '../PlayButton';

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

// NFR-06
it('names the pill and the round Play the same', () => {
  const onClick = vi.fn();
  const { unmount } = render(<PlayButton onClick={onClick} />);

  fireEvent.click(screen.getByRole('button', { name: 'Play through time' }));
  expect(screen.getByText('Play')).toBeTruthy();
  expect(onClick).toHaveBeenCalled();
  unmount();
  render(<PlayButton round />);
  expect(
    screen.getByRole('button', { name: 'Play through time' })
  ).toBeTruthy();
  expect(screen.queryByText('Play')).toBeNull();
});

it('jumps to an epoch and marks the current one', () => {
  const onJump = vi.fn();

  render(
    <JumpTo
      current={1902}
      epochs={[{ year: 1652 }, { year: 1902 }, { label: 'Today', year: 2026 }]}
      onJump={onJump}
    />
  );
  expect(
    screen.getByRole('button', { name: '1902' }).getAttribute('aria-current')
  ).toBe('true');
  expect(
    screen.getByRole('button', { name: '1652' }).getAttribute('aria-current')
  ).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: '1652' }));
  expect(onJump).toHaveBeenCalledWith(1652);
  fireEvent.click(screen.getByRole('button', { name: 'Today' }));
  expect(onJump).toHaveBeenLastCalledWith(2026);
});

// MAP-09
it('counts the contested claims, and shows nothing at none', () => {
  const { container, rerender } = render(<ContestedNote count={2} />);

  expect(screen.getByText('2 contested claims on this date')).toBeTruthy();
  rerender(<ContestedNote count={1} />);
  expect(screen.getByText('1 contested claim on this date')).toBeTruthy();
  rerender(<ContestedNote count={0} />);
  expect(container.textContent).toBe('');
});

it('says what the arrows do at the precision', () => {
  render(<DateKeyHints precision='month' />);
  expect(screen.getByText(/1 month · with/)).toBeTruthy();
  expect(screen.getByText('Shift')).toBeTruthy();
});
