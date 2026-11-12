import type { Dialect } from 'kysely';

import { CamelCasePlugin, Kysely, PostgresDialect } from 'kysely';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import pg from 'pg';

import type { Database } from '#ks/server/db/types.ts';

import { parseCaFile, parseEnv } from '#ks/server/env.mts';

/** Tables are snake_case in SQL and camelCase in code. */
export const createDb = (dialect: Dialect) =>
  new Kysely<Database>({ dialect, plugins: [new CamelCasePlugin()] });

const cas = new Map<string, string>();

/**
 * The database host's root certificate, read once per path. Public, not a secret. It is
 * `server/db/root-ca.crt` unless the test-only `KINSCAPE_DATABASE_CA_FILE` names another file.
 */
export const rootCa = () => {
  const path =
    parseCaFile(process.env) ?? join(process.cwd(), 'server/db/root-ca.crt');
  let ca = cas.get(path);

  if (ca === undefined) {
    // The environment names the override at run time, so the bundler cannot trace it. The default file
    // reaches the build through `outputFileTracingIncludes` in `next.config.ts`.
    ca = readFileSync(/* turbopackIgnore: true */ path, 'utf8');
    cas.set(path, ca);
  }

  return ca;
};

/**
 * The pool's settings: TLS that checks the server's certificate against the pinned root CA.
 * `sslmode` is dropped from the URL because `pg` lets the URL's TLS parameters replace `ssl`.
 */
export const poolConfig = (
  connectionString: string,
  certificate = rootCa()
) => {
  const url = new URL(connectionString);

  url.searchParams.delete('sslmode');

  return {
    connectionString: url.toString(),
    ssl: { ca: certificate, rejectUnauthorized: true },
  };
};

/** A Kysely over `pg`, which sends no named prepared statements, as the transaction pooler needs. */
export const createPgDb = (connectionString: string) =>
  createDb(
    new PostgresDialect({ pool: new pg.Pool(poolConfig(connectionString)) })
  );

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
