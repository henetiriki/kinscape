import type { Dialect } from 'kysely';

import { CamelCasePlugin, Kysely, PostgresDialect } from 'kysely';
import pg from 'pg';

import type { Database } from '#ks/server/db/types.ts';

import { parseEnv } from '#ks/server/env.mts';

/** Tables are snake_case in SQL and camelCase in code. */
export const createDb = (dialect: Dialect) =>
  new Kysely<Database>({ dialect, plugins: [new CamelCasePlugin()] });

/** A Kysely over `pg`, which sends no named prepared statements, as the transaction pooler needs. */
export const createPgDb = (connectionString: string) =>
  createDb(new PostgresDialect({ pool: new pg.Pool({ connectionString }) }));

let instance: ReturnType<typeof createPgDb> | undefined;

/** The app's database, opened on first use from `KINSCAPE_DATABASE_URL`. */
export const db = () => {
  if (instance === undefined) {
    const { databaseUrl } = parseEnv(process.env);

    if (databaseUrl === undefined) {
      throw new Error('The memory adapters have no database');
    }

    instance = createPgDb(databaseUrl);
  }

  return instance;
};
