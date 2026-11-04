'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import type { SignInState } from '@ks/app/components/auth/types';

import { safeReturnTo } from '@ks/lib/domain/auth/return-to.mts';
import { appAdapters } from '@ks/server/adapters.mts';
import { attemptSignIn } from '@ks/server/auth/attempt.mts';
import { sessionCookie } from '@ks/server/auth/sessions.mts';

/**
 * Signs in from the form. A failure comes back as the form's state; success sets the session
 * cookie and goes to the same-site "return to" address, or the map.
 */
export const signInAction = async (
  _state: SignInState,
  data: FormData
): Promise<SignInState> => {
  const result = await attemptSignIn(appAdapters(), () => new Date(), {
    email: data.get('email'),
    password: data.get('password'),
  });

  if (!result.ok) {
    return result.error;
  }

  const { name, options, value } = sessionCookie(result.value);

  (await cookies()).set(name, value, options);
  redirect(safeReturnTo(data.get('returnTo')));
};
