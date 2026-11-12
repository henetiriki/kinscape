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

const isOnVercel = (source: Record<string, string | undefined>) =>
  source.VERCEL !== undefined || source.VERCEL_ENV !== undefined;

/**
 * The path of the CA file that replaces `server/db/root-ca.crt`, or `undefined` for the default.
 * Test-only: CI names the self-signed certificate of its Postgres container. It stops the server
 * if `VERCEL` or `VERCEL_ENV` is defined, even empty, as a CA of the caller's choice would weaken TLS.
 */
export const parseCaFile = (source: Record<string, string | undefined>) => {
  if (source.KINSCAPE_DATABASE_CA_FILE === undefined) {
    return undefined;
  }

  if (isOnVercel(source)) {
    throw new Error('KINSCAPE_DATABASE_CA_FILE must never be set on Vercel');
  }

  return source.KINSCAPE_DATABASE_CA_FILE === ''
    ? undefined
    : source.KINSCAPE_DATABASE_CA_FILE;
};

/**
 * Parses the server variables. A failure names each variable at fault, never its value.
 * `KINSCAPE_MEMORY_ADAPTERS=1` is test-only: it swaps in memory adapters, needs no database or
 * Supabase variable, and stops the server if `VERCEL` or `VERCEL_ENV` is defined, even empty.
 * `KINSCAPE_MEMORY_SIGN_IN=1` is test-only too: it swaps in only the sign-in, needs the database
 * variable but no Supabase variable, and stops the server on Vercel the same way.
 * So does test-only `KINSCAPE_DEV_PAGES`, which shows the design kit and screens (`dev-pages.mts`),
 * and `KINSCAPE_DATABASE_CA_FILE` (`parseCaFile`).
 */
export const parseEnv = (source: Record<string, string | undefined>) => {
  const onVercel = isOnVercel(source);

  if (onVercel && source.KINSCAPE_DEV_PAGES !== undefined) {
    throw new Error('KINSCAPE_DEV_PAGES must never be set on Vercel');
  }

  if (onVercel && source.KINSCAPE_MEMORY_ADAPTERS === '1') {
    throw new Error('KINSCAPE_MEMORY_ADAPTERS must never be set on Vercel');
  }

  if (onVercel && source.KINSCAPE_MEMORY_SIGN_IN === '1') {
    throw new Error('KINSCAPE_MEMORY_SIGN_IN must never be set on Vercel');
  }

  parseCaFile(source);

  if (source.KINSCAPE_MEMORY_ADAPTERS === '1') {
    return {
      databaseDirectUrl: undefined,
      databaseUrl: undefined,
      memoryAdapters: true as const,
      memorySignIn: false as const,
      supabasePublishableKey: undefined,
      supabaseUrl: undefined,
    };
  }

  if (source.KINSCAPE_MEMORY_SIGN_IN === '1') {
    const database = serverEnv
      .pick({
        KINSCAPE_DATABASE_DIRECT_URL: true,
        KINSCAPE_DATABASE_URL: true,
      })
      .safeParse({
        KINSCAPE_DATABASE_DIRECT_URL: source.KINSCAPE_DATABASE_DIRECT_URL,
        KINSCAPE_DATABASE_URL: source.KINSCAPE_DATABASE_URL,
      });

    if (!database.success) {
      return fail(database.error.issues);
    }

    return {
      databaseDirectUrl: database.data.KINSCAPE_DATABASE_DIRECT_URL,
      databaseUrl: database.data.KINSCAPE_DATABASE_URL,
      memoryAdapters: false as const,
      memorySignIn: true as const,
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
    memorySignIn: false as const,
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
