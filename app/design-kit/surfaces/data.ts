import type { MenuEntry } from '@/app/components/Menu';
import type { ChainLevel, PopupPin } from '@/app/components/Popup';

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

// Synthetic: the Popup samples on board 07 are drawn with these.
export const CHAIN: ChainLevel[] = [
  { level: 'District', name: 'Kimberley' },
  {
    detail: 'Was Griqualand West until 1880',
    level: 'Colony',
    name: 'Cape Colony',
  },
];

export const PINS: PopupPin[] = [
  {
    date: '1901-03-14',
    event: 'marriage',
    id: 'marriage',
    people: 'J. Rossouw & M. du Toit',
    title: 'Marriage',
  },
];
