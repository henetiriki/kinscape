import { afterAll } from 'vitest';

import { contractDbs } from '@ks/server/db/__tests__/postgres.ts';
import { runTreeStoreContract } from '@ks/server/trees/__tests__/contract.ts';
import { databaseStore } from '@ks/server/trees/database-store.mts';

for (const shared of contractDbs()) {
  afterAll(() => shared.close());

  runTreeStoreContract(shared.name, async seed => {
    const db = await shared.fresh();

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
}
