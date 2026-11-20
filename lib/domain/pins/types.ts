import type { z } from 'zod';

import type { pinInputSchema } from '@ks/lib/domain/pins/schemas.mts';

/** The kind of life event a Pin records. `lib/ui/types.ts` has the same list for the UI. */
export type EventType = PinInput['eventType'];

/** A saved Pin. `version` starts at 1 and rises by 1 for each update. */
export type Pin = { version: number } & PinInput;

/** What a client saves for a Pin. */
export type PinInput = z.output<typeof pinInputSchema>;
