import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';

import {
  SavedToast,
  useSavedToast,
} from '@ks/features/people/components/SavedToast';

const Saver = () => {
  const show = useSavedToast();

  return (
    <button onClick={() => show('Saved Ana Smit.')} type='button'>
      Save
    </button>
  );
};

afterEach(() => {
  vi.useRealTimers();
});

// PPL-01
it('shows the message a child sets, then removes it after 4 seconds', () => {
  vi.useFakeTimers();
  render(
    <SavedToast>
      <Saver />
    </SavedToast>
  );
  expect(screen.queryByRole('status')).toBeNull();

  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  expect(screen.getByRole('status').textContent).toBe('Saved Ana Smit.');

  act(() => {
    vi.advanceTimersByTime(4000);
  });
  expect(screen.queryByRole('status')).toBeNull();
});

it('does nothing when no provider is above', () => {
  render(<Saver />);
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));

  expect(screen.queryByRole('status')).toBeNull();
});
