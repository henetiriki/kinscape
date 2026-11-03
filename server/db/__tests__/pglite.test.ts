import { sql } from 'kysely';
import { describe, expect, it } from 'vitest';

import { createTestDb } from '@ks/server/db/__tests__/pglite.ts';

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
