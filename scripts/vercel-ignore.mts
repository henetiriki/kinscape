/**
 * Vercel's Ignored Build Step (`vercel.json`): exit 0 skips the deployment, 1 builds it.
 * Skips only when every changed file is on the invisible list; anything unclear deploys.
 * It runs before `npm ci`, so it uses built-ins only. Plan: plans/chores/C291-vercel-ignore.md.
 */
const API = 'https://api.github.com/repos/henetiriki/kinscape/';

/** GitHub lists at most 300 files without paging; a list that long may be cut short. */
const LIMIT = 300;

// Paths no user can see. Keep in step with docs/repo-settings.md.
const INVISIBLE = [
  /^(?:docs|plans|\.github|\.claude|\.husky|\.idea|e2e|scripts|design\/source)\//,
  /^[^/]+\.md$/,
  /^design\/DESIGN\.md$/,
  /^design\/[^/]+\.jpg$/,
  /(?:^|\/)__tests__\//,
  /^(?:vitest\.config\.mts|vitest\.setup\.ts|playwright\.config\.ts|codecov\.yml)$/,
];

export type Get = (
  url: string,
  init: { headers: Record<string, string> }
) => Promise<{ json: () => Promise<unknown>; ok: boolean; status: number }>;

export const invisible = (path: string): boolean =>
  INVISIBLE.some(pattern => pattern.test(path));

/** Every path the change touches, a rename's old one too; undefined if the list can't be trusted. */
const changedPaths = (body: unknown): string[] | undefined => {
  const files = (body as { files?: unknown } | null)?.files;

  if (!Array.isArray(files) || files.length === 0 || files.length >= LIMIT) {
    return undefined;
  }

  const paths: string[] = [];

  for (const file of files as unknown[]) {
    const { filename, previous_filename: previous } = (file ?? {}) as {
      filename?: unknown;
      previous_filename?: unknown;
    };

    if (
      typeof filename !== 'string' ||
      (previous !== undefined && typeof previous !== 'string')
    ) {
      return undefined;
    }

    paths.push(filename, ...(previous === undefined ? [] : [previous]));
  }

  return paths;
};

const deploy = (reason: string): number => {
  console.log(`Deploy: ${reason}`);

  return 1;
};

export const run = async (
  env: Record<string, string | undefined>,
  get: Get
): Promise<number> => {
  const ref = env.VERCEL_GIT_COMMIT_REF;
  const sha = env.VERCEL_GIT_COMMIT_SHA;
  const token = env.KINSCAPE_GIT_READ_TOKEN;

  if (ref === 'po-preview') {
    return deploy('po-preview always deploys');
  }

  if (!ref || !sha || !token) {
    return deploy('no branch, commit or token');
  }

  try {
    const response = await get(
      ref === 'main' ? `${API}commits/${sha}` : `${API}compare/main...${sha}`,
      {
        headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'kinscape' },
      }
    );

    if (!response.ok) {
      return deploy(`GitHub answered ${response.status}`);
    }

    const paths = changedPaths(await response.json());

    if (!paths) {
      return deploy('no usable list of changed files');
    }

    const visible = paths.find(path => !invisible(path));

    if (visible) {
      return deploy(`${visible} is visible`);
    }

    console.log(`Skip: ${paths.length} changed paths, none visible`);

    return 0;
  } catch {
    return deploy('could not read the changes');
  }
};

/* v8 ignore next 3 -- only true when run directly with node, not when imported */
if (import.meta.main) {
  process.exitCode = await run(process.env, fetch);
}
