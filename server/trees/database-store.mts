import type { Selectable } from 'kysely';

import { sql } from 'kysely';

import type { FuzzyDate } from '#ks/lib/domain/dates/types.ts';
import type { PersonId } from '#ks/lib/domain/ids/types.ts';
import type { Person, PersonInput } from '#ks/lib/domain/persons/types.ts';
import type { Pin, PinInput, SpannedPin } from '#ks/lib/domain/pins/types.ts';
import type { Place, PlaceInput } from '#ks/lib/domain/places/types.ts';
import type {
  Relationship,
  RelationshipInput,
} from '#ks/lib/domain/relationships/types.ts';
import type { Result } from '#ks/lib/domain/result/types.ts';
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
import { MAX_PINS } from '#ks/lib/domain/pins/schemas.mts';
import { spanOf } from '#ks/lib/domain/pins/span.mts';
import { MAX_PLACES } from '#ks/lib/domain/places/schemas.mts';
import { endsOf } from '#ks/lib/domain/relationships/rules.mts';
import { MAX_RELATIONSHIPS } from '#ks/lib/domain/relationships/schemas.mts';
import { err, ok } from '#ks/lib/domain/result/result.mts';
import { savedOrNotFound } from '#ks/server/trees/saved.mts';
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

const placeOf = (row: Selectable<Database['place']>): Place => ({
  id: row.id,
  latitude: row.latitude,
  longitude: row.longitude,
  precision: row.precision,
  version: row.version,
});

/** The columns a save writes, apart from the Tree id and the id. */
const placeFieldsOf = (place: PlaceInput) => ({
  latitude: place.latitude,
  longitude: place.longitude,
  precision: place.precision,
});

const selectPlace = (db: Db, { treeId }: TreeScope) =>
  db.selectFrom('place').selectAll().where('treeId', '=', treeId);

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

const selectPin = (db: Db, { treeId }: TreeScope) =>
  db.selectFrom('pin').selectAll().where('treeId', '=', treeId);

/** The columns a save writes, apart from the Tree id and the id. */
const pinFieldsOf = (pin: PinInput) => ({
  address: pin.address,
  dateDate1: pin.date.date1,
  dateDate2: pin.date.date2 ?? null,
  datePrecision: pin.date.precision,
  dateQualifier: pin.date.qualifier,
  dateValidFrom: pin.date.validFrom,
  // `fuzzyDateOf` always sets an end day; the `pin` table requires one.
  dateValidTo: pin.date.validTo!,
  eventType: pin.eventType,
  notes: pin.notes,
  personId: pin.personId,
  placeId: pin.placeId,
  sources: pin.sources,
});

const pinOf = (row: Selectable<Database['pin']>): Pin => ({
  address: row.address,
  date: fuzzyDateOf(
    row.dateQualifier,
    row.dateDate1,
    row.dateDate2 ?? undefined
  ),
  eventType: row.eventType,
  id: row.id,
  notes: row.notes,
  personId: row.personId,
  placeId: row.placeId,
  sources: row.sources,
  version: row.version,
});

/** The Tree's Pins with the birth and death columns of each Pin's Person, ordered by id and capped. */
const selectSpanned = (db: Db, { treeId }: TreeScope) =>
  db
    .selectFrom('pin')
    .innerJoin('person', join =>
      join
        .onRef('person.treeId', '=', 'pin.treeId')
        .onRef('person.id', '=', 'pin.personId')
    )
    .where('pin.treeId', '=', treeId)
    .selectAll('pin')
    .select([
      'person.birthDate1',
      'person.birthDate2',
      'person.birthQualifier',
      'person.deathDate1',
      'person.deathDate2',
      'person.deathQualifier',
    ])
    .orderBy('pin.id')
    .limit(MAX_PINS);

