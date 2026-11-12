import type { TreeId } from '#ks/lib/domain/ids/types.ts';
import type { Result } from '#ks/lib/domain/result/types.ts';
import type { TreeStore, Viewer } from '#ks/lib/domain/trees/types.ts';
import type {
  PersonGroup,
  RelationshipGroup,
  TreeDeps,
  TreeRepository,
} from '#ks/server/trees/types.ts';

import { parseTreeId } from '#ks/lib/domain/ids/ids.mts';
import { checkRelationship } from '#ks/lib/domain/relationships/rules.mts';
import { err, ok } from '#ks/lib/domain/result/result.mts';
import { sessionOf } from '#ks/server/auth/sessions.mts';
import {
  personView,
  relationshipView,
  treeView,
} from '#ks/server/trees/views.mts';

/** The Persons of one Tree, for one Viewer. The Tree id comes from the opened Tree, never from the client. */
const personGroup = (
  store: TreeStore,
  viewer: Viewer,
  treeId: TreeId
): PersonGroup => {
  const scope = { accountId: viewer.accountId, treeId };

  return {
    create: async person => {
      const saved = await store.addPerson({ ...scope, person });

      return saved === undefined
        ? err('not-found')
        : ok(personView(viewer, saved));
    },
    get: async personId => {
      const row = await store.findPerson({ ...scope, personId });

      return row === undefined ? undefined : personView(viewer, row);
    },
    list: async () =>
      (await store.listPersons(scope)).map(row => personView(viewer, row)),
    update: async (person, version) => {
      const saved = await store.updatePerson({ ...scope, person, version });

      return saved.ok ? ok(personView(viewer, saved.value)) : saved;
    },
  };
};

/** The Relationships of one Tree, for one Viewer. */
const relationshipGroup = (
  store: TreeStore,
  viewer: Viewer,
  treeId: TreeId
): RelationshipGroup => {
  const scope = { accountId: viewer.accountId, treeId };

  return {
    create: async relationship => {
      const checked = checkRelationship(
        relationship,
        await store.listRelationships(scope)
      );

      if (!checked.ok) {
        return checked;
      }

      const saved = await store.addRelationship({ ...scope, relationship });

      return saved.ok ? ok(relationshipView(viewer, saved.value)) : saved;
    },
    get: async relationshipId => {
      const row = await store.findRelationship({ ...scope, relationshipId });

      return row === undefined ? undefined : relationshipView(viewer, row);
    },
    list: async () =>
      (await store.listRelationships(scope)).map(row =>
        relationshipView(viewer, row)
      ),
    update: async (relationship, version) => {
      const checked = checkRelationship(
        relationship,
        await store.listRelationships(scope)
      );

      if (!checked.ok) {
        return checked;
      }

      const saved = await store.updateRelationship({
        ...scope,
        relationship,
        version,
      });

      return saved.ok ? ok(relationshipView(viewer, saved.value)) : saved;
    },
  };
};

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
  const parsed = treeId === undefined ? undefined : parseTreeId(treeId);
  const row =
    treeId === undefined
      ? (await store.findTrees(viewer.accountId))[0]
      : parsed === undefined
        ? undefined
        : await store.findTree({ accountId: viewer.accountId, treeId: parsed });

  return row === undefined
    ? err('not-found')
    : ok({
        persons: personGroup(store, viewer, row.id),
        relationships: relationshipGroup(store, viewer, row.id),
        tree: treeView(viewer, row),
        viewer,
      });
};
