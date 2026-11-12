import 'server-only';

import type {
  SessionStore,
  SignInPort,
  ThrottleStore,
} from '#ks/lib/domain/auth/types.ts';
import type { TreeStore } from '#ks/lib/domain/trees/types.ts';

import { databaseSessions } from '#ks/server/auth/database-sessions.mts';
import { databaseThrottle } from '#ks/server/auth/database-throttle.mts';
import { memorySessions } from '#ks/server/auth/memory-sessions.mts';
import { memorySignIn } from '#ks/server/auth/memory-sign-in.mts';
import { memoryThrottle } from '#ks/server/auth/memory-throttle.mts';
import { supabaseSignIn } from '#ks/server/auth/supabase-sign-in.mts';
import { SYNTHETIC } from '#ks/server/auth/synthetic.mts';
import { db } from '#ks/server/db/database.mts';
import { parseEnv } from '#ks/server/env.mts';
import { databaseStore } from '#ks/server/trees/database-store.mts';
import { memoryStore } from '#ks/server/trees/memory-store.mts';

type Adapters = {
  sessions: SessionStore;
  signIn: SignInPort;
  store: TreeStore;
  throttle: ThrottleStore;
};

// On `globalThis`, not in the module: Next bundles each route handler and page with its own copy of
// this module, and the memory adapters hold the sessions, so copies would not see each other's.
const shared = globalThis as { kinscapeAdapters?: Adapters };

/**
 * The sign-in port, session store, Tree store and throttle store. `KINSCAPE_MEMORY_ADAPTERS` makes all four
 * memory. Otherwise the database holds the sessions, Trees and throttle. Sign-in is memory under
 * `KINSCAPE_MEMORY_SIGN_IN` and Supabase if it is off. `parseEnv` refuses both flags on Vercel.
 */
export const appAdapters = (): Adapters => {
  if (shared.kinscapeAdapters === undefined) {
    const env = parseEnv(process.env);

    shared.kinscapeAdapters = env.memoryAdapters
      ? {
          sessions: memorySessions(),
          signIn: memorySignIn([SYNTHETIC]),
          store: memoryStore([
            {
              id: SYNTHETIC.accountId,
              issuer: SYNTHETIC.issuer,
              subject: SYNTHETIC.subject,
              trees: [{ id: SYNTHETIC.treeId, name: SYNTHETIC.treeName }],
            },
          ]),
          throttle: memoryThrottle(),
        }
      : {
          sessions: databaseSessions(db()),
          signIn: env.memorySignIn
            ? memorySignIn([SYNTHETIC])
            : supabaseSignIn({
                key: env.supabasePublishableKey,
                url: env.supabaseUrl,
              }),
          store: databaseStore(db()),
          throttle: databaseThrottle(db()),
        };
  }

  return shared.kinscapeAdapters;
};
