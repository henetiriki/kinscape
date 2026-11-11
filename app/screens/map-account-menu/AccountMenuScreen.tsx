'use client';

import { usePhone } from '@ks/app/components/foundation/usePhone';
import {
  AccountMenu,
  accountSlots,
  LayersButton,
  Stage,
} from '@ks/features/map';

/** The map screen's frame with the account menu and, on a phone, the Layers button; no map. Synthetic Account. */
export const AccountMenuScreen = () => {
  const phone = usePhone();
  const menu = (
    <AccountMenu
      email='researcher@example.com'
      initial='L'
      onOpenSources={() => {}}
      onSignOut={() => Promise.resolve()}
      phone={phone}
    />
  );

  return (
    <Stage
      {...accountSlots(phone, menu)}
      layers={phone ? <LayersButton /> : undefined}
    />
  );
};
