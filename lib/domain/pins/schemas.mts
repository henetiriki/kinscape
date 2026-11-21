import { z } from 'zod';

import { requiredFuzzyDate } from '#ks/lib/domain/dates/schemas.mts';
import {
  parsePersonId,
  parsePinId,
  parsePlaceId,
} from '#ks/lib/domain/ids/ids.mts';
import { idField } from '#ks/lib/domain/ids/schemas.mts';
import { MAX_NOTES } from '#ks/lib/domain/persons/schemas.mts';
import { placeInputSchema } from '#ks/lib/domain/places/schemas.mts';
import { textField } from '#ks/lib/domain/text/schemas.mts';

/** The caps of a Pin's address and sources. A form uses them to set the same limit. */
export const MAX_ADDRESS = 500;
export const MAX_SOURCES = 10_000;

/** The most Pins that `listPins` and `listPinsOn` return, ordered by id (a Tree holds 10,000). */
export const MAX_PINS = 10_000;

/**
 * The Event types (PIN-03), in the order of `EVENT_ORDER` in `lib/ui`: `lib/ui` may not import
 * the domain, so a test keeps the two lists equal. `land` is land ownership and `baptism` is
 * baptism or christening.
 */
export const EVENT_TYPES = [
  'birth',
  'baptism',
  'residence',
  'marriage',
  'divorce',
  'death',
  'burial',
  'land',
  'occupation',
  'other',
] as const;

/** What a client may save for a Pin (PIN-03): a Person at a Place on a date. */
export const pinInputSchema = z.strictObject({
  address: textField(MAX_ADDRESS).default(''),
  date: requiredFuzzyDate,
  eventType: z.enum(EVENT_TYPES),
  id: idField(parsePinId),
  notes: textField(MAX_NOTES).default(''),
  personId: idField(parsePersonId),
  placeId: idField(parsePlaceId),
  sources: textField(MAX_SOURCES).default(''),
});

/**
 * The Place of a form Pin (PIN-02): a new point, with the id that the client made so a repeat saves
 * no second Place, or the id of an existing Place.
 */
const formPlaceSchema = z.discriminatedUnion('kind', [
  z.strictObject({ ...placeInputSchema.shape, kind: z.literal('new') }),
  z.strictObject({
    id: idField(parsePlaceId),
    kind: z.literal('existing'),
  }),
]);

/** What `createPinAction` takes: `pinInputSchema` with `place` in the place of `placeId`. */
export const pinFormSchema = z.strictObject({
  ...pinInputSchema.omit({ placeId: true }).shape,
  place: formPlaceSchema,
});
