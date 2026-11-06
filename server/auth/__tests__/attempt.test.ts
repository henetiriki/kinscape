import { describe, expect, it, vi } from 'vitest';

import { parseAccountId } from '@ks/lib/domain/ids/ids.mts';
import { attemptSignIn } from '@ks/server/auth/attempt.mts';
import { memorySessions } from '@ks/server/auth/memory-sessions.mts';
import { memorySignIn } from '@ks/server/auth/memory-sign-in.mts';
import { memoryThrottle } from '@ks/server/auth/memory-throttle.mts';
import { resumeSession } from '@ks/server/auth/sessions.mts';
import { emailKey } from '@ks/server/auth/throttle.mts';
import { memoryStore } from '@ks/server/trees/memory-store.mts';

const MINUTE = 60_000;
const START = new Date('2030-01-01T00:00:00Z');
const ACCOUNT = parseAccountId('00000000-0000-4000-8000-0000000000a1')!;
const USER = {
  email: 'ada@example.test',
  issuer: 'synthetic',
  password: 'synthetic-password',
  subject: 'sub-ada',
};
const NO_ACCOUNT = {
  email: 'bob@example.test',
  issuer: 'synthetic',
  password: 'synthetic-password',
  subject: 'sub-bob',
};
const RIGHT = { email: USER.email, password: USER.password };
const WRONG = { email: USER.email, password: 'wrong' };

const setup = (
  port = memorySignIn([USER, NO_ACCOUNT]),
  throttle = memoryThrottle()
) => {
  let time = START.getTime();
  const sessions = memorySessions();
  const deps = {
    sessions,
    signIn: port,
    store: memoryStore([
      { id: ACCOUNT, issuer: USER.issuer, subject: USER.subject, trees: [] },
    ]),
    throttle,
  };
  const now = () => new Date(time);

  return {
    at: (minutes: number) => {
      time = START.getTime() + minutes * MINUTE;
    },
    failures: async () =>
      (await throttle.since(emailKey(USER.email), START)).length,
    now,
    sessions,
    signIn: (input: unknown) => attemptSignIn(deps, now, input),
    throttle,
  };
};

// NFR-03
describe('attemptSignIn', () => {
  it('starts a session for the right email and password and counts nothing', async () => {
    const { failures, now, sessions, signIn } = setup();
    const result = await signIn(RIGHT);

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(await resumeSession(sessions, now, result.value)).toEqual({
        accountId: ACCOUNT,
        email: USER.email,
      });
    }

    expect(await failures()).toBe(0);
  });

  it('trims the email', async () => {
    const { signIn } = setup();

    expect((await signIn({ ...RIGHT, email: ` ${USER.email} ` })).ok).toBe(
      true
    );
  });

  it('refuses a wrong password and counts it', async () => {
    const { failures, signIn } = setup();

    expect(await signIn(WRONG)).toEqual({ error: 'refused', ok: false });
    expect(await failures()).toBe(1);
  });

  it('refuses a Supabase user with no Account the same way', async () => {
    const { signIn, throttle } = setup();

    expect(
      await signIn({ email: NO_ACCOUNT.email, password: NO_ACCOUNT.password })
    ).toEqual({ error: 'refused', ok: false });
    expect(
      await throttle.since(emailKey(NO_ACCOUNT.email), START)
    ).toHaveLength(1);
  });

  it.each([
    ['nothing', undefined],
    ['a string', 'ada'],
    ['no password', { email: USER.email }],
    ['an empty email', { email: ' ', password: 'x' }],
    ['an empty password', { email: USER.email, password: '' }],
    ['a very long password', { email: USER.email, password: 'x'.repeat(2000) }],
    [
      'a very long email',
      { email: `${'x'.repeat(300)}@example.test`, password: 'x' },
    ],
  ])('refuses %s without counting or asking Auth', async (_what, input) => {
    const verify = vi.fn();
    const { failures, signIn } = setup({ verify });

    expect(await signIn(input)).toEqual({ error: 'refused', ok: false });
    expect(verify).not.toHaveBeenCalled();
    expect(await failures()).toBe(0);
  });

  it('refuses the right password after 5 failures in 15 minutes', async () => {
    const { at, failures, signIn } = setup();

    for (let i = 0; i < 5; i += 1) {
      at(i);
      await signIn(WRONG);
    }

    at(6);

    expect(await signIn(RIGHT)).toEqual({ error: 'refused', ok: false });
    expect(await failures()).toBe(5);

    // The fifth failure was at minute 4.
    at(19);

    expect((await signIn(RIGHT)).ok).toBe(true);
  });

  it('counts a failure before asking Auth, so a burst meets it', async () => {
    const throttle = memoryThrottle();
    let during = -1;
    const verify = vi.fn(async () => {
      during = (await throttle.since(emailKey(USER.email), START)).length;

      return undefined;
    });
    const { signIn } = setup({ verify }, throttle);

    await signIn(WRONG);

    expect(during).toBe(1);
  });

  it('says unavailable when Auth does not answer, and counts nothing', async () => {
    const { failures, sessions, signIn } = setup({
      verify: vi.fn().mockRejectedValue(new Error('down')),
    });
    const add = vi.spyOn(sessions, 'add');

    expect(await signIn(RIGHT)).toEqual({ error: 'unavailable', ok: false });
    expect(await failures()).toBe(0);
    expect(add).not.toHaveBeenCalled();
  });

  it('says unavailable when a store throws', async () => {
    const { signIn, throttle } = setup();

    throttle.since = vi.fn().mockRejectedValue(new Error('db down'));

    expect(await signIn(RIGHT)).toEqual({ error: 'unavailable', ok: false });
  });
});
