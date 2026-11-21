import type { Feature } from 'geojson';
import type { ComponentProps, ReactElement } from 'react';

import { featureFilter } from '@maplibre/maplibre-gl-style-spec';
import { globSync, readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';

import type { PlaceMarker } from '@ks/features/map/components/PlaceMarker';
import type { Day } from '@ks/lib/domain/boundaries/types.ts';
import type { MapPin } from '@ks/lib/domain/pins/types.ts';

import { dateFilter } from '@ks/features/map/filter';
import { pinsLayer } from '@ks/features/map/layers/pins';
import { polityLayer } from '@ks/features/map/layers/polities';
import { asDay, toDay } from '@ks/lib/domain/boundaries/model.mts';
import { fuzzyDateOf } from '@ks/lib/domain/dates/fuzzy-date.mts';
import { spanOf } from '@ks/lib/domain/pins/span.mts';
import { EVENT_ORDER, EVENT_PATHS } from '@ks/lib/ui/EventGlyph';

describe('polityLayer', () => {
  it('applies the Map date to every polity layer', () => {
    const day = asDay(42);
    const filters = polityLayer.filters(day);

    expect(Object.keys(filters).toSorted()).toEqual(
      polityLayer.layers.map(layer => layer.id).toSorted()
    );
    expect(filters['polity-fills']).toEqual(dateFilter(day, 'boundary'));
    expect(filters['polity-labels']).toEqual(dateFilter(day, 'label'));
  });

  it('names its panel row and keeps the ids the row has always had', () => {
    expect(polityLayer.label).toBe('Polity borders');
    expect(polityLayer.description).toBe(
      'Fills, borders and names of the Polities on the Map date.'
    );
    expect(polityLayer.id).toBe('polity-borders');
  });

  it('splits solid and dashed borders by confidence', () => {
    const filters = polityLayer.filters(asDay(1));

    expect(JSON.stringify(filters['polity-borders'])).toContain('"!"');
    expect(JSON.stringify(filters['polity-borders-low'])).not.toContain('"!"');
  });
});

const pinOn = (
  id: number,
  from: string,
  to: null | string,
  eventType: MapPin['eventType'] = 'residence'
): MapPin => ({
  date1: from.slice(0, 4),
  eventType,
  id: `pin-${id}` as MapPin['id'],
  latitude: -33.9,
  longitude: 18.4,
  qualifier: 'EXACT',
  span: { validFrom: toDay(from), validTo: to === null ? null : toDay(to) },
});
// The span that a Pin dated FROM 1840 TO 1855 gets: it ends on 1856-01-01.
const RESIDENCE: MapPin = {
  ...pinOn(1, '1840-01-01', null),
  span: spanOf(fuzzyDateOf('FROM', '1840', '1855'), {}),
};

// PIN-03, PIN-06
describe('pinsLayer', () => {
  const layer = pinsLayer([RESIDENCE]);
  const shown = (day: string, pins = [RESIDENCE]) => {
    const [filter] = Object.values(pinsLayer(pins).filters(toDay(day)));

    return featureFilter(filter, 'filter').filter(
      { zoom: 0 },
      {
        geometry: [],
        id: 1,
        properties: {
          validFrom: pins[0].span.validFrom,
          validTo: pins[0].span.validTo,
        },
        type: 1,
      }
    );
  };

  it('shows a residence from 1840 to 1855 in 1850 and hides it in 1860', () => {
    expect(shown('1850-06-01')).toBe(true);
    expect(shown('1860-06-01')).toBe(false);
  });

  it('puts one point at the Place of each Pin, with its event type and span', () => {
    const source = pinsLayer([RESIDENCE, pinOn(2, '1900-01-01', null, 'birth')])
      .sources.pins;

    expect(source).toEqual({
      data: {
        features: [
          {
            geometry: { coordinates: [18.4, -33.9], type: 'Point' },
            properties: {
              eventType: 'residence',
              id: 'pin-1',
              validFrom: RESIDENCE.span.validFrom,
              validTo: RESIDENCE.span.validTo,
            },
            type: 'Feature',
          },
          expect.objectContaining({
            properties: expect.objectContaining({
              eventType: 'birth',
              validTo: null,
            }),
          }),
        ],
        type: 'FeatureCollection',
      },
      type: 'geojson',
    });
  });

  it('draws each event type with its own icon and lets Pins on one Place overlap', () => {
    const drawing = layer.layers.find(({ id }) => id === 'pins');

    expect(Object.keys(layer.icons ?? {})).toEqual(
      EVENT_ORDER.map(event => `pin-${event}`)
    );
    expect(layer.icons).toEqual(
      Object.fromEntries(
        EVENT_ORDER.map(event => [`pin-${event}`, EVENT_PATHS[event]])
      )
    );
    expect(drawing).toMatchObject({
      id: 'pins',
      layout: {
        'icon-allow-overlap': true,
        'icon-ignore-placement': true,
        'icon-image': ['concat', 'pin-', ['get', 'eventType']],
        'icon-size': 22 / 24,
      },
      paint: {
        'icon-color': '#9a3b12',
        'icon-halo-color': '#ffffff',
        'icon-halo-width': 2,
      },
      source: 'pins',
      type: 'symbol',
    });
  });

  it('names its panel row and the filter of each drawing layer', () => {
    expect(layer.label).toBe('Pins');
    expect(layer.id).toBe('pins');
    expect(Object.keys(layer.filters(toDay('1850-01-01'))).toSorted()).toEqual(
      layer.layers.map(({ id }) => id).toSorted()
    );
  });

  // PIN-02: a click picks the Pin symbol, not its ring
  it('lets a click pick only the Pin symbols', () => {
    expect(layer.select).toEqual(['pins']);
  });

  // PIN-02, #862 D3
  describe('selection ring', () => {
    const [halo, ring, symbols] = layer.layers;
    const ringShows = (id: string, day: string, open?: string) => {
      const filter = layer.filters(toDay(day), open)['pins-selected'];

      return featureFilter(filter, 'filter').filter(
        { zoom: 0 },
        {
          geometry: [],
          id: 1,
          properties: {
            id,
            validFrom: RESIDENCE.span.validFrom,
            validTo: RESIDENCE.span.validTo,
          },
          type: 1,
        }
      );
    };

    it('draws two rings under the symbols, from the map.selected tokens', () => {
      expect([halo.id, ring.id, symbols.id]).toEqual([
        'pins-halo',
        'pins-selected',
        'pins',
      ]);
      // The Map-pin-count board: a brand ring of r 16 and a white ring of r 20.5 at 0.8, as svg circles.
      expect(halo).toMatchObject({
        paint: {
          'circle-color': 'transparent',
          'circle-radius': 19.5,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-opacity': 0.8,
          'circle-stroke-width': 2,
        },
        source: 'pins',
        type: 'circle',
      });
      expect(ring).toMatchObject({
        paint: {
          'circle-color': 'transparent',
          'circle-radius': 14.75,
          'circle-stroke-color': expect.stringMatching(/^#/),
          'circle-stroke-width': 2.5,
        },
        source: 'pins',
        type: 'circle',
      });
    });

    it('shows on the open Pin only', () => {
      expect(ringShows('pin-1', '1850-06-01', 'pin-1')).toBe(true);
      expect(ringShows('pin-2', '1850-06-01', 'pin-1')).toBe(false);
    });

    it('shows on no Pin when none is open', () => {
      expect(ringShows('pin-1', '1850-06-01')).toBe(false);
    });

    it('goes when the Map date hides the Pin', () => {
      expect(ringShows('pin-1', '1860-06-01', 'pin-1')).toBe(false);
    });

    it('filters both circles the same way', () => {
      const filters = layer.filters(toDay('1850-06-01'), 'pin-1');

      expect(filters['pins-halo']).toEqual(filters['pins-selected']);
    });
  });

  it('counts the Pins true on the Map date in the caption', () => {
    const pins = [
      RESIDENCE,
      pinOn(2, '1900-01-01', '1910-01-01'),
      pinOn(3, '1950-01-01', null, 'death'),
    ];
    const caption = pinsLayer(pins).description;

    expect(typeof caption).toBe('function');
    expect((caption as (day: Day) => string)(toDay('1850-06-01'))).toBe(
      '1 of 3 true on this date'
    );
    expect((caption as (day: Day) => string)(toDay('1860-06-01'))).toBe(
      '0 of 3 true on this date'
    );
    expect((caption as (day: Day) => string)(toDay('2000-06-01'))).toBe(
      '1 of 3 true on this date'
    );
  });

  describe('a Place with several Pins', () => {
    const shared = [
      pinOn(2, '1890-01-01', '1906-01-01'),
      { ...pinOn(3, '1899-01-01', '1900-01-01', 'marriage'), date1: '1899' },
      pinOn(4, '1901-01-01', '1902-01-01', 'birth'),
    ];
    const marked = pinsLayer(shared);
    const markersOn = (day: string, open?: string) =>
      marked.markers!(toDay(day), open, () => {});

    it('draws a single Pin only on the days its Place shows no other Pin', () => {
      const features = (
        marked.sources.pins as { data: { features: Feature[] } }
      ).data.features.map(({ properties }) => [
        properties!.id,
        properties!.validFrom,
        properties!.validTo,
      ]);

      expect(features).toEqual([
        ['pin-2', toDay('1890-01-01'), toDay('1899-01-01')],
        ['pin-2', toDay('1900-01-01'), toDay('1901-01-01')],
        ['pin-2', toDay('1902-01-01'), toDay('1906-01-01')],
      ]);
    });

    it('places a count marker with the Pins of the Map date, in date order (#863 D2)', () => {
      const [marker] = markersOn('1899-06-01');
      const { props } = marker.node as ReactElement<
        ComponentProps<typeof PlaceMarker>
      >;

      expect(marker.key).toBe('18.4,-33.9');
      expect(marker.position).toEqual([18.4, -33.9]);
      expect(props.pins).toEqual([
        { event: 'residence', id: 'pin-2', reading: 'In 1890' },
        { event: 'marriage', id: 'pin-3', reading: 'In 1899' },
      ]);
      expect(props.selected).toBe(false);
    });

    it('places no marker on a day the Place shows one Pin', () => {
      expect(markersOn('1895-06-01')).toEqual([]);
    });

    // PIN-02
    it('selects the marker whose Place holds the open Pin, and passes on an open (#863 D4)', () => {
      const onOpen = vi.fn();
      const [marker] = marked.markers!(toDay('1901-06-01'), 'pin-4', onOpen);
      const { props } = marker.node as ReactElement<
        ComponentProps<typeof PlaceMarker>
      >;

      expect(props.selected).toBe(true);
      props.onOpen('pin-2');
      expect(onOpen).toHaveBeenCalledWith('pin-2');
    });
  });

  it('has no feature and reads "0 of 0" for no Pins', () => {
    const none = pinsLayer([]);

    expect(none.sources.pins).toMatchObject({
      data: { features: [], type: 'FeatureCollection' },
    });
    expect(
      (none.description as (day: Day) => string)(toDay('1850-01-01'))
    ).toBe('0 of 0 true on this date');
  });
});

// The server page passes each layer, whose `filters` is a function, to the client map.
describe('layer files', () => {
  const files = globSync('features/map/layers/*.ts');

  it.each(files)('%s starts with the use client directive', file => {
    const code = readFileSync(file, 'utf8')
      .split('\n')
      .filter(line => !line.startsWith('//'))
      .join('\n')
      .trimStart();

    expect(code).toMatch(/^'use client';/);
  });
});
