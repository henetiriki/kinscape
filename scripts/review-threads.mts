import { execFileSync } from 'node:child_process';

import type { Gh } from '#ks/scripts/types.ts';

// Reads and resolves a PR's review threads for the fix-review run (.github/agent/fix-review.md).
// GraphQL is the only way to see whether a thread is resolved, or to resolve one, and the agent's
// settings deny `gh api` a body, so the run calls this instead.
//   list <PR number>                 prints JSON: `threads`, the unresolved review threads, and
//                                    `comments`, the PR's last comments; each comment carries its
//                                    author's `login` and `bot`, so the prompt can tell the reviewer apart
//   resolve <PR number> <thread id>  resolves that thread, which must be one of the PR's
// Usage: node scripts/review-threads.mts list|resolve <PR number> [<thread id>], with GH_REPO or
// GITHUB_REPOSITORY (which Actions sets) naming the repo. A failed `gh` call is logged and the
// exit code is 1. The threads are read page by page; the comments are the last 50.

type Author = { __typename: string; login: string } | null;
type Comment = { author: Author; body: string; createdAt?: string };
type PageInfo = { endCursor: null | string; hasNextPage: boolean };
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

const THREADS = `query($owner: String!, $name: String!, $number: Int!, $after: String) {
  repository(owner: $owner, name: $name) {
    pullRequest(number: $number) {
      reviewThreads(first: 100, after: $after) {
        pageInfo { endCursor hasNextPage }
        nodes { id isResolved path line comments(first: 50) { nodes { author { login __typename } body } } }
      }
    }
  }
}`;
const COMMENTS = `query($owner: String!, $name: String!, $number: Int!) {
  repository(owner: $owner, name: $name) {
    pullRequest(number: $number) {
      comments(last: 50) { nodes { author { login __typename } body createdAt } }
    }
  }
}`;
const RESOLVE = `mutation($id: ID!) {
  resolveReviewThread(input: { threadId: $id }) { thread { isResolved } }
}`;

// `-F` sends a number as a number, which `$number: Int!` needs. The query names the PR, so its
// fields come back under it.
const graphql = <T,>(
  gh: Gh,
  query: string,
  fields: Record<string, string>
): T =>
  (
    JSON.parse(
      gh([
        'api',
        'graphql',
        '-f',
        `query=${query}`,
        ...Object.entries(fields).flatMap(([key, value]) => [
          '-F',
          `${key}=${value}`,
        ]),
      ])
    ) as { data: { repository: { pullRequest: T } } }
  ).data.repository.pullRequest;

// Every page of review threads: resolved ones take room in a page too. A page that says there is
// more but names no cursor ends the read, so a malformed reply can't loop.
const threadsOf = (gh: Gh, fields: Record<string, string>): Thread[] => {
  const all: Thread[] = [];
  let after: null | string = null;

  do {
    const page: { nodes: Thread[]; pageInfo: PageInfo } = graphql<{
      reviewThreads: { nodes: Thread[]; pageInfo: PageInfo };
    }>(
      gh,
      THREADS,
      after === null ? fields : { ...fields, after }
    ).reviewThreads;

    all.push(...page.nodes);
    after = page.pageInfo.hasNextPage ? page.pageInfo.endCursor : null;
  } while (after !== null);

  return all;
};

const commentsOf = (gh: Gh, fields: Record<string, string>): Comment[] =>
  graphql<{ comments: { nodes: Comment[] } }>(gh, COMMENTS, fields).comments
    .nodes;

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
  const repo = env.GH_REPO || env.GITHUB_REPOSITORY || '';

  if (
    (command !== 'list' && command !== 'resolve') ||
    !NUMBER.test(raw ?? '') ||
    !REPO.test(repo) ||
    (command === 'resolve') !== (id !== undefined) ||
    (id !== undefined && !ID.test(id))
  ) {
    console.error(
      'Usage: review-threads list|resolve <PR number> [<thread id>], with GH_REPO or GITHUB_REPOSITORY=<owner>/<repo> set'
    );

    return 1;
  }

  const [owner, name] = repo.split('/');
  const fields = { name, number: raw, owner };

  try {
    const threads = threadsOf(gh, fields);

    if (command === 'list') {
      out(
        JSON.stringify(
          {
            comments: commentsOf(gh, fields).map(comment),
            threads: threads
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

    if (!threads.some(thread => thread.id === id)) {
      console.error(`#${raw} has no review thread ${id}.`);

      return 1;
    }

    gh(['api', 'graphql', '-f', `query=${RESOLVE}`, '-F', `id=${id}`]);
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
