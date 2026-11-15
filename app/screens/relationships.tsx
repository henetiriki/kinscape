import type {
  RelationshipEntry,
  RelationshipsPerson,
} from '@ks/features/people';
import type { FuzzyDate } from '@ks/lib/domain/dates/types';

import { signOutAction } from '@ks/app/sign-in/actions';
import { PersonRelationships } from '@ks/features/people';
import { fuzzyDateOf } from '@ks/lib/domain/dates/fuzzy-date.mts';
import { personDates, spouseDates } from '@ks/lib/domain/persons/dates.mts';

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

/**
 * The Relationships page in one state, with a synthetic Account. `empty` is a Person with no
 * Relationships. `failed` is a load that threw.
 */
export const RelationshipsScreen = ({
  empty,
  failed,
}: {
  empty?: boolean;
  failed?: boolean;
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
      person={SAMPLE_SUBJECT}
    />
  );
};
