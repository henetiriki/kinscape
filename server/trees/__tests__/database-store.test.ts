import { join } from 'node:path';

import { createTestDb } from '@ks/server/db/__tests__/pglite.ts';
import { migrate } from '@ks/server/db/migrate.mts';
import { runTreeStoreContract } from '@ks/server/trees/__tests__/contract.ts';
import { databaseStore } from '@ks/server/trees/database-store.mts';

runTreeStoreContract('database', async () => {
  const db = createTestDb();

  await migrate(db, join(import.meta.dirname, '../../db/migrations'));

  return { close: () => db.destroy(), store: databaseStore(db) };
});
