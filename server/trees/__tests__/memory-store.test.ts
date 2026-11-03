import { describe, expect, it } from 'vitest';

import { runTreeStoreContract } from '@ks/server/trees/__tests__/contract.ts';
import { memoryStore } from '@ks/server/trees/memory-store.mts';

runTreeStoreContract('memory', async seed => ({
  close: async () => {},
  store: memoryStore(seed),
}));

// NFR-03
describe('memoryStore seed', () => {
  it('lists a seeded Account’s Trees ordered by id', async () => {
    const store = memoryStore([
      {
        id: 'acc',
        issuer: 'test',
        subject: 's',
        trees: [
          { id: 'b', name: 'B' },
          { id: 'a', name: 'A' },
        ],
      },
    ]);

    expect(await store.findTrees('acc')).toEqual([
      { id: 'a', name: 'A' },
      { id: 'b', name: 'B' },
    ]);
    expect(await store.findTree('acc', 'a')).toEqual({ id: 'a', name: 'A' });
  });

  it('refuses to add an Account over a seeded identity', async () => {
    const store = memoryStore([
      { id: 'acc', issuer: 'test', subject: 's', trees: [] },
    ]);

    expect(
      await store.addAccount({ issuer: 'test', subject: 's', treeName: 'T' })
    ).toEqual({ error: 'exists', ok: false });
  });
});
