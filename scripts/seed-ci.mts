import { SYNTHETIC } from '#ks/server/auth/synthetic.mts';
import { createPgDb } from '#ks/server/db/database.mts';
import { parseDirectUrl } from '#ks/server/env.mts';

/**
 * Adds the SYNTHETIC Account and Tree, with the ids the test-only memory sign-in uses, over the
 * direct connection. CI runs it after `db:migrate`, so e2e can sign in against real Postgres.
 * A second run adds nothing. Returns the exit code.
 */
export const run = async (
  env: Record<string, string | undefined>,
  open: typeof createPgDb = createPgDb
): Promise<number> => {
  const databaseDirectUrl = parseDirectUrl(env);

  if (databaseDirectUrl === undefined) {
    console.error('Missing environment variable: KINSCAPE_DATABASE_DIRECT_URL');

    return 1;
  }

  const db = open(databaseDirectUrl);

  try {
    await db.transaction().execute(async trx => {
      await trx
        .insertInto('account')
        .values({
          id: SYNTHETIC.accountId,
          issuer: SYNTHETIC.issuer,
          subject: SYNTHETIC.subject,
        })
        .onConflict(conflict => conflict.doNothing())
        .execute();
      await trx
        .insertInto('tree')
        .values({ id: SYNTHETIC.treeId, name: SYNTHETIC.treeName })
        .onConflict(conflict => conflict.doNothing())
        .execute();
      await trx
        .insertInto('treeAccount')
        .values({ accountId: SYNTHETIC.accountId, treeId: SYNTHETIC.treeId })
        .onConflict(conflict => conflict.doNothing())
        .execute();
    });

    console.log(
      `Seeded Account ${SYNTHETIC.accountId}, Tree ${SYNTHETIC.treeId}`
    );

    return 0;
  } finally {
    await db.destroy();
  }
};

/* v8 ignore next 3 -- only true when run directly with node, not when imported */
if (import.meta.main) {
  process.exitCode = await run(process.env);
}
