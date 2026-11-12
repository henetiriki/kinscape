import { describe, expect, it, vi } from 'vitest';

import type { AccountId, PersonId, TreeId } from '@ks/lib/domain/ids/types.ts';
import type { PersonInput } from '@ks/lib/domain/persons/types.ts';
import type { SeedAccount, TreeStore } from '@ks/lib/domain/trees/types.ts';

import { parseAccountId, parseTreeId } from '@ks/lib/domain/ids/ids.mts';
import {
  MAX_LISTED,
  personInputSchema,
} from '@ks/lib/domain/persons/schemas.mts';
import { memorySessions } from '@ks/server/auth/memory-sessions.mts';
import { startSession } from '@ks/server/auth/sessions.mts';
import { openTree } from '@ks/server/trees/repository.mts';

const MISSING_ACCOUNT = parseAccountId('00000000-0000-4000-8000-000000000000')!;
const MISSING_TREE = parseTreeId('00000000-0000-4000-8000-000000000000')!;
// A cast can hold a string that is not a UUID; a store still finds nothing for it.
const MALFORMED_ACCOUNT = 'not-a-uuid' as AccountId;
const MALFORMED_TREE = 'not-a-uuid' as TreeId;
const NOW = new Date('2030-01-01T00:00:00Z');
const ID_1 = '01900000-0000-7000-8000-0000000000a1' as PersonId;
const ID_2 = '01900000-0000-7000-8000-0000000000a2' as PersonId;
const ID_3 = '01900000-0000-7000-8000-0000000000a3' as PersonId;
const ID_4 = '01900000-0000-7000-8000-0000000000a4' as PersonId;

/** A synthetic Person as a client's text parses: the schema fills what `fields` omits. */
const personOf = (id: string, fields: Record<string, unknown>): PersonInput =>
  personInputSchema.parse({ ...fields, id });
