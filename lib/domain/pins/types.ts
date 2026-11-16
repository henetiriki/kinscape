import type { z } from 'zod';

import type { pinInputSchema } from '@ks/lib/domain/pins/schemas.mts';

/** The kind of life event a Pin records. `lib/ui/types.ts` has the same list for the UI. */
export type EventType = PinInput['eventType'];

/** What a client saves for a Pin. */
export type PinInput = z.output<typeof pinInputSchema>;
