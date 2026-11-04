import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { AuthLayout } from '@ks/app/components/auth/AuthLayout';
import { SignInForm } from '@ks/app/components/auth/SignInForm';
import { SignInHero } from '@ks/app/components/auth/SignInHero';
import { signInAction } from '@ks/app/sign-in/actions';
import { safeReturnTo } from '@ks/lib/domain/auth/return-to.mts';
import { appAdapters } from '@ks/server/adapters.mts';
import { resumeSession, SESSION_COOKIE } from '@ks/server/auth/sessions.mts';

// An outage of the session store shows the form, whose sign-in then says it can't.
const signedIn = async () => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;

  if (token === undefined) {
    return false;
  }

  try {
    return (
      (await resumeSession(appAdapters().sessions, () => new Date(), token)) !==
      undefined
    );
  } catch {
    return false;
  }
};

/** The sign-in page: someone already signed in goes to the map. */
const SignIn = async ({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string | string[] }>;
}) => {
  if (await signedIn()) {
    redirect('/');
  }

  const { returnTo } = await searchParams;

  return (
    <AuthLayout hero={<SignInHero />}>
      <SignInForm action={signInAction} returnTo={safeReturnTo(returnTo)} />
    </AuthLayout>
  );
};

export default SignIn;