const spannedPinOf = (
  row: Awaited<ReturnType<ReturnType<typeof selectSpanned>['execute']>>[number]
): SpannedPin => {
  const pin = pinOf(row);
  const birth = dateOf(row.birthQualifier, row.birthDate1, row.birthDate2);
  const death = dateOf(row.deathQualifier, row.deathDate1, row.deathDate2);

  return { ...pin, span: spanOf(pin.date, { birth, death }) };
};

/** Whether the Tree holds the Person and the Place of `pin`. */
const pinnable = async (
  db: Db,
  { treeId }: TreeScope,
  pin: PinInput
): Promise<boolean> =>
  (await db
    .selectFrom('person')
    .where('treeId', '=', treeId)
    .where('id', '=', pin.personId)
    .select('id')
    .executeTakeFirst()) !== undefined &&
  (await db
    .selectFrom('place')
    .where('treeId', '=', treeId)
    .where('id', '=', pin.placeId)
    .select('id')
    .executeTakeFirst()) !== undefined;

const selectPerson = (db: Db, { treeId }: TreeScope) =>
  db.selectFrom('person').selectAll().where('treeId', '=', treeId);

/**
 * The add flow that each kind shares: refuse, insert, then read the row. `check` is an extra refusal.
 * An insert on a saved id changes nothing, so an add that repeats returns the saved row.
 */
const added = async <Row, Entity>(
  db: Db,
  scope: TreeScope,
  {
    check,
    ids,
    insert,
    map,
    read,
  }: {
    check?: () => Promise<boolean>;
    ids: readonly string[];
    insert: () => Promise<unknown>;
    map: (row: Row) => Entity;
    read: () => Promise<Row>;
  }
): Promise<Entity | undefined> => {
  if (
    !(await reaches(db, scope, ...ids)) ||
    (check !== undefined && !(await check()))
  ) {
    return undefined;
  }

  await insert();

  return map(await read());
};

/**
 * The versioned update that each kind shares. Each kind passes its own typed queries: Kysely does
 * not type `.set(...)` for a generic table. `exists` tells a missing row from a stale version.
 * `check` is an extra refusal.
 */
const updated = async <Row, Entity>(
  db: Db,
  scope: TreeScope,
  {
    check,
    exists,
    ids,
    map,
    update,
    version,
  }: {
    check?: () => Promise<boolean>;
    exists: () => Promise<unknown>;
    ids: readonly string[];
    map: (row: Row) => Entity;
    update: () => Promise<Row | undefined>;
    version: number;
  }
): Promise<Result<Entity, 'conflict' | 'not-found'>> => {
  if (
    !(await reaches(db, scope, ...ids)) ||
    (check !== undefined && !(await check()))
  ) {
    return err('not-found');
  }

  // A version that is not an `int4` matches no row, as in memory, and Postgres does not throw.
  const row = isVersion(version) ? await update() : undefined;

  if (row !== undefined) {
    return ok(map(row));
  }

  // Zero rows: the row is missing or differs in its key, or its version changed.
  return err((await exists()) === undefined ? 'not-found' : 'conflict');
};

/** `placedPin` throws this error to cancel the transaction. It carries the error of the refused write. */
class PinRefused extends Error {
  refusal: 'conflict' | 'not-found' = 'not-found';
}

/**
 * Saves `place`, then runs `write` on the same transaction. If either fails, nothing saves, and the
 * result is the error of the failed step.
 */
const placedPin = async <Refusal extends 'conflict' | 'not-found'>(
  db: Db,
  scope: TreeScope,
  place: PlaceInput,
  write: (inner: TreeStore) => Promise<Result<Pin, Refusal>>
): Promise<Result<Pin, 'not-found' | Refusal>> => {
  try {
    return await db.transaction().execute(async trx => {
      const inner = databaseStore(trx);
      const placed = await inner.addPlace({ ...scope, place });
      const saved = placed.ok ? await write(inner) : placed;

      if (!saved.ok) {
        throw Object.assign(new PinRefused(), { refusal: saved.error });
      }

      return saved;
    });
  } catch (error) {
    if (error instanceof PinRefused) {
      return err(error.refusal as Refusal);
    }

    throw error;
  }
};

