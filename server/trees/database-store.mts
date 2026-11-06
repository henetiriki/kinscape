import type { TreeStore } from '#ks/lib/domain/trees/types.ts';
import type { createDb } from '#ks/server/db/database.mts';

import { parseAccountId, parseTreeId } from '#ks/lib/domain/ids/ids.mts';
import { err, ok } from '#ks/lib/domain/result/result.mts';

/**
 * A TreeStore over Postgres. The ids are branded, but a cast can hold anything and Postgres
 * throws on a malformed `uuid`, so a read given an id that isn't a UUID finds nothing, as in memory.
 */
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
  findAccount: async (issuer, subject) =>
    db
      .selectFrom('account')
      .where('issuer', '=', issuer)
      .where('subject', '=', subject)
      .select('id')
      .executeTakeFirst(),
  findTree: async ({ accountId, treeId }) =>
    parseAccountId(accountId) && parseTreeId(treeId)
      ? db
          .selectFrom('tree')
          .innerJoin('treeAccount', 'treeAccount.treeId', 'tree.id')
          .where('treeAccount.accountId', '=', accountId)
          .where('tree.id', '=', treeId)
          .select(['tree.id', 'tree.name'])
          .executeTakeFirst()
      : undefined,
  findTrees: async accountId =>
    parseAccountId(accountId)
      ? db
          .selectFrom('tree')
          .innerJoin('treeAccount', 'treeAccount.treeId', 'tree.id')
          .where('treeAccount.accountId', '=', accountId)
          .orderBy('tree.id')
          .select(['tree.id', 'tree.name'])
          .execute()
      : [],
});
