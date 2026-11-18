import type { PersonInput } from '#ks/lib/domain/persons/types.ts';
import type { RelationshipInput } from '#ks/lib/domain/relationships/types.ts';

import { parseAccountId, parseTreeId } from '#ks/lib/domain/ids/ids.mts';
import { personInputSchema } from '#ks/lib/domain/persons/schemas.mts';
import { relationshipInputSchema } from '#ks/lib/domain/relationships/schemas.mts';

type PersonRow = {
  birth?: string;
  death?: string;
  givenNames: string;
  maidenName?: string;
  n: number;
  surname: string;
  variants?: string[];
};

/** The id of the other Person `o<n>`, from `o1` to `o12`. */
const personId = (n: number) => `01900000-0000-7000-8000-000000000${100 + n}`;

/** The id of a Relationship of Maria. */
const relationshipId = (n: number) =>
  `01900000-0000-7000-8000-000000000${200 + n}`;

/** A synthetic Person. The module throws on load if a date or an id is bad. */
const person = ({ n, ...row }: PersonRow): PersonInput =>
  personInputSchema.parse({ ...row, deceased: true, id: personId(n) });

/** A Relationship, parsed so that a bad id or date throws when the module loads. */
const relationship = (row: object): RelationshipInput =>
  relationshipInputSchema.parse(row);

/** Maria Magdalena du Toit, the Person of the boards `Person-edit` and `Person-relationships`. */
export const MARIA: PersonInput = personInputSchema.parse({
  birth: 'ABT 1856',
  death: '14 MAR 1930',
  deceased: true,
  givenNames: 'Maria Magdalena',
  id: '01900000-0000-7000-8000-0000000000a1',
  maidenName: 'Rossouw',
  notes: 'Her baptism record spells the family name Rossau.',
  sex: 'F',
  surname: 'du Toit',
  variants: ['Du Toit', 'Dutoit', 'Du Tois'],
});

const OTHERS: PersonInput[] = [
  person({
    birth: '1822',
    death: '1889',
    givenNames: 'Jacobus',
    n: 1,
    surname: 'Rossouw',
  }),
  person({
    birth: 'ABT 1828',
    death: '1901',
    givenNames: 'Johanna Petronella',
    n: 2,
    surname: 'Nel',
  }),
  person({
    birth: '1819',
    death: '1890',
    givenNames: 'Cornelis',
    n: 3,
    surname: 'Visser',
  }),
  person({
    birth: '1878',
    death: '1951',
    givenNames: 'Hendrik Willem',
    n: 4,
    surname: 'du Toit',
  }),
  person({
    birth: '1881',
    death: '1948',
    givenNames: 'Susanna',
    n: 5,
    surname: 'du Toit',
  }),
  person({
    birth: '1845',
    death: '1910',
    givenNames: 'Gerrit',
    n: 6,
    surname: 'van Wyk',
    variants: ['Van Wijk', 'Vanwyk'],
  }),
  person({
    birth: 'BEF 1840',
    givenNames: 'Pieter',
    n: 7,
    surname: 'Fourie',
    variants: ['Fouri'],
  }),
  person({
    birth: '1832',
    death: '1899',
    givenNames: 'Hendrik Willem',
    n: 8,
    surname: 'Botha',
    variants: ['Bota'],
  }),
  person({
    birth: 'ABT 1835',
    death: '1901',
    givenNames: 'Susanna',
    maidenName: 'Fourie',
    n: 9,
    surname: 'Botha',
  }),
  person({
    birth: '1858',
    death: '1933',
    givenNames: 'Maria Elizabeth',
    n: 10,
    surname: 'Foury',
    variants: ['Fourie'],
  }),
  person({
    birth: '1871',
    death: '1948',
    givenNames: 'Anna Catharina',
    n: 11,
    surname: 'le Roux',
    variants: ['Leroux', 'Le Rous'],
  }),
  person({
    birth: '1868',
    death: 'AFT 1920',
    givenNames: 'Cornelis Johannes',
    n: 12,
    surname: 'Nel',
    variants: ['Nell'],
  }),
];

/** A parent row between Maria and `o<n>`. `maria` is her end of the row. */
const parent = (
  id: number,
  n: number,
  subtype: string,
  maria: 'child' | 'parent'
) =>
  relationship({
    childId: maria === 'child' ? MARIA.id : personId(n),
    id: relationshipId(id),
    parentId: maria === 'child' ? personId(n) : MARIA.id,
    subtype,
    type: 'parent',
  });

const spouse = (
  id: number,
  n: number,
  dates: { divorce?: string; marriage?: string }
) =>
  relationship({
    ...dates,
    id: relationshipId(id),
    personAId: MARIA.id,
    personBId: personId(n),
    type: 'spouse',
  });

const FAMILY_RELATIONSHIPS: RelationshipInput[] = [
  parent(1, 1, 'biological', 'child'),
  parent(2, 2, 'adoptive', 'child'),
  parent(3, 3, 'step', 'child'),
  parent(11, 4, 'biological', 'parent'),
  parent(12, 5, 'adoptive', 'parent'),
  spouse(21, 6, { divorce: '1890', marriage: 'MAR 1875' }),
  spouse(22, 7, { marriage: 'MAR 1875' }),
  spouse(23, 8, {}),
];

/**
 * The fixture Accounts that only the memory adapters hold. Each Tree is read-only. No `server-only`,
 * so `e2e/` can import it under plain Node. The passwords differ from the wrong
 * passwords of the sign-in tests. The researcher stays first: `e2e/` reads it by position.
 */
export const FIXTURES = [
  {
    accountId: parseAccountId('00000000-0000-4000-8000-0000000000a2')!,
    email: 'researcher@example.com',
    issuer: 'fixture',
    password: 'researcher-password',
    persons: [] as PersonInput[],
    relationships: [] as RelationshipInput[],
    subject: 'researcher',
    treeId: parseTreeId('00000000-0000-4000-8000-0000000000b2')!,
    treeName: 'Researcher Tree',
  },
  {
    accountId: parseAccountId('00000000-0000-4000-8000-0000000000a3')!,
    email: 'r.family@example.com',
    issuer: 'fixture',
    password: 'family-password',
    persons: [MARIA, ...OTHERS],
    relationships: FAMILY_RELATIONSHIPS,
    subject: 'r.family',
    treeId: parseTreeId('00000000-0000-4000-8000-0000000000b3')!,
    treeName: 'Family Tree',
  },
  {
    accountId: parseAccountId('00000000-0000-4000-8000-0000000000a4')!,
    email: 'r.alone@example.com',
    issuer: 'fixture',
    password: 'alone-password',
    persons: [MARIA],
    relationships: [] as RelationshipInput[],
    subject: 'r.alone',
    treeId: parseTreeId('00000000-0000-4000-8000-0000000000b4')!,
    treeName: 'Alone Tree',
  },
  {
    accountId: parseAccountId('00000000-0000-4000-8000-0000000000a5')!,
    email: 'r.failing@example.com',
    failing: true,
    issuer: 'fixture',
    password: 'failing-password',
    persons: [MARIA],
    relationships: [] as RelationshipInput[],
    subject: 'r.failing',
    treeId: parseTreeId('00000000-0000-4000-8000-0000000000b5')!,
    treeName: 'Failing Tree',
  },
];
