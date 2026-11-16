import { describe, expect, it } from 'vitest';

import { parseAccountId, parseTreeId } from '@ks/lib/domain/ids/ids.mts';
import { personInputSchema } from '@ks/lib/domain/persons/schemas.mts';
import { relationshipInputSchema } from '@ks/lib/domain/relationships/schemas.mts';
import { runTreeStoreContract } from '@ks/server/trees/__tests__/contract.ts';
import { memoryStore } from '@ks/server/trees/memory-store.mts';

const ACCOUNT = parseAccountId('00000000-0000-4000-8000-0000000000a1')!;
const TREE_A = parseTreeId('00000000-0000-4000-8000-0000000000b1')!;
const TREE_B = parseTreeId('00000000-0000-4000-8000-0000000000b2')!;

runTreeStoreContract('memory', async seed => ({
  close: async () => {},
  store: memoryStore(seed),
}));

// NFR-03
describe('memoryStore seed', () => {
  it('lists a seeded Account’s Trees ordered by id', async () => {
    const store = memoryStore([
      {
        id: ACCOUNT,
        issuer: 'test',
        subject: 's',
        trees: [
          { id: TREE_B, name: 'B' },
          { id: TREE_A, name: 'A' },
        ],
      },
    ]);

    expect(await store.findTrees(ACCOUNT)).toEqual([
      { id: TREE_A, name: 'A' },
      { id: TREE_B, name: 'B' },
    ]);
    expect(
      await store.findTree({ accountId: ACCOUNT, treeId: TREE_A })
    ).toEqual({ id: TREE_A, name: 'A' });
  });

  // NFR-09
  describe('a read-only Tree', () => {
    const OTHER = parseAccountId('00000000-0000-4000-8000-0000000000a2')!;
    const PERSON = personInputSchema.parse({
      id: '01900000-0000-7000-8000-0000000000a1',
      surname: 'Seed',
    });
    const NEW_PERSON = personInputSchema.parse({
      id: '01900000-0000-7000-8000-0000000000a2',
    });
    const SECOND = personInputSchema.parse({
      id: '01900000-0000-7000-8000-0000000000a4',
    });
    const REL = relationshipInputSchema.parse({
      childId: SECOND.id,
      id: '01900000-0000-7000-9000-0000000000b1',
      parentId: PERSON.id,
      subtype: 'biological',
      type: 'parent',
    });
    const NEW_REL = relationshipInputSchema.parse({
      ...REL,
      id: '01900000-0000-7000-9000-0000000000b2',
    });
    const scope = { accountId: ACCOUNT, treeId: TREE_A };
    const build = () =>
      memoryStore(
        [
          {
            id: ACCOUNT,
            issuer: 'test',
            subject: 's',
            trees: [
              {
                id: TREE_A,
                name: 'A',
                persons: [PERSON, SECOND],
                relationships: [REL],
              },
            ],
          },
          {
            id: OTHER,
            issuer: 'test',
            subject: 'o',
            trees: [{ id: TREE_B, name: 'B', persons: [NEW_PERSON] }],
          },
        ],
        [TREE_A]
      );

    it('refuses each write and does not change', async () => {
      const store = build();
      const before = await store.listPersons(scope);

      const relsBefore = await store.listRelationships(scope);

      expect(before).toEqual([
        { ...SECOND, version: 1 },
        { ...PERSON, version: 1 },
      ]);
      expect(relsBefore).toEqual([{ ...REL, version: 1 }]);
      expect(await store.addPerson({ ...scope, person: NEW_PERSON })).toBe(
        undefined
      );
      expect(
        await store.updatePerson({
          ...scope,
          person: { ...PERSON, surname: 'Changed' },
          version: 1,
        })
      ).toEqual({ error: 'not-found', ok: false });
      expect(
        await store.addRelationship({ ...scope, relationship: NEW_REL })
      ).toEqual({ error: 'not-found', ok: false });
      expect(
        await store.updateRelationship({
          ...scope,
          relationship: REL,
          version: 1,
        })
      ).toEqual({ error: 'not-found', ok: false });
      expect(await store.listPersons(scope)).toEqual(before);
      expect(await store.listRelationships(scope)).toEqual(relsBefore);
    });

    it('still writes to a Tree not on the list', async () => {
      const store = build();
      const own = { accountId: OTHER, treeId: TREE_B };

      const added = await store.addPerson({
        ...own,
        person: personInputSchema.parse({
          id: '01900000-0000-7000-8000-0000000000a3',
        }),
      });

      expect(added?.version).toBe(1);
    });

    it('shows neither Account a row of the other', async () => {
      const store = build();
      const own = { accountId: OTHER, treeId: TREE_B };

      expect((await store.listPersons(own)).map(p => p.id)).toEqual([
        NEW_PERSON.id,
      ]);
      expect((await store.listPersons(scope)).map(p => p.id)).toEqual([
        SECOND.id,
        PERSON.id,
      ]);
      expect(
        await store.listPersons({ accountId: OTHER, treeId: TREE_A })
      ).toEqual([]);
      expect(
        await store.listPersons({ accountId: ACCOUNT, treeId: TREE_B })
      ).toEqual([]);
    });
  });

  it('refuses to add an Account over a seeded identity', async () => {
    const store = memoryStore([
      { id: ACCOUNT, issuer: 'test', subject: 's', trees: [] },
    ]);

    expect(
      await store.addAccount({ issuer: 'test', subject: 's', treeName: 'T' })
    ).toEqual({ error: 'exists', ok: false });
  });
});
