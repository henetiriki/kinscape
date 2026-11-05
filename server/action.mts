import type { z } from 'zod';

import { cookies } from 'next/headers';

import type { Result } from '#ks/lib/domain/result/types.ts';
import type { TreeRepository } from '#ks/server/trees/types.ts';

import { err } from '#ks/lib/domain/result/result.mts';
import { appAdapters } from '#ks/server/adapters.mts';
import { SESSION_COOKIE } from '#ks/server/auth/sessions.mts';
import { openTree } from '#ks/server/trees/repository.mts';

/**
 * Wraps a Tree action: opens the Viewer's Tree from the request's cookie, parses the raw input,
 * runs the body. No caller passes a token or a Tree id. `not-found` and `invalid` join the body's
 * own errors; none throw.
 */
export const treeAction =
  <S extends z.ZodType, R, E>(
    schema: S,
    body: (
      repository: TreeRepository,
      input: z.output<S>
    ) => Promise<Result<R, E>>
  ) =>
  async (input: unknown): Promise<Result<R, 'invalid' | 'not-found' | E>> => {
    const opened = await openTree(
      appAdapters(),
      (await cookies()).get(SESSION_COOKIE)?.value
    );

    if (!opened.ok) {
      return opened;
    }

    const parsed = schema.safeParse(input);

    if (!parsed.success) {
      return err('invalid');
    }

    return body(opened.value, parsed.data);
  };
