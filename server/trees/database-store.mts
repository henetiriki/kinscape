import type { TreeStore } from '../../lib/domain/trees/types.ts';
import type { createDb } from '../db/database.mts';

import { err, ok } from '../../lib/domain/result/result.mts';

/** A TreeStore over Postgres. */
export const databaseStore = (db: ReturnType<typeof createDb>): TreeStore => ({
  addAccount: ({ issuer, subject, treeName }) =>
    db.transaction().execute(async trx => {
      const account = await trx
        .insertInto('account')
        .values({ issuer, subject })
        .onConflict(conflict =>
          conflict.columns(['issuer', 'subject']).doNothing()
        )
        .returning('id')
        .executeTakeFirst();

      if (account === undefined) {
        return err('exists');
      }

      const tree = await trx
        .insertInto('tree')
        .values({ name: treeName })
        .returning('id')
        .executeTakeFirstOrThrow();

      await trx
        .insertInto('treeAccount')
        .values({ accountId: account.id, treeId: tree.id })
        .execute();

      return ok({ accountId: account.id, treeId: tree.id });
    }),
  findTree: async (accountId, treeId) =>
    db
      .selectFrom('tree')
      .innerJoin('treeAccount', 'treeAccount.treeId', 'tree.id')
      .where('treeAccount.accountId', '=', accountId)
      .where('tree.id', '=', treeId)
      .select(['tree.id', 'tree.name'])
      .executeTakeFirst(),
});
