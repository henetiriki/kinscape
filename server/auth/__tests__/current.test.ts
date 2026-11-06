import { beforeEach, describe, expect, it, vi } from 'vitest';

const jar = vi.hoisted(() => ({ get: vi.fn(), set: vi.fn() }));
const adapters = vi.hoisted(() => ({ current: undefined as unknown }));
const redirect = vi.hoisted(() =>
  vi.fn((to: string) => {
    throw new Error(`redirect:${to}`);
  })
);

vi.mock('next/headers', () => ({ cookies: async () => jar }));
vi.mock('next/navigation', () => ({ redirect }));
vi.mock('@ks/server/adapters.mts', async importOriginal => ({
  ...(await importOriginal<Record<string, unknown>>()),
  appAdapters: () => adapters.current,
}));

import { SYNTHETIC } from '@ks/server/adapters.mts';
import {
  currentSession,
  requireSession,
  signIn,
  signOut,
} from '@ks/server/auth/current.mts';
import { memorySessions } from '@ks/server/auth/memory-sessions.mts';
import { memorySignIn } from '@ks/server/auth/memory-sign-in.mts';
import { memoryThrottle } from '@ks/server/auth/memory-throttle.mts';
import {
  SESSION_COOKIE,
  sessionOf,
  startSession,
} from '@ks/server/auth/sessions.mts';
import { memoryStore } from '@ks/server/trees/memory-store.mts';

const SESSION = { accountId: SYNTHETIC.accountId, email: 'a@example.test' };
const RIGHT = { email: SYNTHETIC.email, password: SYNTHETIC.password };

const sessions = () => (adapters.current as { sessions: never }).sessions;

beforeEach(() => {
  vi.clearAllMocks();
  adapters.current = {
    sessions: memorySessions(),
    signIn: memorySignIn([SYNTHETIC]),
    store: memoryStore([
      {
        id: SYNTHETIC.accountId,
        issuer: SYNTHETIC.issuer,
        subject: SYNTHETIC.subject,
        trees: [],
      },
    ]),
    throttle: memoryThrottle(),
  };
  jar.get.mockReturnValue(undefined);
});

// NFR-03, NFR-10
describe('requireSession', () => {
  it('gives the session of the cookie’s token', async () => {
    const token = await startSession(sessions(), () => new Date(), SESSION);

    jar.get.mockReturnValue({ value: token });

    expect(await requireSession()).toEqual(SESSION);
    expect(redirect).not.toHaveBeenCalled();
  });

  it('sends a forged token to the sign-in page', async () => {
    jar.get.mockReturnValue({ value: 'x'.repeat(43) });

    await expect(requireSession()).rejects.toThrow('redirect:/sign-in');
  });
});

// NFR-03
describe('signIn', () => {
  it('starts a session and sets its cookie', async () => {
    expect(await signIn(RIGHT)).toEqual({ ok: true, value: undefined });

    const [name, value, options] = jar.set.mock.calls[0] as [
      string,
      string,
      Record<string, unknown>,
    ];

    expect(name).toBe(SESSION_COOKIE);
    expect(options).toMatchObject({ httpOnly: true, secure: true });
    expect(await sessionOf(sessions(), () => new Date(), value)).toEqual({
      accountId: SYNTHETIC.accountId,
      email: SYNTHETIC.email,
    });
  });

  it('refuses a wrong password and sets no cookie', async () => {
    expect(await signIn({ ...RIGHT, password: 'wrong' })).toEqual({
      error: 'refused',
      ok: false,
    });
    expect(jar.set).not.toHaveBeenCalled();
  });
});

// NFR-03
describe('signOut', () => {
  it('ends the session behind the cookie and clears the cookie', async () => {
    const token = await startSession(sessions(), () => new Date(), SESSION);

    jar.get.mockReturnValue({ value: token });
    await signOut();

    expect(
      await sessionOf(sessions(), () => new Date(), token)
    ).toBeUndefined();
    expect(jar.set).toHaveBeenCalledWith(
      SESSION_COOKIE,
      '',
      expect.objectContaining({ maxAge: 0 })
    );
  });

  it('only clears the cookie when there is none', async () => {
    await signOut();

    expect(jar.set).toHaveBeenCalledWith(SESSION_COOKIE, '', expect.anything());
  });
});

// NFR-03
describe('currentSession', () => {
  it('gives the session of the cookie’s token', async () => {
    const token = await startSession(
      (adapters.current as { sessions: never }).sessions,
      () => new Date(),
      SESSION
    );

    jar.get.mockReturnValue({ value: token });

    expect(await currentSession()).toEqual(SESSION);
    expect(jar.get).toHaveBeenCalledWith(SESSION_COOKIE);
  });

  it('gives undefined with no cookie', async () => {
    expect(await currentSession()).toBeUndefined();
  });

  it('gives undefined for a forged token', async () => {
    jar.get.mockReturnValue({ value: 'x'.repeat(43) });

    expect(await currentSession()).toBeUndefined();
  });
});
