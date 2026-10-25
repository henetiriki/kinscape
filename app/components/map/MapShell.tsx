'use client';

import { useState } from 'react';

import type { Source } from '@/lib/boundaries/model.mts';

import { usePhone } from '@/app/components/foundation/usePhone';
import { Credits } from '@/app/components/map/Credits';
import { DateDock } from '@/app/components/map/DateDock';
import { LayersButton } from '@/app/components/map/LayersButton';
import { LayersPanel, LayersRow } from '@/app/components/map/LayersPanel';
import { MapView } from '@/app/components/map/MapView';
import { freeArea, Stage } from '@/app/components/map/Stage';
import { Sheet } from '@/app/components/overlays/Sheet';
import { SourcesDialog } from '@/app/components/overlays/SourcesDialog';
import { todayDay } from '@/lib/map/map-date';

import styles from './MapShell.module.css';

export const MapShell = ({ sources }: { sources: Source[] }) => {
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
                lastDay={lastDay}
                onChange={setMapDay}
                sheet={{
                  expanded: sheetExpanded,
                  onExpandedChange: setSheetExpanded,
                }}
              />
            </>
          ) : (
            <DateDock day={mapDay} lastDay={lastDay} onChange={setMapDay} />
          )
        }
        layers={
          phone ? (
            <LayersButton onClick={() => setShowLayers(true)} />
          ) : undefined
        }
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
