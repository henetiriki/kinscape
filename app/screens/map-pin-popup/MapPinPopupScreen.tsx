'use client';

import type { PinPopupState } from '@ks/app/components/overlays/types';

import { usePhone } from '@ks/app/components/foundation/usePhone';
import { MapLayout } from '@ks/app/components/layout/MapLayout';
import { PinPopup, PlacedPinPopup } from '@ks/app/components/overlays/PinPopup';
import { SAMPLE_ACCOUNT } from '@ks/app/screens/account';
import { AccountMenu, accountSlots, LayersButton } from '@ks/features/map';
import { DateDock } from '@ks/features/map/components/DateDock';
import { LayerGroup } from '@ks/features/map/components/LayerGroup';
import { Legend } from '@ks/features/map/components/Legend';
import { Panel } from '@ks/features/map/components/Panel';
import { SearchBar } from '@ks/features/map/components/SearchBar';
import { ZoomControls } from '@ks/features/map/components/ZoomControls';
import {
  CONTESTED_COUNT,
  CONTESTED_YEARS,
  EPOCHS,
  LAYER_GROUPS,
  MAP_DATE,
  panelTabs,
  PIN_DETAILS,
  PIN_POPUP,
  TODAY,
} from '@ks/lib/design/samples.mts';

/** Example Farm, in the pixels of the desktop boards. */
const FARM = { x: 940, y: 400 };

const noop = () => {};

/** What the Pin of the map and the details give the popup. Synthetic. */
const popupProps = (state: PinPopupState) => ({
  ...PIN_POPUP,
  ...(state === 'loaded' ? PIN_DETAILS : {}),
  onClose: noop,
  onRetry: noop,
  state,
});

/**
 * The map screen's frame with the Pin popup open at Example Farm, and no map: the boards
 * `map-pin-popup`, `map-pin-popup-loading`, `map-pin-popup-failed` and `map-pin-popup-phone`.
 * Synthetic data throughout.
 */
export const MapPinPopupScreen = ({ state }: { state: PinPopupState }) => {
  const phone = usePhone();
  const menu = (
    <AccountMenu
      {...SAMPLE_ACCOUNT}
      onOpenSources={noop}
      onSignOut={() => Promise.resolve()}
      phone={phone}
    />
  );
  const dock = (
    <DateDock
      contestedCount={phone ? undefined : CONTESTED_COUNT}
      contestedYears={phone ? undefined : CONTESTED_YEARS}
      day={MAP_DATE}
      details={
        phone ? <PinPopup {...popupProps(state)} form='inline' /> : undefined
      }
      epochs={phone ? undefined : EPOCHS}
      lastDay={TODAY}
      onChange={noop}
      onPlay={noop}
      sheet={phone ? { expanded: true, onExpandedChange: noop } : undefined}
    />
  );

  if (phone) {
    return (
      <MapLayout
        {...accountSlots(phone, menu)}
        dock={dock}
        layers={<LayersButton />}
      />
    );
  }

  return (
    <MapLayout
      {...accountSlots(phone, menu)}
      dock={dock}
      panel={
        <Panel
          bodyId='map-panel-body'
          end={<Legend />}
          gap={14}
          label='Layers and filters'
          onSelect={noop}
          selected='layers'
          tabs={panelTabs('map-panel-body')}>
          {LAYER_GROUPS.map(({ heading, rows }) => (
            <LayerGroup
              heading={heading}
              key={heading}
              rows={rows.map(row => ({ ...row, onChange: noop }))}
            />
          ))}
        </Panel>
      }
      search={<SearchBar form='bar' />}
      zoom={<ZoomControls />}>
      <PlacedPinPopup {...popupProps(state)} {...FARM} />
    </MapLayout>
  );
};
