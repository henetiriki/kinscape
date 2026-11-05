import 'server-only';

import type {
  SessionPort,
  SessionStore,
  ThrottleStore,
} from '#ks/lib/domain/auth/types.ts';
import type { TreeStore } from '#ks/lib/domain/trees/types.ts';

import { databaseSessions } from '#ks/server/auth/database-sessions.mts';
import { databaseThrottle } from '#ks/server/auth/database-throttle.mts';
import { memorySession } from '#ks/server/auth/memory-session.mts';
import { memorySessions } from '#ks/server/auth/memory-sessions.mts';
import { memoryThrottle } from '#ks/server/auth/memory-throttle.mts';
import { supabaseSession } from '#ks/server/auth/supabase-session.mts';
import { db } from '#ks/server/db/database.mts';
import { parseEnv } from '#ks/server/env.mts';
import { databaseStore } from '#ks/server/trees/database-store.mts';
import { memoryStore } from '#ks/server/trees/memory-store.mts';

/** The one synthetic user and Tree behind the test-only memory adapters. */
export const SYNTHETIC = {
  accountId: '00000000-0000-4000-8000-0000000000a1',
  email: 'synthetic@example.test',
  issuer: 'synthetic',
  password: 'synthetic-password',
  subject: 'synthetic-subject',
  treeId: '00000000-0000-4000-8000-0000000000b1',
};

type Adapters = {
  session: SessionPort;
  sessions: SessionStore;
  store: TreeStore;
  throttle: ThrottleStore;
};

// On `globalThis`, not in the module: Next bundles each route handler and page with its own copy of
// this module, and the memory adapters hold the sessions, so copies would not see each other's.
const shared = globalThis as { kinscapeAdapters?: Adapters };

/**
 * The session port, session store, Tree store and throttle store, chosen together: memory under `KINSCAPE_MEMORY_ADAPTERS`
 * (`parseEnv` refuses that on Vercel), otherwise Supabase and the database.
 */
export const appAdapters = (): Adapters => {
  if (shared.kinscapeAdapters === undefined) {
    const env = parseEnv(process.env);

    shared.kinscapeAdapters = env.memoryAdapters
      ? {
          session: memorySession([SYNTHETIC]),
          sessions: memorySessions(),
          store: memoryStore([
            {
              id: SYNTHETIC.accountId,
              issuer: SYNTHETIC.issuer,
              subject: SYNTHETIC.subject,
              trees: [{ id: SYNTHETIC.treeId, name: 'Synthetic Tree' }],
            },
          ]),
          throttle: memoryThrottle(),
        }
      : {
          session: supabaseSession({
            key: env.supabasePublishableKey,
            url: env.supabaseUrl,
          }),
          sessions: databaseSessions(db()),
          store: databaseStore(db()),
          throttle: databaseThrottle(db()),
        };
  }

  return shared.kinscapeAdapters;
};