/**
 * A TreeStore over Postgres. The ids are branded, but a cast can hold anything and Postgres
 * throws on a malformed `uuid`, so a read given an id that isn't a UUID finds nothing, as in memory.
 */
// eslint-disable-next-line max-lines-per-function -- over 60 lines before the rule (C1174)
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
  addPerson: ({ person, ...scope }) =>
    added(db, scope, {
      ids: [person.id],
      insert: () =>
        db
          .insertInto('person')
          .values({ ...fieldsOf(person), id: person.id, treeId: scope.treeId })
          .onConflict(conflict =>
            conflict.columns(['treeId', 'id']).doNothing()
          )
          .execute(),
      map: personOf,
      read: () =>
        selectPerson(db, scope)
          .where('id', '=', person.id)
          .executeTakeFirstOrThrow(),
    }),
  addPin: async ({ pin, ...scope }) =>
    savedOrNotFound(
      await added(db, scope, {
        check: () => pinnable(db, scope, pin),
        ids: [pin.id, pin.personId, pin.placeId],
        insert: () =>
          db
            .insertInto('pin')
            .values({
              ...pinFieldsOf(pin),
              id: pin.id,
              treeId: scope.treeId,
            })
            .onConflict(conflict =>
              conflict.columns(['treeId', 'id']).doNothing()
            )
            .execute(),
        map: pinOf,
        read: () =>
          selectPin(db, scope)
            .where('id', '=', pin.id)
            .executeTakeFirstOrThrow(),
      })
    ),
  addPinAt: ({ pin, place, ...scope }) =>
    placedPin(db, scope, place, inner =>
      inner.addPin({ ...scope, pin: { ...pin, placeId: place.id } })
    ),
  addPlace: async ({ place, ...scope }) =>
    savedOrNotFound(
      await added(db, scope, {
        ids: [place.id],
        insert: () =>
          db
            .insertInto('place')
            .values({
              ...placeFieldsOf(place),
              id: place.id,
              treeId: scope.treeId,
            })
            .onConflict(conflict =>
              conflict.columns(['treeId', 'id']).doNothing()
            )
            .execute(),
        map: placeOf,
        read: () =>
          selectPlace(db, scope)
            .where('id', '=', place.id)
            .executeTakeFirstOrThrow(),
      })
    ),
  addRelationship: async ({ relationship, ...scope }) => {
    const ends = endsOf(relationship);

    return savedOrNotFound(
      await added(db, scope, {
        check: () => bothInTree(db, scope, ends),
        ids: [relationship.id, ...ends],
        insert: () =>
          db
            .insertInto('relationship')
            .values({
              ...relationshipFieldsOf(relationship),
              id: relationship.id,
              personA: ends[0],
              personB: ends[1],
              treeId: scope.treeId,
              type: relationship.type,
            })
            .onConflict(conflict =>
              conflict.columns(['treeId', 'id']).doNothing()
            )
            .execute(),
        map: relationshipOf,
        read: () =>
          selectRelationship(db, scope)
            .where('id', '=', relationship.id)
            .executeTakeFirstOrThrow(),
      })
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
  findPin: async ({ pinId, ...scope }) => {
    const row = (await reaches(db, scope, pinId))
      ? await selectPin(db, scope).where('id', '=', pinId).executeTakeFirst()
      : undefined;

    return row === undefined ? undefined : pinOf(row);
  },
  findPlace: async ({ placeId, ...scope }) => {
    const row = (await reaches(db, scope, placeId))
      ? await selectPlace(db, scope)
          .where('id', '=', placeId)
          .executeTakeFirst()
      : undefined;

    return row === undefined ? undefined : placeOf(row);
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
  listPins: async scope =>
    (await reaches(db, scope))
      ? (await selectSpanned(db, scope).execute()).map(spannedPinOf)
      : [],
  // The clip is in SQL so `limit` caps the current Pins. A null birth or death clips nothing, as in
  // `spanOf`. The plain date bounds let Postgres use `pin_date_idx`.
  listPinsOn: async ({ day, ...scope }) =>
    (await reaches(db, scope))
      ? (
          await selectSpanned(db, scope)
            .where('pin.dateValidFrom', '<=', day)
            .where('pin.dateValidTo', '>', day)
            .where(
              sql<boolean>`greatest(pin.date_valid_from, person.birth_valid_from) <= ${day}`
            )
            .where(
              sql<boolean>`${day} < least(pin.date_valid_to, person.death_valid_to)`
            )
            .execute()
        ).map(row => pinOf(row))
      : [],
  listPlaces: async scope =>
    (await reaches(db, scope))
      ? (
          await selectPlace(db, scope).orderBy('id').limit(MAX_PLACES).execute()
        ).map(placeOf)
      : [],
  listRelationships: async scope =>
    (await reaches(db, scope))
      ? (
          await selectRelationship(db, scope)
            .orderBy('id')
            .limit(MAX_RELATIONSHIPS)
            .execute()
        ).map(relationshipOf)
      : [],
  updatePerson: ({ person, version, ...scope }) =>
    updated(db, scope, {
      exists: () =>
        selectPerson(db, scope)
          .where('id', '=', person.id)
          .select('id')
          .executeTakeFirst(),
      ids: [person.id],
      map: personOf,
      update: () =>
        db
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
          .executeTakeFirst(),
      version,
    }),
  updatePin: ({ pin, version, ...scope }) =>
    updated(db, scope, {
      check: () => pinnable(db, scope, pin),
      exists: () =>
        selectPin(db, scope)
          .where('id', '=', pin.id)
          .select('id')
          .executeTakeFirst(),
      ids: [pin.id, pin.personId, pin.placeId],
      map: pinOf,
      update: () =>
        db
          .updateTable('pin')
          .set({
            ...pinFieldsOf(pin),
            updatedAt: sql`now()`,
            version: sql`version + 1`,
          })
          .where('treeId', '=', scope.treeId)
          .where('id', '=', pin.id)
          .where('version', '=', version)
          .returningAll()
          .executeTakeFirst(),
      version,
    }),
  updatePinAt: ({ pin, place, version, ...scope }) =>
    placedPin(db, scope, place, inner =>
      inner.updatePin({
        ...scope,
        pin: { ...pin, placeId: place.id },
        version,
      })
    ),
  updatePlace: ({ place, version, ...scope }) =>
    updated(db, scope, {
      exists: () =>
        selectPlace(db, scope)
          .where('id', '=', place.id)
          .select('id')
          .executeTakeFirst(),
      ids: [place.id],
      map: placeOf,
      update: () =>
        db
          .updateTable('place')
          .set({
            ...placeFieldsOf(place),
            updatedAt: sql`now()`,
            version: sql`version + 1`,
          })
          .where('treeId', '=', scope.treeId)
          .where('id', '=', place.id)
          .where('version', '=', version)
          .returningAll()
          .executeTakeFirst(),
      version,
    }),
  updateRelationship: ({ relationship, version, ...scope }) => {
    const ends = endsOf(relationship);
    // The row matches by Tree, id, type and both Persons: an update never changes them.
    const key = {
      id: relationship.id,
      personA: ends[0],
      personB: ends[1],
      treeId: scope.treeId,
      type: relationship.type,
    };

    return updated(db, scope, {
      exists: () =>
        selectRelationship(db, scope)
          .where(eb => eb.and(key))
          .select('id')
          .executeTakeFirst(),
      ids: [relationship.id, ...ends],
      map: relationshipOf,
      update: () =>
        db
          .updateTable('relationship')
          .set({
            ...relationshipFieldsOf(relationship),
            updatedAt: sql`now()`,
            version: sql`version + 1`,
          })
          .where(eb => eb.and(key))
          .where('version', '=', version)
          .returningAll()
          .executeTakeFirst(),
      version,
    });
  },
});
