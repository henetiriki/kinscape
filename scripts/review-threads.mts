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
// exit code is 1. The threads are read page by page; the comments are the last 50; a resolve asks
// the thread itself which PR it is on.

type Author = { __typename: string; login: string } | null;
type Comment = { author: Author; body: string; createdAt?: string };
type PageInfo = { endCursor: null | string; hasNextPage: boolean };
type Pr<T> = { repository: { pullRequest: T } };
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
const THREAD = `query($id: ID!) {
  node(id: $id) {
    ... on PullRequestReviewThread { pullRequest { number repository { nameWithOwner } } }
  }
}`;
const RESOLVE = `mutation($id: ID!) {
  resolveReviewThread(input: { threadId: $id }) { thread { isResolved } }
}`;

// A string variable goes in with `-f`; `-F` types its value, which `$number: Int!` needs and a
// string must not get (an all-digit login would arrive as a number).
const graphql = <T,>(
  gh: Gh,
  query: string,
  variables: Record<string, number | string>
): T =>
  (
    JSON.parse(
      gh([
        'api',
        'graphql',
        '-f',
        `query=${query}`,
        ...Object.entries(variables).flatMap(([key, value]) => [
          typeof value === 'number' ? '-F' : '-f',
          `${key}=${value}`,
        ]),
      ])
    ) as { data: T }
  ).data;

// Every page of review threads: resolved ones take room in a page too. A page that says there is
// more but names no cursor ends the read, so a malformed reply can't loop.
const threadsOf = (gh: Gh, pr: Record<string, number | string>): Thread[] => {
  const all: Thread[] = [];
  let after: null | string = null;

  do {
    const page: { nodes: Thread[]; pageInfo: PageInfo } = graphql<
      Pr<{ reviewThreads: { nodes: Thread[]; pageInfo: PageInfo } }>
    >(gh, THREADS, after === null ? pr : { ...pr, after }).repository
      .pullRequest.reviewThreads;

    all.push(...page.nodes);
    after = page.pageInfo.hasNextPage ? page.pageInfo.endCursor : null;
  } while (after !== null);

  return all;
};

const commentsOf = (gh: Gh, pr: Record<string, number | string>): Comment[] =>
  graphql<Pr<{ comments: { nodes: Comment[] } }>>(gh, COMMENTS, pr).repository
    .pullRequest.comments.nodes;

// The PR a review thread is on, as "<owner>/<repo>#<number>"; '' for an id that is no thread.
const threadOn = (gh: Gh, id: string): string => {
  const on = graphql<{
    node: {
      pullRequest?: { number: number; repository: { nameWithOwner: string } };
    } | null;
  }>(gh, THREAD, { id }).node?.pullRequest;

  return on === undefined
    ? ''
    : `${on.repository.nameWithOwner}#${on.number}`.toLowerCase();
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
  const pr = { name, number: Number(raw), owner };

  try {
    if (command === 'list') {
      out(
        JSON.stringify(
          {
            comments: commentsOf(gh, pr).map(comment),
            threads: threadsOf(gh, pr)
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

    if (threadOn(gh, id as string) !== `${repo}#${raw}`.toLowerCase()) {
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
