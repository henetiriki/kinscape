'use client';

import type { ComponentProps } from 'react';

import type { PinState } from '@ks/app/screens/map-pin-popup/types';

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
import { asDay } from '@ks/lib/domain/boundaries/model.mts';

/** The Map date of the boards, 14 June 1901, and the last day of the slider. */
const DAY = asDay(91109);
const LAST_DAY = asDay(136894);
const EPOCHS: { label?: string; year: number }[] = [
  ...[1652, 1806, 1854, 1880, 1902, 1910, 1976, 1994].map(year => ({ year })),
  { label: 'Today', year: 2026 },
];
/** Example Farm, in the pixels of the desktop boards. */
const FARM = { x: 940, y: 400 };

const noop = () => {};
const rows = (
  items: [string, string, string, boolean][],
  size?: 'm'
): ComponentProps<typeof LayerGroup>['rows'] =>
  items.map(([id, label, description, checked]) => ({
    checked,
    description,
    id,
    label,
    onChange: noop,
    size,
  }));

/** What the Pin of the map and the details give the popup. Synthetic. */
const popupProps = (state: PinState) => ({
  address: state === 'loaded' ? 'Farm Example, district Example' : undefined,
  event: 'residence' as const,
  name: state === 'loaded' ? 'Example Person' : undefined,
  onClose: noop,
  onRetry: noop,
  reading: 'From 1890 to 1905',
  recorded: 'FROM 1890 TO 1905',
  state,
});

/**
 * The map screen's frame with the Pin popup open at Example Farm, and no map: the boards
 * `map-pin-popup`, `map-pin-popup-loading`, `map-pin-popup-failed` and `map-pin-popup-phone`.
 * Synthetic data throughout.
 */
export const MapPinPopupScreen = ({ state }: { state: PinState }) => {
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
      contestedCount={phone ? undefined : 2}
      contestedYears={phone ? undefined : [{ from: 1900, to: 1901 }]}
      day={DAY}
      details={
        phone ? <PinPopup {...popupProps(state)} form='inline' /> : undefined
      }
      epochs={phone ? undefined : EPOCHS}
      lastDay={LAST_DAY}
      onChange={noop}
      onPlay={noop}
      sheet={phone ? { expanded: false, onExpandedChange: noop } : undefined}
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
          tabs={[
            { controls: 'map-panel-body', label: 'Layers', value: 'layers' },
            {
              controls: 'map-panel-body',
              count: 1,
              label: 'Filters',
              value: 'filters',
            },
          ]}>
          <LayerGroup
            heading='Boundaries'
            rows={rows([
              [
                'polities',
                'Polities',
                'Colonies, republics, provinces, homelands',
                true,
              ],
              [
                'districts',
                'Districts',
                'Drostdy and magisterial districts',
                false,
              ],
            ])}
          />
          <LayerGroup
            heading='Basemap'
            rows={rows(
              [
                ['names', 'Place names', 'As they were on the map date', true],
                ['rivers', 'Rivers', 'Many early borders follow them', true],
                ['terrain', 'Terrain', 'Hillshade, no modern borders', true],
              ],
              'm'
            )}
          />
          <LayerGroup
            heading='Pins'
            rows={rows(
              [
                ['pins', 'Pins', '8 of 214 true on this date', true],
                [
                  'halos',
                  'Uncertainty halos',
                  'Grow with the date range',
                  true,
                ],
              ],
              'm'
            )}
          />
        </Panel>
      }
      search={<SearchBar form='bar' />}
      zoom={<ZoomControls />}>
      <PlacedPinPopup {...popupProps(state)} {...FARM} />
    </MapLayout>
  );
};
