'use client';

import { useState } from 'react';

import type { Source } from '@ks/lib/domain/boundaries/types.ts';
import type { Span } from '@ks/lib/domain/map/types';

import { NoticeCard } from '@ks/app/components/feedback/NoticeCard';
import { usePhone } from '@ks/app/components/foundation/usePhone';
import { Sheet } from '@ks/app/components/overlays/Sheet';
import { Credits } from '@ks/features/map/components/Credits';
import { DateDock } from '@ks/features/map/components/DateDock';
import { LayersButton } from '@ks/features/map/components/LayersButton';
import {
  LayersPanel,
  LayersRow,
} from '@ks/features/map/components/LayersPanel';
import { MapView } from '@ks/features/map/components/MapView';
import { SourcesDialog } from '@ks/features/map/components/SourcesDialog';
import { freeArea, Stage } from '@ks/features/map/components/Stage';
import { fromDay } from '@ks/lib/domain/boundaries/model.mts';
import { hasBorders } from '@ks/lib/domain/map/coverage';
import { todayDay } from '@ks/lib/domain/map/map-date';

import styles from '@ks/features/map/components/MapShell.module.css';

export const MapShell = ({
  coverage,
  sources,
}: {
  /** The days with a Boundary version; the first one is where the notice card jumps to. */
  coverage: Span[];
  sources: Source[];
}) => {
  const phone = usePhone();
  // The Map date starts on today, which is also the last date.
  const [lastDay] = useState(todayDay);
  const [mapDay, setMapDay] = useState(lastDay);
  const [showPolities, setShowPolities] = useState(true);
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
  const layers = {
    onShowPolitiesChange: setShowPolities,
    showPolities,
  };
  const borders = (day: number) => hasBorders(coverage, day);
  const first = coverage.at(0)?.validFrom;
  const firstYear = first === undefined ? '' : fromDay(first).slice(0, 4);

  return (
    <>
      <Stage
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
              title={`No borders are mapped for ${fromDay(mapDay).slice(0, 4)} yet`}>
              {`The map has borders from ${firstYear}.`}
            </NoticeCard>
          ) : undefined
        }
        overlayAt='top'
        panel={phone ? undefined : <LayersPanel {...layers} />}>
        <MapView
          mapDay={mapDay}
          padding={freeArea(phone)}
          showPolities={showPolities}
        />
      </Stage>
      {phone && (
        <Sheet
          onClose={() => setShowLayers(false)}
          open={showLayers}
          title='Layers'>
          <LayersRow {...layers} />
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
