import type { Gh, GhFetchDeps } from '#ks/scripts/types.ts';

// Serves the three `gh` call shapes that review-threads.mts and plan-new.mts make, with `fetch` and
// GH_TOKEN, for a sandboxed local session where `gh` cannot read its config (plans/chores/C1219).
//   api graphql -f query=… [-f|-F key=value]…
//   api [--paginate] <path> [--jq '.[] | @json']
//   issue view <n> --json <fields>
// `Gh` is synchronous and `fetch` is not, so `localGh` runs this file as a child process. The child
// prints what `gh` prints, and a failed call goes to stderr as `gh: <message> (HTTP <status>)` with
// exit code 1. Error text holds the status and the API's message, never the token.

const API = 'https://api.github.com';
const JQ_LINES = '.[] | @json';
const NEXT = /<([^>]+)>;\s*rel="next"/;
const REMOTE =
  /^(?:https:\/\/github\.com\/|git@github\.com:)([\w.-]+\/[\w.-]+?)(?:\.git)?$/;
const UNSUPPORTED = 'gh: this call is not supported';

const fail = (message: string, status: number) =>
  new Error(`gh: ${message} (HTTP ${status})`);

const request = async (
  deps: GhFetchDeps,
  url: string,
  init: RequestInit = {}
): Promise<Response> => {
  const response = await deps.fetch(url, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${deps.token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as {
      message?: string;
    };

    throw fail(body.message ?? response.statusText, response.status);
  }

  return response;
};

// `-F` makes a number, as `gh api -F` does for an integer; `-f` keeps a string.
const graphql = async (args: string[], deps: GhFetchDeps): Promise<string> => {
  const variables: Record<string, number | string> = {};
  let query = '';

  for (let at = 2; at < args.length; at += 2) {
    const flag = args[at];
    const pair = args[at + 1] ?? '';
    const split = pair.indexOf('=');
    const key = pair.slice(0, split);
    const value = pair.slice(split + 1);

    if ((flag !== '-f' && flag !== '-F') || split < 1) {
      throw new Error(UNSUPPORTED);
    }

    if (key === 'query') {
      query = value;
    } else {
      variables[key] = flag === '-F' ? Number(value) : value;
    }
  }

  const text = await (
    await request(deps, `${API}/graphql`, {
      body: JSON.stringify({ query, variables }),
      method: 'POST',
    })
  ).text();
  const { errors } = JSON.parse(text) as { errors?: { message: string }[] };

  if (errors !== undefined) {
    throw fail(errors.map(({ message }) => message).join('; '), 200);
  }

  return text;
};

const rest = async (args: string[], deps: GhFetchDeps): Promise<string> => {
  const paginate = args.includes('--paginate');
  const jqAt = args.indexOf('--jq');
  const jq = jqAt === -1 ? undefined : args[jqAt + 1];
  // The words that are no flag and not the value of `--jq`.
  const path = args
    .slice(1)
    .filter((arg, at) => arg !== '--paginate' && arg !== '--jq' && at !== jqAt);

  if (
    path.length !== 1 ||
    paginate !== (jq !== undefined) ||
    (jq !== undefined && jq !== JQ_LINES)
  ) {
    throw new Error(UNSUPPORTED);
  }

  let url: null | string =
    `${API}/${path[0].replaceAll('{owner}/{repo}', deps.repo)}`;
  const lines: string[] = [];
  let single = '';

  while (url !== null) {
    const response: Response = await request(deps, url);

    if (jq === undefined) {
      single = await response.text();
    } else {
      lines.push(
        ...((await response.json()) as unknown[]).map(item =>
          JSON.stringify(item)
        )
      );
    }

    url = NEXT.exec(response.headers.get('Link') ?? '')?.[1] ?? null;
  }

  return jq === undefined ? single : lines.join('\n');
};

// The REST issue, under the names `gh issue view --json` uses.
const issue = async (args: string[], deps: GhFetchDeps): Promise<string> => {
  const [, , number, flag, fields] = args;

  if (args.length !== 5 || flag !== '--json') {
    throw new Error(UNSUPPORTED);
  }

  const data = JSON.parse(
    await (
      await request(deps, `${API}/repos/${deps.repo}/issues/${number}`)
    ).text()
  ) as Record<string, unknown>;
  const mapped: Record<string, unknown> = {
    ...data,
    issueType: data.type ?? null,
    url: data.html_url,
  };

  return JSON.stringify(
    Object.fromEntries(fields.split(',').map(name => [name, mapped[name]]))
  );
};

export const ghFetch = (
  args: string[],
  _input: string | undefined,
  deps: GhFetchDeps
): Promise<string> => {
  if (args[0] === 'api' && args[1] === 'graphql') {
    return graphql(args, deps);
  }

  if (args[0] === 'api') {
    return rest(args, deps);
  }

  if (args[0] === 'issue' && args[1] === 'view') {
    return issue(args, deps);
  }

  return Promise.reject(new Error(UNSUPPORTED));
};

/** `<owner>/<repo>` from an `origin` URL, in the `https://` or the `git@` form. */
export const repoOf = (url: string): string | undefined =>
  REMOTE.exec(url.trim())?.[1];

/**
 * A `Gh` that runs this file in a child process, and the repo; or the message to print
 * when `GH_TOKEN` is empty or `origin` is not on GitHub.
 */
export const localGh = (
  env: Record<string, string | undefined>,
  git: (args: string[]) => string,
  exec: (
    command: string,
    args: string[],
    input: string | undefined,
    env: Record<string, string | undefined>
  ) => string
): { gh: Gh; repo: string } | string => {
  if (!env.GH_TOKEN) {
    return 'Set GH_TOKEN to a GitHub token, then run this again.';
  }

  const repo = repoOf(git(['remote', 'get-url', 'origin']));

  if (repo === undefined) {
    return 'The origin remote is not a github.com repository.';
  }

  return {
    gh: (args, input) =>
      exec('node', [import.meta.filename, ...args], input, {
        ...env,
        GH_REPO: repo,
      }),
    repo,
  };
};

/* v8 ignore next 12 -- only true when run directly with node, not when imported */
if (import.meta.main) {
  ghFetch(process.argv.slice(2), undefined, {
    fetch,
    repo: process.env.GH_REPO ?? '',
    token: process.env.GH_TOKEN ?? '',
  }).then(
    text => process.stdout.write(`${text}\n`),
    (error: Error) => {
      console.error(error.message);
      process.exitCode = 1;
    }
  );
}
