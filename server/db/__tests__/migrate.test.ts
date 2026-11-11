import type { Kysely } from 'kysely';

import { sql } from 'kysely';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { Database } from '@ks/server/db/types.ts';

import { sharedTestDb } from '@ks/server/db/__tests__/pglite.ts';
import { migrate } from '@ks/server/db/migrate.mts';

const MIGRATIONS = join(import.meta.dirname, '..', 'migrations');

const shared = sharedTestDb();

let db: Kysely<Database>;
let dir = '';

const columnsOf = async (table: string) => {
  const { rows } = await sql<{ column: string; key: null | string }>`
    select c.column_name as column, k.constraint_type as key
    from information_schema.columns c
    left join (
      select u.table_name, u.column_name, t.constraint_type
      from information_schema.key_column_usage u
      join information_schema.table_constraints t
        on t.constraint_name = u.constraint_name
      where t.constraint_type in ('PRIMARY KEY', 'UNIQUE')
    ) k on k.table_name = c.table_name and k.column_name = c.column_name
    where c.table_name = ${table}
    order by c.ordinal_position`.execute(db);

  return rows;
};

const tables = async () => {
  const { rows } = await sql<{ name: string }>`
    select table_name as name from information_schema.tables
    where table_schema = 'public' order by table_name`.execute(db);

  return rows.map(row => row.name);
};

const write = (name: string, body: string) =>
  writeFileSync(join(dir, name), body);

beforeEach(async () => {
  db = await shared.empty();
  dir = mkdtempSync(join(tmpdir(), 'migrations-'));
});

afterEach(async () => {
  await db.destroy();
  rmSync(dir, { force: true, recursive: true });
});

afterAll(() => shared.close());

// NFR-09
describe('migrate', () => {
  it('creates the tables with their keys on an empty database', async () => {
    const applied = await migrate(db, MIGRATIONS);

    expect(applied).toEqual([
      '0001_accounts_and_trees.sql',
      '0002_sessions.sql',
      '0003_sign_in_failures.sql',
    ]);
    expect(await tables()).toEqual([
      'account',
      'schema_migration',
      'session',
      'sign_in_failure',
      'tree',
      'tree_account',
    ]);
    expect(await columnsOf('account')).toEqual([
      { column: 'id', key: 'PRIMARY KEY' },
      { column: 'issuer', key: 'UNIQUE' },
      { column: 'subject', key: 'UNIQUE' },
    ]);
    expect(await columnsOf('tree')).toEqual([
      { column: 'id', key: 'PRIMARY KEY' },
      { column: 'name', key: null },
    ]);
    expect(await columnsOf('tree_account')).toEqual([
      { column: 'tree_id', key: 'PRIMARY KEY' },
      { column: 'account_id', key: 'PRIMARY KEY' },
    ]);
  });

  it('keeps an Account unique by issuer and subject', async () => {
    await migrate(db, MIGRATIONS);
    await db
      .insertInto('account')
      .values({ issuer: 'https://issuer.test', subject: 's1' })
      .execute();

    await expect(
      db
        .insertInto('account')
        .values({ issuer: 'https://issuer.test', subject: 's1' })
        .execute()
    ).rejects.toThrow();
  });

  it('deletes tree_account rows with their Tree or Account', async () => {
    await migrate(db, MIGRATIONS);

    const tree = await db
      .insertInto('tree')
      .values({ name: 'T' })
      .returning('id')
      .executeTakeFirstOrThrow();
    const account = await db
      .insertInto('account')
      .values({ issuer: 'i', subject: 's' })
      .returning('id')
      .executeTakeFirstOrThrow();
    const link = { accountId: account.id, treeId: tree.id };

    await db.insertInto('treeAccount').values(link).execute();
    await db.deleteFrom('tree').where('id', '=', tree.id).execute();

    expect(await db.selectFrom('treeAccount').selectAll().execute()).toEqual(
      []
    );

    const other = await db
      .insertInto('tree')
      .values({ name: 'U' })
      .returning('id')
      .executeTakeFirstOrThrow();

    await db
      .insertInto('treeAccount')
      .values({ accountId: account.id, treeId: other.id })
      .execute();
    await db.deleteFrom('account').where('id', '=', account.id).execute();

    expect(await db.selectFrom('treeAccount').selectAll().execute()).toEqual(
      []
    );
  });

  it('changes nothing when run again', async () => {
    await migrate(db, MIGRATIONS);

    const before = await db.selectFrom('schemaMigration').selectAll().execute();

    expect(await migrate(db, MIGRATIONS)).toEqual([]);
    expect(
      await db.selectFrom('schemaMigration').selectAll().execute()
    ).toEqual(before);
  });

  it('applies only the new files, in name order', async () => {
    write('0002_b.sql', 'create table b (id int);');
    write('0001_a.sql', 'create table a (id int);\ncreate table a2 (id int);');
    write('notes.txt', 'not a migration');

    expect(await migrate(db, dir)).toEqual(['0001_a.sql', '0002_b.sql']);

    write('0003_c.sql', 'create table c (id int);');

    expect(await migrate(db, dir)).toEqual(['0003_c.sql']);
    expect(
      (await db.selectFrom('schemaMigration').select('name').execute()).map(
        row => row.name
      )
    ).toEqual(['0001_a.sql', '0002_b.sql', '0003_c.sql']);
  });

  it('stops naming an applied file that was edited', async () => {
    write('0001_a.sql', 'create table a (id int);');
    await migrate(db, dir);
    write('0001_a.sql', 'create table a (id bigint);');
    write('0002_b.sql', 'create table b (id int);');

    await expect(migrate(db, dir)).rejects.toThrow(/0001_a\.sql/);
    expect(await tables()).not.toContain('b');
  });

  it('rolls a failing file back whole and records nothing for it', async () => {
    write('0001_a.sql', 'create table a (id int);');
    write('0002_b.sql', 'create table b (id int);\nselect * from missing;');

    await expect(migrate(db, dir)).rejects.toThrow(/0002_b\.sql/);
    expect(await tables()).toContain('a');
    expect(await tables()).not.toContain('b');
    expect(
      (await db.selectFrom('schemaMigration').select('name').execute()).map(
        row => row.name
      )
    ).toEqual(['0001_a.sql']);
  });
});
