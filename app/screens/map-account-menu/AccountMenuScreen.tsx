'use client';

import { usePhone } from '@ks/app/components/foundation/usePhone';
import { MapLayout } from '@ks/app/components/layout/MapLayout';
import { SAMPLE_ACCOUNT } from '@ks/app/screens/account';
import { AccountMenu, accountSlots, LayersButton } from '@ks/features/map';

/** The map screen's frame with the account menu and, on a phone, the Layers button; no map. Synthetic Account. */
export const AccountMenuScreen = () => {
  const phone = usePhone();
  const menu = (
    <AccountMenu
      {...SAMPLE_ACCOUNT}
      onOpenSources={() => {}}
      onSignOut={() => Promise.resolve()}
      phone={phone}
    />
  );

  return (
    <MapLayout
      {...accountSlots(phone, menu)}
      layers={phone ? <LayersButton /> : undefined}
    />
  );
};
