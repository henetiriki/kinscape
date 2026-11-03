import { randomUUID } from 'node:crypto';

import type { Tree, TreeStore } from '#ks/lib/domain/trees/types.ts';

import { err, ok } from '#ks/lib/domain/result/result.mts';

/** A TreeStore in memory, for tests. */
export const memoryStore = (): TreeStore => {
  const accounts = new Map<string, string>();
  const trees = new Map<string, { accountId: string } & Tree>();

  return {
    addAccount: async ({ issuer, subject, treeName }) => {
      const identity = JSON.stringify([issuer, subject]);

      if (accounts.has(identity)) {
        return err('exists');
      }

      const accountId = randomUUID();
      const treeId = randomUUID();

      accounts.set(identity, accountId);
      trees.set(treeId, { accountId, id: treeId, name: treeName });

      return ok({ accountId, treeId });
    },
    findTree: async (accountId, treeId) => {
      const found = trees.get(treeId);

      return found?.accountId === accountId
        ? { id: found.id, name: found.name }
        : undefined;
    },
  };
};
