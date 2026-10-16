'use client';

import {
  Map as MapLibreMap,
  NavigationControl,
  ScaleControl,
  setWorkerUrl,
} from 'maplibre-gl';
import { useEffect, useRef } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';

// MapLibre looks for its worker next to its own module, which the bundle moves.
setWorkerUrl(
  new URL('maplibre-gl/dist/maplibre-gl-worker.mjs', import.meta.url).href
);

// Roughly the middle of South Africa.
const CENTRE: [number, number] = [25, -29];
const ZOOM = 4.5;

const MapView = () => {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    /* v8 ignore next -- React sets the ref before effects run; the guard only narrows the type */
    if (!container.current) return;

    // A background layer only: no basemap, tiles or borders until M1.
    const map = new MapLibreMap({
      center: CENTRE,
      container: container.current,
      style: {
        layers: [
          {
            id: 'background',
            paint: { 'background-color': '#f2efe9' },
            type: 'background',
          },
        ],
        sources: {},
        version: 8,
      },
      zoom: ZOOM,
    });

    map.addControl(new NavigationControl());
    map.addControl(new ScaleControl());

    return () => map.remove();
  }, []);

  return <div className='map' ref={container} />;
};

export default MapView;
