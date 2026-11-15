import { describe, expect, it } from 'vitest';

import type { PersonView } from '@ks/lib/domain/persons/types';
import type { Relationship } from '@ks/lib/domain/relationships/types';

import { parsePersonId } from '@ks/lib/domain/ids/ids.mts';
import {
  groupRelationships,
  linkedPersonIds,
} from '@ks/lib/domain/relationships/groups.mts';

const id = (n: number) =>
  parsePersonId(`01900000-0000-7000-8000-${String(n).padStart(12, '0')}`)!;

const rid = (n: number) =>
  `01900000-0000-7000-9000-${String(n).padStart(12, '0')}` as Relationship['id'];

const person = (n: number, surname: string, givenNames: string): PersonView =>
  ({
    givenNames,
    id: id(n),
    living: false,
    surname,
  }) as PersonView;

const parent = (
  n: number,
  parentId: number,
  childId: number
): Relationship => ({
  childId: id(childId),
  id: rid(n),
  parentId: id(parentId),
  subtype: 'biological',
  type: 'parent',
  version: 1,
});

const spouse = (n: number, a: number, b: number): Relationship => ({
  divorce: undefined,
  id: rid(n),
  marriage: undefined,
  personAId: id(a),
  personBId: id(b),
  type: 'spouse',
  version: 1,
});

const people = new Map(
  [
    person(1, 'du Toit', 'Maria'),
    person(2, 'Rossouw', 'Jacobus'),
    person(3, 'Nel', 'Johanna'),
    person(4, 'Botha', 'Hendrik'),
    person(5, 'Botha', 'Anna'),
    person(6, 'van Wyk', 'Gerrit'),
    person(7, 'Fourie', 'Pieter'),
  ].map(p => [p.id, p])
);

const names = (entries: { person: PersonView }[]) =>
  entries.map(
    ({ person: { givenNames, surname } }) => `${surname}, ${givenNames}`
  );

// PPL-02
describe('linkedPersonIds', () => {
  it('lists the Person at the other end of each link of the Person, once', () => {
    expect(
      linkedPersonIds(id(1), [
        parent(1, 2, 1),
        parent(2, 1, 4),
        spouse(3, 6, 1),
        spouse(4, 1, 6),
        parent(5, 4, 5),
      ])
    ).toEqual([id(2), id(4), id(6)]);
  });
});

// PPL-02
describe('groupRelationships', () => {
  it('splits the links of a Person into parents, children and spouses', () => {
    const groups = groupRelationships(
      id(1),
      [parent(1, 2, 1), parent(2, 1, 4), spouse(3, 6, 1), spouse(4, 1, 7)],
      people
    );

    expect(names(groups.parents)).toEqual(['Rossouw, Jacobus']);
    expect(names(groups.children)).toEqual(['Botha, Hendrik']);
    expect(names(groups.spouses)).toEqual([
      'Fourie, Pieter',
      'van Wyk, Gerrit',
    ]);
  });

  it('sorts each group by surname, then given names', () => {
    const groups = groupRelationships(
      id(1),
      [parent(1, 3, 1), parent(2, 2, 1), parent(3, 1, 4), parent(4, 1, 5)],
      people
    );

    expect(names(groups.parents)).toEqual(['Nel, Johanna', 'Rossouw, Jacobus']);
    expect(names(groups.children)).toEqual(['Botha, Anna', 'Botha, Hendrik']);
  });

  it('keeps the link with its Person', () => {
    const link = parent(1, 2, 1);

    expect(groupRelationships(id(1), [link], people).parents).toEqual([
      { person: people.get(id(2)), relationship: link },
    ]);
  });

  it('leaves out the links of other Persons', () => {
    const groups = groupRelationships(
      id(1),
      [parent(1, 4, 5), spouse(2, 6, 7)],
      people
    );

    expect(groups).toEqual({ children: [], parents: [], spouses: [] });
  });

  it('skips a link whose other Person is not in the map', () => {
    const groups = groupRelationships(id(1), [parent(1, 99, 1)], people);

    expect(groups.parents).toEqual([]);
  });
});
