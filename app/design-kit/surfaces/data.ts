import type {
  ChainLevel,
  MenuEntry,
  PopupPin,
} from '@ks/app/components/overlays/types';

import {
  CHAIN as SAMPLE_CHAIN,
  PINS as SAMPLE_PINS,
} from '@ks/lib/design/samples.mts';

export const MENU_GROUPS: MenuEntry[][] = [
  [
    {
      detail: 'JSON and GeoJSON',
      icon: 'export',
      id: 'export',
      label: 'Export all data',
    },
    { icon: 'document', id: 'sources', label: 'Sources and attributions' },
  ],
  [{ icon: 'signOut', id: 'sign-out', label: 'Sign out' }],
];

export const MENU_WORDS = {
  email: 'researcher@example.com',
  footer: 'Last backup: today, 02:00',
  initial: 'L',
};

export const CHAIN: ChainLevel[] = SAMPLE_CHAIN;

export const PINS: PopupPin[] = SAMPLE_PINS;
