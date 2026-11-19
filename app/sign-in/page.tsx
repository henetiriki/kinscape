import { redirect } from 'next/navigation';

import { SignInForm } from '@ks/app/components/auth/SignInForm';
import { SignInHero } from '@ks/app/components/auth/SignInHero';
import { SignInLayout } from '@ks/app/components/layout/SignInLayout';
import { signInAction } from '@ks/app/sign-in/actions';
import { safeReturnTo } from '@ks/lib/domain/auth/return-to.mts';
import { currentSession } from '@ks/server/auth/current.mts';

/** The sign-in page: someone already signed in goes to the map. */
const SignIn = async ({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string | string[] }>;
}) => {
  // An outage of the session store shows the form, whose sign-in then says it can't.
  if ((await currentSession()) !== undefined) {
    redirect('/');
  }

  const { returnTo } = await searchParams;

  return (
    <SignInLayout hero={<SignInHero />}>
      <SignInForm action={signInAction} returnTo={safeReturnTo(returnTo)} />
    </SignInLayout>
  );
};

export default SignIn;
