import type { Result } from '#ks/lib/domain/result/types.ts';
import type { Viewer } from '#ks/lib/domain/trees/types.ts';
import type { TreeDeps, TreeRepository } from '#ks/server/trees/types.ts';

import { err, ok } from '#ks/lib/domain/result/result.mts';
import { sessionOf } from '#ks/server/auth/sessions.mts';
import { isUuid } from '#ks/server/trees/uuid.mts';
import { treeView } from '#ks/server/trees/views.mts';

/**
 * The only way to reach a Tree's data. It resumes the session from the token itself, so nothing
 * can hand it a forged Viewer. With no `treeId` it opens the Account's Tree (v1 makes one per
 * Account). No, a forged or an expired token, a malformed id (Postgres would throw), a missing Tree
 * and another Account's Tree all give the same `not-found`.
 */
export const openTree = async (
  { now = () => new Date(), sessions, store }: TreeDeps,
  token: string | undefined,
  treeId?: string
): Promise<Result<TreeRepository, 'not-found'>> => {
  const session = await sessionOf(sessions, now, token);

  if (session === undefined) {
    return err('not-found');
  }

  const viewer: Viewer = { accountId: session.accountId };
  const row =
    treeId === undefined
      ? (await store.findTrees(viewer.accountId))[0]
      : isUuid(treeId)
        ? await store.findTree(viewer.accountId, treeId)
        : undefined;

  return row === undefined
    ? err('not-found')
    : ok({ tree: treeView(viewer, row), viewer });
};
