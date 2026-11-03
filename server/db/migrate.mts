import type { Kysely } from 'kysely';

import { sql } from 'kysely';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { Database } from './types.ts';

const checksum = (body: string) =>
  createHash('sha256').update(body).digest('hex');

/**
 * Applies the `.sql` files in `dir` that are not yet recorded, in name order, each with its
 * `schema_migration` row in one transaction. Stops, naming the file, if an applied file was edited.
 * Returns the names it applied.
 */
export const migrate = async (
  db: Kysely<Database>,
  dir: string
): Promise<string[]> => {
  await sql`create table if not exists schema_migration (
    name text primary key,
    checksum text not null,
    applied_at timestamptz not null default now()
  )`.execute(db);

  const files = readdirSync(dir)
    .filter(name => name.endsWith('.sql'))
    .toSorted()
    .map(name => {
      const body = readFileSync(join(dir, name), 'utf8');

      return { body, checksum: checksum(body), name };
    });
  const applied = new Map(
    (
      await db
        .selectFrom('schemaMigration')
        .select(['name', 'checksum'])
        .execute()
    ).map(row => [row.name, row.checksum])
  );

  for (const file of files) {
    if (applied.has(file.name) && applied.get(file.name) !== file.checksum) {
      throw new Error(
        `Migration ${file.name} was edited after it was applied. Add a new file instead.`
      );
    }
  }

  const pending = files.filter(file => !applied.has(file.name));

  for (const file of pending) {
    try {
      await db.transaction().execute(async trx => {
        await sql.raw(file.body).execute(trx);
        await trx
          .insertInto('schemaMigration')
          .values({ checksum: file.checksum, name: file.name })
          .execute();
      });
    } catch (error) {
      throw new Error(`Migration ${file.name} failed`, { cause: error });
    }
  }

  return pending.map(file => file.name);
};
