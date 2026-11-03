import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { run } from '@ks/scripts/account-add.mts';
import { createTestDb } from '@ks/server/db/__tests__/pglite.ts';
import { migrate } from '@ks/server/db/migrate.mts';

const env = { KINSCAPE_DATABASE_DIRECT_URL: 'postgres://direct@localhost/db' };
const SUBJECT_A = '11111111-1111-4111-8111-111111111111';
const SUBJECT_B = '22222222-2222-4222-8222-222222222222';

const snapshot = async (db: ReturnType<typeof createTestDb>) => ({
  accounts: await db.selectFrom('account').selectAll().orderBy('id').execute(),
  links: await db.selectFrom('treeAccount').selectAll().execute(),
  trees: await db.selectFrom('tree').selectAll().orderBy('id').execute(),
});

const migrated = async () => {
  const db = createTestDb();

  await migrate(db, join(import.meta.dirname, '../../server/db/migrations'));
  vi.spyOn(db, 'destroy').mockResolvedValue();

  return db;
};

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

// NFR-09
describe('account-add run', () => {
  it('creates an Account and Tree, prints the ids and opens the direct URL', async () => {
    const db = await migrated();
    const open = vi.fn(() => db);

    expect(await run([SUBJECT_A, 'Tree A'], env, open)).toBe(0);
    expect(open).toHaveBeenCalledExactlyOnceWith(
      'postgres://direct@localhost/db'
    );
    expect(console.log).toHaveBeenCalledWith(
      expect.stringMatching(/^Account [0-9a-f-]{36}, Tree [0-9a-f-]{36}$/)
    );
    expect(await db.selectFrom('account').select('issuer').execute()).toEqual([
      { issuer: 'supabase' },
    ]);
    expect(db.destroy).toHaveBeenCalledOnce();
  });

  it('leaves the first Tree unchanged when a second Account is added', async () => {
    const db = await migrated();

    await run([SUBJECT_A, 'Tree A'], env, () => db);

    const before = await snapshot(db);

    expect(await run([SUBJECT_B, 'Tree B'], env, () => db)).toBe(0);

    const after = await snapshot(db);

    expect(after.accounts).toEqual(expect.arrayContaining(before.accounts));
    expect(after.trees).toEqual(expect.arrayContaining(before.trees));
    expect(after.links).toEqual(expect.arrayContaining(before.links));
    expect(after.accounts).toHaveLength(2);
  });

  it('exits 1, naming the clash, when the Account exists', async () => {
    const db = await migrated();

    await run([SUBJECT_A, 'Tree A'], env, () => db);

    const before = await snapshot(db);

    expect(await run([SUBJECT_A, 'Other'], env, () => db)).toBe(1);
    expect(console.error).toHaveBeenCalledWith(
      `An Account already exists for ${SUBJECT_A}`
    );
    expect(await snapshot(db)).toEqual(before);
  });

  it.each([[[]], [['not-a-uuid', 'Tree']], [[SUBJECT_A, '  ']], [[SUBJECT_A]]])(
    'rejects the arguments %j without opening the database',
    async argv => {
      const open = vi.fn();

      expect(await run(argv, env, open)).toBe(1);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Usage:')
      );
      expect(open).not.toHaveBeenCalled();
    }
  );

  it('fails naming the direct URL variable when it is not set', async () => {
    const open = vi.fn();

    expect(await run([SUBJECT_A, 'Tree A'], {}, open)).toBe(1);
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('KINSCAPE_DATABASE_DIRECT_URL')
    );
    expect(open).not.toHaveBeenCalled();
  });
});
