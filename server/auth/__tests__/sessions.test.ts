import { describe, expect, it } from 'vitest';

import { memorySessions } from '@ks/server/auth/memory-sessions.mts';
import {
  endedSessionCookie,
  sessionCookie,
  sessionOf,
  startSession,
} from '@ks/server/auth/sessions.mts';

const NOW = () => new Date('2030-01-01T00:00:00Z');
const SESSION = { accountId: 'a', email: 'a@example.test' };

// NFR-03
describe('sessionOf', () => {
  it('gives the session of a valid token', async () => {
    const store = memorySessions();
    const token = await startSession(store, NOW, SESSION);

    expect(await sessionOf(store, NOW, token)).toEqual(SESSION);
  });

  it.each([
    ['no token', undefined],
    ['a malformed token', 'nope'],
    ['an unknown token', 'x'.repeat(43)],
  ])('gives undefined for %s', async (_what, token) => {
    expect(await sessionOf(memorySessions(), NOW, token)).toBeUndefined();
  });

  it('gives undefined when the store throws', async () => {
    const store = memorySessions();

    store.find = async () => {
      throw new Error('down');
    };

    expect(await sessionOf(store, NOW, 'x'.repeat(43))).toBeUndefined();
  });
});

// NFR-03
describe('startSession', () => {
  it('returns 32 random bytes as 43 base64url characters', async () => {
    const token = await startSession(
      memorySessions(),
      () => new Date('2030-01-01T00:00:00Z'),
      { accountId: 'a', email: 'a@example.test' }
    );

    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });
});

// NFR-03
describe('sessionCookie', () => {
  it('is __Host- prefixed, HttpOnly, Secure, SameSite=Lax and lasts 90 days', () => {
    expect(sessionCookie('tok')).toEqual({
      name: '__Host-kinscape-session',
      options: {
        httpOnly: true,
        maxAge: 90 * 86_400,
        path: '/',
        sameSite: 'lax',
        secure: true,
      },
      value: 'tok',
    });
  });
});

// NFR-03
describe('endedSessionCookie', () => {
  it('has the same name, an empty value and maxAge 0, keeping Secure, Path=/ and HttpOnly', () => {
    expect(endedSessionCookie()).toEqual({
      name: '__Host-kinscape-session',
      options: {
        httpOnly: true,
        maxAge: 0,
        path: '/',
        sameSite: 'lax',
        secure: true,
      },
      value: '',
    });
  });
});
