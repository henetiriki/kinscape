import { unstable_rethrow } from 'next/navigation';

import type { Result } from '@ks/lib/domain/result/types.ts';

import { privateJson } from '@ks/app/data/private-json';

/**
 * The answer for a Result of a Tree read. A failed Result (no Tree for the session) gets 401 and no
 * body. A value of `undefined` gets 404 and no body.
 */
export const answerOf = (result: Result<unknown, unknown>): Response => {
  if (!result.ok) {
    return new Response(null, { status: 401 });
  }

  return result.value === undefined
    ? new Response(null, { status: 404 })
    : privateJson(result.value);
};

/**
 * Runs a route. A throw gets 500 and no body, and leaves a log of the error name only: its message
 * can hold Person data. Each route checks the session itself, because the gate test reads it there.
 */
export const guarded = async (
  label: string,
  run: () => Promise<Response>
): Promise<Response> => {
  try {
    return await run();
  } catch (error) {
    unstable_rethrow(error);
    console.error(
      `${label} failed:`,
      error instanceof Error ? error.name : 'unknown'
    );

    return new Response(null, { status: 500 });
  }
};
