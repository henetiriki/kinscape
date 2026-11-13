import type { PersonSummary } from '@ks/lib/domain/persons/types';

import { signOutAction } from '@ks/app/sign-in/actions';
import { PeopleList } from '@ks/features/people';

const person = (
  id: string,
  surname: string,
  givenNames: string,
  born: string,
  died: string,
  more: Partial<PersonSummary> = {}
): PersonSummary => ({
  born,
  deceased: false,
  died,
  givenNames,
  id,
  maidenName: '',
  surname,
  variants: [],
  ...more,
});

/** The twelve synthetic Persons of the `people-list` board. */
export const SAMPLE_PEOPLE: PersonSummary[] = [
  person('p01', 'Botha', 'Hendrik Willem', '1832', '1899'),
  person('p02', 'Botha', 'Susanna', 'c. 1835', '1901', {
    maidenName: 'Fourie',
  }),
  person('p03', 'du Toit', 'Maria Magdalena', 'c. 1856', '1930', {
    maidenName: 'Rossouw',
  }),
  person('p04', 'Fourie', 'Pieter', 'bef. 1840', '', { deceased: true }),
  person('p05', 'le Roux', 'Anna Catharina', '1871', '1948'),
  person('p06', 'Nel', 'Cornelis Johannes', '1868', 'aft. 1920'),
  person('p07', 'Nel', 'Elsie', '1874', '1952', { maidenName: 'van Wyk' }),
  person('p08', 'Rossouw', 'Jacobus', 'c. 1850', '1912'),
  person('p09', 'Rossouw', 'Johanna Petronella', '1878', ''),
  person('p10', 'Rossouw', 'Willem', '1880–1885', '1961'),
  person('p11', 'van Wyk', 'Gerrit', '1845', '1910'),
  person('p12', 'Viljoen', 'Aletta', 'c. 1860', '', { maidenName: 'Botha' }),
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
    email='researcher@example.com'
    failed={failed}
    initial='L'
    onSignOut={signOutAction}
    people={people}
  />
);
