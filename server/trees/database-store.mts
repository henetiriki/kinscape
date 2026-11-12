import type { Selectable } from 'kysely';

import { sql } from 'kysely';

import type { FuzzyDate } from '#ks/lib/domain/dates/types.ts';
import type { PersonId } from '#ks/lib/domain/ids/types.ts';
import type { Person, PersonInput } from '#ks/lib/domain/persons/types.ts';
import type {
  Relationship,
  RelationshipInput,
} from '#ks/lib/domain/relationships/types.ts';
import type { TreeScope, TreeStore } from '#ks/lib/domain/trees/types.ts';
import type { createDb } from '#ks/server/db/database.mts';
import type { Database, FuzzyDateColumnsOf } from '#ks/server/db/types.ts';

import { fuzzyDateOf } from '#ks/lib/domain/dates/fuzzy-date.mts';
import {
  parseAccountId,
  parsePersonId,
  parseTreeId,
} from '#ks/lib/domain/ids/ids.mts';
import { MAX_LISTED } from '#ks/lib/domain/persons/schemas.mts';
import { endsOf } from '#ks/lib/domain/relationships/rules.mts';
import { err, ok } from '#ks/lib/domain/result/result.mts';
import { isVersion } from '#ks/server/trees/version.mts';

type Db = ReturnType<typeof createDb>;

/** The six columns of a FuzzyDate under `prefix`, all null for no date. */
const dateColumns = <Prefix extends string>(
  prefix: Prefix,
  date?: FuzzyDate
): FuzzyDateColumnsOf<Prefix> =>
  Object.fromEntries(
    Object.entries({
      date1: date?.date1 ?? null,
      date2: date?.date2 ?? null,
      precision: date?.precision ?? null,
      qualifier: date?.qualifier ?? null,
      validFrom: date?.validFrom ?? null,
      validTo: date?.validTo ?? null,
    }).map(([key, value]) => [
      `${prefix}${key[0].toUpperCase()}${key.slice(1)}`,
      value,
    ])
  ) as FuzzyDateColumnsOf<Prefix>;

/** The FuzzyDate from stored parts, or undefined for no date. */
const dateOf = (
  qualifier: FuzzyDateColumnsOf<'x'>['xQualifier'],
  date1: null | string,
  date2: null | string
): FuzzyDate | undefined =>
  qualifier === null || date1 === null
    ? undefined
    : fuzzyDateOf(qualifier, date1, date2 ?? undefined);

/** The columns a save writes. The Tree and Person ids are not among them. */
const fieldsOf = (person: PersonInput) => ({
  ...dateColumns('birth', person.birth),
  ...dateColumns('death', person.death),
  deceased: person.deceased,
  givenNames: person.givenNames,
  maidenName: person.maidenName,
  notes: person.notes,
  sex: person.sex,
  surname: person.surname,
  variants: person.variants,
});

const personOf = (row: Selectable<Database['person']>): Person => {
  const birth = dateOf(row.birthQualifier, row.birthDate1, row.birthDate2);
  const death = dateOf(row.deathQualifier, row.deathDate1, row.deathDate2);

  return {
    ...(birth === undefined ? {} : { birth }),
    ...(death === undefined ? {} : { death }),
    deceased: row.deceased,
    givenNames: row.givenNames,
    id: row.id,
    maidenName: row.maidenName,
    notes: row.notes,
    sex: row.sex,
    surname: row.surname,
    variants: row.variants,
    version: row.version,
  };
};

/** The columns a save writes, apart from the Tree id, the id and the Persons. */
const relationshipFieldsOf = (relationship: RelationshipInput) => ({
  ...dateColumns(
    'start',
    relationship.type === 'spouse' ? relationship.marriage : undefined
  ),
  ...dateColumns(
    'end',
    relationship.type === 'spouse' ? relationship.divorce : undefined
  ),
  subtype: relationship.type === 'parent' ? relationship.subtype : null,
});

