import { featureFilter } from '@maplibre/maplibre-gl-style-spec';
import { globSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

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
    const [drawing] = layer.layers;

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

  it('names its panel row and the filter of its one layer', () => {
    expect(layer.label).toBe('Pins');
    expect(layer.id).toBe('pins');
    expect(Object.keys(layer.filters(toDay('1850-01-01')))).toEqual(['pins']);
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
