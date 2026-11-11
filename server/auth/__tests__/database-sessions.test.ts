import { createHash } from 'node:crypto';
import { afterAll, describe, expect, it } from 'vitest';

import {
  ACCOUNT,
  OTHER,
  runSessionContract,
} from '@ks/server/auth/__tests__/session-contract.ts';
import { databaseSessions } from '@ks/server/auth/database-sessions.mts';
import { startSession } from '@ks/server/auth/sessions.mts';
import { sharedTestDb } from '@ks/server/db/__tests__/pglite.ts';

const shared = sharedTestDb();

afterAll(() => shared.close());

const prepare = async () => {
  const db = await shared.fresh();

  await db
    .insertInto('account')
    .values([
      { id: ACCOUNT, issuer: 'test', subject: 'a' },
      { id: OTHER, issuer: 'test', subject: 'o' },
    ])
    .execute();

  return db;
};

runSessionContract('database', async () => {
  const db = await prepare();

  return { close: () => db.destroy(), store: databaseSessions(db) };
});

// NFR-03
describe('database sessions', () => {
  it('holds the token’s hash in the row and the token nowhere', async () => {
    const db = await prepare();
    const token = await startSession(
      databaseSessions(db),
      () => new Date('2030-01-01T00:00:00Z'),
      { accountId: ACCOUNT, email: 'a@example.test' }
    );
    const rows = await db.selectFrom('session').selectAll().execute();

    expect(rows).toHaveLength(1);
    expect(rows[0]?.tokenHash).toBe(
      createHash('sha256').update(token).digest('hex')
    );
    expect(JSON.stringify(rows)).not.toContain(token);

    await db.destroy();
  });

  it('deletes a session with its Account', async () => {
    const db = await prepare();

    await startSession(
      databaseSessions(db),
      () => new Date('2030-01-01T00:00:00Z'),
      { accountId: ACCOUNT, email: 'a@example.test' }
    );
    await db.deleteFrom('account').where('id', '=', ACCOUNT).execute();

    expect(await db.selectFrom('session').selectAll().execute()).toEqual([]);

    await db.destroy();
  });
});
