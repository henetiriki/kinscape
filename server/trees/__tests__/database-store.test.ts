import { join } from 'node:path';

import { createTestDb } from '@ks/server/db/__tests__/pglite.ts';
import { migrate } from '@ks/server/db/migrate.mts';
import { runTreeStoreContract } from '@ks/server/trees/__tests__/contract.ts';
import { databaseStore } from '@ks/server/trees/database-store.mts';

runTreeStoreContract('database', async seed => {
  const db = createTestDb();

  await migrate(db, join(import.meta.dirname, '../../db/migrations'));

  for (const { id, issuer, subject, trees } of seed) {
    await db.insertInto('account').values({ id, issuer, subject }).execute();

    for (const tree of trees) {
      await db.insertInto('tree').values(tree).execute();
      await db
        .insertInto('treeAccount')
        .values({ accountId: id, treeId: tree.id })
        .execute();
    }
  }

  return { close: () => db.destroy(), store: databaseStore(db) };
});
