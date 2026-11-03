import type { SessionRow, SessionStore } from '#ks/lib/domain/auth/types.ts';

/** A SessionStore in memory, for tests and the test-only adapters. */
export const memorySessions = (): SessionStore => {
  const rows = new Map<string, SessionRow>();

  return {
    add: async row => {
      rows.set(row.tokenHash, row);
    },
    find: async tokenHash => rows.get(tokenHash),
    remove: async tokenHash => {
      rows.delete(tokenHash);
    },
    removeExpired: async now => {
      for (const [hash, row] of rows) {
        if (row.expiresAt <= now) {
          rows.delete(hash);
        }
      }
    },
    renew: async (tokenHash, expiresAt) => {
      const row = rows.get(tokenHash);

      if (row !== undefined) {
        rows.set(tokenHash, { ...row, expiresAt });
      }
    },
  };
};
