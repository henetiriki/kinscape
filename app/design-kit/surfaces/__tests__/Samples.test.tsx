import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';

import {
  AccountMenu,
  CopyChainPopup,
} from '@ks/app/design-kit/surfaces/Samples';

afterEach(() => {
  vi.unstubAllGlobals();
});

const pick = (name: string) => {
  fireEvent.click(screen.getByRole('button', { name: 'Account menu' }));
  fireEvent.click(screen.getByRole('menuitem', { name }));
};

// NFR-05, NFR-06
it('opens the Sources dialog from "Sources and attributions" and closes it again', () => {
  render(<AccountMenu sources={[]} />);
  expect(
    screen.getByRole('dialog', { hidden: true }).hasAttribute('open')
  ).toBe(false);

  pick('Sources and attributions');
  expect(
    screen.getByRole('dialog', { name: 'Sources and attributions' })
  ).toBeTruthy();

  fireEvent.click(screen.getByRole('button', { name: 'Close' }));
  expect(
    screen.getByRole('dialog', { hidden: true }).hasAttribute('open')
  ).toBe(false);
});

it('only closes for the other items', () => {
  render(<AccountMenu sources={[]} />);
  pick('Sign out');
  expect(screen.queryByRole('menu')).toBeNull();
  expect(
    screen.getByRole('dialog', { hidden: true }).hasAttribute('open')
  ).toBe(false);
});

it('shows the success Toast after Copy chain, and Esc removes it', async () => {
  vi.stubGlobal('navigator', {
    clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
  });
  render(<CopyChainPopup />);
  fireEvent.click(screen.getByRole('button', { name: 'Copy chain' }));

  expect((await screen.findByRole('status')).textContent).toBe(
    'Jurisdiction chain copied.'
  );

  fireEvent.keyDown(screen.getByRole('status'), { key: 'Escape' });
  expect(screen.queryByRole('status')).toBeNull();
});

it('shows the error Toast when copying fails, and Try again copies', async () => {
  const writeText = vi
    .fn()
    .mockRejectedValueOnce(new Error('no'))
    .mockRejectedValueOnce(new Error('no'))
    .mockResolvedValueOnce(undefined);

  vi.stubGlobal('navigator', { clipboard: { writeText } });
  render(<CopyChainPopup />);
  fireEvent.click(screen.getByRole('button', { name: 'Copy chain' }));

  expect((await screen.findByRole('alert')).textContent).toContain(
    'Couldn’t copy the chain.'
  );

  // Try again fails once more, so the error stays.
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  await waitFor(() => expect(writeText).toHaveBeenCalledTimes(2));
  expect(screen.getByRole('alert')).toBeTruthy();

  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  expect((await screen.findByRole('status')).textContent).toBe(
    'Jurisdiction chain copied.'
  );
  expect(screen.queryByRole('alert')).toBeNull();
});
