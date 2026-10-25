import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

import { ContestedNote } from '@/app/components/map/ContestedNote';
import { DateKeyHints } from '@/app/components/map/DateKeyHints';
import { JumpTo } from '@/app/components/map/JumpTo';
import { PlayButton } from '@/app/components/map/PlayButton';

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
