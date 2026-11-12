import { sql } from 'kysely';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';

import { sharedTestDb } from '@ks/server/db/__tests__/pglite.ts';
import { createPgDb } from '@ks/server/db/database.mts';
import { migrate } from '@ks/server/db/migrate.mts';

/** What a database contract file needs from a backend: `sharedTestDb()`'s methods and a name. */
type ContractDb = { name: string } & ReturnType<typeof sharedTestDb>;

/**
 * One database of its own on the Postgres container, for one test file (NFR-09). Parallel files
 * would reset each other's schema if they shared a database. It is made on first use. `close()`
 * drops it. A handle's `destroy()` closes that handle's pool, as on a real connection.
 */
const containerDb = (adminUrl: string): ReturnType<typeof sharedTestDb> => {
  const name = `ks_test_${randomUUID().replaceAll('-', '')}`;
  let admin: ReturnType<typeof createPgDb> | undefined;
  let created: Promise<string> | undefined;

  const create = async () => {
    admin = createPgDb(adminUrl);
    await sql`create database ${sql.id(name)}`.execute(admin);

    const url = new URL(adminUrl);

    url.pathname = `/${name}`;

    return url.toString();
  };

  const empty = async () => {
    created ??= create();

    const db = createPgDb(await created);

    await sql`drop schema public cascade`.execute(db);
    await sql`create schema public`.execute(db);

    return db;
  };

  const fresh = async () => {
    const db = await empty();

    await migrate(db, join(import.meta.dirname, '../migrations'));

    return db;
  };

  const close = async () => {
    if (admin !== undefined) {
      await sql`drop database ${sql.id(name)} with (force)`.execute(admin);
      await admin.destroy();
    }
  };

  return { close, empty, fresh };
};

/**
 * The backends a database contract file runs on: PGlite always, and the Postgres container when
 * `KINSCAPE_TEST_DATABASE_URL` is set (CI's `test` job, `scripts/ci-postgres.sh`). Read here, not
 * in `server/env.mts`, because only tests use it.
 */
export const contractDbs = (
  env: Record<string, string | undefined> = process.env
): ContractDb[] => {
  const url = env.KINSCAPE_TEST_DATABASE_URL;

  return [
    { ...sharedTestDb(), name: 'database (pglite)' },
    ...(url ? [{ ...containerDb(url), name: 'database (postgres)' }] : []),
  ];
};
