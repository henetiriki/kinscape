import type { Kysely } from 'kysely';

import { sql } from 'kysely';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { Database } from '@ks/server/db/types.ts';

import { sharedTestDb } from '@ks/server/db/__tests__/pglite.ts';

type Violation = { rule: string; table: string };

const DB_DIR = join(import.meta.dirname, '..');

const shared = sharedTestDb();

let db: Kysely<Database>;

/** Every table with a `tree_id` column (`tree_account` is the link table) that breaks a rule. */
const violations = async (): Promise<Violation[]> => {
  const { rows } = await sql<Violation>`
    with scoped as (
      select c.oid, c.relname
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind = 'r' and c.relname <> 'tree_account'
        and exists (
          select 1 from pg_attribute a
          where a.attrelid = c.oid and a.attname = 'tree_id' and not a.attisdropped
        )
    )
    select s.relname as "table", 'primary key' as rule
    from scoped s
    where coalesce((
      select array_agg(a.attname::text order by k.ord)
      from pg_constraint p
      cross join unnest(p.conkey) with ordinality k (attnum, ord)
      join pg_attribute a on a.attrelid = p.conrelid and a.attnum = k.attnum
      where p.conrelid = s.oid and p.contype = 'p'
    ), '{}') <> array['tree_id', 'id']
    union all
    select s.relname, 'column ' || w
    from scoped s
    cross join unnest(array['version', 'created_at', 'updated_at']) w
    where not exists (
      select 1 from pg_attribute a
      where a.attrelid = s.oid and a.attname = w and a.attnum > 0 and not a.attisdropped
    )
    union all
    select s.relname, 'foreign key ' || f.conname
    from scoped s
    join pg_constraint f on f.conrelid = s.oid and f.contype = 'f'
    where f.confrelid in (select oid from scoped)
      and not exists (
        select 1 from pg_attribute a
        where a.attrelid = s.oid and a.attnum = any (f.conkey) and a.attname = 'tree_id'
      )
    order by 1, 2`.execute(db);

  return rows;
};

const STAMPS = `version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()`;
const TREE = 'tree_id uuid not null references tree (id) on delete cascade';

afterEach(async () => {
  await db.destroy();
});

afterAll(() => shared.close());

const found = async (table: string, body: string) => {
  await sql.raw(`create table ${table} (${body})`).execute(db);

  return violations();
};

// NFR-09
describe('the Tree-scoped table check', () => {
  beforeEach(async () => {
    db = await shared.empty();
    await sql`create table tree (id uuid primary key)`.execute(db);
    await sql
      .raw(
        `create table person (${TREE}, id uuid not null, ${STAMPS}, primary key (tree_id, id), unique (id))`
      )
      .execute(db);
  });

  it('finds nothing in a table that follows the pattern', async () => {
    expect(
      await found(
        'good',
        `${TREE}, id uuid not null, person_id uuid not null, ${STAMPS},
         primary key (tree_id, id),
         foreign key (tree_id, person_id) references person (tree_id, id)`
      )
    ).toEqual([]);
  });

  it('names a table without the composite primary key', async () => {
    expect(
      await found('bad', `${TREE}, id uuid primary key, ${STAMPS}`)
    ).toEqual([{ rule: 'primary key', table: 'bad' }]);
  });

  it('names a table without version', async () => {
    expect(
      await found(
        'bad',
        `${TREE}, id uuid not null, created_at timestamptz not null,
         updated_at timestamptz not null, primary key (tree_id, id)`
      )
    ).toEqual([{ rule: 'column version', table: 'bad' }]);
  });

  it('names a table without a timestamp', async () => {
    expect(
      await found(
        'bad',
        `${TREE}, id uuid not null, version integer not null,
         updated_at timestamptz not null, primary key (tree_id, id)`
      )
    ).toEqual([{ rule: 'column created_at', table: 'bad' }]);
  });

  it('names a plain reference to a Tree-scoped table', async () => {
    expect(
      await found(
        'bad',
        `${TREE}, id uuid not null, person_id uuid not null references person (id), ${STAMPS},
         primary key (tree_id, id)`
      )
    ).toEqual([{ rule: expect.stringMatching(/^foreign key /), table: 'bad' }]);
  });
});

// NFR-09, NFR-10
describe('the migrations and TEMPLATE.sql', () => {
  const treeA = crypto.randomUUID();
  const treeB = crypto.randomUUID();
  const personId = crypto.randomUUID();

  beforeEach(async () => {
    db = await shared.fresh();
    await sql
      .raw(readFileSync(join(DB_DIR, 'TEMPLATE.sql'), 'utf8'))
      .execute(db);
    await sql`insert into tree (id, name) values (${treeA}, 'A'), (${treeB}, 'B')`.execute(
      db
    );
  });

  const createPerson = (tree: string, id: string, name: string) =>
    sql`insert into example_person (tree_id, id, name) values (${tree}, ${id}, ${name})
      on conflict (tree_id, id) do nothing`.execute(db);

  it('has no table that breaks the pattern', async () => {
    expect(await violations()).toEqual([]);
  });

  it('refuses a pin that points at a Person in another Tree', async () => {
    await createPerson(treeA, personId, 'Ana');

    await expect(
      sql`insert into example_pin (tree_id, id, person_id)
        values (${treeB}, ${crypto.randomUUID()}, ${personId})`.execute(db)
    ).rejects.toThrow(/foreign key/);
  });

  it('updates zero rows when the version is stale', async () => {
    await createPerson(treeA, personId, 'Ana');

    const update = (version: number) =>
      sql`update example_person
        set name = 'Ana B', version = version + 1, updated_at = now()
        where tree_id = ${treeA} and id = ${personId} and version = ${version}`.execute(
        db
      );

    expect((await update(1)).numAffectedRows).toBe(1n);
    expect((await update(1)).numAffectedRows).toBe(0n);
  });

  it('ignores a repeated create with the same id', async () => {
    await createPerson(treeA, personId, 'Ana');
    await createPerson(treeA, personId, 'Other');

    const { rows } = await sql<{ name: string }>`
      select name from example_person where tree_id = ${treeA} and id = ${personId}`.execute(
      db
    );

    expect(rows).toEqual([{ name: 'Ana' }]);
  });

  it('reads a row added in Tree A as missing from Tree B', async () => {
    await createPerson(treeA, personId, 'Ana');

    const { rows } = await sql`
      select 1 from example_person where tree_id = ${treeB} and id = ${personId}`.execute(
      db
    );

    expect(rows).toEqual([]);
  });
});
