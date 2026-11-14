'use client';

import type { ReactNode } from 'react';

import { useRouter } from 'next/navigation';
import { startTransition } from 'react';

import type { MenuEntry } from '@ks/app/components/overlays/types';

import { Menu } from '@ks/app/components/overlays/Menu';
import { SearchBar } from '@ks/features/map/components/SearchBar';

const groups = (phone?: boolean): MenuEntry[][] => [
  [
    {
      detail: phone ? 'Look up the people in your Tree' : 'Add and edit people',
      icon: 'people',
      id: 'people',
      label: 'People',
    },
  ],
  [{ icon: 'document', id: 'sources', label: 'Sources and attributions' }],
  [{ icon: 'signOut', id: 'sign-out', label: 'Sign out' }],
];

/** The `Stage` slot for the account menu: `search` on a phone, `account` on desktop. */
export const accountSlots = (phone: boolean, menu: ReactNode) =>
  phone ? { search: menu } : { account: menu };

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
  const router = useRouter();
  const menu = (
    <Menu
      email={email}
      form={phone ? 'phone' : undefined}
      groups={groups(phone)}
      initial={initial}
      onSelect={id => {
        if (id === 'people') {
          router.push('/people');
        } else if (id === 'sources') {
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
