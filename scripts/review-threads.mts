import { execFileSync } from 'node:child_process';

import type { Gh } from '#ks/scripts/types.ts';

// Reads and resolves a PR's review threads for the fix-review run (.github/agent/fix-review.md).
// GraphQL is the only way to see whether a thread is resolved, or to resolve one, and the agent's
// settings deny `gh api` a body, so the run calls this instead.
//   list <PR number>                 prints JSON: `threads`, the unresolved review threads, and
//                                    `comments`, the PR's last comments; each comment carries its
//                                    author's `login` and `bot`, so the prompt can tell the reviewer apart
//   resolve <PR number> <thread id>  resolves that thread, which must be one of the PR's
// Usage: node scripts/review-threads.mts list|resolve <PR number> [<thread id>], with GH_REPO set.
// A failed `gh` call is logged and the exit code is 1.

type Author = { __typename: string; login: string } | null;
type Comment = { author: Author; body: string; createdAt?: string };
type Pr = {
  comments: { nodes: Comment[] };
  reviewThreads: { nodes: Thread[] };
};
type Thread = {
  comments: { nodes: Comment[] };
  id: string;
  isResolved: boolean;
  line: null | number;
  path: string;
};

const NUMBER = /^[1-9]\d*$/;
const REPO = /^[\w.-]+\/[\w.-]+$/;
// A GraphQL node id, as `list` prints it.
const ID = /^[\w=-]+$/;

const QUERY = `query($owner: String!, $name: String!, $number: Int!) {
  repository(owner: $owner, name: $name) {
    pullRequest(number: $number) {
      reviewThreads(first: 100) {
        nodes { id isResolved path line comments(first: 50) { nodes { author { login __typename } body } } }
      }
      comments(last: 50) { nodes { author { login __typename } body createdAt } }
    }
  }
}`;
const RESOLVE = `mutation($id: ID!) {
  resolveReviewThread(input: { threadId: $id }) { thread { isResolved } }
}`;

// `-F` sends a number as a number, which `$number: Int!` needs.
const graphql = (gh: Gh, query: string, fields: Record<string, string>) =>
  gh([
    'api',
    'graphql',
    '-f',
    `query=${query}`,
    ...Object.entries(fields).flatMap(([key, value]) => [
      '-F',
      `${key}=${value}`,
    ]),
  ]);

const read = (gh: Gh, repo: string, number: string): Pr => {
  const [owner, name] = repo.split('/');

  return (
    JSON.parse(graphql(gh, QUERY, { name, number, owner })) as {
      data: { repository: { pullRequest: Pr } };
    }
  ).data.repository.pullRequest;
};

const comment = ({ author, body, createdAt }: Comment) => ({
  body,
  bot: author?.__typename === 'Bot',
  login: author?.login ?? '',
  ...(createdAt === undefined ? {} : { createdAt }),
});

export const run = (
  args: string[],
  env: Record<string, string | undefined>,
  gh: Gh,
  out: (text: string) => void
): number => {
  const [command, raw, id] = args;
  const repo = env.GH_REPO ?? '';

  if (
    (command !== 'list' && command !== 'resolve') ||
    !NUMBER.test(raw ?? '') ||
    !REPO.test(repo) ||
    (command === 'resolve') !== (id !== undefined) ||
    (id !== undefined && !ID.test(id))
  ) {
    console.error(
      'Usage: review-threads list|resolve <PR number> [<thread id>], with GH_REPO=<owner>/<repo> set'
    );

    return 1;
  }

  try {
    const pr = read(gh, repo, raw);

    if (command === 'list') {
      out(
        JSON.stringify(
          {
            comments: pr.comments.nodes.map(comment),
            threads: pr.reviewThreads.nodes
              .filter(({ isResolved }) => !isResolved)
              .map(({ comments, id: threadId, line, path }) => ({
                comments: comments.nodes.map(comment),
                id: threadId,
                line,
                path,
              })),
          },
          null,
          2
        )
      );

      return 0;
    }

    if (!pr.reviewThreads.nodes.some(thread => thread.id === id)) {
      console.error(`#${raw} has no review thread ${id}.`);

      return 1;
    }

    graphql(gh, RESOLVE, { id: id as string });
    out(`Resolved ${id} on #${raw}.`);

    return 0;
  } catch (error) {
    console.error(`#${raw}: ${(error as Error).message}`);

    return 1;
  }
};

/* v8 ignore next 10 -- only true when run directly with node, not when imported */
if (import.meta.main) {
  process.exitCode = run(
    process.argv.slice(2),
    process.env,
    (args, input) =>
      execFileSync('gh', args, {
        encoding: 'utf8',
        input,
        maxBuffer: 16 * 1024 * 1024,
      }),
    text => console.log(text)
  );
}
