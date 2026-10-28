'use client';

import { useState } from 'react';

import type { ControlState } from '@ks/app/components/foundation/types';

import { ZoomControls } from '@ks/features/map/components/ZoomControls';

// Three zoom levels, so a click or two reaches a limit and the disabled look can be tried.
const MIN = 0;
const MAX = 2;
const START = 1;

/** A zoom card that works on a stand-in zoom level. `atMax` and `state` pin the look for the state matrix. */
export const ZoomDemo = ({
  atMax,
  state,
}: {
  atMax?: boolean;
  state?: ControlState;
}) => {
  const [zoom, setZoom] = useState(START);

  return (
    <ZoomControls
      atMax={atMax ?? zoom === MAX}
      atMin={zoom === MIN}
      onFit={() => setZoom(START)}
      onZoomIn={() => setZoom(zoom + 1)}
      onZoomOut={() => setZoom(zoom - 1)}
      state={state}
    />
  );
};
