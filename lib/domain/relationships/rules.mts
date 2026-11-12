import type { PersonId } from '#ks/lib/domain/ids/types.ts';
import type {
  Refusal,
  RelationshipInput,
} from '#ks/lib/domain/relationships/types.ts';
import type { Result } from '#ks/lib/domain/result/types.ts';

import { err, ok } from '#ks/lib/domain/result/result.mts';

type ParentRelationship = Extract<RelationshipInput, { type: 'parent' }>;

const MAX_BIOLOGICAL_PARENTS = 2;

const isParent = (value: RelationshipInput): value is ParentRelationship =>
  value.type === 'parent';

/** The Persons a Relationship joins: the parent then the child, or Person A then Person B. */
export const endsOf = (
  relationship: RelationshipInput
): readonly [PersonId, PersonId] =>
  relationship.type === 'parent'
    ? [relationship.parentId, relationship.childId]
    : [relationship.personAId, relationship.personBId];

const isDuplicate = (input: RelationshipInput, other: RelationshipInput) => {
  if (input.type === 'parent') {
    return (
      isParent(other) &&
      other.parentId === input.parentId &&
      other.childId === input.childId
    );
  }

  return (
    other.type === 'spouse' &&
    ((other.personAId === input.personAId &&
      other.personBId === input.personBId) ||
      (other.personAId === input.personBId &&
        other.personBId === input.personAId))
  );
};

/** Whether a walk from `start` to its children, and their children, reaches `target`. */
const reaches = (
  start: PersonId,
  target: PersonId,
  parents: ParentRelationship[]
) => {
  const childrenOf = new Map<PersonId, PersonId[]>();

  for (const { childId, parentId } of parents) {
    const list = childrenOf.get(parentId);

    if (list) {
      list.push(childId);
    } else {
      childrenOf.set(parentId, [childId]);
    }
  }

  const seen = new Set<PersonId>([start]);
  const queue = [start];

  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const next = queue[cursor];

    if (next === target) {
      return true;
    }

    for (const child of childrenOf.get(next) ?? []) {
      if (!seen.has(child)) {
        seen.add(child);
        queue.push(child);
      }
    }
  }

  return false;
};

const parentRefusal = (
  input: ParentRelationship,
  others: RelationshipInput[]
): Refusal | undefined => {
  const parents = others.filter(isParent);

  if (
    input.subtype === 'biological' &&
    parents.filter(
      other => other.childId === input.childId && other.subtype === 'biological'
    ).length >= MAX_BIOLOGICAL_PARENTS
  ) {
    return 'third-biological-parent';
  }

  return reaches(input.childId, input.parentId, parents) ? 'cycle' : undefined;
};

/**
 * Whether `input` may join `existing` (PPL-02). A Relationship in `existing`
 * with the id of `input` is the one an update replaces, so it does not count.
 * When two refusals apply, the first of `self`, `duplicate`,
 * `third-biological-parent` and `cycle` shows.
 */
export const checkRelationship = (
  input: RelationshipInput,
  existing: RelationshipInput[]
): Result<RelationshipInput, Refusal> => {
  const others = existing.filter(other => other.id !== input.id);

  const [first, second] = endsOf(input);

  if (first === second) {
    return err('self');
  }

  if (others.some(other => isDuplicate(input, other))) {
    return err('duplicate');
  }

  const refusal =
    input.type === 'parent' ? parentRefusal(input, others) : undefined;

  return refusal === undefined ? ok(input) : err(refusal);
};
