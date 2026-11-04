import type { ThrottleStore } from '#ks/lib/domain/auth/types.ts';

/** A ThrottleStore in memory, for tests and the test-only adapters. */
export const memoryThrottle = (): ThrottleStore => {
  let rows: { emailKey: string; failedAt: Date }[] = [];

  return {
    add: async (emailKey, failedAt) => {
      rows.push({ emailKey, failedAt });
    },
    removeBefore: async before => {
      rows = rows.filter(row => row.failedAt >= before);
    },
    since: async (emailKey, since) =>
      rows
        .filter(row => row.emailKey === emailKey && row.failedAt >= since)
        .map(row => row.failedAt)
        .sort((a, b) => a.getTime() - b.getTime()),
  };
};
