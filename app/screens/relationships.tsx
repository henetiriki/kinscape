import type {
  RelationshipEntry,
  RelationshipsPerson,
} from '@ks/features/people';
import type { FuzzyDate } from '@ks/lib/domain/dates/types';
import type { PersonSummary } from '@ks/lib/domain/persons/types';
import type { RelationshipGroup } from '@ks/lib/domain/relationships/types';

import { signOutAction } from '@ks/app/sign-in/actions';
import { PersonRelationships } from '@ks/features/people';
import { fuzzyDateOf } from '@ks/lib/domain/dates/fuzzy-date.mts';
import {
  personDates,
  personSummary,
  spouseDates,
} from '@ks/lib/domain/persons/dates.mts';

const exact = (year: string) => fuzzyDateOf('EXACT', year);

const parentOrChild = (
  id: string,
  surname: string,
  givenNames: string,
  subtype: NonNullable<RelationshipEntry['subtype']>,
  born: FuzzyDate,
  died: FuzzyDate
): RelationshipEntry => ({
  ...personDates({ birth: born, death: died, deceased: false }),
  givenNames,
  id,
  subtype,
  surname,
});

const spouse = (
  id: string,
  surname: string,
  givenNames: string,
  person: Parameters<typeof personDates>[0],
  relationship: Parameters<typeof spouseDates>[0]
): RelationshipEntry => ({
  ...personDates(person),
  ...spouseDates(relationship),
  givenNames,
  id,
  surname,
});

/** The synthetic Person of the `person-relationships` boards. */
const SAMPLE_SUBJECT: RelationshipsPerson = {
  ...personDates({
    birth: fuzzyDateOf('ABT', '1856'),
    death: exact('1930'),
    deceased: true,
  }),
  givenNames: 'Maria Magdalena',
  id: '01900000-0000-7000-8000-0000000000a1',
  surname: 'du Toit',
};

/** The synthetic Relationships of the `person-relationships` board. */
const SAMPLE_RELATIONSHIPS = {
  children: [
    parentOrChild(
      'c1',
      'du Toit',
      'Hendrik Willem',
      'biological',
      exact('1878'),
      exact('1951')
    ),
    parentOrChild(
      'c2',
      'du Toit',
      'Susanna',
      'adoptive',
      exact('1881'),
      exact('1948')
    ),
  ],
  parents: [
    parentOrChild(
      'p2',
      'Nel',
      'Johanna Petronella',
      'adoptive',
      fuzzyDateOf('ABT', '1828'),
      exact('1901')
    ),
    parentOrChild(
      'p1',
      'Rossouw',
      'Jacobus',
      'biological',
      exact('1822'),
      exact('1889')
    ),
    parentOrChild(
      'p3',
      'Visser',
      'Cornelis',
      'step',
      exact('1819'),
      exact('1890')
    ),
  ],
  spouses: [
    spouse(
      's3',
      'Botha',
      'Hendrik Willem',
      { birth: exact('1832'), death: exact('1899'), deceased: true },
      {}
    ),
    spouse(
      's2',
      'Fourie',
      'Pieter',
      { birth: fuzzyDateOf('BEF', '1840'), deceased: true },
      { marriage: fuzzyDateOf('EXACT', '1875-03') }
    ),
    spouse(
      's1',
      'van Wyk',
      'Gerrit',
      { birth: exact('1845'), death: exact('1910'), deceased: true },
      { divorce: exact('1890'), marriage: fuzzyDateOf('EXACT', '1875-03') }
    ),
  ],
};

const NO_RELATIONSHIPS = { children: [], parents: [], spouses: [] };

const sample = (
  id: string,
  surname: string,
  givenNames: string,
  dates: Parameters<typeof personDates>[0],
  more: Partial<Pick<PersonSummary, 'maidenName' | 'variants'>> = {}
): PersonSummary =>
  personSummary({
    ...dates,
    givenNames,
    id,
    maidenName: '',
    surname,
    variants: [],
    ...more,
  });

/** The synthetic Persons of the Tree, other than the subject: the picker's rows. */
const SAMPLE_PEOPLE: PersonSummary[] = [
  sample('o1', 'Rossouw', 'Jacobus', {
    birth: exact('1822'),
    death: exact('1889'),
    deceased: true,
  }),
  sample('o2', 'Nel', 'Johanna Petronella', {
    birth: fuzzyDateOf('ABT', '1828'),
    death: exact('1901'),
    deceased: true,
  }),
  sample('o3', 'Visser', 'Cornelis', {
    birth: exact('1819'),
    death: exact('1890'),
    deceased: true,
  }),
  sample('o4', 'du Toit', 'Hendrik Willem', {
    birth: exact('1878'),
    death: exact('1951'),
    deceased: true,
  }),
  sample('o5', 'du Toit', 'Susanna', {
    birth: exact('1881'),
    death: exact('1948'),
    deceased: true,
  }),
  sample(
    'o6',
    'van Wyk',
    'Gerrit',
    { birth: exact('1845'), death: exact('1910'), deceased: true },
    { variants: ['Van Wijk', 'Vanwyk'] }
  ),
  sample(
    'o7',
    'Fourie',
    'Pieter',
    { birth: fuzzyDateOf('BEF', '1840'), deceased: true },
    { variants: ['Fouri'] }
  ),
  sample(
    'o8',
    'Botha',
    'Hendrik Willem',
    { birth: exact('1832'), death: exact('1899'), deceased: true },
    { variants: ['Bota'] }
  ),
  sample(
    'o9',
    'Botha',
    'Susanna',
    {
      birth: fuzzyDateOf('ABT', '1835'),
      death: exact('1901'),
      deceased: true,
    },
    { maidenName: 'Fourie' }
  ),
  sample(
    'o10',
    'Foury',
    'Maria Elizabeth',
    { birth: exact('1858'), death: exact('1933'), deceased: true },
    { variants: ['Fourie'] }
  ),
  sample(
    'o11',
    'le Roux',
    'Anna Catharina',
    { birth: exact('1871'), death: exact('1948'), deceased: true },
    { variants: ['Leroux', 'Le Rous'] }
  ),
  sample(
    'o12',
    'Nel',
    'Cornelis Johannes',
    {
      birth: exact('1868'),
      death: fuzzyDateOf('AFT', '1920'),
      deceased: true,
    },
    { variants: ['Nell'] }
  ),
];

/**
 * The Relationships page in one state, with a synthetic Account. `empty` is a Person with no
 * Relationships, and with no other Person in the Tree. `failed` is a load that threw. `picking`
 * opens the picker of a group, with a filter.
 */
export const RelationshipsScreen = ({
  empty,
  failed,
  picking,
}: {
  empty?: boolean;
  failed?: boolean;
  picking?: { group: RelationshipGroup; query?: string };
}) => {
  const account = {
    email: 'researcher@example.com',
    initial: 'L',
    onSignOut: signOutAction,
  };

  return failed ? (
    <PersonRelationships {...account} failed person={SAMPLE_SUBJECT} />
  ) : (
    <PersonRelationships
      {...account}
      groups={empty ? NO_RELATIONSHIPS : SAMPLE_RELATIONSHIPS}
      people={empty ? [] : SAMPLE_PEOPLE}
      person={SAMPLE_SUBJECT}
      picking={picking}
    />
  );
};
