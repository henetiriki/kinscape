'use client';

import { useState } from 'react';

import type { Source } from '@/lib/boundaries/model.mts';

import { todayDay } from '@/lib/map/map-date';

import { Credits } from './Credits';
import { DateDock } from './DateDock';
import { LayersPanel } from './LayersPanel';
import styles from './MapShell.module.css';
import { MapView } from './MapView';
import { SourcesDialog } from './SourcesDialog';

export const MapShell = ({ sources }: { sources: Source[] }) => {
  // The Map date starts on today, which is also the last date.
  const [lastDay] = useState(todayDay);
  const [mapDay, setMapDay] = useState(lastDay);
  const [showPolities, setShowPolities] = useState(true);
  const [showSources, setShowSources] = useState(false);

  return (
    <>
      <MapView mapDay={mapDay} showPolities={showPolities} />
      <LayersPanel
        onShowPolitiesChange={setShowPolities}
        showPolities={showPolities}
      />
      <div className={styles.bottom}>
        <DateDock day={mapDay} lastDay={lastDay} onChange={setMapDay} />
        <Credits
          onOpenAttributions={() => setShowSources(true)}
          showPolities={showPolities}
          sources={sources}
        />
      </div>
      <SourcesDialog
        onClose={() => setShowSources(false)}
        open={showSources}
        sources={sources}
      />
    </>
  );
};
