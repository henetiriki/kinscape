import { z } from 'zod';

// Server variables only: none starts with NEXT_PUBLIC_, so none reaches the browser.
const serverEnv = z.object({
  /** Used by `npm run db:migrate`; the app never needs it. */
  KINSCAPE_DATABASE_DIRECT_URL: z.url().optional(),
  /** The app's connection, through the transaction pooler. */
  KINSCAPE_DATABASE_URL: z.url(),
});

const fail = (issues: readonly { path: PropertyKey[] }[]): never => {
  const names = [...new Set(issues.map(({ path }) => String(path[0])))];

  throw new Error(
    `Missing or invalid environment variable: ${names.join(', ')}`
  );
};

/** Parses the server variables. A failure names each variable at fault, never its value. */
export const parseEnv = (source: Record<string, string | undefined>) => {
  const parsed = serverEnv.safeParse({
    KINSCAPE_DATABASE_DIRECT_URL: source.KINSCAPE_DATABASE_DIRECT_URL,
    KINSCAPE_DATABASE_URL: source.KINSCAPE_DATABASE_URL,
  });

  if (!parsed.success) {
    return fail(parsed.error.issues);
  }

  return {
    databaseDirectUrl: parsed.data.KINSCAPE_DATABASE_DIRECT_URL,
    databaseUrl: parsed.data.KINSCAPE_DATABASE_URL,
  };
};

/** Parses only the direct URL, for `db:migrate`, which never needs the app's URL. */
export const parseDirectUrl = (source: Record<string, string | undefined>) => {
  const parsed = serverEnv
    .pick({ KINSCAPE_DATABASE_DIRECT_URL: true })
    .safeParse({
      KINSCAPE_DATABASE_DIRECT_URL: source.KINSCAPE_DATABASE_DIRECT_URL,
    });

  if (!parsed.success) {
    return fail(parsed.error.issues);
  }

  return parsed.data.KINSCAPE_DATABASE_DIRECT_URL;
};
