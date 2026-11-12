import { sql } from 'kysely';
import { describe, expect, inject, it } from 'vitest';

import { contractDb } from '@ks/server/db/__tests__/postgres.ts';

const version = async (db: ReturnType<typeof contractDb>['fresh']) => {
  const handle = await db();
  const { rows } = await sql<{
    version: string;
  }>`select version() as version`.execute(handle);

  return { handle, version: rows[0]?.version };
};

// NFR-09
describe('contractDb', () => {
  if (inject('backend') === 'pglite') {
    it('is PGlite in the database-pglite project', async () => {
      const shared = contractDb();
      const { handle, version: found } = await version(shared.fresh);

      expect(found).toMatch(/PGlite/);
      expect(await handle.selectFrom('tree').selectAll().execute()).toEqual([]);

      await handle.destroy();
      await shared.close();
    });
  } else {
    it('is Postgres 17 over TLS in the database-postgres project', async () => {
      const shared = contractDb();
      const { handle, version: found } = await version(shared.fresh);
      const { rows } = await sql<{
        ssl: boolean;
      }>`select ssl from pg_stat_ssl where pid = pg_backend_pid()`.execute(
        handle
      );

      expect(found).toMatch(/^PostgreSQL 17\./);
      expect(found).not.toMatch(/PGlite/);
      expect(rows).toEqual([{ ssl: true }]);

      await handle.destroy();
      await shared.close();
    });

    it('gives each file its own migrated database on the container', async () => {
      const first = contractDb();
      const second = contractDb();
      const db = await first.fresh();

      await db
        .insertInto('tree')
        .values({ name: 'only in the first database' })
        .execute();

      const elsewhere = await second.fresh();

      expect(await db.selectFrom('tree').select('name').execute()).toHaveLength(
        1
      );
      expect(await elsewhere.selectFrom('tree').selectAll().execute()).toEqual(
        []
      );

      // A new handle on the same database starts empty again, with the tables migrated.
      await db.destroy();

      const again = await first.fresh();

      expect(await again.selectFrom('tree').selectAll().execute()).toEqual([]);

      await again.destroy();
      await elsewhere.destroy();
      await Promise.all([first.close(), second.close()]);
    });
  }
});
