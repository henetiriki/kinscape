import { personInputSchema } from '#ks/lib/domain/persons/schemas.mts';
import { EVENT_TYPES, pinInputSchema } from '#ks/lib/domain/pins/schemas.mts';
import { placeInputSchema } from '#ks/lib/domain/places/schemas.mts';
import { SYNTHETIC } from '#ks/server/auth/synthetic.mts';
import { createPgDb } from '#ks/server/db/database.mts';
import { parseDirectUrl } from '#ks/server/env.mts';
import { databaseStore } from '#ks/server/trees/database-store.mts';

/**
 * How many Persons, Places and Pins the seed adds. The map `@perf` check needs about 10,000 Pins on
 * 500 Places (NFR-01). A Pins list holds 10,000 Pins at most, so the seed leaves 50 free places
 * for the Pins that the e2e save tests add, with room for 10 repeats of each.
 */
export const SEED = { persons: 10, pins: 9_950, places: 500 };

type Size = typeof SEED;

/** The first and last year that a seeded Pin covers. */
const FIRST_YEAR = 1700;
const LAST_YEAR = 2015;
/** The Places lie on a grid of this many rows inside South Africa. */
const ROWS = 25;
/** A step of the year that is prime to the span of years, so the Pins spread over all of them. */
const YEAR_STEP = 7919;
/** The most rows that one batch saves at once. */
const BATCH = 100;

/** A fixed UUID for the `n`th row of a `kind`, so a second run finds the same rows. */
const idOf = (kind: 'a' | 'b' | 'c', n: number) =>
  `01900000-0000-7000-${kind}000-${n.toString(16).padStart(12, '0')}`;

/** The GEDCOM date of the `n`th Pin. The first is the residence that the acceptance checks use. */
const dateOf = (n: number) => {
  if (n === 0) return 'FROM 1840 TO 1855';

  const year = FIRST_YEAR + ((n * YEAR_STEP) % (LAST_YEAR - FIRST_YEAR + 1));
  const end = Math.min(year + (n % 20) + 1, LAST_YEAR);

  return n % 2 === 0 ? `FROM ${year} TO ${end}` : `${year}`;
};

const personOf = (n: number) =>
  personInputSchema.parse({
    givenNames: `Seed${n}`,
    id: idOf('a', n),
    surname: 'Synthetic',
  });

const placeOf = (n: number) =>
  placeInputSchema.parse({
    id: idOf('b', n),
    latitude: -34 + (n % ROWS) * 0.45,
    longitude: 17 + Math.floor(n / ROWS) * 0.8,
  });

const pinOf = (n: number, { persons, places }: Size) =>
  pinInputSchema.parse({
    date: dateOf(n),
    eventType: n === 0 ? 'residence' : EVENT_TYPES[n % EVENT_TYPES.length],
    id: idOf('c', n),
    // With no Person added, the id still names Person 0, so the store refuses the Pin.
    personId: idOf('a', n % Math.max(persons, 1)),
    placeId: idOf('b', n % Math.max(places, 1)),
  });

/** Saves `count` rows, `BATCH` at a time; `save` returns whether the row is saved. */
const saveAll = async (
  count: number,
  label: string,
  save: (n: number) => Promise<boolean>
) => {
  for (let start = 0; start < count; start += BATCH) {
    const batch = Array.from(
      { length: Math.min(BATCH, count - start) },
      (_, offset) => save(start + offset)
    );

    if ((await Promise.all(batch)).includes(false)) {
      throw new Error(`Seed: a ${label} was not saved`);
    }
  }
};

/**
 * Adds the SYNTHETIC Account and Tree, with the ids the test-only memory sign-in uses, over the
 * direct connection. It also adds the Persons, Places and Pins of `size` to that Tree, with fixed
 * ids. Pin 0 is a residence from 1840 to 1855, and the other Pins cycle through the Event types.
 * CI runs it after `db:migrate`, so e2e can sign in against real Postgres. A second run adds
 * nothing. Returns the exit code.
 */
export const run = async (
  env: Record<string, string | undefined>,
  open: typeof createPgDb = createPgDb,
  size: Size = SEED
): Promise<number> => {
  const databaseDirectUrl = parseDirectUrl(env);

  if (databaseDirectUrl === undefined) {
    console.error('Missing environment variable: KINSCAPE_DATABASE_DIRECT_URL');

    return 1;
  }

  const db = open(databaseDirectUrl);

  try {
    await db.transaction().execute(async trx => {
      await trx
        .insertInto('account')
        .values({
          id: SYNTHETIC.accountId,
          issuer: SYNTHETIC.issuer,
          subject: SYNTHETIC.subject,
        })
        .onConflict(conflict => conflict.doNothing())
        .execute();
      await trx
        .insertInto('tree')
        .values({ id: SYNTHETIC.treeId, name: SYNTHETIC.treeName })
        .onConflict(conflict => conflict.doNothing())
        .execute();
      await trx
        .insertInto('treeAccount')
        .values({ accountId: SYNTHETIC.accountId, treeId: SYNTHETIC.treeId })
        .onConflict(conflict => conflict.doNothing())
        .execute();
    });

    const store = databaseStore(db);
    const scope = { accountId: SYNTHETIC.accountId, treeId: SYNTHETIC.treeId };

    await saveAll(
      size.persons,
      'Person',
      async n =>
        (await store.addPerson({ ...scope, person: personOf(n) })) !== undefined
    );
    await saveAll(
      size.places,
      'Place',
      async n => (await store.addPlace({ ...scope, place: placeOf(n) })).ok
    );
    await saveAll(
      size.pins,
      'Pin',
      async n => (await store.addPin({ ...scope, pin: pinOf(n, size) })).ok
    );

    console.log(
      `Seeded Account ${SYNTHETIC.accountId}, Tree ${SYNTHETIC.treeId}`
    );

    return 0;
  } finally {
    await db.destroy();
  }
};

/* v8 ignore next 3 -- only true when run directly with node, not when imported */
if (import.meta.main) {
  process.exitCode = await run(process.env);
}
