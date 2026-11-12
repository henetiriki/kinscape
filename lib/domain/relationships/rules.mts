import type { PersonId } from '#ks/lib/domain/ids/types.ts';
import type {
  Refusal,
  Relationship,
  RelationshipInput,
} from '#ks/lib/domain/relationships/types.ts';
import type { Result } from '#ks/lib/domain/result/types.ts';

import { err, ok } from '#ks/lib/domain/result/result.mts';

type ParentRelationship = Extract<Relationship, { type: 'parent' }>;

const MAX_BIOLOGICAL_PARENTS = 2;

const isParent = (value: Relationship): value is ParentRelationship =>
  value.type === 'parent';

const isDuplicate = (input: RelationshipInput, other: Relationship) => {
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

/** Whether a walk down from `start` through the parent Relationships reaches `target`. */
const reaches = (
  start: PersonId,
  target: PersonId,
  parents: ParentRelationship[]
) => {
  const childrenOf = new Map<PersonId, PersonId[]>();

  for (const { childId, parentId } of parents) {
    childrenOf.set(parentId, [...(childrenOf.get(parentId) ?? []), childId]);
  }

  const seen = new Set<PersonId>([start]);
  const queue = [start];

  for (let next = queue.shift(); next !== undefined; next = queue.shift()) {
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
  others: Relationship[]
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
  existing: Relationship[]
): Result<RelationshipInput, Refusal> => {
  const others = existing.filter(other => other.id !== input.id);

  if (
    input.type === 'parent'
      ? input.parentId === input.childId
      : input.personAId === input.personBId
  ) {
    return err('self');
  }

  if (others.some(other => isDuplicate(input, other))) {
    return err('duplicate');
  }

  const refusal =
    input.type === 'parent' ? parentRefusal(input, others) : undefined;

  return refusal === undefined ? ok(input) : err(refusal);
};
