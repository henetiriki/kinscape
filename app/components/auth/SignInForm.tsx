'use client';

import { useActionState, useId, useState } from 'react';

import type { SignInAction, SignInState } from '@ks/app/components/auth/types';

import { Button } from '@ks/app/components/actions/Button';
import { Alert } from '@ks/app/components/feedback/Alert';
import { TextField } from '@ks/app/components/forms/TextField';
import { Text } from '@ks/app/components/foundation/Text';
import { usePhone } from '@ks/app/components/foundation/usePhone';

import styles from '@ks/app/components/auth/SignInForm.module.css';

const REFUSED =
  "That email and password don't match. Check them and try again.";
const UNAVAILABLE =
  "KinScape can't sign you in right now. Try again in a few minutes.";

const useSignIn = (action: SignInAction) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [missing, setMissing] = useState({ email: false, password: false });
  const [state, submit, pending] = useActionState(
    async (previous: SignInState, data: FormData) => {
      const blank = {
        email: String(data.get('email')).trim() === '',
        password: String(data.get('password')) === '',
      };

      setMissing(blank);

      if (blank.email || blank.password) {
        return undefined;
      }

      const next = await action(previous, data);

      if (next === 'refused') {
        setPassword('');
      }

      return next;
    },
    undefined
  );

  return {
    email,
    missing,
    password,
    pending,
    refused: state === 'refused',
    setEmail: (value: string) => {
      setEmail(value);
      setMissing(current => ({ ...current, email: false }));
    },
    setPassword: (value: string) => {
      setPassword(value);
      setMissing(current => ({ ...current, password: false }));
    },
    state,
    submit,
  };
};

type SignIn = ReturnType<typeof useSignIn>;

const Head = ({ phone, titleId }: { phone: boolean; titleId: string }) => (
  <div className={styles.head}>
    {phone ? (
      <Text as='h1' id={titleId} variant='h1Phone'>
        Sign in
      </Text>
    ) : (
      <Text as='h1' id={titleId} variant='h1'>
        Sign in
      </Text>
    )}
    <div className={styles.lede}>
      <Text variant='body'>Your tree is private. Sign in to open the map.</Text>
    </div>
  </div>
);

const Fields = ({ form }: { form: SignIn }) => (
  <div className={styles.fields}>
    <TextField
      autoComplete='username'
      error={form.missing.email ? 'Enter your email.' : undefined}
      label='Email'
      mark={form.refused ? 'error' : undefined}
      name='email'
      onChange={event => form.setEmail(event.target.value)}
      placeholder='you@example.com'
      required
      size='l'
      type='email'
      value={form.email}
    />
    <TextField
      autoComplete='current-password'
      error={form.missing.password ? 'Enter your password.' : undefined}
      helper={
        form.refused ? 'Password cleared after a failed attempt.' : undefined
      }
      label='Password'
      mark={form.refused ? 'error' : undefined}
      name='password'
      onChange={event => form.setPassword(event.target.value)}
      required
      size='l'
      type='password'
      value={form.password}
    />
  </div>
);

/**
 * The sign-in form: title, the failure above the fields, Email, Password, Sign in, and the
 * no-sign-up note. The fields are controlled, so the form's reset after an action keeps the
 * email; a refusal empties the password and marks both fields.
 */
export const SignInForm = ({
  action,
  returnTo,
}: {
  action: SignInAction;
  /** Where to go after signing in; the action checks it. */
  returnTo?: string;
}) => {
  const phone = usePhone();
  const titleId = useId();
  const form = useSignIn(action);

  return (
    <form
      action={form.submit}
      aria-labelledby={titleId}
      className={styles.form}
      data-form={phone ? 'phone' : 'desktop'}
      noValidate>
      <Head phone={phone} titleId={titleId} />
      {form.state && (
        <Alert tone='error'>{form.refused ? REFUSED : UNAVAILABLE}</Alert>
      )}
      <Fields form={form} />
      {returnTo !== undefined && (
        <input name='returnTo' type='hidden' value={returnTo} />
      )}
      <div className={styles.submit}>
        <Button
          disabled={form.pending}
          full
          size='l'
          type='submit'
          variant='primary'>
          Sign in
        </Button>
      </div>
      <p className={styles.note}>
        <Text variant='small'>
          There&apos;s no sign-up. Accounts are set up by whoever runs this
          KinScape.
        </Text>
      </p>
    </form>
  );
};
