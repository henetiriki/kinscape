import { describe, expect, it } from 'vitest';

import { contractDbs } from '@ks/server/db/__tests__/postgres.ts';

const URL = process.env.KINSCAPE_TEST_DATABASE_URL;

// NFR-09
describe('contractDbs', () => {
  it('is PGlite alone without KINSCAPE_TEST_DATABASE_URL', async () => {
    const dbs = contractDbs({});

    expect(dbs.map(({ name }) => name)).toEqual(['database (pglite)']);
    await Promise.all(dbs.map(({ close }) => close()));
  });

  it('adds the container with it, and opens no connection until a test asks', async () => {
    // Port 1 refuses a connection, so an attempt throws.
    const dbs = contractDbs({
      KINSCAPE_TEST_DATABASE_URL: 'postgres://app@localhost:1/postgres',
    });

    expect(dbs.map(({ name }) => name)).toEqual([
      'database (pglite)',
      'database (postgres)',
    ]);
    await Promise.all(dbs.map(({ close }) => close()));
  });

  // Only where `scripts/ci-postgres.sh` started a container.
  if (URL !== undefined) {
    it('gives each file its own migrated database on the container', async () => {
      const [pglite, first] = contractDbs();
      const [other, second] = contractDbs();

      if (first === undefined || second === undefined) {
        throw new Error('KINSCAPE_TEST_DATABASE_URL gave no container');
      }

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
      await Promise.all(
        [pglite, first, other, second].map(({ close }) => close())
      );
    });
  }
});
