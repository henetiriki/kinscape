import { describe, expect, it } from 'vitest';

import type { Pin } from '@ks/lib/domain/pins/types.ts';
import type { Place } from '@ks/lib/domain/places/types.ts';

import { fuzzyDateOf } from '@ks/lib/domain/dates/fuzzy-date.mts';
import {
  parsePersonId,
  parsePinId,
  parsePlaceId,
} from '@ks/lib/domain/ids/ids.mts';
import { pinEditFields } from '@ks/lib/domain/pins/pin-edit.mts';

// PIN-02, NFR-10. Data is synthetic.
const PERSON_ID = '01900000-0000-7000-8000-0000000000a1';

const pin: Pin = {
  address: '1 Church Street',
  date: fuzzyDateOf('EXACT', '1850-03-04'),
  eventType: 'baptism',
  id: parsePinId('01900000-0000-7000-b000-0000000000d1')!,
  notes: 'A private note',
  personId: parsePersonId(PERSON_ID)!,
  placeId: parsePlaceId('01900000-0000-7000-a000-0000000000c1')!,
  sources: 'A parish register',
  version: 2,
};

const place: Place = {
  id: parsePlaceId('01900000-0000-7000-a000-0000000000c1')!,
  latitude: -29.12,
  longitude: 26.21,
  precision: 'town',
  version: 3,
};

describe('pinEditFields', () => {
  it('holds the fields of the form and no Pin id or Place id', () => {
    const fields = pinEditFields(pin, place);

    expect(Object.keys(fields).sort()).toEqual([
      'address',
      'date',
      'eventType',
      'latitude',
      'longitude',
      'notes',
      'personId',
      'precision',
      'sources',
      'version',
    ]);
    expect(fields).toEqual({
      address: '1 Church Street',
      date: '4 MAR 1850',
      eventType: 'baptism',
      latitude: -29.12,
      longitude: 26.21,
      notes: 'A private note',
      personId: PERSON_ID,
      precision: 'town',
      sources: 'A parish register',
      version: 2,
    });
  });
});
