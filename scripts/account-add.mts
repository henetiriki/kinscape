import { createPgDb } from '#ks/server/db/database.mts';
import { parseDirectUrl } from '#ks/server/env.mts';
import { databaseStore } from '#ks/server/trees/database-store.mts';
import { ISSUER } from '#ks/server/trees/repository.mts';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Adds an Account and its Tree over the direct connection; returns the exit code. */
export const run = async (
  argv: string[],
  env: Record<string, string | undefined>,
  open: typeof createPgDb = createPgDb
): Promise<number> => {
  const [subject, ...rest] = argv;
  const treeName = rest.join(' ').trim();

  if (subject === undefined || !UUID.test(subject) || treeName === '') {
    console.error(
      'Usage: npm run account:add -- <Supabase user id (uuid)> <Tree name>'
    );

    return 1;
  }

  const databaseDirectUrl = parseDirectUrl(env);

  if (databaseDirectUrl === undefined) {
    console.error('Missing environment variable: KINSCAPE_DATABASE_DIRECT_URL');

    return 1;
  }

  const db = open(databaseDirectUrl);

  try {
    const added = await databaseStore(db).addAccount({
      issuer: ISSUER,
      subject,
      treeName,
    });

    if (!added.ok) {
      console.error(`An Account already exists for ${subject}`);

      return 1;
    }

    console.log(`Account ${added.value.accountId}, Tree ${added.value.treeId}`);

    return 0;
  } finally {
    await db.destroy();
  }
};

/* v8 ignore next 3 -- only true when run directly with node, not when imported */
if (import.meta.main) {
  process.exitCode = await run(process.argv.slice(2), process.env);
}