const NOT_FOUND = { error: 'not-found', ok: false };
const NO_TREE: SeedAccount = {
  id: parseAccountId('00000000-0000-4000-8000-0000000000a1')!,
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

        expect(await store.findTree(added.value)).toEqual({
          id: added.value.treeId,
          name: 'Tree A',
        });
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

        const cross = await store.findTree({
          accountId: b.value.accountId,
          treeId: a.value.treeId,
        });
        const missing = await store.findTree({
          accountId: b.value.accountId,
          treeId: MISSING_TREE,
        });

        expect(cross).toBeUndefined();
        expect(cross).toEqual(missing);
        expect(
          await store.findTree({
            accountId: MISSING_ACCOUNT,
            treeId: a.value.treeId,
          })
        ).toBeUndefined();
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
        expect(await store.findTree(first.value)).toEqual({
          id: first.value.treeId,
          name: 'Tree A',
        });
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
        expect(await store.findTrees(MISSING_ACCOUNT)).toEqual([]);
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

        expect(await store.findTrees(MALFORMED_ACCOUNT)).toEqual([]);
        expect(
          await store.findTree({
            accountId: MALFORMED_ACCOUNT,
            treeId: added.value.treeId,
          })
        ).toBe(undefined);
        expect(
          await store.findTree({
            accountId: added.value.accountId,
            treeId: MALFORMED_TREE,
          })
        ).toBe(undefined);
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

    describe('persons', () => {
      // PPL-01
      it('reads back every field of a Person born ABT 1850', async () => {
        await withStore(async store => {
          const { a } = await twoTrees(store);
          const person = personOf(ID_1, {
            birth: 'ABT 1850',
            death: 'BET 1900 AND MAR 1910',
            deceased: true,
            givenNames: 'Ana',
            maidenName: 'Dube',
            notes: 'Synthetic.',
            sex: 'F',
            surname: 'Test',
            variants: ['Anna', 'Ana'],
          });

          expect(person.birth?.qualifier).toBe('ABT');
          expect(await store.addPerson({ ...a, person })).toEqual({
            ...person,
            version: 1,
          });
          expect(await store.findPerson({ ...a, personId: ID_1 })).toEqual({
            ...person,
            version: 1,
          });
          expect(await store.listPersons(a)).toEqual([
            { ...person, version: 1 },
          ]);
        });
      });

      // PPL-01
      it('saves a Person with no sex as unknown', async () => {
        await withStore(async store => {
          const { a } = await twoTrees(store);
          const saved = await store.addPerson({
            ...a,
            person: personOf(ID_1, {}),
          });

          expect(saved?.sex).toBe('U');
          expect(saved?.birth).toBeUndefined();
        });
      });

      // NFR-09
      it('gives Account B the result of a Person that does not exist', async () => {
        await withStore(async store => {
          const { a, b } = await twoTrees(store);

          await store.addPerson({ ...a, person: personOf(ID_1, {}) });

          const cross = { accountId: b.accountId, treeId: a.treeId };
          const missing = { ...a, personId: ID_2 };

          expect(await store.findPerson({ ...cross, personId: ID_1 })).toEqual(
            await store.findPerson(missing)
          );
          expect(await store.listPersons(cross)).toEqual([]);
          expect(
            await store.addPerson({ ...cross, person: personOf(ID_2, {}) })
          ).toBeUndefined();
          expect(
            await store.updatePerson({
              ...cross,
              person: personOf(ID_1, { surname: 'Taken' }),
              version: 1,
            })
          ).toEqual({ error: 'not-found', ok: false });
          expect(await store.listPersons(a)).toHaveLength(1);
          expect(
            (await store.findPerson({ ...a, personId: ID_1 }))?.surname
          ).toBe('');
        });
      });

      // NFR-09
      it('keeps the same id apart in two Trees', async () => {
        await withStore(async store => {
          const { a, b } = await twoTrees(store);

          await store.addPerson({
            ...a,
            person: personOf(ID_1, { surname: 'One' }),
          });
          await store.addPerson({
            ...b,
            person: personOf(ID_1, { surname: 'Two' }),
          });

          expect(
            (await store.findPerson({ ...a, personId: ID_1 }))?.surname
          ).toBe('One');
          expect(
            (await store.findPerson({ ...b, personId: ID_1 }))?.surname
          ).toBe('Two');
        });
      });

      // NFR-09
      it('ignores a repeated create with the same id', async () => {
        await withStore(async store => {
          const { a } = await twoTrees(store);
          const first = await store.addPerson({
            ...a,
            person: personOf(ID_1, { surname: 'First' }),
          });
          const again = await store.addPerson({
            ...a,
            person: personOf(ID_1, { surname: 'Second' }),
          });

          expect(again).toEqual(first);
          expect(await store.listPersons(a)).toEqual([first]);
        });
      });

      // NFR-09
      it('updates with the version read, and refuses a stale one', async () => {
        await withStore(async store => {
          const { a } = await twoTrees(store);

          await store.addPerson({
            ...a,
            person: personOf(ID_1, { surname: 'Old' }),
          });

          const update = (surname: string, version: number, id = ID_1) =>
            store.updatePerson({
              ...a,
              person: personOf(id, { surname }),
              version,
            });
          const updated = await update('New', 1);

          expect(updated.ok && updated.value.version).toBe(2);
          expect(updated.ok && updated.value.surname).toBe('New');
          expect(await update('Stale', 1)).toEqual({
            error: 'conflict',
            ok: false,
          });
          expect(await update('Gone', 1, ID_2)).toEqual({
            error: 'not-found',
            ok: false,
          });
          expect(
            (await store.findPerson({ ...a, personId: ID_1 }))?.surname
          ).toBe('New');
        });
      });

      // PPL-01
      it('removes a date that an update leaves out', async () => {
        await withStore(async store => {
          const { a } = await twoTrees(store);

          await store.addPerson({
            ...a,
            person: personOf(ID_1, { birth: '1850' }),
          });

          const updated = await store.updatePerson({
            ...a,
            person: personOf(ID_1, {}),
            version: 1,
          });

          expect(updated.ok && updated.value.birth).toBeUndefined();
        });
      });

      // NFR-09
      it('lists by surname, given names, then id', async () => {
        await withStore(async store => {
          const { a } = await twoTrees(store);
          const ids = [ID_3, ID_1, ID_2, ID_4];
          const names = [
            ['Bee', 'Ann'],
            ['Bee', 'Ann'],
            ['Bee', 'Abe'],
            ['Axe', 'Zed'],
          ];

          for (const [index, id] of ids.entries()) {
            const [surname, givenNames] = names[index];

            await store.addPerson({
              ...a,
              person: personOf(id, { givenNames, surname }),
            });
          }

          expect((await store.listPersons(a)).map(p => p.id)).toEqual([
            ID_4,
            ID_2,
            ID_1,
            ID_3,
          ]);
        });
      });

      // PPL-01
      it('lists no more than the cap', async () => {
        await withStore(async store => {
          const { a } = await twoTrees(store);

          for (let n = 0; n <= MAX_LISTED; n += 1) {
            await store.addPerson({
              ...a,
              person: personOf(
                `01900000-0000-7000-8000-${String(n).padStart(12, '0')}`,
                {}
              ),
            });
          }

          expect(await store.listPersons(a)).toHaveLength(MAX_LISTED);
        });
      }, 60_000);

      // NFR-03
      it('treats an id that is not a UUID as one that matches nothing', async () => {
        await withStore(async store => {
          const { a } = await twoTrees(store);
          const bad = { accountId: MALFORMED_ACCOUNT, treeId: a.treeId };
          const badTree = { accountId: a.accountId, treeId: MALFORMED_TREE };

          expect(await store.listPersons(bad)).toEqual([]);
          expect(await store.listPersons(badTree)).toEqual([]);
          expect(
            await store.findPerson({
              ...a,
              personId: 'nope' as PersonId,
            })
          ).toBeUndefined();
          expect(
            await store.addPerson({ ...badTree, person: personOf(ID_1, {}) })
          ).toBeUndefined();
          expect(
            await store.updatePerson({
              ...a,
              person: { ...personOf(ID_1, {}), id: 'nope' as PersonId },
              version: 1,
            })
          ).toEqual({ error: 'not-found', ok: false });
        });
      });
    });

    describe('openTree', () => {
      /** Opens as a signed-in Account; `at` is the clock when opening. */
      const openAs = async (
        store: TreeStore,
        accountId: AccountId,
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
            value: expect.objectContaining({
              tree: { id: a.treeId, name: 'Tree A' },
              viewer: { accountId: a.accountId },
            }),
          });
        });
      });

      // NFR-10
      it('opens the Account’s Tree when no id is given', async () => {
        await withStore(async store => {
          const { a } = await twoTrees(store);

          expect(await openAs(store, a.accountId)).toEqual({
            ok: true,
            value: expect.objectContaining({
              tree: { id: a.treeId, name: 'Tree A' },
              viewer: { accountId: a.accountId },
            }),
          });
        });
      });

      // PPL-01, NFR-10
      it('gives each Person a living status from the death date and the deceased mark', async () => {
        await withStore(async store => {
          const { a } = await twoTrees(store);
          const opened = await openAs(store, a.accountId, a.treeId);

          if (!opened.ok) {
            throw new Error('setup failed');
          }

          const { persons } = opened.value;
          const created = await persons.create(personOf(ID_1, {}));

          await persons.create(personOf(ID_2, { death: '1900' }));
          await persons.create(personOf(ID_3, { deceased: true }));

          expect(created.ok && created.value.living).toBe(true);
          expect((await persons.get(ID_2))?.living).toBe(false);
          expect((await persons.get(ID_3))?.living).toBe(false);
          expect((await persons.list()).map(p => p.living)).toEqual([
            true,
            false,
            false,
          ]);
        });
      });

      // PPL-01
      it('updates through the group, and refuses a stale version', async () => {
        await withStore(async store => {
          const { a } = await twoTrees(store);
          const opened = await openAs(store, a.accountId, a.treeId);

          if (!opened.ok) {
            throw new Error('setup failed');
          }

          const { persons } = opened.value;

          await persons.create(personOf(ID_1, {}));

          const first = await persons.update(
            personOf(ID_1, { deceased: true }),
            1
          );

          expect(first.ok && [first.value.version, first.value.living]).toEqual(
            [2, false]
          );
          expect(
            await persons.update(personOf(ID_1, { deceased: false }), 1)
          ).toEqual({ error: 'conflict', ok: false });
        });
      });

      // NFR-09
      it('gives not-found when the store refuses a create', async () => {
        await withStore(async store => {
          const { a } = await twoTrees(store);
          const opened = await openAs(store, a.accountId, a.treeId);

          if (!opened.ok) {
            throw new Error('setup failed');
          }

          vi.spyOn(store, 'addPerson').mockResolvedValue(undefined);

          expect(await opened.value.persons.create(personOf(ID_1, {}))).toEqual(
            { error: 'not-found', ok: false }
          );
        });
      });

      // NFR-09
      it('keeps a Person of Tree A out of Account B’s Tree', async () => {
        await withStore(async store => {
          const { a, b } = await twoTrees(store);
          const asA = await openAs(store, a.accountId, a.treeId);
          const asB = await openAs(store, b.accountId, b.treeId);

          if (!asA.ok || !asB.ok) {
            throw new Error('setup failed');
          }

          await asA.value.persons.create(personOf(ID_1, {}));

          expect(await asB.value.persons.get(ID_1)).toEqual(
            await asB.value.persons.get(ID_2)
          );
          expect(await asB.value.persons.list()).toEqual([]);
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
          expect(cross).toEqual(await openAs(store, b.accountId, MISSING_TREE));
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
