import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Gh } from '@ks/scripts/types.ts';

import { run } from '@ks/scripts/review-threads.mts';

const ENV = { GH_REPO: 'owner/repo' };

type Author = { __typename: string; login: string } | null;
type Comment = { author: Author; body: string };
type Thread = {
  comments: Comment[];
  id: string;
  isResolved: boolean;
  line: null | number;
  path: string;
};

const bot: Author = { __typename: 'Bot', login: 'claude' };
const person: Author = { __typename: 'User', login: 'claude' };

const THREADS: Thread[] = [
  {
    comments: [
      { author: bot, body: 'Unused import.' },
      { author: person, body: 'Fixed.' },
    ],
    id: 'PRRT_1',
    isResolved: false,
    line: 12,
    path: 'app/page.tsx',
  },
  {
    comments: [{ author: bot, body: 'Done already.' }],
    id: 'PRRT_2',
    isResolved: true,
    line: 3,
    path: 'app/page.tsx',
  },
  {
    comments: [{ author: null, body: 'A deleted account wrote this.' }],
    id: 'PRRT_3',
    isResolved: false,
    line: null,
    path: 'README.md',
  },
];
const COMMENTS = [
  { author: bot, body: 'Gaps: none.', createdAt: '2026-11-02T10:00:00Z' },
  { author: person, body: 'Thanks.', createdAt: '2026-11-02T11:00:00Z' },
];

type Options = {
  // Every page says there is more but names no cursor.
  cursorless?: boolean;
  // The PR the threads are on, as the thread query answers it.
  on?: { number: number; repo: string };
  pageSize?: number;
};

