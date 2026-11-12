import { sql } from 'kysely';
import { describe, expect, inject, it, vi } from 'vitest';

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

    it('destroys a handle that a failed test left open when it closes', async () => {
      const shared = contractDb();
      const left = await shared.fresh();
      const destroyed = await shared.fresh();

      await destroyed.destroy();
      await shared.close();

      // Kysely names a handle that was destroyed. A handle left open gives a `pg` error instead.
      await expect(sql`select 1`.execute(left)).rejects.toThrow(
        /driver has already been destroyed/
      );
    });

    it('logs one line for a dropped idle connection and then queries again', async () => {
      const log = vi.spyOn(console, 'error').mockImplementation(() => {});
      const shared = contractDb();
      const db = await shared.fresh();
      const admin = await shared.fresh();

      // Make the pool hold an idle client, then end that client's backend.
      const { rows } = await sql<{
        pid: number;
      }>`select pg_backend_pid() as pid`.execute(db);

      await sql`select pg_terminate_backend(${rows[0]?.pid})`.execute(admin);
      await vi.waitFor(() => expect(log).toHaveBeenCalledTimes(1));

      expect(log).toHaveBeenCalledWith(
        expect.stringMatching(
          /^The database closed an idle connection \(\w+\)$/
        )
      );
      expect(await db.selectFrom('tree').selectAll().execute()).toEqual([]);

      await db.destroy();
      await admin.destroy();
      await shared.close();
      log.mockRestore();
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
