import type { z } from 'zod';

import type { PersonView } from '@ks/lib/domain/persons/types.ts';
import type { relationshipInputSchema } from '@ks/lib/domain/relationships/schemas.mts';

/** A link of one Person, with the Person at its other end. */
export type LinkedPerson = { person: PersonView; relationship: Relationship };

/** How a parent is related to a child. */
export type ParentSubtype = Extract<
  RelationshipInput,
  { type: 'parent' }
>['subtype'];

/** Why `checkRelationship` refuses an input. */
export type Refusal =
  'cycle' | 'duplicate' | 'self' | 'third-biological-parent';

/** A saved Relationship. */
export type Relationship = { version: number } & RelationshipInput;

/** What a client saves for a Relationship. */
export type RelationshipInput = z.output<typeof relationshipInputSchema>;

/** Every result code of the Relationship actions: a refusal, a store error or an input error. */
export type RelationshipSaveError =
  | 'conflict'
  | 'divorce-before-marriage'
  | 'invalid'
  | 'not-found'
  | 'tree-full'
  | Refusal;
