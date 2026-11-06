import type { SignInPort } from '#ks/lib/domain/auth/types.ts';

/** A SignInPort over synthetic users, for tests and the test-only adapters. */
export const memorySignIn = (
  users: {
    email: string;
    issuer: string;
    password: string;
    subject: string;
  }[]
): SignInPort => ({
  verify: async (email, password) => {
    const user = users.find(u => u.email === email && u.password === password);

    return user === undefined
      ? undefined
      : { issuer: user.issuer, subject: user.subject };
  },
});
