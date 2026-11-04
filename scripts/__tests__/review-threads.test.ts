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

type Paging = {
  // Every page says there is more but names no cursor.
  cursorless?: boolean;
  pageSize?: number;
};

describe('run', () => {
  let gh: ReturnType<typeof vi.fn<Gh>>;
  let out: ReturnType<typeof vi.fn<(text: string) => void>>;
  let errors: string[];

  // Serves the threads `pageSize` at a time: a query with `after=c<n>` gets page n + 1.
  const fakeGh = (
    threads = THREADS,
    { cursorless = false, pageSize = 100 }: Paging = {}
  ) => {
    gh = vi.fn<Gh>(args => {
      const query = args.find(arg => arg.startsWith('query=')) ?? '';

      if (query.startsWith('query=mutation')) {
        return JSON.stringify({ data: { resolveReviewThread: {} } });
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
  const mutations = () => about('resolveReviewThread');
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
    it('asks for the PR by owner, name and number, as a number', () => {
      fakeGh();
      run(['list', '5'], ENV, gh, out);

      expect(threadQueries()).toHaveLength(1);
      expect(threadQueries()[0].slice(0, 2)).toEqual(['api', 'graphql']);
      expect(threadQueries()[0]).toEqual(
        expect.arrayContaining(['-F', 'owner=owner', 'name=repo', 'number=5'])
      );
      expect(
        threadQueries()[0].find(arg => arg.startsWith('query='))
      ).toContain('reviewThreads(first: 100, after: $after)');
      expect(commentQueries()).toHaveLength(1);
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
    it('reads every page of threads, and the comments once', () => {
      fakeGh(THREADS, { pageSize: 2 });

      expect(run(['list', '5'], ENV, gh, out)).toBe(0);
      expect(threadQueries()).toHaveLength(2);
      expect(threadQueries()[0]).not.toEqual(
        expect.arrayContaining([expect.stringMatching(/^after=/)])
      );
      expect(threadQueries()[1]).toEqual(
        expect.arrayContaining(['-F', 'after=c0'])
      );
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
    it('resolves a thread of the PR and says so, reading no comments', () => {
      fakeGh();

      expect(run(['resolve', '5', 'PRRT_1'], ENV, gh, out)).toBe(0);
      expect(mutations()).toHaveLength(1);
      expect(mutations()[0]).toEqual(
        expect.arrayContaining(['-F', 'id=PRRT_1'])
      );
      expect(commentQueries()).toEqual([]);
      expect(out).toHaveBeenCalledWith('Resolved PRRT_1 on #5.');
    });

    it('resolves a thread on a later page', () => {
      fakeGh(THREADS, { pageSize: 2 });

      expect(run(['resolve', '5', 'PRRT_3'], ENV, gh, out)).toBe(0);
      expect(mutations()).toHaveLength(1);
    });

    it('resolves nothing that is not a thread of the PR', () => {
      fakeGh();

      expect(run(['resolve', '5', 'PRRT_9'], ENV, gh, out)).toBe(1);
      expect(mutations()).toEqual([]);
      expect(errors).toEqual(['#5 has no review thread PRRT_9.']);
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
