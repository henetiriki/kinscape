import { describe, expect, it } from 'vitest';

import type { SpannedPin } from '@ks/lib/domain/pins/types.ts';
import type { Place } from '@ks/lib/domain/places/types.ts';

import { toDay } from '@ks/lib/domain/boundaries/model.mts';
import { fuzzyDateOf } from '@ks/lib/domain/dates/fuzzy-date.mts';
import {
  parsePersonId,
  parsePinId,
  parsePlaceId,
} from '@ks/lib/domain/ids/ids.mts';
import { mapPins } from '@ks/lib/domain/pins/map-pins.mts';

// PIN-02, NFR-03.
const id = (last: string) => `01900000-0000-7000-8000-0000000000${last}`;

const place = (last: string, latitude: number, longitude: number): Place => ({
  id: parsePlaceId(id(last))!,
  latitude,
  longitude,
  precision: 'town',
  version: 3,
});

const pin = (last: string, placeLast: string): SpannedPin => ({
  address: '1 Church Street',
  date: fuzzyDateOf('EXACT', '1850-03-04'),
  eventType: 'baptism',
  id: parsePinId(id(last))!,
  notes: 'A private note',
  personId: parsePersonId(id('p1'))!,
  placeId: parsePlaceId(id(placeLast))!,
  sources: 'A parish register',
  span: { validFrom: toDay('1850-03-04'), validTo: toDay('1850-03-05') },
  version: 2,
});

describe('mapPins', () => {
  it('holds only the id, the position, the span and the event type of each Pin', () => {
    const [mapped] = mapPins([pin('a1', 'b1')], [place('b1', -33.9, 18.4)]);

    expect(Object.keys(mapped).sort()).toEqual([
      'eventType',
      'id',
      'latitude',
      'longitude',
      'span',
    ]);
    expect(mapped).toEqual({
      eventType: 'baptism',
      id: id('a1'),
      latitude: -33.9,
      longitude: 18.4,
      span: { validFrom: toDay('1850-03-04'), validTo: toDay('1850-03-05') },
    });
  });

  it('gives each Pin the position of its own Place', () => {
    const places = [place('b1', -33.9, 18.4), place('b2', -26.2, 28.0)];

    expect(
      mapPins([pin('a1', 'b2'), pin('a2', 'b1')], places).map(mapped => [
        mapped.id,
        mapped.latitude,
        mapped.longitude,
      ])
    ).toEqual([
      [id('a1'), -26.2, 28.0],
      [id('a2'), -33.9, 18.4],
    ]);
  });

  it('gives two Pins on one Place the same position', () => {
    const mapped = mapPins(
      [pin('a1', 'b1'), pin('a2', 'b1')],
      [place('b1', -33.9, 18.4)]
    );

    expect(mapped).toHaveLength(2);
    expect(mapped[0]).toMatchObject({ latitude: -33.9, longitude: 18.4 });
    expect(mapped[1]).toMatchObject({ latitude: -33.9, longitude: 18.4 });
  });

  it('drops a Pin whose Place is not in the list', () => {
    expect(
      mapPins(
        [pin('a1', 'b1'), pin('a2', 'b9')],
        [place('b1', -33.9, 18.4)]
      ).map(mapped => mapped.id)
    ).toEqual([id('a1')]);
  });

  it('gives no Pin for an empty Tree', () => {
    expect(mapPins([], [])).toEqual([]);
    expect(mapPins([], [place('b1', -33.9, 18.4)])).toEqual([]);
  });
});
