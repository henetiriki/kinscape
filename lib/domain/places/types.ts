import type { z } from 'zod';

import type { placeInputSchema } from '@ks/lib/domain/places/schemas.mts';

/** A saved Place. `version` starts at 1 and rises by 1 for each update. */
export type Place = { version: number } & PlaceInput;

/** What a client saves for a Place. */
export type PlaceInput = z.output<typeof placeInputSchema>;

/** How exactly a Place is known. Not the `Precision` of a date. */
export type PlacePrecision = PlaceInput['precision'];
