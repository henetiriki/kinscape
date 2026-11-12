import { describe, expect, it } from 'vitest';

import type { PersonId, RelationshipId } from '@ks/lib/domain/ids/types.ts';
import type {
  ParentSubtype,
  Relationship,
} from '@ks/lib/domain/relationships/types.ts';

import { checkRelationship } from '@ks/lib/domain/relationships/rules.mts';

const person = (n: number) =>
  `00000000-0000-4000-8000-00000000000${n}` as PersonId;
const rid = (n: number) =>
  `00000000-0000-4000-9000-0000000000${String(n).padStart(2, '0')}` as RelationshipId;

const parent = (
  id: number,
  parentId: number,
  childId: number,
  subtype: ParentSubtype = 'biological'
): Relationship => ({
  childId: person(childId),
  id: rid(id),
  parentId: person(parentId),
  subtype,
  type: 'parent',
});

const spouse = (id: number, a: number, b: number): Relationship => ({
  id: rid(id),
  personAId: person(a),
  personBId: person(b),
  type: 'spouse',
});

const refusal = (input: Relationship, existing: Relationship[]) => {
  const result = checkRelationship(input, existing);

  return result.ok ? undefined : result.error;
};

// PPL-02
describe('checkRelationship', () => {
  it('refuses a cycle of two', () => {
    expect(refusal(parent(2, 2, 1), [parent(1, 1, 2)])).toBe('cycle');
  });

  it('refuses a cycle of three', () => {
    expect(refusal(parent(3, 3, 1), [parent(1, 1, 2), parent(2, 2, 3)])).toBe(
      'cycle'
    );
  });

  it('accepts a parent that makes no cycle', () => {
    expect(
      checkRelationship(parent(3, 1, 3), [parent(1, 1, 2), parent(2, 2, 3)]).ok
    ).toBe(true);
  });

  it('handles a Person with two parents in a diamond', () => {
    const existing = [
      parent(1, 1, 2),
      parent(2, 1, 3),
      parent(3, 2, 4),
      parent(4, 3, 4),
    ];

    expect(refusal(parent(5, 4, 1), existing)).toBe('cycle');
    expect(checkRelationship(parent(5, 1, 4, 'step'), existing).ok).toBe(true);
  });

  const two = [parent(1, 1, 3), parent(2, 2, 3)];

  it('refuses a third biological parent', () => {
    expect(refusal(parent(3, 4, 3), two)).toBe('third-biological-parent');
  });

  it('accepts an adoptive or step parent as a third', () => {
    expect(checkRelationship(parent(3, 4, 3, 'adoptive'), two).ok).toBe(true);
    expect(checkRelationship(parent(3, 4, 3, 'step'), two).ok).toBe(true);
  });

  it('refuses an adoptive parent updated to biological', () => {
    const existing = [...two, parent(3, 4, 3, 'adoptive')];

    expect(refusal(parent(3, 4, 3), existing)).toBe('third-biological-parent');
  });

  it('accepts an update of a biological parent with the same subtype', () => {
    expect(checkRelationship(parent(1, 1, 3), two).ok).toBe(true);
  });

  it('refuses a Person as their own parent', () => {
    expect(refusal(parent(1, 1, 1), [])).toBe('self');
  });

  it('refuses a Person as their own spouse', () => {
    expect(refusal(spouse(1, 1, 1), [])).toBe('self');
  });

  it('refuses the same spouses in the other order', () => {
    expect(refusal(spouse(2, 2, 1), [spouse(1, 1, 2)])).toBe('duplicate');
  });

  it('accepts a second spouse', () => {
    expect(checkRelationship(spouse(2, 1, 3), [spouse(1, 1, 2)]).ok).toBe(true);
  });

  it('refuses a biological parent added again as adoptive', () => {
    expect(refusal(parent(2, 1, 2, 'adoptive'), [parent(1, 1, 2)])).toBe(
      'duplicate'
    );
  });

  it('ignores the Relationship that the input updates', () => {
    expect(checkRelationship(spouse(1, 2, 1), [spouse(1, 1, 2)]).ok).toBe(true);
  });

  it('checks self before duplicate', () => {
    expect(refusal(parent(2, 1, 1), [parent(1, 1, 1)])).toBe('self');
  });

  it('refuses a spouse that shares a parent id pair only for the same type', () => {
    expect(checkRelationship(spouse(2, 1, 2), [parent(1, 1, 2)]).ok).toBe(true);
  });
});
