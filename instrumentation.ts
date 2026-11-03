/** Runs once when the server starts: a bad environment stops it here, not at the first query. */
export const register = async () => {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { parseEnv } = await import('./server/env.mts');

    parseEnv(process.env);
  }
};
