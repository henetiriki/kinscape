import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AccountMenu } from '@ks/features/map/components/AccountMenu';

const open = () =>
  fireEvent.click(screen.getByRole('button', { name: /account/i }));

const setup = (props: { phone?: boolean } = {}) => {
  const onOpenSources = vi.fn();
  const onSignOut = vi.fn(() => Promise.resolve());

  render(
    <AccountMenu
      email='a@example.test'
      initial='A'
      onOpenSources={onOpenSources}
      onSignOut={onSignOut}
      {...props}
    />
  );

  return { onOpenSources, onSignOut };
};

// NFR-03
describe('AccountMenu on desktop', () => {
  it('shows the email, Sources and attributions, and Sign out, and no Export or backup', () => {
    setup();
    open();

    expect(screen.getByText('a@example.test')).toBeTruthy();
    expect(
      screen
        .getAllByRole('menuitem')
        .map(item => item.textContent)
        .join('|')
    ).toBe('Sources and attributions|Sign out');
    expect(screen.queryByText(/export/i)).toBeNull();
    expect(screen.queryByText(/backup/i)).toBeNull();
    expect(screen.queryByRole('search')).toBeNull();
  });

  it('opens the Sources dialog from Sources and attributions', () => {
    const { onOpenSources, onSignOut } = setup();

    open();
    fireEvent.click(
      screen.getByRole('menuitem', { name: 'Sources and attributions' })
    );
    expect(onOpenSources).toHaveBeenCalledOnce();
    expect(onSignOut).not.toHaveBeenCalled();
  });

  it('signs out from Sign out', () => {
    const { onOpenSources, onSignOut } = setup();

    open();
    fireEvent.click(screen.getByRole('menuitem', { name: 'Sign out' }));
    expect(onSignOut).toHaveBeenCalledOnce();
    expect(onOpenSources).not.toHaveBeenCalled();
  });
});

describe('AccountMenu on a phone', () => {
  it('draws the search pill with the Avatar, which opens the menu', () => {
    setup({ phone: true });

    const pill = screen.getByRole('search');

    expect(screen.queryByRole('menu')).toBeNull();
    open();
    expect(pill.contains(screen.getByRole('menu'))).toBe(true);
    expect(screen.getAllByRole('menuitem')).toHaveLength(2);
  });

  it('routes the items as on desktop', () => {
    const { onOpenSources, onSignOut } = setup({ phone: true });

    open();
    fireEvent.click(screen.getByRole('menuitem', { name: 'Sign out' }));
    expect(onSignOut).toHaveBeenCalledOnce();
    open();
    fireEvent.click(
      screen.getByRole('menuitem', { name: 'Sources and attributions' })
    );
    expect(onOpenSources).toHaveBeenCalledOnce();
  });
});
