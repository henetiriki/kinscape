import type { SessionPort } from '#ks/lib/domain/auth/types.ts';
import type { TreeStore } from '#ks/lib/domain/trees/types.ts';

import { memorySession } from '#ks/server/auth/memory-session.mts';
import { supabaseSession } from '#ks/server/auth/supabase-session.mts';
import { db } from '#ks/server/db/database.mts';
import { parseEnv } from '#ks/server/env.mts';
import { databaseStore } from '#ks/server/trees/database-store.mts';
import { memoryStore } from '#ks/server/trees/memory-store.mts';
import { ISSUER } from '#ks/server/trees/repository.mts';

/** The one synthetic user and Tree behind the test-only memory adapters. */
export const SYNTHETIC = {
  accountId: '00000000-0000-4000-8000-0000000000a1',
  email: 'synthetic@example.test',
  password: 'synthetic-password',
  subject: 'synthetic-subject',
  treeId: '00000000-0000-4000-8000-0000000000b1',
};

type Adapters = { session: SessionPort; store: TreeStore };

let instance: Adapters | undefined;

/**
 * The session port and the store, chosen together: memory under `KINSCAPE_MEMORY_ADAPTERS`
 * (`parseEnv` refuses that on Vercel), otherwise Supabase and the database.
 */
export const appAdapters = (): Adapters => {
  if (instance === undefined) {
    const env = parseEnv(process.env);

    instance = env.memoryAdapters
      ? {
          session: memorySession([SYNTHETIC]),
          store: memoryStore([
            {
              id: SYNTHETIC.accountId,
              issuer: ISSUER,
              subject: SYNTHETIC.subject,
              trees: [{ id: SYNTHETIC.treeId, name: 'Synthetic Tree' }],
            },
          ]),
        }
      : {
          session: supabaseSession({
            key: env.supabasePublishableKey,
            url: env.supabaseUrl,
          }),
          store: databaseStore(db()),
        };
  }

  return instance;
};
