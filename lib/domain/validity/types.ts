import type { Day } from '@ks/lib/domain/boundaries/types.ts';

/** The days a fact holds: `[validFrom, validTo)`, so `validTo` is exclusive; null = still current. */
export type Validity = { validFrom: Day; validTo: Day | null };
