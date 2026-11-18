import { describe, expect, it } from 'vitest';

import { FIXTURES, MARIA } from '@ks/server/auth/fixtures.mts';

describe('FIXTURES', () => {
  it('has the emails and Trees of the Specs', () => {
    expect(FIXTURES.map(fixture => [fixture.email, fixture.treeName])).toEqual([
      ['researcher@example.com', 'Researcher Tree'],
      ['r.family@example.com', 'Family Tree'],
      ['r.alone@example.com', 'Alone Tree'],
    ]);
  });

  it('starts each email with "r", for the avatar letter', () => {
    for (const fixture of FIXTURES) {
      expect(fixture.email.startsWith('r')).toBe(true);
    }
  });

  it('holds 13 People and 8 Relationships in the Family Tree', () => {
    const family = FIXTURES.find(fixture => fixture.email.includes('family'))!;

    expect(family.persons).toHaveLength(13);
    expect(family.relationships).toHaveLength(8);
    expect(family.persons).toContain(MARIA);
  });

  it('holds Maria alone in the Alone Tree', () => {
    const alone = FIXTURES.find(fixture => fixture.email.includes('alone'))!;

    expect(alone.persons).toEqual([MARIA]);
    expect(alone.relationships).toEqual([]);
  });

  it('holds no Person or Relationship in the researcher Tree', () => {
    expect(FIXTURES[0].persons).toEqual([]);
    expect(FIXTURES[0].relationships).toEqual([]);
  });

  it('gives Maria the fields of the board Person-edit', () => {
    expect(MARIA).toMatchObject({
      deceased: true,
      givenNames: 'Maria Magdalena',
      id: '01900000-0000-7000-8000-0000000000a1',
      maidenName: 'Rossouw',
      sex: 'F',
      surname: 'du Toit',
      variants: ['Du Toit', 'Dutoit', 'Du Tois'],
    });
  });

  // Data rules: each fixture Person is deceased.
  it('makes each Person deceased', () => {
    for (const fixture of FIXTURES) {
      for (const person of fixture.persons) {
        expect(person.deceased).toBe(true);
      }
    }
  });

  it('puts both ends of each Relationship in its Tree', () => {
    for (const fixture of FIXTURES) {
      const ids = new Set(fixture.persons.map(person => person.id));

      for (const relationship of fixture.relationships) {
        const ends =
          relationship.type === 'parent'
            ? [relationship.parentId, relationship.childId]
            : [relationship.personAId, relationship.personBId];

        for (const end of ends) {
          expect(ids.has(end)).toBe(true);
        }
      }
    }
  });
});
