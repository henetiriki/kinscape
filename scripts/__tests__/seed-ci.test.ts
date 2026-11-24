import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { toDay } from '@ks/lib/domain/boundaries/model.mts';
import { EVENT_TYPES, MAX_PINS } from '@ks/lib/domain/pins/schemas.mts';
import { run, SEED } from '@ks/scripts/seed-ci.mts';
import { SYNTHETIC } from '@ks/server/auth/synthetic.mts';
import { sharedTestDb } from '@ks/server/db/__tests__/pglite.ts';
import { databaseStore } from '@ks/server/trees/database-store.mts';

const env = { KINSCAPE_DATABASE_DIRECT_URL: 'postgres://direct@localhost/db' };

const shared = sharedTestDb();
// The default size takes minutes on PGlite, so a test that checks only the Account adds no rows.
const NONE = { persons: 0, pins: 0, places: 0 };

const migrated = async () => {
  const db = await shared.fresh();

  vi.spyOn(db, 'destroy').mockResolvedValue();

  return db;
};

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => shared.close());

afterEach(() => {
  vi.restoreAllMocks();
});

// NFR-09
describe('seed-ci run', () => {
  it('inserts the SYNTHETIC Account and Tree with their fixed ids over the direct URL', async () => {
    const db = await migrated();
    const open = vi.fn(() => db);

    expect(await run(env, open, NONE)).toBe(0);
    expect(open).toHaveBeenCalledExactlyOnceWith(
      'postgres://direct@localhost/db'
    );

    const store = databaseStore(db);

    expect(
      await store.findAccount(SYNTHETIC.issuer, SYNTHETIC.subject)
    ).toEqual({ id: SYNTHETIC.accountId });
    expect(await store.findTrees(SYNTHETIC.accountId)).toEqual([
      { id: SYNTHETIC.treeId, name: SYNTHETIC.treeName },
    ]);
    expect(await store.findTree(SYNTHETIC)).toEqual({
      id: SYNTHETIC.treeId,
      name: SYNTHETIC.treeName,
    });
    expect(db.destroy).toHaveBeenCalledOnce();
  });

  it('adds nothing on a second run', async () => {
    const db = await migrated();

    expect(await run(env, () => db, NONE)).toBe(0);
    expect(await run(env, () => db, NONE)).toBe(0);
    expect(await db.selectFrom('account').select('id').execute()).toHaveLength(
      1
    );
    expect(await db.selectFrom('tree').select('id').execute()).toHaveLength(1);
    expect(
      await db.selectFrom('treeAccount').select('treeId').execute()
    ).toHaveLength(1);
  });

  // PIN-03: the `@perf` check of the map needs these Pins.
  describe('the Persons, Places and Pins', () => {
    const small = { persons: 3, pins: 12, places: 4 };
    const scope = {
      accountId: SYNTHETIC.accountId,
      treeId: SYNTHETIC.treeId,
    };

    it('sets the size that the perf check needs, and leaves five places under the Pins list cap', () => {
      expect(SEED).toEqual({ persons: 10, pins: 9_950, places: 500 });
      expect(MAX_PINS - SEED.pins).toBe(50);
    });

    it('adds the counts that it is given, with no birth or death on a Person', async () => {
      const db = await migrated();

      expect(await run(env, () => db, small)).toBe(0);

      const store = databaseStore(db);
      const persons = await store.listPersons(scope);

      expect(persons).toHaveLength(3);
      expect(persons.every(({ birth, death }) => !birth && !death)).toBe(true);
      expect(await store.listPlaces(scope)).toHaveLength(4);
      expect(await store.listPins(scope)).toHaveLength(12);
    });

    it('gives each event type at least one Pin, and no Place twice the same position', async () => {
      const db = await migrated();

      await run(env, () => db, small);

      const store = databaseStore(db);
      const pins = await store.listPins(scope);
      const places = await store.listPlaces(scope);

      expect(new Set(pins.map(pin => pin.eventType))).toEqual(
        new Set(EVENT_TYPES)
      );
      expect(
        new Set(
          places.map(({ latitude, longitude }) => `${latitude},${longitude}`)
        ).size
      ).toBe(4);
    });

    it('makes the first Pin a residence from 1840 to 1855', async () => {
      const db = await migrated();

      await run(env, () => db, small);

      const pins = await databaseStore(db).listPins(scope);
      const first = pins.find(
        ({ date }) => date.validFrom === toDay('1840-01-01')
      );

      expect(first).toMatchObject({
        eventType: 'residence',
        span: {
          validFrom: toDay('1840-01-01'),
          validTo: toDay('1856-01-01'),
        },
      });
    });

    it('keeps each span between 1700 and 2036', async () => {
      const db = await migrated();

      await run(env, () => db, small);

      for (const { span } of await databaseStore(db).listPins(scope)) {
        expect(span.validFrom).toBeGreaterThanOrEqual(toDay('1700-01-01'));
        expect(span.validTo).toBeLessThanOrEqual(toDay('2037-01-01'));
      }
    });

    it('adds nothing on a second run', async () => {
      const db = await migrated();

      await run(env, () => db, small);
      await run(env, () => db, small);

      const store = databaseStore(db);

      expect(await store.listPersons(scope)).toHaveLength(3);
      expect(await store.listPlaces(scope)).toHaveLength(4);
      expect(await store.listPins(scope)).toHaveLength(12);
    });

    it('stops when a row is not saved', async () => {
      const db = await migrated();

      // Pins need a Person, and no Person is added.
      await expect(
        run(env, () => db, { persons: 0, pins: 1, places: 1 })
      ).rejects.toThrow('Seed: a Pin was not saved');
      expect(db.destroy).toHaveBeenCalledOnce();
    });
  });

  it('names the missing variable and opens no database', async () => {
    const open = vi.fn();

    expect(await run({}, open)).toBe(1);
    expect(open).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith(
      'Missing environment variable: KINSCAPE_DATABASE_DIRECT_URL'
    );
  });

  it('closes the database when the insert fails', async () => {
    const db = await shared.empty();

    vi.spyOn(db, 'destroy').mockResolvedValue();

    // No migrations ran, so the tables do not exist.
    await expect(run(env, () => db)).rejects.toThrow();
    expect(db.destroy).toHaveBeenCalledOnce();
  });
});
