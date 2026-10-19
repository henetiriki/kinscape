'use client';

import { useState } from 'react';

import type { Source } from '@/lib/boundaries/model.mts';

import { dayOf } from '@/lib/map/filter';

import { Credits } from './Credits';
import { LayersPanel } from './LayersPanel';
import { MapView } from './MapView';
import { SourcesDialog } from './SourcesDialog';

export const MapShell = ({ sources }: { sources: Source[] }) => {
  // Until the date dock arrives (M1.3) the Map date is today.
  const [mapDay] = useState(() => dayOf(new Date()));
  const [showPolities, setShowPolities] = useState(true);
  const [showSources, setShowSources] = useState(false);

  return (
    <>
      <MapView mapDay={mapDay} showPolities={showPolities} />
      <LayersPanel
        onShowPolitiesChange={setShowPolities}
        showPolities={showPolities}
      />
      <Credits
        onOpenAttributions={() => setShowSources(true)}
        showPolities={showPolities}
        sources={sources}
      />
      {showSources && (
        <SourcesDialog
          onClose={() => setShowSources(false)}
          sources={sources}
        />
      )}
    </>
  );
};
