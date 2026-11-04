import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { runThrottleContract } from '@ks/server/auth/__tests__/throttle-contract.ts';
import { databaseThrottle } from '@ks/server/auth/database-throttle.mts';
import { countFailure } from '@ks/server/auth/throttle.mts';
import { createTestDb } from '@ks/server/db/__tests__/pglite.ts';
import { migrate } from '@ks/server/db/migrate.mts';

const prepare = async () => {
  const db = createTestDb();

  await migrate(db, join(import.meta.dirname, '../../db/migrations'));

  return db;
};

runThrottleContract('database', async () => {
  const db = await prepare();

  return { close: () => db.destroy(), store: databaseThrottle(db) };
});

// NFR-03
describe('database throttle', () => {
  it('holds the email’s hash in the row and the email nowhere', async () => {
    const db = await prepare();

    await countFailure(
      databaseThrottle(db),
      new Date('2030-01-01T00:00:00Z'),
      'Typed@Example.test'
    );

    const rows = await db.selectFrom('signInFailure').selectAll().execute();

    expect(rows).toHaveLength(1);
    expect(JSON.stringify(rows).toLowerCase()).not.toContain('typed');

    await db.destroy();
  });
});
