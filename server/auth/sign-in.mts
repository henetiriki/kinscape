import type { SignInPort } from '#ks/lib/domain/auth/types.ts';
import type { TreeStore } from '#ks/lib/domain/trees/types.ts';

import { err, ok } from '#ks/lib/domain/result/result.mts';

/**
 * An email and password to an Account. A wrong password, an unknown email and a user with no
 * Account give the same `refused`. An Auth outage throws (the port's error) and is never a refusal.
 */
export const signIn = async (
  { signIn: port, store }: { signIn: SignInPort; store: TreeStore },
  email: string,
  password: string
) => {
  if (email === '' || password === '') {
    return err('refused');
  }

  const identity = await port.verify(email, password);
  const account =
    identity === undefined
      ? undefined
      : await store.findAccount(identity.issuer, identity.subject);

  return account === undefined ? err('refused') : ok(account);
};
