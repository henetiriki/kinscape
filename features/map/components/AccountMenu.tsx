'use client';

import { startTransition } from 'react';

import type { MenuEntry } from '@ks/app/components/overlays/types';

import { Menu } from '@ks/app/components/overlays/Menu';
import { SearchBar } from '@ks/features/map/components/SearchBar';

const GROUPS: MenuEntry[][] = [
  [{ icon: 'document', id: 'sources', label: 'Sources and attributions' }],
  [{ icon: 'signOut', id: 'sign-out', label: 'Sign out' }],
];

/**
 * The signed-in Account's Menu. On a phone it sits in the search pill, as the board draws it.
 * A failed sign-out reaches the error page, because it throws inside a transition.
 */
export const AccountMenu = ({
  email,
  initial,
  onOpenSources,
  onSignOut,
  phone,
}: {
  email: string;
  initial: string;
  onOpenSources: () => void;
  onSignOut: () => Promise<unknown>;
  phone?: boolean;
}) => {
  const menu = (
    <Menu
      email={email}
      form={phone ? 'phone' : undefined}
      groups={GROUPS}
      initial={initial}
      onSelect={id => {
        if (id === 'sources') {
          onOpenSources();
        } else {
          startTransition(async () => {
            await onSignOut();
          });
        }
      }}
    />
  );

  return phone ? <SearchBar account={menu} form='pill' /> : menu;
};