const relationshipOf = (
  row: Selectable<Database['relationship']>
): Relationship => {
  if (row.type === 'parent') {
    return {
      childId: row.personB,
      id: row.id,
      parentId: row.personA,
      subtype: row.subtype!,
      type: 'parent',
      version: row.version,
    };
  }

  const marriage = dateOf(row.startQualifier, row.startDate1, row.startDate2);
  const divorce = dateOf(row.endQualifier, row.endDate1, row.endDate2);

  return {
    ...(divorce === undefined ? {} : { divorce }),
    id: row.id,
    ...(marriage === undefined ? {} : { marriage }),
    personAId: row.personA,
    personBId: row.personB,
    type: 'spouse',
    version: row.version,
  };
};

const selectRelationship = (db: Db, { treeId }: TreeScope) =>
  db.selectFrom('relationship').selectAll().where('treeId', '=', treeId);

/** Whether the Tree holds every Person of `ends`. */
const bothInTree = async (
  db: Db,
  { treeId }: TreeScope,
  ends: readonly [PersonId, PersonId]
): Promise<boolean> => {
  const wanted = new Set(ends);
  const found = await db
    .selectFrom('person')
    .where('treeId', '=', treeId)
    .where('id', 'in', [...wanted])
    .select('id')
    .execute();

  return found.length === wanted.size;
};

/**
 * Whether the ids are UUIDs and the Account may access the Tree. A method asks first, so
 * another Account's Tree and a malformed id give what a missing Tree gives.
 */
const reaches = async (
  db: Db,
  { accountId, treeId }: TreeScope,
  ...ids: string[]
): Promise<boolean> =>
  parseAccountId(accountId) !== undefined &&
  parseTreeId(treeId) !== undefined &&
  ids.every(id => parsePersonId(id) !== undefined) &&
  (await db
    .selectFrom('treeAccount')
    .where('accountId', '=', accountId)
    .where('treeId', '=', treeId)
    .select('treeId')
    .executeTakeFirst()) !== undefined;

const selectPerson = (db: Db, { treeId }: TreeScope) =>
  db.selectFrom('person').selectAll().where('treeId', '=', treeId);

/**
 * A TreeStore over Postgres. The ids are branded, but a cast can hold anything and Postgres
 * throws on a malformed `uuid`, so a read given an id that isn't a UUID finds nothing, as in memory.
 */
