import type { z } from 'zod';

import type { personInputSchema } from '@ks/lib/domain/persons/schemas.mts';

/** A saved Person. `version` counts saves; an update names the one it read. */
export type Person = { version: number } & PersonInput;

/** What a client saves. A name or note with nothing in it is the empty string. */
export type PersonInput = z.output<typeof personInputSchema>;

/** A Person as a Viewer sees it. The server derives `living` on read and never stores it. */
export type PersonView = { living: boolean } & Person;

/** GEDCOM 7 codes: male, female, intersex (X) and unknown. */
export type Sex = PersonInput['sex'];
