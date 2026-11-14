'use client';

import { startTransition } from 'react';

import { Menu } from '@ks/app/components/overlays/Menu';

const MENU = [
  [{ icon: 'signOut', id: 'sign-out', label: 'Sign out' }],
] as const;

/** The Avatar of a People page and its menu, with Sign out. `onSignOut` is a server action. */
export const AccountMenu = ({
  email,
  initial,
  onSignOut,
}: {
  email: string;
  initial: string;
  onSignOut: () => Promise<unknown>;
}) => (
  <Menu
    email={email}
    groups={MENU.map(group => [...group])}
    initial={initial}
    onSelect={() => {
      startTransition(async () => {
        await onSignOut();
      });
    }}
  />
);
