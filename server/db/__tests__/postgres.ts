import { sql } from 'kysely';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { inject } from 'vitest';

import { sharedTestDb } from '@ks/server/db/__tests__/pglite.ts';
import { createPgDb } from '@ks/server/db/database.mts';
import { migrate } from '@ks/server/db/migrate.mts';

/**
 * One database of its own on the Postgres container, for one test file (NFR-09). Parallel files
 * reset each other's schema in a shared database. The first call makes it, and `close()` drops it.
 * A handle's `destroy()` closes that handle's pool, as on a real connection. A test that failed
 * may leave its handle open, so `close()` destroys the open handles before the drop.
 */
const containerDb = (adminUrl: string): ReturnType<typeof sharedTestDb> => {
  const name = `ks_test_${randomUUID().replaceAll('-', '')}`;
  let admin: ReturnType<typeof createPgDb> | undefined;
  let created: Promise<string> | undefined;

  // The handles whose pools are open. A handle that a failed test left open must close before the
  // drop, or the drop ends its connection and the logged pool error could hide the test's failure.
  const open = new Set<ReturnType<typeof createPgDb>>();

  const track = (db: ReturnType<typeof createPgDb>) => {
    const destroy = db.destroy.bind(db);

    open.add(db);
    // A second `end()` on a `pg` pool throws, so a handle that a test destroyed leaves the set.
    db.destroy = async () => {
      open.delete(db);
      await destroy();
    };

    return db;
  };

  const create = async () => {
    admin = createPgDb(adminUrl);
    await sql`create database ${sql.id(name)}`.execute(admin);

    const url = new URL(adminUrl);

    url.pathname = `/${name}`;

    return url.toString();
  };

  const empty = async () => {
    created ??= create();

    const db = track(createPgDb(await created));

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
    // A database that was never made needs no drop, and a second error would hide the first.
    const made = await created?.then(
      () => true,
      () => false
    );

    await Promise.all([...open].map(db => db.destroy()));

    if (admin !== undefined) {
      if (made) {
        await sql`drop database ${sql.id(name)} with (force)`.execute(admin);
      }

      await admin.destroy();
    }
  };

  return { close, empty, fresh };
};

/**
 * The backend of the current Vitest project (`vitest.config.mts`): PGlite in `database-pglite` and
 * the Postgres container in `database-postgres`. The project name labels the log, so the contract
 * suites need no backend in their titles.
 */
export const contractDb = (): ReturnType<typeof sharedTestDb> =>
  inject('backend') === 'postgres'
    ? containerDb(inject('databaseUrl'))
    : sharedTestDb();
