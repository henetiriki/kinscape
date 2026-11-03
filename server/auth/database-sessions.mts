import type { SessionStore } from '#ks/lib/domain/auth/types.ts';
import type { createDb } from '#ks/server/db/database.mts';

/** A SessionStore over Postgres. */
export const databaseSessions = (
  db: ReturnType<typeof createDb>
): SessionStore => ({
  add: async row => {
    await db.insertInto('session').values(row).execute();
  },
  find: async tokenHash =>
    db
      .selectFrom('session')
      .where('tokenHash', '=', tokenHash)
      .selectAll()
      .executeTakeFirst(),
  remove: async tokenHash => {
    await db.deleteFrom('session').where('tokenHash', '=', tokenHash).execute();
  },
  removeExpired: async now => {
    await db.deleteFrom('session').where('expiresAt', '<=', now).execute();
  },
  renew: async (tokenHash, expiresAt) => {
    await db
      .updateTable('session')
      .set({ expiresAt })
      .where('tokenHash', '=', tokenHash)
      .execute();
  },
});
