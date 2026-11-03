import { randomUUID } from 'node:crypto';

import type {
  SeedAccount,
  Tree,
  TreeStore,
} from '#ks/lib/domain/trees/types.ts';

import { err, ok } from '#ks/lib/domain/result/result.mts';

const identityOf = (issuer: string, subject: string) =>
  JSON.stringify([issuer, subject]);

/** A TreeStore in memory, for tests and the test-only adapters. `seed` Accounts may have no Tree. */
export const memoryStore = (seed: SeedAccount[] = []): TreeStore => {
  const accounts = new Map<string, string>();
  const trees = new Map<string, Tree>();
  const links = new Map<string, Set<string>>();

  for (const { id, issuer, subject, trees: owned } of seed) {
    accounts.set(identityOf(issuer, subject), id);
    links.set(id, new Set(owned.map(tree => tree.id)));

    for (const tree of owned) {
      trees.set(tree.id, tree);
    }
  }

  const ownedBy = (accountId: string) => [...(links.get(accountId) ?? [])];

  return {
    addAccount: async ({ issuer, subject, treeName }) => {
      const identity = identityOf(issuer, subject);

      if (accounts.has(identity)) {
        return err('exists');
      }

      const accountId = randomUUID();
      const treeId = randomUUID();

      accounts.set(identity, accountId);
      trees.set(treeId, { id: treeId, name: treeName });
      links.set(accountId, new Set([treeId]));

      return ok({ accountId, treeId });
    },
    findAccount: async (issuer, subject) => {
      const id = accounts.get(identityOf(issuer, subject));

      return id === undefined ? undefined : { id };
    },
    findTree: async (accountId, treeId) => {
      const found = trees.get(treeId);

      return found !== undefined && links.get(accountId)?.has(treeId)
        ? { id: found.id, name: found.name }
        : undefined;
    },
    findTrees: async accountId =>
      ownedBy(accountId)
        .sort()
        .map(id => {
          const { name } = trees.get(id) as Tree;

          return { id, name };
        }),
  };
};
