import type { SessionStore } from '#ks/lib/domain/auth/types.ts';
import type { TreeStore } from '#ks/lib/domain/trees/types.ts';
import type { TreeRepository } from '#ks/server/trees/types.ts';

import { err, ok } from '#ks/lib/domain/result/result.mts';
import { sessionOf } from '#ks/server/auth/sessions.mts';
import { isUuid } from '#ks/server/trees/uuid.mts';

/**
 * The only way to reach a Tree's data. It resumes the session from the token itself. No, a forged or
 * an expired token, a malformed id (Postgres would throw), a missing Tree and another Account's Tree
 * all give the same `not-found`.
 */
export const openTree = async (
  token: string | undefined,
  treeId: string,
  store: TreeStore,
  sessions: SessionStore,
  now: () => Date
) => {
  const session = await sessionOf(sessions, now, token);

  if (session === undefined || !isUuid(treeId)) {
    return err('not-found');
  }

  const tree = await store.findTree(session.accountId, treeId);

  return tree === undefined ? err('not-found') : ok<TreeRepository>({ tree });
};
