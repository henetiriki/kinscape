// The design kit and the built screens: sample data for design work, never part of the product.
// No `server-only`: `proxy.ts` imports this too.

const DEV_PAGE = /^\/(?:design-kit|screens)(?:\/|$)/;

/** Whether a path is under `/design-kit` or `/screens`. */
export const isDevPage = (pathname: string) => DEV_PAGE.test(pathname);

/**
 * An allowlist: the pages show on a Preview deployment, outside a production build, or with the
 * test-only `KINSCAPE_DEV_PAGES=1` (refused on Vercel by `parseEnv`). Anything else hides them,
 * including a production deployment where Vercel's system variables are off.
 */
export const devPagesVisible = (env: Record<string, string | undefined>) =>
  env.VERCEL_ENV === 'preview' ||
  env.NODE_ENV !== 'production' ||
  env.KINSCAPE_DEV_PAGES === '1';
