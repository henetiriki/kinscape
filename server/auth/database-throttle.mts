import { sql } from 'kysely';

import type { ThrottleStore } from '#ks/lib/domain/auth/types.ts';
import type { createDb } from '#ks/server/db/database.mts';

/** A ThrottleStore over Postgres. */
export const databaseThrottle = (
  db: ReturnType<typeof createDb>
): ThrottleStore => ({
  add: async (emailKey, failedAt) => {
    await db
      .insertInto('signInFailure')
      .values({ emailKey, failedAt })
      .execute();
  },
  // The table has no key, so `ctid` picks the one row.
  remove: async (emailKey, failedAt) => {
    await sql`delete from sign_in_failure where ctid in (
      select ctid from sign_in_failure
      where email_key = ${emailKey} and failed_at = ${failedAt} limit 1)`.execute(
      db
    );
  },
  removeBefore: async before => {
    await db
      .deleteFrom('signInFailure')
      .where('failedAt', '<', before)
      .execute();
  },
  since: async (emailKey, since) =>
    (
      await db
        .selectFrom('signInFailure')
        .select('failedAt')
        .where('emailKey', '=', emailKey)
        .where('failedAt', '>=', since)
        .orderBy('failedAt')
        .execute()
    ).map(row => row.failedAt),
});
