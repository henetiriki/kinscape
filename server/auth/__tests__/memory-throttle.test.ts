import { runThrottleContract } from '@ks/server/auth/__tests__/throttle-contract.ts';
import { memoryThrottle } from '@ks/server/auth/memory-throttle.mts';

runThrottleContract('memory', async () => ({
  close: async () => {},
  store: memoryThrottle(),
}));
