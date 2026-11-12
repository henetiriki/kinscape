import type { Selectable } from 'kysely';

import { sql } from 'kysely';

import type { FuzzyDate } from '#ks/lib/domain/dates/types.ts';
import type { Person, PersonInput } from '#ks/lib/domain/persons/types.ts';
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
import { err, ok } from '#ks/lib/domain/result/result.mts';

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

/**
 * Whether the ids are UUIDs and the Account may access the Tree. A Person method asks first, so
 * another Account's Tree and a malformed id give what a missing Tree gives.
 */
const reaches = async (
  db: Db,
  { accountId, treeId }: TreeScope,
  personId?: string
): Promise<boolean> =>
  parseAccountId(accountId) !== undefined &&
  parseTreeId(treeId) !== undefined &&
  (personId === undefined || parsePersonId(personId) !== undefined) &&
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
  // `collate "C"` orders by code unit, as the memory store does.
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
  updatePerson: async ({ person, version, ...scope }) => {
    if (!(await reaches(db, scope, person.id))) {
      return err('not-found');
    }

    const row = await db
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
      .executeTakeFirst();

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
});
