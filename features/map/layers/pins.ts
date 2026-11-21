// The page passes `pinsLayer` output to the client map; its `filters` is a function.
'use client';

import type { Feature, FeatureCollection, Point } from 'geojson';
import type { ExpressionSpecification } from 'maplibre-gl';

import type { Layer } from '@ks/features/map/types';
import type { Day } from '@ks/lib/domain/boundaries/types.ts';
import type { MapPin } from '@ks/lib/domain/pins/types.ts';

import rawTokens from '@ks/design/tokens.json';
import { resolveTokens } from '@ks/design/tokens.mts';
import { spanFilter } from '@ks/features/map/filter';
import { isCurrentOn } from '@ks/lib/domain/validity/validity.mts';
import { EVENT_ORDER, EVENT_PATHS } from '@ks/lib/ui/EventGlyph';

// Every colour and width comes from the `map` section of design/tokens.json.
const { map } = resolveTokens(rawTokens);

/** A Pin draws at 22 px, as the glyphs of `map-pin-fan`; an icon image is 24 px wide. */
const ICON_SIZE = 22 / 24;

/**
 * A token's `radius` is the centre line of its ring, as an svg circle takes it. MapLibre draws a
 * circle stroke outside `circle-radius`, so the fill radius is half the stroke width less.
 */
const ringRadius = ({ radius, width }: { radius: number; width: number }) =>
  radius - width / 2;

/** The image id of an Event type is this prefix and its name; the style builds it the same way. */
const PREFIX = 'pin-';

const featureOf = ({
  eventType,
  id,
  latitude,
  longitude,
  span,
}: MapPin): Feature<Point> => ({
  geometry: { coordinates: [longitude, latitude], type: 'Point' },
  properties: {
    eventType,
    id,
    validFrom: span.validFrom,
    validTo: span.validTo,
  },
  type: 'Feature',
});

/** The id of the "Pins" row, which the map shell reads to close the popup of a Pin that the row hides. */
export const PINS_LAYER_ID = 'pins';

/**
 * The "Pins" row: one symbol for each Pin at the position of its Place. The Map date only changes
 * the filter, so the source holds every Pin and no request is sent (NFR-01). Pins on one Place
 * overlap (PIN-06). Two circles under the symbols draw the selection ring; their filter keeps only
 * the open Pin (PIN-02), so no ring shows while none is open.
 */
export const pinsLayer = (pins: MapPin[]): Layer => {
  const data: FeatureCollection<Point> = {
    features: pins.map(featureOf),
    type: 'FeatureCollection',
  };

  return {
    description: (day: Day) =>
      `${pins.filter(({ span }) => isCurrentOn(span, day)).length} of ${pins.length} true on this date`,
    filters: (day, open) => {
      const ring: ExpressionSpecification = [
        'all',
        spanFilter(day),
        ['==', ['get', 'id'], open ?? ''],
      ];

      return {
        pins: spanFilter(day),
        'pins-halo': ring,
        'pins-selected': ring,
      };
    },
    icons: Object.fromEntries(
      EVENT_ORDER.map(event => [`${PREFIX}${event}`, EVENT_PATHS[event]])
    ),
    id: PINS_LAYER_ID,
    label: 'Pins',
    layers: [
      {
        id: 'pins-halo',
        paint: {
          'circle-color': 'transparent',
          'circle-radius': ringRadius(map.selected.halo),
          'circle-stroke-color': map.selected.halo.colour,
          'circle-stroke-opacity': map.selected.halo.opacity,
          'circle-stroke-width': map.selected.halo.width,
        },
        source: 'pins',
        type: 'circle',
      },
      {
        id: 'pins-selected',
        paint: {
          'circle-color': 'transparent',
          'circle-radius': ringRadius(map.selected),
          'circle-stroke-color': map.selected.colour,
          'circle-stroke-width': map.selected.width,
        },
        source: 'pins',
        type: 'circle',
      },
      {
        id: 'pins',
        layout: {
          'icon-allow-overlap': true,
          'icon-ignore-placement': true,
          'icon-image': ['concat', PREFIX, ['get', 'eventType']],
          'icon-size': ICON_SIZE,
        },
        paint: {
          'icon-color': map.pin.colour,
          'icon-halo-color': map.pin.halo,
          'icon-halo-width': map.pin['halo-width'],
        },
        source: 'pins',
        type: 'symbol',
      },
    ],
    select: ['pins'],
    sources: { pins: { data, type: 'geojson' } },
  };
};
