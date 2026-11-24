// The page passes `pinsLayer` output to the client map; its `filters` is a function.
'use client';

import type { Feature, FeatureCollection, Point } from 'geojson';
import type { ExpressionSpecification } from 'maplibre-gl';

import { createElement } from 'react';

import type { FanPin, Layer } from '@ks/features/map/types';
import type { Day } from '@ks/lib/domain/boundaries/types.ts';
import type { MapPin } from '@ks/lib/domain/pins/types.ts';
import type { Validity } from '@ks/lib/domain/validity/types.ts';

import { map } from '@ks/design/tokens.generated.ts';
import { PlaceMarker } from '@ks/features/map/components/PlaceMarker';
import { spanFilter } from '@ks/features/map/filter';
import { readFuzzyDate } from '@ks/lib/domain/dates/fuzzy-date-text.mts';
import {
  aloneParts,
  groupByPlace,
  sharedPlaces,
} from '@ks/lib/domain/pins/shared-places.mts';
import { isCurrentOn } from '@ks/lib/domain/validity/validity.mts';
import { EVENT_ORDER, EVENT_PATHS } from '@ks/lib/ui/EventGlyph';

// Every colour and width comes from the `map` export of design/tokens.generated.ts.
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

/** A single Pin for the days of `part`, on which its Place shows no other Pin. */
const featureOf = (
  { eventType, id, latitude, longitude }: MapPin,
  part: Validity
): Feature<Point> => ({
  geometry: { coordinates: [longitude, latitude], type: 'Point' },
  properties: {
    eventType,
    id,
    validFrom: part.validFrom,
    validTo: part.validTo,
  },
  type: 'Feature',
});

const fanPinOf = (pin: MapPin): FanPin => ({
  event: pin.eventType,
  id: pin.id,
  reading: readFuzzyDate(pin),
});

type Groups = ReturnType<typeof groupByPlace>;

const pinData = (pins: MapPin[], groups: Groups): FeatureCollection<Point> => {
  const byId = new Map(pins.map(pin => [pin.id, pin]));

  return {
    features: groups
      .flatMap(aloneParts)
      .map(({ id, ...part }) => featureOf(byId.get(id)!, part)),
    type: 'FeatureCollection',
  };
};

const pinFilters: Layer['filters'] = (day, open) => {
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
};

const STYLE_LAYERS: Layer['layers'] = [
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
];

const pinMarkers = (
  groups: Groups,
  day: Day,
  open: string | undefined,
  onOpen: (id: string) => void
) =>
  sharedPlaces(groups, day).map(({ pins: shown, position }) => ({
    key: position.join(','),
    node: createElement(PlaceMarker, {
      onOpen,
      pins: shown.map(fanPinOf),
      selected: shown.some(({ id }) => id === open),
    }),
    position,
  }));

/** The id of the "Pins" row, which the map shell reads to close the popup of a Pin that the row hides. */
export const PINS_LAYER_ID = 'pins';

/**
 * The "Pins" row: one symbol for each Pin at the position of its Place, on the days its Place shows
 * no other Pin. On the other days the Place has a count marker with a fan of its Pins (PIN-06).
 * The Map date only changes the filter and the markers, so the source holds every Pin and no
 * request is sent (NFR-01). Two circles under the symbols draw the selection ring; their filter
 * keeps only the open Pin (PIN-02), so no ring shows while none is open.
 */
export const pinsLayer = (pins: MapPin[]): Layer => {
  const groups = groupByPlace(pins);

  return {
    description: (day: Day) =>
      `${pins.filter(({ span }) => isCurrentOn(span, day)).length} of ${pins.length} true on this date`,
    filters: pinFilters,
    group: 'pins',
    icons: Object.fromEntries(
      EVENT_ORDER.map(event => [`${PREFIX}${event}`, EVENT_PATHS[event]])
    ),
    id: PINS_LAYER_ID,
    label: 'Pins',
    layers: STYLE_LAYERS,
    markers: (day, open, onOpen) => pinMarkers(groups, day, open, onOpen),
    select: ['pins'],
    sources: { pins: { data: pinData(pins, groups), type: 'geojson' } },
  };
};
