'use client';

import type { GeoJSONSource } from 'maplibre-gl';
import type { ReactNode, Ref } from 'react';

import {
  Map as MapLibreMap,
  Marker,
  ScaleControl,
  setWorkerUrl,
} from 'maplibre-gl';
import { useEffect, useImperativeHandle, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import 'maplibre-gl/dist/maplibre-gl.css';

import type {
  Layer,
  LayerId,
  MapHandle,
  OpenPin,
  ZoomLimits,
} from '@ks/features/map/types';
import type { Day } from '@ks/lib/domain/boundaries/types.ts';

import { PHONE } from '@ks/app/components/foundation/usePhone';
import { freeArea } from '@ks/app/components/layout/MapLayout';
import { iconImage } from '@ks/features/map/icons';
import { buildStyle } from '@ks/features/map/style';
import { FIRST_VIEW } from '@ks/lib/domain/map/view.mts';
import { coverZoom } from '@ks/lib/domain/map/zoom.mts';

type Padding = ReturnType<typeof freeArea>;

// MapLibre looks for its worker next to its own module, which the bundle moves.
setWorkerUrl(
  new URL('maplibre-gl/dist/maplibre-gl-worker.mjs', import.meta.url).href
);

/** Panning stops at the edge of this box, so the map can't be lost. */
export const MAX_BOUNDS: [[number, number], [number, number]] = [
  [8, -42],
  [42, -14],
];

const MIN_ZOOM = 3;
const MAX_ZOOM = 10;

/**
 * The map events that a marker keeps to itself. A drag or a pinch can still start on a marker,
 * because the map gets its mouse and touch events.
 */
const MAP_EVENTS = ['click', 'dblclick'] as const;

/** The map zoom is a float, so "at a limit" allows this much slack. */
const ZOOM_TOLERANCE = 0.001;

export const MapView = ({
  handle,
  layers,
  mapDay,
  onEmptyClick,
  onOpenPin,
  onOpenPoint,
  onZoomLimits,
  open,
  padding,
  visible,
}: {
  /** `MapView` fills it with the zoom calls once the map exists. */
  handle?: Ref<MapHandle>;
  /** The layers the map draws; the Map date filters each and `visible` shows or hides them. */
  layers: Layer[];
  mapDay: Day;
  /** A click that picks no feature. */
  onEmptyClick?: () => void;
  /** A click on a feature of a layer's `select` ids, with the feature's `id` property. */
  onOpenPin?: (id: string) => void;
  /** The pixel point of the open Pin in the map, now and after each move; `null` once no Pin is open. */
  onOpenPoint?: (point: { x: number; y: number } | null) => void;
  /** `MapView` calls it on load and after each zoom and resize, with whether the zoom is at a limit. */
  onZoomLimits?: (limits: ZoomLimits) => void;
  /** The Pin whose popup is open. Its id goes to each layer's filters. */
  open?: OpenPin;
  /** The free map area, from `freeArea`; the first view and the centre stay inside it. */
  padding: Padding;
  /** Each layer is on unless its entry is `false`. */
  visible: Partial<Record<LayerId, boolean>>;
  // eslint-disable-next-line max-lines-per-function -- over 60 lines before the rule (C1174)
}) => {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);
  const onZoomLimitsRef = useRef(onZoomLimits);
  const onEmptyClickRef = useRef(onEmptyClick);
  const onOpenPinRef = useRef(onOpenPin);
  const onOpenPointRef = useRef(onOpenPoint);
  const selectRef = useRef<string[]>([]);
  /** The Map date that the last NFR-01 timing started for. */
  const timedDay = useRef<Day>(undefined);
  /** The MapLibre marker of each layer marker on the map, by its key. */
  const markers = useRef(new Map<string, Marker>());
  /** What each marker element draws: React renders it there through a portal. */
  const [placed, setPlaced] = useState<
    { element: HTMLElement; key: string; node: ReactNode }[]
  >([]);

  useEffect(() => {
    onZoomLimitsRef.current = onZoomLimits;
    onEmptyClickRef.current = onEmptyClick;
    onOpenPinRef.current = onOpenPin;
    onOpenPointRef.current = onOpenPoint;
    selectRef.current = layers.flatMap(layer => layer.select ?? []);
  });

  useImperativeHandle(handle, () => ({
    fit: () => {
      // The map's own padding (set below) already leaves the free area; more would shift the view.
      map.current?.fitBounds(FIRST_VIEW);
    },
    zoomIn: () => {
      map.current?.zoomIn();
    },
    zoomOut: () => {
      map.current?.zoomOut();
    },
  }));
  // The first style uses the values from the first render; later changes go through the effect below.
  const initial = useRef({ layers, mapDay, visible });
  // The data objects the map already holds: those the first style was built with.
  const [sent] = useState(
    () =>
      new WeakSet<object>(
        layers.flatMap(layer =>
          Object.values(layer.sources).flatMap(source =>
            source.type === 'geojson' && typeof source.data === 'object'
              ? [source.data]
              : []
          )
        )
      )
  );
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
      style: buildStyle(
        initial.current.mapDay,
        initial.current.layers,
        initial.current.visible
      ),
    });

    created.addControl(new ScaleControl());
    created.once('load', () => {
      loaded.current = true;
    });

    // The bounds clamp zoom out above `MIN_ZOOM` on a large window; the card must know the real limit.
    const reportLimits = () => {
      const element = container.current;

      /* v8 ignore next -- the container outlives the map; the guard only narrows the type */
      if (!element) return;

      created.setMinZoom(
        Math.max(
          MIN_ZOOM,
          coverZoom(MAX_BOUNDS, element.clientWidth, element.clientHeight)
        )
      );

      const zoom = created.getZoom();

      onZoomLimitsRef.current?.({
        atMax: zoom >= MAX_ZOOM - ZOOM_TOLERANCE,
        atMin: zoom <= created.getMinZoom() + ZOOM_TOLERANCE,
      });
    };

    created.on('zoomend', reportLimits);
    created.on('resize', reportLimits);
    created.once('load', reportLimits);
    // A click on a pickable feature opens it; a click that picks none is a click on empty map.
    created.on('click', ({ point }) => {
      const pickable = selectRef.current;
      const hit =
        pickable.length === 0
          ? undefined
          : created.queryRenderedFeatures(point, { layers: pickable })[0];

      if (hit) {
        onOpenPinRef.current?.(String(hit.properties.id));
      } else {
        onEmptyClickRef.current?.();
      }
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
  const openId = open?.id;
  const [openLongitude, openLatitude] = open?.position ?? [0, 0];

  useEffect(() => {
    // The form changed (a rotation, a resize): keep the centre in the free area.
    /* v8 ignore next -- the effect above has created the map by now; the guard only narrows the type */
    if (!map.current) return;

    map.current.setPadding({ bottom, left, right, top });
  }, [bottom, left, right, top]);

  // A Map date change must not reload a source (NFR-01), so each data object goes to its source once.
  useEffect(() => {
    const current = map.current;

    /* v8 ignore next -- the effect above has created the map by now; the guard only narrows the type */
    if (!current) return;

    const send = () => {
      for (const layer of layers) {
        for (const [id, source] of Object.entries(layer.sources)) {
          if (
            source.type === 'geojson' &&
            typeof source.data === 'object' &&
            !sent.has(source.data)
          ) {
            sent.add(source.data);
            (current.getSource(id) as GeoJSONSource).setData(source.data);
          }
        }
      }
    };

    if (loaded.current || current.isStyleLoaded()) {
      send();

      return;
    }

    current.once('load', send);

    return () => {
      current.off('load', send);
    };
  }, [layers, sent]);

  // A symbol asks for its image by id; the layer that names the id draws it. The resolver runs
  // before the tile is laid out, so the first draw already has the icon (`styleimagemissing` fires
  // after the layout, which leaves the symbol out).
  useEffect(() => {
    const current = map.current;

    /* v8 ignore next -- the effect above has created the map by now; the guard only narrows the type */
    if (!current) return;

    current.setMissingStyleImageResolver(async id => {
      const path = layers.map(layer => layer.icons?.[id]).find(Boolean);

      if (path === undefined) return;

      const ratio = window.devicePixelRatio;

      current.addImage(id, iconImage(path, ratio), {
        pixelRatio: ratio,
        sdf: true,
      });
    });

    return () => {
      current.setMissingStyleImageResolver(null);
    };
  }, [layers]);

  useEffect(() => {
    const current = map.current;

    /* v8 ignore next -- the effect above has created the map by now; the guard only narrows the type */
    if (!current) return;

    const apply = () => {
      // NFR-01: from the Map date change to the next idle frame. An open Pin or a layer toggle is no date change.
      if (timedDay.current !== mapDay) {
        timedDay.current = mapDay;
        performance.mark('map-date-change');
        current.once('idle', () => {
          performance.measure('map-date-redraw', 'map-date-change');
        });
      }

      for (const layer of layers) {
        const filters = layer.filters(mapDay, openId);

        for (const { id } of layer.layers) {
          current.setFilter(id, filters[id] ?? null);
          current.setLayoutProperty(
            id,
            'visibility',
            visible[layer.id] === false ? 'none' : 'visible'
          );
        }
      }

      // The markers change after the mark, so the NFR-01 timing covers them too.
      const wanted = layers
        .filter(layer => visible[layer.id] !== false)
        .flatMap(
          layer =>
            layer.markers?.(mapDay, openId, id => onOpenPinRef.current?.(id)) ??
            []
        );
      const keys = new Set(wanted.map(({ key }) => key));

      for (const [key, marker] of markers.current) {
        if (!keys.has(key)) {
          marker.remove();
          markers.current.delete(key);
        }
      }

      setPlaced(
        wanted.map(({ key, node, position }) => {
          let marker = markers.current.get(key);

          if (!marker) {
            const element = document.createElement('div');

            // An HTML marker handles its own clicks. A fold can remove the clicked element before
            // the event reaches the map. The map would then read a click on empty map, so it never
            // gets the click. Pointer events still bubble, so a tap on another marker folds a fan.
            for (const type of MAP_EVENTS) {
              element.addEventListener(type, event => event.stopPropagation());
            }

            marker = new Marker({ element }).setLngLat(position).addTo(current);
            markers.current.set(key, marker);
          }

          return { element: marker.getElement(), key, node };
        })
      );
    };

    if (loaded.current || current.isStyleLoaded()) {
      apply();

      return;
    }

    current.once('load', apply);

    return () => {
      current.off('load', apply);
    };
  }, [layers, mapDay, openId, visible]);

  // The popup follows its Pin: the point is read again after each move, pan, zoom and resize.
  useEffect(() => {
    const current = map.current;

    /* v8 ignore next -- the effect above has created the map by now; the guard only narrows the type */
    if (!current) return;

    if (openId === undefined) {
      onOpenPointRef.current?.(null);

      return;
    }

    const report = () => {
      const { x, y } = current.project([openLongitude, openLatitude]);

      onOpenPointRef.current?.({ x, y });
    };

    report();
    current.on('move', report);

    return () => {
      current.off('move', report);
    };
  }, [openId, openLatitude, openLongitude]);

  return (
    <>
      <div className='map' ref={container} />
      {placed.map(({ element, key, node }) => createPortal(node, element, key))}
    </>
  );
};
