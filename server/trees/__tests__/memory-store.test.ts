import { runTreeStoreContract } from '@ks/server/trees/__tests__/contract.ts';
import { memoryStore } from '@ks/server/trees/memory-store.mts';

runTreeStoreContract('memory', async () => ({
  close: async () => {},
  store: memoryStore(),
}));
