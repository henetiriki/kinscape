import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { Toast } from '@/app/components/feedback/Toast';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

// NFR-06
it('asks to remove a success toast at 4000ms, not before', () => {
  const onDismiss = vi.fn();

  render(
    <Toast onDismiss={onDismiss} tone='success'>
      Jurisdiction chain copied.
    </Toast>
  );

  expect(screen.getByRole('status').textContent).toBe(
    'Jurisdiction chain copied.'
  );
  act(() => {
    vi.advanceTimersByTime(3999);
  });
  expect(onDismiss).not.toHaveBeenCalled();
  act(() => {
    vi.advanceTimersByTime(1);
  });
  expect(onDismiss).toHaveBeenCalledTimes(1);
});

it('stays when nobody is told to remove it', () => {
  render(<Toast tone='success'>Copied.</Toast>);

  act(() => {
    vi.advanceTimersByTime(60_000);
  });
  expect(screen.getByRole('status')).toBeTruthy();
});

it('keeps an error toast, announced at once, until Esc or its action', () => {
  const onAction = vi.fn();
  const onDismiss = vi.fn();

  render(
    <Toast
      action='Try again'
      onAction={onAction}
      onDismiss={onDismiss}
      tone='error'>
      The export didn&apos;t finish.
    </Toast>
  );

  act(() => {
    vi.advanceTimersByTime(60_000);
  });
  expect(onDismiss).not.toHaveBeenCalled();

  const toast = screen.getByRole('alert');

  fireEvent.keyDown(toast, { key: 'Enter' });
  expect(onDismiss).not.toHaveBeenCalled();
  fireEvent.keyDown(toast, { key: 'Escape' });
  expect(onDismiss).toHaveBeenCalledTimes(1);

  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  expect(onAction).toHaveBeenCalledTimes(1);
  expect(onDismiss).toHaveBeenCalledTimes(2);
});

it('has no button without an action, and tolerates having no owner', () => {
  render(<Toast tone='error'>Failed.</Toast>);

  const toast = screen.getByRole('alert');

  expect(screen.queryByRole('button')).toBeNull();
  fireEvent.keyDown(toast, { key: 'Escape' });
});

// NFR-05
it('marks a placed toast for its phone position', () => {
  render(
    <Toast placed tone='success'>
      Copied.
    </Toast>
  );

  expect(screen.getByRole('status').hasAttribute('data-placed')).toBe(true);
});

it('presses an action that has no handlers', () => {
  render(
    <Toast action='Retry' tone='error'>
      Failed.
    </Toast>
  );

  fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
  expect(screen.getByRole('alert')).toBeTruthy();
});
