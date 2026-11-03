import { createHash, randomBytes } from 'node:crypto';

import type { Session, SessionStore } from '#ks/lib/domain/auth/types.ts';

const DAY = 86_400_000;
const IDLE_LIMIT = 30 * DAY;
const AGE_LIMIT = 90 * DAY;
const TOKEN_FORMAT = /^[A-Za-z0-9_-]{43}$/;

const hashOf = (token: string) =>
  createHash('sha256').update(token).digest('hex');

/**
 * A new session for an Account. Returns its token, the only copy: the store keeps the SHA-256.
 * Deletes every expired row first, so unused sessions don't keep an email forever.
 */
export const startSession = async (
  store: SessionStore,
  now: () => Date,
  { accountId, email }: Session
) => {
  const token = randomBytes(32).toString('base64url');
  const createdAt = now();

  await store.removeExpired(createdAt);
  await store.add({
    accountId,
    createdAt,
    email,
    expiresAt: new Date(createdAt.getTime() + IDLE_LIMIT),
    tokenHash: hashOf(token),
  });

  return token;
};

/**
 * The session a token belongs to, or undefined. A malformed token is refused without a lookup; a
 * row past its expiry or 90 days old is deleted. Otherwise expiry becomes the earlier of 30 days
 * from now and 90 days from creation.
 */
export const useSession = async (
  store: SessionStore,
  now: () => Date,
  token: string
): Promise<Session | undefined> => {
  if (!TOKEN_FORMAT.test(token)) {
    return undefined;
  }

  const tokenHash = hashOf(token);
  const row = await store.find(tokenHash);

  if (row === undefined) {
    return undefined;
  }

  const time = now().getTime();
  const lastDay = row.createdAt.getTime() + AGE_LIMIT;

  if (row.expiresAt.getTime() <= time || lastDay <= time) {
    await store.remove(tokenHash);

    return undefined;
  }

  await store.renew(tokenHash, new Date(Math.min(time + IDLE_LIMIT, lastDay)));

  return { accountId: row.accountId, email: row.email };
};

/** Ends the session; a malformed or unknown token does nothing. */
export const endSession = async (store: SessionStore, token: string) => {
  if (TOKEN_FORMAT.test(token)) {
    await store.remove(hashOf(token));
  }
};

/** The cookie that carries the token. `__Host-` needs `Secure`, `Path=/` and no `Domain`. */
export const sessionCookie = (token: string) => ({
  name: '__Host-kinscape-session',
  options: {
    httpOnly: true,
    maxAge: AGE_LIMIT / 1000,
    path: '/',
    sameSite: 'lax' as const,
    secure: true,
  },
  value: token,
});
