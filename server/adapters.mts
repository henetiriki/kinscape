import 'server-only';

import type {
  SessionStore,
  SignInPort,
  ThrottleStore,
} from '#ks/lib/domain/auth/types.ts';
import type { TreeStore } from '#ks/lib/domain/trees/types.ts';

import { parseAccountId, parseTreeId } from '#ks/lib/domain/ids/ids.mts';
import { databaseSessions } from '#ks/server/auth/database-sessions.mts';
import { databaseThrottle } from '#ks/server/auth/database-throttle.mts';
import { memorySessions } from '#ks/server/auth/memory-sessions.mts';
import { memorySignIn } from '#ks/server/auth/memory-sign-in.mts';
import { memoryThrottle } from '#ks/server/auth/memory-throttle.mts';
import { supabaseSignIn } from '#ks/server/auth/supabase-sign-in.mts';
import { db } from '#ks/server/db/database.mts';
import { parseEnv } from '#ks/server/env.mts';
import { databaseStore } from '#ks/server/trees/database-store.mts';
import { memoryStore } from '#ks/server/trees/memory-store.mts';

/** The one synthetic user and Tree behind the test-only memory adapters. */
export const SYNTHETIC = {
  accountId: parseAccountId('00000000-0000-4000-8000-0000000000a1')!,
  email: 'synthetic@example.test',
  issuer: 'synthetic',
  password: 'synthetic-password',
  subject: 'synthetic-subject',
  treeId: parseTreeId('00000000-0000-4000-8000-0000000000b1')!,
};

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
 * The sign-in port, session store, Tree store and throttle store, chosen together: memory under `KINSCAPE_MEMORY_ADAPTERS`
 * (`parseEnv` refuses that on Vercel), otherwise Supabase and the database.
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
              trees: [{ id: SYNTHETIC.treeId, name: 'Synthetic Tree' }],
            },
          ]),
          throttle: memoryThrottle(),
        }
      : {
          sessions: databaseSessions(db()),
          signIn: supabaseSignIn({
            key: env.supabasePublishableKey,
            url: env.supabaseUrl,
          }),
          store: databaseStore(db()),
          throttle: databaseThrottle(db()),
        };
  }

  return shared.kinscapeAdapters;
};
