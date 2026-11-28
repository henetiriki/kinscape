'use client';

import type { ReactNode } from 'react';

import { usePhone } from '@ks/app/components/foundation/usePhone';
import { MapLayout } from '@ks/app/components/layout/MapLayout';
import { SAMPLE_ACCOUNT } from '@ks/app/screens/account';
import { map } from '@ks/design/tokens.generated.ts';
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
  TODAY,
} from '@ks/lib/design/samples.mts';

const noop = () => {};

/** Example Farm, in the pixels of the boards of each form. */
export const FARM = { desktop: { x: 940, y: 400 }, phone: { x: 264, y: 310 } };

/** A part of the map drawn with its centre at a point of the board, such as a marker at Example Farm. */
export const AtPoint = ({
  children,
  x,
  y,
}: {
  children: ReactNode;
  x: number;
  y: number;
}) => (
  <div
    data-testid='placed-at'
    style={{
      left: x,
      position: 'absolute',
      top: y,
      transform: 'translate(-50%, -50%)',
    }}>
    {children}
  </div>
);

const Dock = ({ details, phone }: { details?: ReactNode; phone: boolean }) => (
  <DateDock
    contestedCount={phone ? undefined : CONTESTED_COUNT}
    contestedYears={phone ? undefined : CONTESTED_YEARS}
    day={MAP_DATE}
    details={phone ? details : undefined}
    epochs={phone ? undefined : EPOCHS}
    lastDay={TODAY}
    onChange={noop}
    onPlay={noop}
    sheet={
      phone
        ? { expanded: details !== undefined, onExpandedChange: noop }
        : undefined
    }
  />
);

const BoardPanel = () => (
  <Panel
    bodyId='map-panel-body'
    end={<Legend />}
    gap='m'
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
);

/**
 * The map screen's frame over the sea colour that stands in for the map, as the Pin boards draw it.
 * `children` sits on the map; on a phone, `details` fills the expanded Map date sheet. On a desktop,
 * `action` fills the action slot and `panel` takes the place of the tabbed panel. Synthetic data
 * throughout.
 */
export const MapFrame = ({
  action,
  children,
  details,
  panel,
}: {
  action?: ReactNode;
  children?: (phone: boolean) => ReactNode;
  details?: ReactNode;
  panel?: ReactNode;
}) => {
  const phone = usePhone();
  const menu = (
    <AccountMenu
      {...SAMPLE_ACCOUNT}
      onOpenSources={noop}
      onSignOut={() => Promise.resolve()}
      phone={phone}
    />
  );
  const dock = <Dock details={details} phone={phone} />;

  return (
    // The sea colour sits on its own layer, as the map canvas does.
    <div style={{ height: '100%', position: 'relative' }}>
      <div
        aria-hidden
        style={{
          background: map.sea,
          inset: 0,
          position: 'absolute',
          willChange: 'transform',
        }}
      />
      {phone ? (
        <MapLayout
          {...accountSlots(phone, menu)}
          dock={dock}
          layers={<LayersButton />}>
          {children?.(phone)}
        </MapLayout>
      ) : (
        <MapLayout
          {...accountSlots(phone, menu)}
          action={action}
          dock={dock}
          panel={panel ?? <BoardPanel />}
          search={<SearchBar form='bar' />}
          zoom={<ZoomControls />}>
          {children?.(phone)}
        </MapLayout>
      )}
    </div>
  );
};
