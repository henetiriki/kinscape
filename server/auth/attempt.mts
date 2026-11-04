import { z } from 'zod';

import type {
  SessionPort,
  SessionStore,
  ThrottleStore,
} from '#ks/lib/domain/auth/types.ts';
import type { TreeStore } from '#ks/lib/domain/trees/types.ts';

import { err, ok } from '#ks/lib/domain/result/result.mts';
import { startSession } from '#ks/server/auth/sessions.mts';
import { signIn } from '#ks/server/auth/sign-in.mts';
import {
  countFailure,
  forgetFailure,
  mayTry,
} from '#ks/server/auth/throttle.mts';

const input = z.object({
  email: z.string().trim().min(1).max(254),
  password: z.string().min(1).max(1024),
});

/**
 * A sign-in from raw form input, to a session token. Input that doesn't parse, a throttled email,
 * a wrong password and a user with no Account are all `refused`; anything that throws is
 * `unavailable`. A failure is counted before Auth is asked, and taken back if Auth accepts
 * the sign-in or can't answer, so a burst of guesses meets the count.
 */
export const attemptSignIn = async (
  deps: {
    session: SessionPort;
    sessions: SessionStore;
    store: TreeStore;
    throttle: ThrottleStore;
  },
  now: () => Date,
  raw: unknown
) => {
  const parsed = input.safeParse(raw);

  if (!parsed.success) {
    return err('refused');
  }

  const { email, password } = parsed.data;

  try {
    if (!(await mayTry(deps.throttle, now(), email))) {
      return err('refused');
    }

    const failedAt = now();

    await countFailure(deps.throttle, failedAt, email);

    const result = await signIn(deps, email, password).catch(() => undefined);

    if (result?.ok !== false) {
      await forgetFailure(deps.throttle, failedAt, email);
    }

    if (result === undefined) {
      return err('unavailable');
    }

    return result.ok
      ? ok(
          await startSession(deps.sessions, now, {
            accountId: result.value.id,
            email,
          })
        )
      : err('refused');
  } catch {
    return err('unavailable');
  }
};
