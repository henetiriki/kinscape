'use client';

import { useState } from 'react';

import type { Layer, LayerId } from '@ks/features/map/types';
import type { Source } from '@ks/lib/domain/boundaries/types.ts';
import type { Day } from '@ks/lib/domain/boundaries/types.ts';
import type { Validity } from '@ks/lib/domain/validity/types.ts';

import { NoticeCard } from '@ks/app/components/feedback/NoticeCard';
import { usePhone } from '@ks/app/components/foundation/usePhone';
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
import { freeArea, Stage } from '@ks/features/map/components/Stage';
import { polityLayer } from '@ks/features/map/layers/polities';
import { hasBorders } from '@ks/lib/domain/map/coverage.mts';
import { todayDay, yearOf } from '@ks/lib/domain/map/map-date.mts';

import styles from '@ks/features/map/components/MapShell.module.css';

export const MapShell = ({
  coverage,
  email,
  initial,
  layers,
  onSignOut,
  sources,
}: {
  /** The days with a Boundary version; the first one is where the notice card jumps to. */
  coverage: Validity[];
  /** Shown in the account menu. */
  email: string;
  /** The letter on the Avatar. */
  initial: string;
  /** The layers the map draws. */
  layers: Layer[];
  onSignOut: () => Promise<unknown>;
  sources: Source[];
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

  const credits = (
    <Credits
      onOpenAttributions={() => setShowSources(true)}
      showPolities={showPolities}
      sources={sources}
    />
  );
  const layerProps = {
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
      <Stage
        {...accountSlots(phone, account)}
        credits={phone ? undefined : credits}
        dock={
          phone ? (
            <>
              <div className={styles.credits}>{credits}</div>
              <DateDock
                day={mapDay}
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
        panel={phone ? undefined : <LayersPanel {...layerProps} />}>
        <MapView
          layers={layers}
          mapDay={mapDay}
          padding={freeArea(phone)}
          visible={visible}
        />
      </Stage>
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
