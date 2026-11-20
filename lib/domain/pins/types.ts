import type { z } from 'zod';

import type { pinInputSchema } from '@ks/lib/domain/pins/schemas.mts';
import type { Place } from '@ks/lib/domain/places/types.ts';
import type { Validity } from '@ks/lib/domain/validity/types.ts';

/** The kind of life event a Pin records. `lib/ui/types.ts` has the same list for the UI. */
export type EventType = PinInput['eventType'];

/**
 * What the map needs of a Pin (NFR-03): the position of its Place, its span and its event type.
 * It holds no Place id, Person id, date, address, source or note.
 */
export type MapPin = {
  eventType: EventType;
  id: Pin['id'];
  span: Validity;
} & Pick<Place, 'latitude' | 'longitude'>;

/** A saved Pin. `version` starts at 1 and rises by 1 for each update. */
export type Pin = { version: number } & PinInput;

/** What a client saves for a Pin. */
export type PinInput = z.output<typeof pinInputSchema>;

/** A Pin with the days it shows: its date clipped by the birth and death of its Person. */
export type SpannedPin = { span: Validity } & Pin;
