'use client';

import { useActionState, useState } from 'react';

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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [state, submit, pending] = useActionState(
    async (previous: SignInState, data: FormData) => {
      const next = await action(previous, data);

      if (next === 'refused') {
        setPassword('');
      }

      return next;
    },
    undefined
  );
  const refused = state === 'refused';

  return (
    <form
      action={submit}
      className={styles.form}
      data-form={phone ? 'phone' : 'desktop'}>
      <div className={styles.head}>
        {phone ? (
          <Text as='h1' variant='h1Phone'>
            Sign in
          </Text>
        ) : (
          <Text as='h1' variant='h1'>
            Sign in
          </Text>
        )}
        <div className={styles.lede}>
          <Text variant='body'>
            Your tree is private. Sign in to open the map.
          </Text>
        </div>
      </div>
      {state && <Alert tone='error'>{refused ? REFUSED : UNAVAILABLE}</Alert>}
      <div className={styles.fields}>
        <TextField
          autoComplete='username'
          label='Email'
          mark={refused ? 'error' : undefined}
          name='email'
          onChange={event => setEmail(event.target.value)}
          placeholder='you@example.com'
          required
          size='l'
          type='email'
          value={email}
        />
        <TextField
          autoComplete='current-password'
          helper={
            refused ? 'Password cleared after a failed attempt.' : undefined
          }
          label='Password'
          mark={refused ? 'error' : undefined}
          name='password'
          onChange={event => setPassword(event.target.value)}
          required
          size='l'
          type='password'
          value={password}
        />
      </div>
      {returnTo !== undefined && (
        <input name='returnTo' type='hidden' value={returnTo} />
      )}
      <div className={styles.submit}>
        <Button
          disabled={pending}
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
