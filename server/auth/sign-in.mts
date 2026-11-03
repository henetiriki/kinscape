import type { SessionPort } from '#ks/lib/domain/auth/types.ts';
import type { TreeStore } from '#ks/lib/domain/trees/types.ts';

import { err, ok } from '#ks/lib/domain/result/result.mts';
import { ISSUER } from '#ks/server/trees/repository.mts';

/**
 * An email and password to an Account. A wrong password, an unknown email and a user with no
 * Account give the same `refused`. An Auth outage throws (the port's error) and is never a refusal.
 */
export const signIn = async (
  { session, store }: { session: SessionPort; store: TreeStore },
  email: string,
  password: string
) => {
  if (email === '' || password === '') {
    return err('refused');
  }

  const subject = await session.verify(email, password);
  const account =
    subject === undefined
      ? undefined
      : await store.findAccount(ISSUER, subject);

  return account === undefined ? err('refused') : ok(account);
};
