import { runSessionContract } from '@ks/server/auth/__tests__/session-contract.ts';
import { memorySessions } from '@ks/server/auth/memory-sessions.mts';

runSessionContract('memory', async () => ({
  close: async () => {},
  store: memorySessions(),
}));
