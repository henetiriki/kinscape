'use client';

import type { ReactNode } from 'react';

import { useEffect, useRef, useState } from 'react';

import type {
  Layer,
  LayerId,
  MapHandle,
  OpenPin,
  ZoomLimits,
} from '@ks/features/map/types';
import type { Source } from '@ks/lib/domain/boundaries/types.ts';
import type { Day } from '@ks/lib/domain/boundaries/types.ts';
import type { Validity } from '@ks/lib/domain/validity/types.ts';

import { NoticeCard } from '@ks/app/components/feedback/NoticeCard';
import { usePhone } from '@ks/app/components/foundation/usePhone';
import { freeArea, MapLayout } from '@ks/app/components/layout/MapLayout';
import { Sheet } from '@ks/app/components/overlays/Sheet';
import {
  AccountMenu,
  accountSlots,
} from '@ks/features/map/components/AccountMenu';
import { Credits } from '@ks/features/map/components/Credits';
import { DateDock } from '@ks/features/map/components/DateDock';
import { LayersButton } from '@ks/features/map/components/LayersButton';
import {
  LayersList,
  LayersPanel,
} from '@ks/features/map/components/LayersPanel';
import { MapView } from '@ks/features/map/components/MapView';
import { SourcesDialog } from '@ks/features/map/components/SourcesDialog';
import { ZoomControls } from '@ks/features/map/components/ZoomControls';
import { polityLayer } from '@ks/features/map/layers/polities';
import { hasBorders } from '@ks/lib/domain/map/coverage.mts';
import { todayDay, yearOf } from '@ks/lib/domain/map/map-date.mts';
import { isCurrentOn } from '@ks/lib/domain/validity/validity.mts';

import styles from '@ks/features/map/components/MapShell.module.css';

export const MapShell = ({
  coverage,
  email,
  initial,
  layers,
  onClosePin,
  onOpenPin,
  onSignOut,
  pin,
  sources,
  toast,
}: {
  /** The days with a Boundary version; the first one is where the notice card jumps to. */
  coverage: Validity[];
  /** Shown in the account menu. */
  email: string;
  /** The letter on the Avatar. */
  initial: string;
  /** The layers the map draws. */
  layers: Layer[];
  /** A click on empty map, Esc, or a Map date that hides the open Pin. Keep its identity stable. */
  onClosePin?: () => void;
  /** A click on a Pin, with its id. */
  onOpenPin?: (id: string) => void;
  onSignOut: () => Promise<unknown>;
  /** The Pin whose popup is open. */
  pin?: {
    open: OpenPin;
    /** `popup` draws the popup: floating at the `place` of the Pin on a desktop, `inline` in the date sheet on a phone. */
    popup: (
      form: 'floating' | 'inline',
      place?: { x: number; y: number }
    ) => ReactNode;
    /** The days the Pin shows; the popup closes when the Map date leaves them. */
    span: Validity;
  };
  sources: Source[];
  /** A `Toast` for the result of an action, at the bottom centre above the dock. */
  toast?: ReactNode;
}) => {
  const phone = usePhone();
  // The Map date starts on today, which is also the last date.
  const [lastDay] = useState(todayDay);
  const [mapDay, setMapDay] = useState(lastDay);
  const [visible, setVisible] = useState<Partial<Record<LayerId, boolean>>>(
    () => Object.fromEntries(layers.map(layer => [layer.id, true]))
  );
  const showPolities = visible[polityLayer.id] !== false;
  const [showSources, setShowSources] = useState(false);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [showLayers, setShowLayers] = useState(false);
  const map = useRef<MapHandle>(null);
  const [limits, setLimits] = useState<ZoomLimits>({
    atMax: false,
    atMin: false,
  });

  // The pixel point of the open Pin in the map, which the popup follows.
  const [point, setPoint] = useState<{ x: number; y: number } | null>(null);
  const shown = pin !== undefined;
  const hidden = pin !== undefined && !isCurrentOn(pin.span, mapDay);

  useEffect(() => {
    if (hidden) onClosePin?.();
  }, [hidden, onClosePin]);

  useEffect(() => {
    if (!shown) return;

    const close = ({ key }: KeyboardEvent) => {
      if (key === 'Escape') onClosePin?.();
    };

    document.addEventListener('keydown', close);

    return () => document.removeEventListener('keydown', close);
  }, [onClosePin, shown]);

  const credits = (
    <Credits
      collapsible={!phone}
      onOpenAttributions={() => setShowSources(true)}
      showPolities={showPolities}
      sources={sources}
    />
  );
  const layerProps = {
    day: mapDay,
    layers,
    onChange: (id: LayerId, show: boolean) =>
      setVisible(current => ({ ...current, [id]: show })),
    visible,
  };
  const borders = (day: Day) => hasBorders(coverage, day);
  const first = coverage.at(0)?.validFrom;
  const firstYear = first === undefined ? '' : String(yearOf(first));

  const account = (
    <AccountMenu
      email={email}
      initial={initial}
      onOpenSources={() => setShowSources(true)}
      onSignOut={onSignOut}
      phone={phone}
    />
  );

  return (
    <>
      <MapLayout
        {...accountSlots(phone, account)}
        credits={phone ? undefined : credits}
        dock={
          phone ? (
            <>
              <div className={styles.credits}>{credits}</div>
              <DateDock
                day={mapDay}
                details={pin?.popup('inline')}
                hasBorders={borders}
                lastDay={lastDay}
                onChange={setMapDay}
                sheet={{
                  expanded: sheetExpanded,
                  onExpandedChange: setSheetExpanded,
                }}
              />
            </>
          ) : (
            <DateDock
              day={mapDay}
              hasBorders={borders}
              lastDay={lastDay}
              onChange={setMapDay}
            />
          )
        }
        layers={
          phone ? (
            <LayersButton onClick={() => setShowLayers(true)} />
          ) : undefined
        }
        overlay={
          showPolities && first !== undefined && !borders(mapDay) ? (
            <NoticeCard
              actions={[
                {
                  label: `Jump to ${firstYear}`,
                  onClick: () => setMapDay(first),
                },
              ]}
              icon='layers'
              phone={phone}
              title={`No borders are mapped for ${yearOf(mapDay)} yet`}>
              {`The map has borders from ${firstYear}.`}
            </NoticeCard>
          ) : undefined
        }
        overlayAt='top'
        panel={phone ? undefined : <LayersPanel {...layerProps} />}
        zoom={
          phone ? undefined : (
            <ZoomControls
              atMax={limits.atMax}
              atMin={limits.atMin}
              onFit={() => map.current?.fit()}
              onZoomIn={() => map.current?.zoomIn()}
              onZoomOut={() => map.current?.zoomOut()}
            />
          )
        }>
        <MapView
          handle={map}
          layers={layers}
          mapDay={mapDay}
          onEmptyClick={onClosePin}
          onOpenPin={onOpenPin}
          onOpenPoint={setPoint}
          onZoomLimits={setLimits}
          open={pin?.open}
          padding={freeArea(phone)}
          visible={visible}
        />
        {!phone && pin && point && pin.popup('floating', point)}
        {toast && <div className={styles.toast}>{toast}</div>}
      </MapLayout>
      {phone && (
        <Sheet
          onClose={() => setShowLayers(false)}
          open={showLayers}
          title='Layers'>
          <LayersList {...layerProps} />
        </Sheet>
      )}
      <SourcesDialog
        onClose={() => setShowSources(false)}
        open={showSources}
        sources={sources}
      />
    </>
  );
};
