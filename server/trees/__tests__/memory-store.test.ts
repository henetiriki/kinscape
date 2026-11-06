import { describe, expect, it } from 'vitest';

import { parseAccountId, parseTreeId } from '@ks/lib/domain/ids/ids.mts';
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

  it('refuses to add an Account over a seeded identity', async () => {
    const store = memoryStore([
      { id: ACCOUNT, issuer: 'test', subject: 's', trees: [] },
    ]);

    expect(
      await store.addAccount({ issuer: 'test', subject: 's', treeName: 'T' })
    ).toEqual({ error: 'exists', ok: false });
  });
});
