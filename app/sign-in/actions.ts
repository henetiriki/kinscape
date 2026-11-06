'use server';

import { redirect } from 'next/navigation';

import type { SignInState } from '@ks/app/components/auth/types';

import { safeReturnTo } from '@ks/lib/domain/auth/return-to.mts';
import { signIn, signOut } from '@ks/server/auth/current.mts';

/**
 * Signs in from the form. A failure comes back as the form's state; success goes to the same-site
 * "return to" address, or the map.
 */
export const signInAction = async (
  _state: SignInState,
  data: FormData
): Promise<SignInState> => {
  const result = await signIn({
    email: data.get('email'),
    password: data.get('password'),
  });

  if (!result.ok) {
    return result.error;
  }

  redirect(safeReturnTo(data.get('returnTo')));
};

/** Signs out and goes to `/sign-in`. */
export const signOutAction = async (): Promise<never> => {
  await signOut();
  redirect('/sign-in');
};
