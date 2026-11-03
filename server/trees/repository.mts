import type { TreeStore, Viewer } from '#ks/lib/domain/trees/types.ts';
import type { TreeRepository } from '#ks/server/trees/types.ts';

import { err, ok } from '#ks/lib/domain/result/result.mts';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The only way to reach a Tree's data. No Account, a malformed id (Postgres would throw),
 * a missing Tree and another Account's Tree all give the same `not-found`.
 */
export const openTree = async (
  viewer: Viewer,
  treeId: string,
  store: TreeStore
) => {
  if (viewer.accountId === undefined || !UUID.test(treeId)) {
    return err('not-found');
  }

  const tree = await store.findTree(viewer.accountId, treeId);

  return tree === undefined ? err('not-found') : ok<TreeRepository>({ tree });
};
