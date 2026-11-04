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

describe('run', () => {
  let gh: ReturnType<typeof vi.fn<Gh>>;
  let out: ReturnType<typeof vi.fn<(text: string) => void>>;
  let errors: string[];

  const fakeGh = (threads = THREADS) => {
    gh = vi.fn<Gh>(args => {
      if (args.some(arg => arg.startsWith('query=mutation'))) {
        return JSON.stringify({ data: { resolveReviewThread: {} } });
      }

      return JSON.stringify({
        data: {
          repository: {
            pullRequest: {
              comments: { nodes: COMMENTS },
              reviewThreads: {
                nodes: threads.map(({ comments, ...thread }) => ({
                  ...thread,
                  comments: { nodes: comments },
                })),
              },
            },
          },
        },
      });
    });
  };
  const queries = () => gh.mock.calls.map(([args]) => args);
  const mutations = () =>
    queries().filter(args =>
      args.some(arg => arg.startsWith('query=mutation'))
    );

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

      expect(queries()).toHaveLength(1);
      expect(queries()[0].slice(0, 2)).toEqual(['api', 'graphql']);
      expect(queries()[0]).toEqual(
        expect.arrayContaining(['-F', 'owner=owner', 'name=repo', 'number=5'])
      );
      expect(queries()[0].find(arg => arg.startsWith('query='))).toContain(
        'reviewThreads(first: 100)'
      );
    });

    it('prints the unresolved threads and the comments, each author with its bot flag', () => {
      fakeGh();

      expect(run(['list', '5'], ENV, gh, out)).toBe(0);
      expect(JSON.parse(out.mock.calls[0][0])).toEqual({
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
      expect(JSON.parse(out.mock.calls[0][0]).threads).toEqual([]);
    });
  });

  describe('resolve', () => {
    it('resolves a thread of the PR and says so', () => {
      fakeGh();

      expect(run(['resolve', '5', 'PRRT_1'], ENV, gh, out)).toBe(0);
      expect(mutations()).toHaveLength(1);
      expect(mutations()[0]).toEqual(
        expect.arrayContaining(['-F', 'id=PRRT_1'])
      );
      expect(mutations()[0].find(arg => arg.startsWith('query='))).toContain(
        'resolveReviewThread'
      );
      expect(out).toHaveBeenCalledWith('Resolved PRRT_1 on #5.');
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
