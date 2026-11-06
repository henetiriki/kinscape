import { z } from 'zod';

/** Connection-string parameters that change how the server's certificate is checked. */
const TLS_KEYS = ['ssl', 'sslcert', 'sslkey', 'sslrootcert', 'uselibpqcompat'];

/**
 * A database URL whose TLS the code alone decides (`server/db/database.mts`): it may name
 * `sslmode=verify-full` and no other TLS parameter.
 */
const databaseUrl = z.url().pipe(
  z.string().refine(value => {
    const { searchParams } = new URL(value);

    return (
      TLS_KEYS.every(key => !searchParams.has(key)) &&
      searchParams.getAll('sslmode').every(mode => mode === 'verify-full')
    );
  })
);

// Server variables only: none starts with NEXT_PUBLIC_, so none reaches the browser.
const serverEnv = z.object({
  /** Used by `npm run db:migrate`; the app never needs it. */
  KINSCAPE_DATABASE_DIRECT_URL: databaseUrl.optional(),
  /** The app's connection, through the transaction pooler. */
  KINSCAPE_DATABASE_URL: databaseUrl,
  /** The project's publishable key; it signs users in but can't manage them. */
  KINSCAPE_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  /** The project's API URL. */
  KINSCAPE_SUPABASE_URL: z.url(),
});

const fail = (issues: readonly { path: PropertyKey[] }[]): never => {
  const names = [...new Set(issues.map(({ path }) => String(path[0])))];

  throw new Error(
    `Missing or invalid environment variable: ${names.join(', ')}`
  );
};

/**
 * Parses the server variables. A failure names each variable at fault, never its value.
 * `KINSCAPE_MEMORY_ADAPTERS=1` is test-only: it swaps in memory adapters, needs no database or
 * Supabase variable, and stops the server if `VERCEL` or `VERCEL_ENV` is defined, even empty.
 * So does test-only `KINSCAPE_DEV_PAGES`, which shows the design kit and screens (`dev-pages.mts`).
 */
export const parseEnv = (source: Record<string, string | undefined>) => {
  const onVercel =
    source.VERCEL !== undefined || source.VERCEL_ENV !== undefined;

  if (onVercel && source.KINSCAPE_DEV_PAGES !== undefined) {
    throw new Error('KINSCAPE_DEV_PAGES must never be set on Vercel');
  }

  if (source.KINSCAPE_MEMORY_ADAPTERS === '1') {
    if (onVercel) {
      throw new Error('KINSCAPE_MEMORY_ADAPTERS must never be set on Vercel');
    }

    return {
      databaseDirectUrl: undefined,
      databaseUrl: undefined,
      memoryAdapters: true as const,
      supabasePublishableKey: undefined,
      supabaseUrl: undefined,
    };
  }

  const parsed = serverEnv.safeParse({
    KINSCAPE_DATABASE_DIRECT_URL: source.KINSCAPE_DATABASE_DIRECT_URL,
    KINSCAPE_DATABASE_URL: source.KINSCAPE_DATABASE_URL,
    KINSCAPE_SUPABASE_PUBLISHABLE_KEY: source.KINSCAPE_SUPABASE_PUBLISHABLE_KEY,
    KINSCAPE_SUPABASE_URL: source.KINSCAPE_SUPABASE_URL,
  });

  if (!parsed.success) {
    return fail(parsed.error.issues);
  }

  return {
    databaseDirectUrl: parsed.data.KINSCAPE_DATABASE_DIRECT_URL,
    databaseUrl: parsed.data.KINSCAPE_DATABASE_URL,
    memoryAdapters: false as const,
    supabasePublishableKey: parsed.data.KINSCAPE_SUPABASE_PUBLISHABLE_KEY,
    supabaseUrl: parsed.data.KINSCAPE_SUPABASE_URL,
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
