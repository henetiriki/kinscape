import { z } from 'zod';

import { fuzzyDateText } from '#ks/lib/domain/dates/schemas.mts';
import { parsePersonId, parseRelationshipId } from '#ks/lib/domain/ids/ids.mts';
import { idField } from '#ks/lib/domain/ids/schemas.mts';

/**
 * The most Relationships a list returns. A Tree holds about 2,000 Persons (NFR sizing) and about
 * 4,000 Relationships, so this leaves 2.5 times headroom.
 */
export const MAX_RELATIONSHIPS = 10_000;

const parentSchema = z.strictObject({
  childId: idField(parsePersonId),
  id: idField(parseRelationshipId),
  parentId: idField(parsePersonId),
  subtype: z.enum(['adoptive', 'biological', 'step']),
  type: z.literal('parent'),
});

const spouseSchema = z
  .strictObject({
    divorce: fuzzyDateText,
    id: idField(parseRelationshipId),
    marriage: fuzzyDateText,
    personAId: idField(parsePersonId),
    personBId: idField(parsePersonId),
    type: z.literal('spouse'),
  })
  .refine(
    ({ divorce, marriage }) =>
      divorce === undefined ||
      marriage === undefined ||
      divorce.latestDay >= marriage.earliestDay,
    { message: 'divorce is before marriage', path: ['divorce'] }
  );

/** What a client saves for a Relationship (PPL-02): a parent has a subtype, a spouse has dates. */
export const relationshipInputSchema = z.discriminatedUnion('type', [
  parentSchema,
  spouseSchema,
]);
