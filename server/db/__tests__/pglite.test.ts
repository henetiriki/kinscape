import { sql } from 'kysely';
import { afterAll, describe, expect, it } from 'vitest';

import { parseAccountId } from '@ks/lib/domain/ids/ids.mts';
import { createTestDb, sharedTestDb } from '@ks/server/db/__tests__/pglite.ts';

// NFR-09
describe('createTestDb', () => {
  it('lets two overlapping queries finish', async () => {
    const db = createTestDb();

    const rows = await Promise.all([
      sql<{ n: number }>`select 1 as n`.execute(db),
      sql<{ n: number }>`select 2 as n`.execute(db),
    ]);

    expect(rows.map(({ rows: [row] }) => row?.n)).toEqual([1, 2]);
    await db.destroy();
  });

  it('counts the rows a parameterless write affects', async () => {
    const db = createTestDb();

    await sql`create table t (id int)`.execute(db);
    await sql`insert into t values (1), (2)`.execute(db);

    const result = await db.deleteFrom('t' as never).executeTakeFirst();

    expect(result.numDeletedRows).toBe(2n);
    await db.destroy();
  });
});

// NFR-09
describe('sharedTestDb', () => {
  const shared = sharedTestDb();

  afterAll(() => shared.close());

  it('empty() leaves no table from an earlier call', async () => {
    const first = await shared.empty();

    await sql`create table t (id int)`.execute(first);

    const second = await shared.empty();
    const { rows } = await sql<{ n: number }>`
      select count(*)::int as n from information_schema.tables where table_schema = 'public'
    `.execute(second);

    expect(rows[0]?.n).toBe(0);
  });

  it('fresh() leaves the migrated tables and no row from an earlier call', async () => {
    const first = await shared.fresh();

    await first
      .insertInto('account')
      .values({
        id: parseAccountId('00000000-0000-4000-8000-0000000000a1')!,
        issuer: 'test',
        subject: 'a',
      })
      .execute();

    const second = await shared.fresh();
    const accounts = await second.selectFrom('account').selectAll().execute();

    expect(accounts).toEqual([]);
  });

  it('destroy() on a handle leaves the client open', async () => {
    const handle = await shared.empty();

    await handle.destroy();

    const { rows } = await sql<{ n: number }>`select 1 as n`.execute(
      await shared.empty()
    );

    expect(rows[0]?.n).toBe(1);
  });
});
