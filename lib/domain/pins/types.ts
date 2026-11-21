import type { z } from 'zod';

import type { FuzzyDate, FuzzyDateError } from '@ks/lib/domain/dates/types.ts';
import type { pinInputSchema } from '@ks/lib/domain/pins/schemas.mts';
import type { Place, PlaceInput } from '@ks/lib/domain/places/types.ts';
import type { Validity } from '@ks/lib/domain/validity/types.ts';

/** What `checkPin` returns: the Pin, and its new Place for a new point. */
export type CheckedPin = { pin: PinInput; place?: PlaceInput };

/** The kind of life event a Pin records. `lib/ui/types.ts` has the same list for the UI. */
export type EventType = PinInput['eventType'];

/**
 * What the map needs of a Pin (NFR-03): the position of its Place, its span, its event type and the
 * parts of its date. `date2` is there only for a Pin with two dates. It holds no Place id, Person
 * id, address, source or note.
 */
export type MapPin = {
  eventType: EventType;
  id: Pin['id'];
  span: Validity;
} & Pick<FuzzyDate, 'date1' | 'date2' | 'qualifier'> &
  Pick<Place, 'latitude' | 'longitude'>;

/** A saved Pin. `version` starts at 1 and rises by 1 for each update. */
export type Pin = { version: number } & PinInput;

/** What the popup shows of a Pin beyond the Pin of the map (PIN-02). It holds no date. */
export type PinDetails = {
  address: PinInput['address'];
  eventType: EventType;
  givenNames: string;
  surname: string;
};

/** The error kind of each form field that failed. A kind never holds input text. */
export type PinFieldErrors = {
  fields: {
    address?: 'too-long';
    date?: 'required' | FuzzyDateError;
    eventType?: 'required' | 'unknown';
    latitude?: 'not-a-number' | 'out-of-range' | 'required';
    longitude?: 'not-a-number' | 'out-of-range' | 'required';
    notes?: 'too-long';
    personId?: 'required';
    place?: 'required';
    precision?: 'unknown';
    sources?: 'too-long';
  };
};

/** What a client saves for a Pin. */
export type PinInput = z.output<typeof pinInputSchema>;

/** A Pin with the days it shows: its date clipped by the birth and death of its Person. */
export type SpannedPin = { span: Validity } & Pin;
