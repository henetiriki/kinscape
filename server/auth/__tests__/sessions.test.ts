import { describe, expect, it } from 'vitest';

import { memorySessions } from '@ks/server/auth/memory-sessions.mts';
import { sessionCookie, startSession } from '@ks/server/auth/sessions.mts';

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