describe('run', () => {
  let gh: ReturnType<typeof vi.fn<Gh>>;
  let out: ReturnType<typeof vi.fn<(text: string) => void>>;
  let errors: string[];

  // Serves the threads `pageSize` at a time: a query with `after=c<n>` gets page n + 1. A thread
  // asked by id answers the PR it is on; an unknown id answers no node, another kind of node an
  // empty one.
  const fakeGh = (
    threads = THREADS,
    {
      cursorless = false,
      on = { number: 5, repo: 'Owner/Repo' },
      pageSize = 100,
    }: Options = {}
  ) => {
    gh = vi.fn<Gh>(args => {
      const query = args.find(arg => arg.startsWith('query=')) ?? '';

      if (query.startsWith('query=mutation')) {
        return JSON.stringify({ data: { resolveReviewThread: {} } });
      }

      if (query.includes('node(id:')) {
        const id = args.find(arg => arg.startsWith('id='))?.slice(3);
        const node = threads.some(thread => thread.id === id)
          ? {
              pullRequest: {
                number: on.number,
                repository: { nameWithOwner: on.repo },
              },
            }
          : id === 'PR_1'
            ? {}
            : null;

        return JSON.stringify({ data: { node } });
      }

      if (!query.includes('reviewThreads')) {
        return JSON.stringify({
          data: {
            repository: { pullRequest: { comments: { nodes: COMMENTS } } },
          },
        });
      }

      const after = args.find(arg => arg.startsWith('after='));
      const index = after ? Number(after.slice('after=c'.length)) + 1 : 0;
      const last = Math.max(0, Math.ceil(threads.length / pageSize) - 1);

      return JSON.stringify({
        data: {
          repository: {
            pullRequest: {
              reviewThreads: {
                nodes: threads
                  .slice(index * pageSize, (index + 1) * pageSize)
                  .map(({ comments, ...thread }) => ({
                    ...thread,
                    comments: { nodes: comments },
                  })),
                pageInfo: cursorless
                  ? { endCursor: null, hasNextPage: true }
                  : {
                      endCursor: index < last ? `c${index}` : null,
                      hasNextPage: index < last,
                    },
              },
            },
          },
        },
      });
    });
  };
  const queries = () => gh.mock.calls.map(([args]) => args);
  const about = (what: string) =>
    queries().filter(args =>
      args.some(arg => arg.startsWith('query=') && arg.includes(what))
    );
  const threadQueries = () => about('reviewThreads');
  const commentQueries = () => about('comments(last');
  const byId = () => about('node(id:');
  const mutations = () => about('resolveReviewThread');
  // The flag before a variable: `-f` sends it as a string, `-F` as a typed value.
  const flagOf = (args: string[], variable: string) =>
    args[args.indexOf(variable) - 1];
  const listed = () =>
    JSON.parse(out.mock.calls[0][0]) as {
      comments: unknown[];
      threads: { id: string }[];
    };

  beforeEach(() => {
    out = vi.fn();
    errors = [];
    vi.spyOn(console, 'error').mockImplementation((message: string) => {
      errors.push(message);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('usage', () => {
    it.each([
      [[], ENV],
      [['list'], ENV],
      [['show', '5'], ENV],
      [['list', '0'], ENV],
      [['list', '5x'], ENV],
      [['list', '5', 'PRRT_1'], ENV],
      [['resolve', '5'], ENV],
      [['resolve', '5', 'PRRT_1; rm'], ENV],
      [['list', '5'], { GH_REPO: 'no-slash' }],
      [['list', '5'], {}],
    ])('rejects %j with env %j', (args, env) => {
      fakeGh();

      expect(run(args, env, gh, out)).toBe(1);
      expect(errors[0]).toMatch(/^Usage/);
      expect(gh).not.toHaveBeenCalled();
      expect(out).not.toHaveBeenCalled();
    });
  });

  describe('list', () => {
    // An all-digit login is a valid one, and `-F` would send it as a number.
    it('asks for the PR by owner and name as strings and by number as a number', () => {
      fakeGh();
      run(['list', '5'], ENV, gh, out);

      expect(threadQueries()).toHaveLength(1);
      expect(threadQueries()[0].slice(0, 2)).toEqual(['api', 'graphql']);
      expect(threadQueries()[0].slice(4)).toEqual([
        '-f',
        'name=repo',
        '-F',
        'number=5',
        '-f',
        'owner=owner',
      ]);
      expect(
        threadQueries()[0].find(arg => arg.startsWith('query='))
      ).toContain('reviewThreads(first: 100, after: $after)');
      expect(commentQueries()).toHaveLength(1);
      expect(commentQueries()[0].slice(4)).toEqual(threadQueries()[0].slice(4));
    });

    it('prints the unresolved threads and the comments, each author with its bot flag', () => {
      fakeGh();

      expect(run(['list', '5'], ENV, gh, out)).toBe(0);
      expect(listed()).toEqual({
        comments: [
          {
            body: 'Gaps: none.',
            bot: true,
            createdAt: '2026-11-02T10:00:00Z',
            login: 'claude',
          },
          {
            body: 'Thanks.',
            bot: false,
            createdAt: '2026-11-02T11:00:00Z',
            login: 'claude',
          },
        ],
        threads: [
          {
            comments: [
              { body: 'Unused import.', bot: true, login: 'claude' },
              { body: 'Fixed.', bot: false, login: 'claude' },
            ],
            id: 'PRRT_1',
            line: 12,
            path: 'app/page.tsx',
          },
          {
            comments: [
              { body: 'A deleted account wrote this.', bot: false, login: '' },
            ],
            id: 'PRRT_3',
            line: null,
            path: 'README.md',
          },
        ],
      });
    });

    it('prints empty lists for a PR with none', () => {
      fakeGh([]);

      expect(run(['list', '5'], ENV, gh, out)).toBe(0);
      expect(listed().threads).toEqual([]);
    });

    // Resolved threads take room in a page too, so a long-reviewed PR has more than one.
    it('reads every page of threads, the cursor as a string, and the comments once', () => {
      fakeGh(THREADS, { pageSize: 2 });

      expect(run(['list', '5'], ENV, gh, out)).toBe(0);
      expect(threadQueries()).toHaveLength(2);
      expect(threadQueries()[0]).not.toEqual(
        expect.arrayContaining([expect.stringMatching(/^after=/)])
      );
      expect(flagOf(threadQueries()[1], 'after=c0')).toBe('-f');
      expect(commentQueries()).toHaveLength(1);
      expect(listed().threads.map(({ id }) => id)).toEqual([
        'PRRT_1',
        'PRRT_3',
      ]);
    });

    it('stops at a page that claims more but names no cursor', () => {
      fakeGh(THREADS, { cursorless: true, pageSize: 2 });

      expect(run(['list', '5'], ENV, gh, out)).toBe(0);
      expect(threadQueries()).toHaveLength(1);
      expect(listed().threads.map(({ id }) => id)).toEqual(['PRRT_1']);
    });

    // Actions sets GITHUB_REPOSITORY; the fix-review run's shell has no GH_REPO, or an empty one.
    it.each([
      { GITHUB_REPOSITORY: 'o/r' },
      { GH_REPO: '', GITHUB_REPOSITORY: 'o/r' },
    ])('takes the repo from GITHUB_REPOSITORY with env %j', env => {
      fakeGh();

      expect(run(['list', '5'], env, gh, out)).toBe(0);
      expect(threadQueries()[0]).toEqual(
        expect.arrayContaining(['owner=o', 'name=r'])
      );
    });
  });

  describe('resolve', () => {
    // One small query asks the thread which PR it is on: no page of threads is read.
    it('resolves a thread of the PR and says so, reading no threads or comments', () => {
      fakeGh();

      expect(run(['resolve', '5', 'PRRT_1'], ENV, gh, out)).toBe(0);
      expect(byId()).toHaveLength(1);
      expect(flagOf(byId()[0], 'id=PRRT_1')).toBe('-f');
      expect(mutations()).toHaveLength(1);
      expect(flagOf(mutations()[0], 'id=PRRT_1')).toBe('-f');
      expect(threadQueries()).toEqual([]);
      expect(commentQueries()).toEqual([]);
      expect(out).toHaveBeenCalledWith('Resolved PRRT_1 on #5.');
    });

    it.each<[string, Options, string]>([
      ['PRRT_9', {}, 'an unknown id'],
      ['PR_1', {}, 'a node that is no thread'],
      ['PRRT_1', { on: { number: 7, repo: 'owner/repo' } }, 'another PR'],
      ['PRRT_1', { on: { number: 5, repo: 'owner/fork' } }, 'another repo'],
    ])('resolves nothing for %s (%s)', (id, options) => {
      fakeGh(THREADS, options);

      expect(run(['resolve', '5', id], ENV, gh, out)).toBe(1);
      expect(mutations()).toEqual([]);
      expect(errors).toEqual([`#5 has no review thread ${id}.`]);
      expect(out).not.toHaveBeenCalled();
    });
  });

  it('logs a failed gh call and exits 1', () => {
    fakeGh();
    gh.mockImplementation(() => {
      throw new Error('HTTP 502');
    });

    expect(run(['list', '5'], ENV, gh, out)).toBe(1);
    expect(errors).toEqual(['#5: HTTP 502']);
    expect(out).not.toHaveBeenCalled();
  });
});
