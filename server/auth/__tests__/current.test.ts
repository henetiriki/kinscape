import { beforeEach, describe, expect, it, vi } from 'vitest';

const jar = vi.hoisted(() => ({ get: vi.fn() }));
const adapters = vi.hoisted(() => ({ current: undefined as unknown }));

vi.mock('next/headers', () => ({ cookies: async () => jar }));
vi.mock('@ks/server/adapters.mts', () => ({
  appAdapters: () => adapters.current,
}));

import { currentSession } from '@ks/server/auth/current.mts';
import { memorySessions } from '@ks/server/auth/memory-sessions.mts';
import { SESSION_COOKIE, startSession } from '@ks/server/auth/sessions.mts';

const SESSION = { accountId: 'a', email: 'a@example.test' };

beforeEach(() => {
  vi.clearAllMocks();
  adapters.current = { sessions: memorySessions() };
  jar.get.mockReturnValue(undefined);
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
