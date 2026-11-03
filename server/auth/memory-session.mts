import type { SessionPort } from '#ks/lib/domain/auth/types.ts';

/** A SessionPort over synthetic users, for tests and the test-only adapters. */
export const memorySession = (
  users: { email: string; password: string; subject: string }[]
): SessionPort => ({
  verify: async (email, password) =>
    users.find(user => user.email === email && user.password === password)
      ?.subject,
});
