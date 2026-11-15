import { describe, expect, it } from 'vitest';

import type { PersonSummary } from '@ks/lib/domain/persons/types';

import {
  byName,
  findPeople,
  matchesQuery,
} from '@ks/lib/domain/persons/list.mts';

const person = (fields: Partial<PersonSummary>): PersonSummary => ({
  born: '',
  bornReading: '',
  deceased: false,
  died: '',
  diedReading: '',
  givenNames: '',
  id: 'p',
  maidenName: '',
  surname: '',
  variants: [],
  ...fields,
});

const hendrik = person({ givenNames: 'Hendrik Willem', surname: 'Botha' });
const maria = person({
  givenNames: 'Maria',
  maidenName: 'Pretorius',
  surname: 'du Toit',
  variants: ['v.d. Merwe'],
});

// PPL-01
describe('byName', () => {
  it('orders by surname, ignoring case', () => {
    const list = [
      person({ givenNames: 'Anna', surname: 'van Wyk' }),
      person({ givenNames: 'Zed', surname: 'botha' }),
      person({ givenNames: 'Y', surname: 'Cloete' }),
    ];

    expect(list.sort(byName).map(({ surname }) => surname)).toEqual([
      'botha',
      'Cloete',
      'van Wyk',
    ]);
  });

  it('ignores accents', () => {
    const list = [
      person({ givenNames: 'B', surname: 'Eloff' }),
      person({ givenNames: 'A', surname: 'Éloff' }),
      person({ givenNames: 'C', surname: 'Ebersohn' }),
    ];

    // "Éloff" and "Eloff" tie, so the given names put A before B.
    expect(list.sort(byName).map(({ givenNames }) => givenNames)).toEqual([
      'C',
      'A',
      'B',
    ]);
  });

  it('breaks a tie on the given names', () => {
    const list = [
      person({ givenNames: 'Maria', surname: 'Botha' }),
      person({ givenNames: 'Hendrik', surname: 'Botha' }),
    ];

    expect(list.sort(byName).map(({ givenNames }) => givenNames)).toEqual([
      'Hendrik',
      'Maria',
    ]);
  });
});

// PPL-01, PPL-02
describe('findPeople', () => {
  const pieter = person({
    givenNames: 'Pieter',
    id: 'a',
    surname: 'Fourie',
    variants: ['Fouri'],
  });
  const susanna = person({
    givenNames: 'Susanna',
    id: 'b',
    maidenName: 'Fourie',
    surname: 'Botha',
  });
  const mariaE = person({
    givenNames: 'Maria',
    id: 'c',
    surname: 'Foury',
    variants: ['Fourie'],
  });

  it('sorts by name, then keeps each match', () => {
    expect(findPeople([mariaE, pieter, susanna], 'fourie')).toEqual([
      { match: {}, person: susanna },
      { match: {}, person: pieter },
      { match: { variant: 'Fourie' }, person: mariaE },
    ]);
  });

  it('lists everyone on a blank filter', () => {
    expect(
      findPeople([pieter, susanna], ' ').map(row => row.person.id)
    ).toEqual(['b', 'a']);
  });

  it('gives no rows when nothing matches', () => {
    expect(findPeople([pieter], 'zzz')).toEqual([]);
  });

  it('leaves its input in order', () => {
    const list = [pieter, susanna];

    findPeople(list, '');

    expect(list).toEqual([pieter, susanna]);
  });
});

// PPL-01
describe('matchesQuery', () => {
  it('matches everyone on an empty or blank query', () => {
    expect(matchesQuery(hendrik, '')).toEqual({});
    expect(matchesQuery(hendrik, '   ')).toEqual({});
  });

  it.each([
    'hend',
    'BOTHA',
    'botha',
    'hendrik willem botha',
    'botha, hendrik',
    'willem  bot',
  ])('matches %s on the name', query => {
    expect(matchesQuery(hendrik, query)).toEqual({});
  });

  it('matches without regard to accents', () => {
    expect(matchesQuery(person({ givenNames: 'André' }), 'andre')).toEqual({});
    expect(matchesQuery(person({ givenNames: 'Andre' }), 'ANDRÉ')).toEqual({});
  });

  it('matches the maiden name', () => {
    expect(matchesQuery(maria, 'pretor')).toEqual({});
  });

  it('matches a variant and says which one', () => {
    expect(matchesQuery(maria, 'v.d.')).toEqual({ variant: 'v.d. Merwe' });
  });

  it('prefers the name when both the name and a variant match', () => {
    expect(matchesQuery(maria, 'toit')).toEqual({});
  });

  it('does not match another Person', () => {
    expect(matchesQuery(hendrik, 'maria')).toBeUndefined();
    expect(matchesQuery(maria, 'zzz')).toBeUndefined();
  });
});
