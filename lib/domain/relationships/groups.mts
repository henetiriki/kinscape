import type { PersonId } from '#ks/lib/domain/ids/types.ts';
import type { PersonView } from '#ks/lib/domain/persons/types.ts';
import type {
  LinkedPerson,
  Relationship,
} from '#ks/lib/domain/relationships/types.ts';

import { byName } from '#ks/lib/domain/persons/list.mts';

/** The id at the other end of a link, and the group it falls in. */
const otherEnd = (
  id: PersonId,
  link: Relationship
): [PersonId, 'children' | 'parents' | 'spouses'] | undefined => {
  if (link.type === 'parent') {
    if (link.childId === id) return [link.parentId, 'parents'];
    if (link.parentId === id) return [link.childId, 'children'];

    return undefined;
  }

  if (link.personAId === id) return [link.personBId, 'spouses'];
  if (link.personBId === id) return [link.personAId, 'spouses'];

  return undefined;
};

/** The Persons at the other end of the links of one Person, each once. Read these, then group. */
export const linkedPersonIds = (
  id: PersonId,
  relationships: Relationship[]
): PersonId[] => [
  ...new Set(
    relationships.flatMap(link => {
      const end = otherEnd(id, link);

      return end ? [end[0]] : [];
    })
  ),
];

/**
 * The links of one Person, in three groups, each sorted by surname, then given names (PPL-02). A
 * link of another Person, or one whose other Person is not in `people`, is left out.
 */
export const groupRelationships = (
  id: PersonId,
  relationships: Relationship[],
  people: ReadonlyMap<PersonId, PersonView>
): Record<'children' | 'parents' | 'spouses', LinkedPerson[]> => {
  const groups: Record<'children' | 'parents' | 'spouses', LinkedPerson[]> = {
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
