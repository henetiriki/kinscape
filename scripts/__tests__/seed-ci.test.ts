import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { run } from '@ks/scripts/seed-ci.mts';
import { SYNTHETIC } from '@ks/server/auth/synthetic.mts';
import { sharedTestDb } from '@ks/server/db/__tests__/pglite.ts';
import { databaseStore } from '@ks/server/trees/database-store.mts';

const env = { KINSCAPE_DATABASE_DIRECT_URL: 'postgres://direct@localhost/db' };

const shared = sharedTestDb();

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

    expect(await run(env, open)).toBe(0);
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

    expect(await run(env, () => db)).toBe(0);
    expect(await run(env, () => db)).toBe(0);
    expect(await db.selectFrom('account').select('id').execute()).toHaveLength(
      1
    );
    expect(await db.selectFrom('tree').select('id').execute()).toHaveLength(1);
    expect(
      await db.selectFrom('treeAccount').select('treeId').execute()
    ).toHaveLength(1);
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
