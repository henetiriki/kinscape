import 'vitest';

// The values `vitest.config.mts` gives each database project (`test.provide`).
declare module 'vitest' {
  interface ProvidedContext {
    /** The backend the project runs the contract suites on. */
    backend: 'pglite' | 'postgres';
    /** The container's URL under `postgres`; empty under `pglite`. */
    databaseUrl: string;
  }
}
