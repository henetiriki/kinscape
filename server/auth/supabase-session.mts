import { z } from 'zod';

import type { SessionPort } from '#ks/lib/domain/auth/types.ts';

/** The Account issuer for Supabase sign-in. */
export const ISSUER = 'supabase';

const TIMEOUT_MS = 5000;
const answer = z.object({ user: z.object({ id: z.string().min(1) }) });

const isTimeout = (error: unknown) =>
  error instanceof DOMException && error.name === 'TimeoutError';

type Options = {
  fetch?: typeof globalThis.fetch;
  key: string;
  url: string;
};

/**
 * A SessionPort over Supabase Auth's password grant. A 400 is wrong credentials; anything else
 * throws an error naming only the status or the kind of failure, never a credential or a body.
 */
export const supabaseSession = ({
  fetch: send = (url, init) => globalThis.fetch(url, init),
  key,
  url,
}: Options): SessionPort => ({
  verify: async (email, password) => {
    const response = await send(
      `${url.replace(/\/$/, '')}/auth/v1/token?grant_type=password`,
      {
        body: JSON.stringify({ email, password }),
        headers: { apikey: key, 'content-type': 'application/json' },
        method: 'POST',
        signal: AbortSignal.timeout(TIMEOUT_MS),
      }
    ).catch((error: unknown) => {
      throw new Error(
        isTimeout(error)
          ? 'Supabase Auth timed out'
          : 'Supabase Auth could not be reached'
      );
    });

    if (!response.ok) {
      await response.body?.cancel();

      if (response.status === 400) {
        return undefined;
      }

      throw new Error(`Supabase Auth answered ${response.status}`);
    }

    const parsed = answer.safeParse(
      await response.json().catch((error: unknown) => {
        if (isTimeout(error)) {
          throw new Error('Supabase Auth timed out');
        }

        return null;
      })
    );

    if (!parsed.success) {
      throw new Error('Supabase Auth sent an unreadable answer');
    }

    return { issuer: ISSUER, subject: parsed.data.user.id };
  },
});
