import { createHash } from 'node:crypto';

import type { ThrottleStore } from '#ks/lib/domain/auth/types.ts';

const MINUTE = 60_000;
const WINDOW = 15 * MINUTE;
const KEEP = 30 * MINUTE;
const LIMIT = 5;

/** The SHA-256 of the trimmed, lower-cased email: what a row keeps of it. */
export const emailKey = (email: string) =>
  createHash('sha256').update(email.trim().toLowerCase()).digest('hex');

/**
 * Whether `email` may try to sign in. Refused for 15 minutes after the failure that made 5 within
 * 15 minutes.
 */
export const mayTry = async (
  store: ThrottleStore,
  now: Date,
  email: string
) => {
  const failures = (
    await store.since(emailKey(email), new Date(now.getTime() - KEEP))
  ).map(failedAt => failedAt.getTime());

  for (let i = 0; i + LIMIT <= failures.length; i += 1) {
    const first = failures[i] as number;
    const last = failures[i + LIMIT - 1] as number;

    if (last - first < WINDOW && now.getTime() < last + WINDOW) {
      return false;
    }
  }

  return true;
};

/** Takes back the failure `countFailure` recorded at `failedAt`, once the sign-in turns out not to have failed. */
export const forgetFailure = (
  store: ThrottleStore,
  failedAt: Date,
  email: string
) => store.remove(emailKey(email), failedAt);

/** Records a failed sign-in for `email` and deletes failures older than 30 minutes. */
export const countFailure = async (
  store: ThrottleStore,
  now: Date,
  email: string
) => {
  await store.add(emailKey(email), now);
  await store.removeBefore(new Date(now.getTime() - KEEP));
};