export const databaseStore = (db: Db): TreeStore => ({
  addAccount: ({ issuer, subject, treeName }) =>
    db.transaction().execute(async trx => {
      const account = await trx
        .insertInto('account')
        .values({ issuer, subject })
        .onConflict(conflict =>
          conflict.columns(['issuer', 'subject']).doNothing()
        )
        .returning('id')
        .executeTakeFirst();

      if (account === undefined) {
        return err('exists');
      }

      const tree = await trx
        .insertInto('tree')
        .values({ name: treeName })
        .returning('id')
        .executeTakeFirstOrThrow();

      await trx
        .insertInto('treeAccount')
        .values({ accountId: account.id, treeId: tree.id })
        .execute();

      return ok({ accountId: account.id, treeId: tree.id });
    }),
  addPerson: async ({ person, ...scope }) => {
    if (!(await reaches(db, scope, person.id))) {
      return undefined;
    }

    await db
      .insertInto('person')
      .values({ ...fieldsOf(person), id: person.id, treeId: scope.treeId })
      .onConflict(conflict => conflict.columns(['treeId', 'id']).doNothing())
      .execute();

    return personOf(
      await selectPerson(db, scope)
        .where('id', '=', person.id)
        .executeTakeFirstOrThrow()
    );
  },
  addRelationship: async ({ relationship, ...scope }) => {
    const ends = endsOf(relationship);

    if (
      !(await reaches(db, scope, relationship.id, ...ends)) ||
      !(await bothInTree(db, scope, ends))
    ) {
      return err('not-found');
    }

    await db
      .insertInto('relationship')
      .values({
        ...relationshipFieldsOf(relationship),
        id: relationship.id,
        personA: ends[0],
        personB: ends[1],
        treeId: scope.treeId,
        type: relationship.type,
      })
      .onConflict(conflict => conflict.columns(['treeId', 'id']).doNothing())
      .execute();

    return ok(
      relationshipOf(
        await selectRelationship(db, scope)
          .where('id', '=', relationship.id)
          .executeTakeFirstOrThrow()
      )
    );
  },
  findAccount: async (issuer, subject) =>
    db
      .selectFrom('account')
      .where('issuer', '=', issuer)
      .where('subject', '=', subject)
      .select('id')
      .executeTakeFirst(),
  findPerson: async ({ personId, ...scope }) => {
    const row = (await reaches(db, scope, personId))
      ? await selectPerson(db, scope)
          .where('id', '=', personId)
          .executeTakeFirst()
      : undefined;

    return row === undefined ? undefined : personOf(row);
  },
  findRelationship: async ({ relationshipId, ...scope }) => {
    const row = (await reaches(db, scope, relationshipId))
      ? await selectRelationship(db, scope)
          .where('id', '=', relationshipId)
          .executeTakeFirst()
      : undefined;

    return row === undefined ? undefined : relationshipOf(row);
  },
  findTree: async ({ accountId, treeId }) =>
    parseAccountId(accountId) && parseTreeId(treeId)
      ? db
          .selectFrom('tree')
          .innerJoin('treeAccount', 'treeAccount.treeId', 'tree.id')
          .where('treeAccount.accountId', '=', accountId)
          .where('tree.id', '=', treeId)
          .select(['tree.id', 'tree.name'])
          .executeTakeFirst()
      : undefined,
  findTrees: async accountId =>
    parseAccountId(accountId)
      ? db
          .selectFrom('tree')
          .innerJoin('treeAccount', 'treeAccount.treeId', 'tree.id')
          .where('treeAccount.accountId', '=', accountId)
          .orderBy('tree.id')
          .select(['tree.id', 'tree.name'])
          .execute()
      : [],
  // In a UTF-8 database `collate "C"` compares bytes, which is code-point order, as the memory store does.
  listPersons: async scope =>
    (await reaches(db, scope))
      ? (
          await selectPerson(db, scope)
            .orderBy(sql`surname collate "C"`)
            .orderBy(sql`given_names collate "C"`)
            .orderBy('id')
            .limit(MAX_LISTED)
            .execute()
        ).map(personOf)
      : [],
  listRelationships: async scope =>
    (await reaches(db, scope))
      ? (await selectRelationship(db, scope).orderBy('id').execute()).map(
          relationshipOf
        )
      : [],
  updatePerson: async ({ person, version, ...scope }) => {
    if (!(await reaches(db, scope, person.id))) {
      return err('not-found');
    }

    // A version that is not an `int4` matches no row, as in memory, and Postgres does not throw.
    const row = isVersion(version)
      ? await db
          .updateTable('person')
          .set({
            ...fieldsOf(person),
            updatedAt: sql`now()`,
            version: sql`version + 1`,
          })
          .where('treeId', '=', scope.treeId)
          .where('id', '=', person.id)
          .where('version', '=', version)
          .returningAll()
          .executeTakeFirst()
      : undefined;

    if (row !== undefined) {
      return ok(personOf(row));
    }

    // Zero rows: the Person is missing, or its version changed.
    const saved = await selectPerson(db, scope)
      .where('id', '=', person.id)
      .select('id')
      .executeTakeFirst();

    return err(saved === undefined ? 'not-found' : 'conflict');
  },
  updateRelationship: async ({ relationship, version, ...scope }) => {
    const ends = endsOf(relationship);

    if (!(await reaches(db, scope, relationship.id, ...ends))) {
      return err('not-found');
    }

    // The row matches by Tree, id, type and both Persons: an update never changes them.
    const key = {
      id: relationship.id,
      personA: ends[0],
      personB: ends[1],
      treeId: scope.treeId,
      type: relationship.type,
    };
    // A version that is not an `int4` matches no row, as in memory, and Postgres does not throw.
    const row = isVersion(version)
      ? await db
          .updateTable('relationship')
          .set({
            ...relationshipFieldsOf(relationship),
            updatedAt: sql`now()`,
            version: sql`version + 1`,
          })
          .where(eb => eb.and(key))
          .where('version', '=', version)
          .returningAll()
          .executeTakeFirst()
      : undefined;

    if (row !== undefined) {
      return ok(relationshipOf(row));
    }

    // Zero rows: the Relationship is missing or differs in type or Persons, or its version changed.
    const saved = await selectRelationship(db, scope)
      .where(eb => eb.and(key))
      .select('id')
      .executeTakeFirst();

    return err(saved === undefined ? 'not-found' : 'conflict');
  },
});
