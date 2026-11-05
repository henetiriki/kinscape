import { describe, expect, it, vi } from 'vitest';

import type { SeedAccount, TreeStore } from '@ks/lib/domain/trees/types.ts';

import { memorySessions } from '@ks/server/auth/memory-sessions.mts';
import { startSession } from '@ks/server/auth/sessions.mts';
import { openTree } from '@ks/server/trees/repository.mts';

const MISSING = '00000000-0000-4000-8000-000000000000';
const NOW = new Date('2030-01-01T00:00:00Z');
const NOT_FOUND = { error: 'not-found', ok: false };
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
    it('treats an id that is not a UUID as one that matches nothing', async () => {
      await withStore(async store => {
        const added = await store.addAccount({
          issuer: 'test',
          subject: 'a',
          treeName: 'Tree A',
        });

        if (!added.ok) {
          throw new Error('setup failed');
        }

        expect(await store.findTrees('not-a-uuid')).toEqual([]);
        expect(await store.findTree('not-a-uuid', added.value.treeId)).toBe(
          undefined
        );
        expect(await store.findTree(added.value.accountId, 'not-a-uuid')).toBe(
          undefined
        );
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

    describe('openTree', () => {
      const twoTrees = async (store: TreeStore) => {
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

        return { a: a.value, b: b.value };
      };

      /** Opens as a signed-in Account; `at` is the clock when opening. */
      const openAs = async (
        store: TreeStore,
        accountId: string,
        treeId?: string,
        at = NOW
      ) => {
        const sessions = memorySessions();
        const token = await startSession(sessions, () => NOW, {
          accountId,
          email: 'x@example.test',
        });

        return openTree({ now: () => at, sessions, store }, token, treeId);
      };

      // NFR-09, NFR-10
      it('opens the signed-in Account’s own Tree for that Viewer', async () => {
        await withStore(async store => {
          const { a } = await twoTrees(store);

          expect(await openAs(store, a.accountId, a.treeId)).toEqual({
            ok: true,
            value: {
              tree: { id: a.treeId, name: 'Tree A' },
              viewer: { accountId: a.accountId },
            },
          });
        });
      });

      // NFR-10
      it('opens the Account’s Tree when no id is given', async () => {
        await withStore(async store => {
          const { a } = await twoTrees(store);

          expect(await openAs(store, a.accountId)).toEqual({
            ok: true,
            value: {
              tree: { id: a.treeId, name: 'Tree A' },
              viewer: { accountId: a.accountId },
            },
          });
        });
      });

      // NFR-10
      it('finds nothing for an Account with no Tree', async () => {
        await withStore(
          async store => {
            expect(await openAs(store, NO_TREE.id)).toEqual(NOT_FOUND);
          },
          [NO_TREE]
        );
      });

      // NFR-09
      it('gives Account B the result of a Tree that does not exist', async () => {
        await withStore(async store => {
          const { a, b } = await twoTrees(store);
          const cross = await openAs(store, b.accountId, a.treeId);

          expect(cross).toEqual(NOT_FOUND);
          expect(cross).toEqual(await openAs(store, b.accountId, MISSING));
        });
      });

      // NFR-03
      it.each([
        ['no token', undefined],
        ['a forged token', 'x'.repeat(43)],
        ['a malformed token', 'nope'],
      ])(
        'returns nothing for %s, without asking the store',
        async (_what, token) => {
          await withStore(async store => {
            const { a } = await twoTrees(store);
            const findTree = vi.spyOn(store, 'findTree');
            const findTrees = vi.spyOn(store, 'findTrees');
            const deps = { now: () => NOW, sessions: memorySessions(), store };

            expect(await openTree(deps, token, a.treeId)).toEqual(NOT_FOUND);
            expect(await openTree(deps, token)).toEqual(NOT_FOUND);
            expect(findTree).not.toHaveBeenCalled();
            expect(findTrees).not.toHaveBeenCalled();
          });
        }
      );

      // NFR-03
      it('returns nothing for an expired token, without asking the store', async () => {
        await withStore(async store => {
          const { a } = await twoTrees(store);
          const findTree = vi.spyOn(store, 'findTree');
          const later = new Date(NOW.getTime() + 31 * 86_400_000);

          expect(await openAs(store, a.accountId, a.treeId, later)).toEqual(
            NOT_FOUND
          );
          expect(findTree).not.toHaveBeenCalled();
        });
      });

      // NFR-03
      it('returns nothing when the session store is down', async () => {
        await withStore(async store => {
          const { a } = await twoTrees(store);
          const sessions = memorySessions();

          sessions.find = async () => {
            throw new Error('down');
          };

          expect(
            await openTree(
              { now: () => NOW, sessions, store },
              'x'.repeat(43),
              a.treeId
            )
          ).toEqual(NOT_FOUND);
        });
      });

      // NFR-03
      it('treats a malformed id as not found, without asking the store', async () => {
        await withStore(async store => {
          const { a } = await twoTrees(store);
          const findTree = vi.spyOn(store, 'findTree');

          expect(await openAs(store, a.accountId, 'not-a-uuid')).toEqual(
            NOT_FOUND
          );
          expect(findTree).not.toHaveBeenCalled();
        });
      });
    });
  });
};
