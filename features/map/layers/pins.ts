// The page passes `pinsLayer` output to the client map; its `filters` is a function.
'use client';

import type { Feature, FeatureCollection, Point } from 'geojson';

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

/** The image id of an Event type is this prefix and its name; the style builds it the same way. */
const PREFIX = 'pin-';

const featureOf = ({
  eventType,
  latitude,
  longitude,
  span,
}: MapPin): Feature<Point> => ({
  geometry: { coordinates: [longitude, latitude], type: 'Point' },
  properties: {
    eventType,
    validFrom: span.validFrom,
    validTo: span.validTo,
  },
  type: 'Feature',
});

/**
 * The "Pins" row: one symbol for each Pin at the position of its Place. The Map date only changes
 * the filter, so the source holds every Pin and no request is sent (NFR-01). Pins on one Place
 * overlap (PIN-06).
 */
export const pinsLayer = (pins: MapPin[]): Layer => {
  const data: FeatureCollection<Point> = {
    features: pins.map(featureOf),
    type: 'FeatureCollection',
  };

  return {
    description: (day: Day) =>
      `${pins.filter(({ span }) => isCurrentOn(span, day)).length} of ${pins.length} true on this date`,
    filters: day => ({ pins: spanFilter(day) }),
    icons: Object.fromEntries(
      EVENT_ORDER.map(event => [`${PREFIX}${event}`, EVENT_PATHS[event]])
    ),
    id: 'pins',
    label: 'Pins',
    layers: [
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
    sources: { pins: { data, type: 'geojson' } },
  };
};
