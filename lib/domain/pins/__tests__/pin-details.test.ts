import { describe, expect, it } from 'vitest';

import type { PersonView } from '@ks/lib/domain/persons/types.ts';
import type { Pin } from '@ks/lib/domain/pins/types.ts';
import type { Place } from '@ks/lib/domain/places/types.ts';

import { fuzzyDateOf } from '@ks/lib/domain/dates/fuzzy-date.mts';
import {
  parsePersonId,
  parsePinId,
  parsePlaceId,
} from '@ks/lib/domain/ids/ids.mts';
import { pinDetails } from '@ks/lib/domain/pins/pin-details.mts';

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

const person = {
  givenNames: 'Ana Maria',
  id: parsePersonId(PERSON_ID)!,
  living: false,
  notes: 'A person note',
  surname: 'Smit',
  version: 4,
} as unknown as PersonView;

const place: Place = {
  id: parsePlaceId('01900000-0000-7000-a000-0000000000c1')!,
  latitude: -29.12,
  longitude: 26.21,
  precision: 'town',
  version: 3,
};

describe('pinDetails', () => {
  it('holds only the names, the event type, the address and the precision of the Place', () => {
    const details = pinDetails(pin, person, place);

    expect(Object.keys(details).sort()).toEqual([
      'address',
      'eventType',
      'givenNames',
      'precision',
      'surname',
    ]);
    expect(details).toEqual({
      address: '1 Church Street',
      eventType: 'baptism',
      givenNames: 'Ana Maria',
      precision: 'town',
      surname: 'Smit',
    });
  });
});
