import { describe, expect, it } from 'vitest';

import type { SeedAccount, TreeStore } from '@ks/lib/domain/trees/types.ts';

const MISSING = '00000000-0000-4000-8000-000000000000';
const NO_TREE: SeedAccount = {
  id: '00000000-0000-4000-8000-0000000000a1',
  issuer: 'test',
  subject: 'no-tree',
  trees: [],
};

/** The suite every TreeStore adapter passes (NFR-09, NFR-10). Data is synthetic. */
export const runTreeStoreContract = (
  name: string,
  open: (
    seed: SeedAccount[]
  ) => Promise<{ close: () => Promise<void>; store: TreeStore }>
) => {
  describe(`${name} TreeStore contract`, () => {
    const withStore = async (
      test: (store: TreeStore) => Promise<void>,
      seed: SeedAccount[] = []
    ): Promise<void> => {
      const { close, store } = await open(seed);

      try {
        await test(store);
      } finally {
        await close();
      }
    };

    // NFR-09
    it('gives an Account its Tree', async () => {
      await withStore(async store => {
        const added = await store.addAccount({
          issuer: 'test',
          subject: 'a',
          treeName: 'Tree A',
        });

        expect(added.ok).toBe(true);

        if (!added.ok) {
          return;
        }

        expect(
          await store.findTree(added.value.accountId, added.value.treeId)
        ).toEqual({ id: added.value.treeId, name: 'Tree A' });
      });
    });

    // NFR-09
    it('treats another Account’s Tree as a Tree that does not exist', async () => {
      await withStore(async store => {
        const a = await store.addAccount({
          issuer: 'test',
          subject: 'a',
          treeName: 'Tree A',
        });
        const b = await store.addAccount({
          issuer: 'test',
          subject: 'b',
          treeName: 'Tree B',
        });

        if (!a.ok || !b.ok) {
          throw new Error('setup failed');
        }

        const cross = await store.findTree(b.value.accountId, a.value.treeId);
        const missing = await store.findTree(b.value.accountId, MISSING);

        expect(cross).toBeUndefined();
        expect(cross).toEqual(missing);
        expect(await store.findTree(MISSING, a.value.treeId)).toBeUndefined();
      });
    });

    // NFR-09
    it('refuses an identity that already has an Account', async () => {
      await withStore(async store => {
        const input = { issuer: 'test', subject: 'a', treeName: 'Tree A' };
        const first = await store.addAccount(input);
        const second = await store.addAccount({ ...input, treeName: 'Other' });

        if (!first.ok) {
          throw new Error('setup failed');
        }

        expect(second).toEqual({ error: 'exists', ok: false });
        expect(
          await store.findTree(first.value.accountId, first.value.treeId)
        ).toEqual({ id: first.value.treeId, name: 'Tree A' });
      });
    });

    // NFR-03
    it('finds an Account by issuer and subject', async () => {
      await withStore(async store => {
        const added = await store.addAccount({
          issuer: 'test',
          subject: 'a',
          treeName: 'Tree A',
        });

        if (!added.ok) {
          throw new Error('setup failed');
        }

        expect(await store.findAccount('test', 'a')).toEqual({
          id: added.value.accountId,
        });
        expect(await store.findAccount('other', 'a')).toBeUndefined();
        expect(await store.findAccount('test', 'b')).toBeUndefined();
      });
    });

    // NFR-03
    it('finds only the Trees of the Account asked about', async () => {
      await withStore(async store => {
        const a = await store.addAccount({
          issuer: 'test',
          subject: 'a',
          treeName: 'Tree A',
        });
        const b = await store.addAccount({
          issuer: 'test',
          subject: 'b',
          treeName: 'Tree B',
        });

        if (!a.ok || !b.ok) {
          throw new Error('setup failed');
        }

        expect(await store.findTrees(a.value.accountId)).toEqual([
          { id: a.value.treeId, name: 'Tree A' },
        ]);
        expect(await store.findTrees(b.value.accountId)).toEqual([
          { id: b.value.treeId, name: 'Tree B' },
        ]);
        expect(await store.findTrees(MISSING)).toEqual([]);
      });
    });

    // NFR-03
    it('gives an Account with no Tree an empty list', async () => {
      await withStore(
        async store => {
          const found = await store.findAccount(
            NO_TREE.issuer,
            NO_TREE.subject
          );

          expect(found).toEqual({ id: NO_TREE.id });
          expect(await store.findTrees(NO_TREE.id)).toEqual([]);
        },
        [NO_TREE]
      );
    });

    // NFR-09
    it('lets the same subject sign in under another issuer', async () => {
      await withStore(async store => {
        const one = await store.addAccount({
          issuer: 'one',
          subject: 'a',
          treeName: 'Tree',
        });
        const two = await store.addAccount({
          issuer: 'two',
          subject: 'a',
          treeName: 'Tree',
        });

        expect(one.ok && two.ok).toBe(true);
      });
    });
  });
};
