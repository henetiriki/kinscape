'use client';

import { useState } from 'react';

import type { Source } from '@/lib/boundaries/model.mts';

import { Credits } from '@/app/components/map/Credits';
import { DateDock } from '@/app/components/map/DateDock';
import { LayersPanel } from '@/app/components/map/LayersPanel';
import { MapView } from '@/app/components/map/MapView';
import { SourcesDialog } from '@/app/components/overlays/SourcesDialog';
import { todayDay } from '@/lib/map/map-date';

import styles from './MapShell.module.css';

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
