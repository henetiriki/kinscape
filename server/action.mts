import type { z } from 'zod';

import type { Result } from '#ks/lib/domain/result/types.ts';
import type { TreeStore, Viewer } from '#ks/lib/domain/trees/types.ts';
import type { TreeRepository } from '#ks/server/trees/types.ts';

import { err, ok } from '#ks/lib/domain/result/result.mts';
import { openTree } from '#ks/server/trees/repository.mts';

/**
 * Wraps a Tree action: open the Tree for the Viewer, parse the raw input, run the body.
 * Expected failures come back as `not-found` or `invalid`; they don't throw.
 */
export const treeAction =
  <S extends z.ZodType, R>(
    store: TreeStore,
    schema: S,
    body: (repository: TreeRepository, input: z.output<S>) => Promise<R>
  ) =>
  async (
    viewer: Viewer,
    treeId: string,
    input: unknown
  ): Promise<Result<R, 'invalid' | 'not-found'>> => {
    const opened = await openTree(viewer, treeId, store);

    if (!opened.ok) {
      return opened;
    }

    const parsed = schema.safeParse(input);

    if (!parsed.success) {
      return err('invalid');
    }

    return ok(await body(opened.value, parsed.data));
  };
