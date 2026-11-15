import type { PersonId } from '#ks/lib/domain/ids/types.ts';
import type { PersonView } from '#ks/lib/domain/persons/types.ts';
import type {
  RelatedPerson,
  Relationship,
} from '#ks/lib/domain/relationships/types.ts';

import { byName } from '#ks/lib/domain/persons/list.mts';

/** The id at the other end of a Relationship, and its group. */
const otherEnd = (
  id: PersonId,
  relationship: Relationship
): [PersonId, 'children' | 'parents' | 'spouses'] | undefined => {
  if (relationship.type === 'parent') {
    if (relationship.childId === id) return [relationship.parentId, 'parents'];
    if (relationship.parentId === id) return [relationship.childId, 'children'];

    return undefined;
  }

  if (relationship.personAId === id) return [relationship.personBId, 'spouses'];
  if (relationship.personBId === id) return [relationship.personAId, 'spouses'];

  return undefined;
};

/**
 * The Relationships of one Person, in three groups, each sorted by surname, then given names
 * (PPL-02). `groupRelationships` omits a Relationship of another Person, and a Relationship whose
 * other Person is not in `people`.
 */
export const groupRelationships = (
  id: PersonId,
  relationships: Relationship[],
  people: ReadonlyMap<PersonId, PersonView>
): Record<'children' | 'parents' | 'spouses', RelatedPerson[]> => {
  const groups: Record<'children' | 'parents' | 'spouses', RelatedPerson[]> = {
    children: [],
    parents: [],
    spouses: [],
  };

  for (const relationship of relationships) {
    const end = otherEnd(id, relationship);
    const person = end && people.get(end[0]);

    if (end && person) groups[end[1]].push({ person, relationship });
  }

  for (const group of Object.values(groups)) {
    group.sort((a, b) => byName(a.person, b.person));
  }

  return groups;
};
