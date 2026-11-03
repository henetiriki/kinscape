import { z } from 'zod';

import type { SessionPort } from '#ks/lib/domain/auth/types.ts';

const TIMEOUT_MS = 5000;
const answer = z.object({ user: z.object({ id: z.string().min(1) }) });

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
    const response = await send(`${url}/auth/v1/token?grant_type=password`, {
      body: JSON.stringify({ email, password }),
      headers: { apikey: key, 'content-type': 'application/json' },
      method: 'POST',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    }).catch((error: unknown) => {
      throw new Error(
        error instanceof DOMException && error.name === 'TimeoutError'
          ? 'Supabase Auth timed out'
          : 'Supabase Auth could not be reached'
      );
    });

    if (response.status === 400) {
      return undefined;
    }

    if (!response.ok) {
      throw new Error(`Supabase Auth answered ${response.status}`);
    }

    const parsed = answer.safeParse(await response.json().catch(() => null));

    if (!parsed.success) {
      throw new Error('Supabase Auth sent an unreadable answer');
    }

    return parsed.data.user.id;
  },
});
