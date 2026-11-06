// Checks a deployment from outside, by hand after a production deploy:
// `npm run check:production -- https://<production host>`.
// While Vercel Authentication covers production, set VERCEL_AUTOMATION_BYPASS_SECRET in your shell
// (docs/repo-settings.md); it is sent as a header and never printed.

type Fetch = (url: string, init: RequestInit) => Promise<Response>;

/** Each check: the path, what a correct deployment answers, and whether the response gives it. */
const CHECKS: {
  expected: string;
  ok: (response: Response) => boolean;
  path: string;
}[] = [
  {
    expected: '404',
    ok: response => response.status === 404,
    path: '/design-kit',
  },
  {
    expected: 'a redirect to /sign-in',
    ok: response =>
      response.status >= 300 &&
      response.status < 400 &&
      new URL(response.headers.get('location') ?? '', 'http://x').pathname ===
        '/sign-in',
    path: '/',
  },
];

/** Runs every check against `base`; prints one line each and returns the exit code. */
export const run = async (
  args: readonly string[],
  env: Record<string, string | undefined>,
  fetch: Fetch
): Promise<number> => {
  const [base] = args;

  if (base === undefined || !URL.canParse(base)) {
    console.error('Usage: npm run check:production -- https://<host>');

    return 2;
  }

  const secret = env.VERCEL_AUTOMATION_BYPASS_SECRET;
  const headers: Record<string, string> = secret
    ? { 'x-vercel-protection-bypass': secret }
    : {};
  let failures = 0;

  for (const { expected, ok, path } of CHECKS) {
    const response = await fetch(new URL(path, base).href, {
      headers,
      redirect: 'manual',
    });

    if (ok(response)) {
      console.log(`ok   ${path}: ${expected}`);
    } else {
      failures += 1;
      console.error(
        `FAIL ${path}: expected ${expected}, got ${response.status}`
      );
    }
  }

  return failures === 0 ? 0 : 1;
};

/* v8 ignore next 3 -- only true when run directly with node, not when imported */
if (import.meta.main) {
  process.exitCode = await run(process.argv.slice(2), process.env, fetch);
}
