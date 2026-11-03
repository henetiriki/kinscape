import { join } from 'node:path';

import { createPgDb } from '#ks/server/db/database.mts';
import { migrate } from '#ks/server/db/migrate.mts';
import { parseDirectUrl } from '#ks/server/env.mts';

const MIGRATIONS = join(
  import.meta.dirname,
  '..',
  'server',
  'db',
  'migrations'
);

/** Applies pending migrations over the direct connection (not the pooler); returns the exit code. */
export const run = async (
  env: Record<string, string | undefined>,
  open: typeof createPgDb = createPgDb,
  dir: string = MIGRATIONS
): Promise<number> => {
  const databaseDirectUrl = parseDirectUrl(env);

  if (databaseDirectUrl === undefined) {
    console.error('Missing environment variable: KINSCAPE_DATABASE_DIRECT_URL');

    return 1;
  }

  const db = open(databaseDirectUrl);

  try {
    const applied = await migrate(db, dir);

    console.log(
      applied.length === 0
        ? 'No pending migrations.'
        : `Applied: ${applied.join(', ')}`
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
