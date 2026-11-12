import type { z } from 'zod';

import type { relationshipInputSchema } from '@ks/lib/domain/relationships/schemas.mts';

/** How a parent is related to a child. */
export type ParentSubtype = Extract<
  RelationshipInput,
  { type: 'parent' }
>['subtype'];

/** Why `checkRelationship` refuses an input. */
export type Refusal =
  'cycle' | 'duplicate' | 'self' | 'third-biological-parent';

/** A saved Relationship. */
export type Relationship = RelationshipInput;

/** What a client saves for a Relationship. */
export type RelationshipInput = z.output<typeof relationshipInputSchema>;
