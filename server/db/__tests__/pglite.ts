import type {
  CompiledQuery,
  DatabaseConnection,
  Dialect,
  Driver,
  QueryResult,
} from 'kysely';

import { PGlite } from '@electric-sql/pglite';
import {
  PostgresAdapter,
  PostgresIntrospector,
  PostgresQueryCompiler,
} from 'kysely';

import { createDb } from '@ks/server/db/database.mts';

/** One connection, lent to one caller at a time, over an in-process Postgres. */
const pgliteDriver = (client: PGlite): Driver => {
  let lock: Promise<void> = Promise.resolve();
  let release = () => {};

  const connection: DatabaseConnection = {
    executeQuery: async <R>({
      parameters,
      sql,
    }: CompiledQuery): Promise<QueryResult<R>> => {
      // Like `pg`, send parameterless SQL as a simple query, so a file may hold many statements.
      if (parameters.length === 0) {
        const results = await client.exec(sql);

        return { rows: (results.at(-1)?.rows ?? []) as R[] };
      }

      const result = await client.query<R>(sql, [...parameters]);

      return {
        numAffectedRows: BigInt(result.affectedRows ?? 0),
        rows: result.rows,
      };
    },

    streamQuery: () => {
      throw new Error('PGlite driver: streaming is not supported');
    },
  };

  const run = async (sql: string) => {
    await connection.executeQuery({
      parameters: [],
      sql,
    } as unknown as CompiledQuery);
  };

  return {
    acquireConnection: async () => {
      const previous = lock;

      lock = new Promise<void>(resolve => {
        release = resolve;
      });
      await previous;

      return connection;
    },
    beginTransaction: () => run('begin'),
    commitTransaction: () => run('commit'),
    destroy: () => client.close(),
    init: () => client.waitReady,
    releaseConnection: async () => {
      release();
    },
    rollbackTransaction: () => run('rollback'),
  };
};

/** A fresh in-memory database per call (NFR-09). Call `destroy()` on the result when done. */
export const createTestDb = () => {
  const client = new PGlite();
  const dialect: Dialect = {
    createAdapter: () => new PostgresAdapter(),
    createDriver: () => pgliteDriver(client),
    createIntrospector: db => new PostgresIntrospector(db),
    createQueryCompiler: () => new PostgresQueryCompiler(),
  };

  return createDb(dialect);
};
