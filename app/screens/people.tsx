import type { FuzzyDate } from '@ks/lib/domain/dates/types';
import type { PersonSummary } from '@ks/lib/domain/persons/types';

import { SAMPLE_ACCOUNT } from '@ks/app/screens/account';
import { signOutAction } from '@ks/app/sign-in/actions';
import { PeopleList } from '@ks/features/people';
import { fuzzyDateOf } from '@ks/lib/domain/dates/fuzzy-date.mts';
import { personDates } from '@ks/lib/domain/persons/dates.mts';

const exact = (date: string) => fuzzyDateOf('EXACT', date);

const person = (
  id: string,
  surname: string,
  givenNames: string,
  born: FuzzyDate,
  died: FuzzyDate | undefined,
  more: Partial<PersonSummary> = {}
): PersonSummary => ({
  ...personDates({ birth: born, death: died, deceased: false }),
  givenNames,
  id,
  maidenName: '',
  surname,
  variants: [],
  ...more,
});

/** The twelve synthetic Persons of the `people-list` board. */
export const SAMPLE_PEOPLE: PersonSummary[] = [
  person('p01', 'Botha', 'Hendrik Willem', exact('1832'), exact('1899')),
  person('p02', 'Botha', 'Susanna', fuzzyDateOf('ABT', '1835'), exact('1901'), {
    maidenName: 'Fourie',
  }),
  person(
    'p03',
    'du Toit',
    'Maria Magdalena',
    fuzzyDateOf('ABT', '1856'),
    exact('1930'),
    { maidenName: 'Rossouw' }
  ),
  person('p04', 'Fourie', 'Pieter', fuzzyDateOf('BEF', '1840'), undefined, {
    deceased: true,
  }),
  person('p05', 'le Roux', 'Anna Catharina', exact('1871'), exact('1948')),
  person(
    'p06',
    'Nel',
    'Cornelis Johannes',
    exact('1868'),
    fuzzyDateOf('AFT', '1920')
  ),
  person('p07', 'Nel', 'Elsie', exact('1874'), exact('1952'), {
    maidenName: 'van Wyk',
  }),
  person(
    'p08',
    'Rossouw',
    'Jacobus',
    fuzzyDateOf('ABT', '1850'),
    exact('1912')
  ),
  person('p09', 'Rossouw', 'Johanna Petronella', exact('1878'), undefined),
  person(
    'p10',
    'Rossouw',
    'Willem',
    fuzzyDateOf('BET', '1880', '1885'),
    exact('1961')
  ),
  person('p11', 'van Wyk', 'Gerrit', exact('1845'), exact('1910')),
  person('p12', 'Viljoen', 'Aletta', fuzzyDateOf('ABT', '1860'), undefined, {
    maidenName: 'Botha',
  }),
];

/** The People page in one state, with a synthetic Account. */
export const PeopleScreen = ({
  failed,
  people = SAMPLE_PEOPLE,
}: {
  failed?: boolean;
  people?: PersonSummary[];
}) => (
  <PeopleList
    {...SAMPLE_ACCOUNT}
    failed={failed}
    onSignOut={signOutAction}
    people={people}
  />
);
