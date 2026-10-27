'use client';

import {
  Map as MapLibreMap,
  NavigationControl,
  ScaleControl,
  setWorkerUrl,
} from 'maplibre-gl';
import { useEffect, useRef } from 'react';

import 'maplibre-gl/dist/maplibre-gl.css';

import { PHONE } from '@/app/components/foundation/usePhone';
import { freeArea } from '@/app/components/map/Stage';
import { buildStyle, POLITY_LAYERS, polityFilters } from '@/lib/map/style';

type Padding = ReturnType<typeof freeArea>;

// MapLibre looks for its worker next to its own module, which the bundle moves.
setWorkerUrl(
  new URL('maplibre-gl/dist/maplibre-gl-worker.mjs', import.meta.url).href
);

/** South Africa, Lesotho and eSwatini: west, south, east, north. */
export const FIRST_VIEW: [[number, number], [number, number]] = [
  [16, -35.5],
  [33.5, -21.5],
];

/** Panning stops at the edge of this box, so the map can't be lost. */
export const MAX_BOUNDS: [[number, number], [number, number]] = [
  [8, -42],
  [42, -14],
];

export const MIN_ZOOM = 3;
export const MAX_ZOOM = 10;

export const MapView = ({
  mapDay,
  padding,
  showPolities,
}: {
  mapDay: number;
  /** The free map area, from `freeArea`; the first view and the centre stay inside it. */
  padding: Padding;
  showPolities: boolean;
}) => {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);
  // The first style uses the values from the first render; later changes go through the effect below.
  const initial = useRef({ mapDay, showPolities });
  // `load` fires once. After it, isStyleLoaded() is false while tiles reload, so it can't gate later changes.
  const loaded = useRef(false);

  useEffect(() => {
    /* v8 ignore next -- React sets the ref before effects run; the guard only narrows the type */
    if (!container.current) return;

    const created = new MapLibreMap({
      attributionControl: false,
      bounds: FIRST_VIEW,
      container: container.current,
      // The server renders the desktop form, so the first padding asks the screen.
      fitBoundsOptions: {
        padding: freeArea(window.matchMedia(PHONE).matches),
      },
      maxBounds: MAX_BOUNDS,
      maxZoom: MAX_ZOOM,
      minZoom: MIN_ZOOM,
      style: buildStyle(initial.current.mapDay, initial.current.showPolities),
    });

    created.addControl(new NavigationControl());
    created.addControl(new ScaleControl());
    created.once('load', () => {
      loaded.current = true;
    });
    map.current = created;

    // Only builds made for the browser tests (NEXT_PUBLIC_E2E=1) expose the map.
    if (process.env.NEXT_PUBLIC_E2E === '1') {
      (window as unknown as { kinscapeMap?: MapLibreMap }).kinscapeMap =
        created;
    }

    return () => created.remove();
  }, []);

  const { bottom, left, right, top } = padding;

  useEffect(() => {
    // The form changed (a rotation, a resize): keep the centre in the free area.
    /* v8 ignore next -- the effect above has created the map by now; the guard only narrows the type */
    if (!map.current) return;

    map.current.setPadding({ bottom, left, right, top });
  }, [bottom, left, right, top]);

  useEffect(() => {
    const current = map.current;

    /* v8 ignore next -- the effect above has created the map by now; the guard only narrows the type */
    if (!current) return;

    const apply = () => {
      // NFR-01: from the Map date change to the next idle frame.
      performance.mark('map-date-change');
      current.once('idle', () => {
        performance.measure('map-date-redraw', 'map-date-change');
      });

      const filters = polityFilters(mapDay);

      for (const id of POLITY_LAYERS) {
        current.setFilter(id, filters[id]);
        current.setLayoutProperty(
          id,
          'visibility',
          showPolities ? 'visible' : 'none'
        );
      }
    };

    if (loaded.current || current.isStyleLoaded()) {
      apply();

      return;
    }

    current.once('load', apply);

    return () => {
      current.off('load', apply);
    };
  }, [mapDay, showPolities]);

  return <div className='map' ref={container} />;
};
