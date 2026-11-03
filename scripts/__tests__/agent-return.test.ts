import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Gh } from '@ks/scripts/types.ts';

import { run } from '@ks/scripts/agent-return.mts';

const ENV = { GH_REPO: 'owner/repo' };
const AGENT = 'status: ready-for-agent';
const DEV = 'status: ready-for-dev';
const BLOCKED = 'status: blocked';

type World = {
  // issue number -> its labels; every issue is on ready-for-agent by default
  issues?: Record<number, string[]>;
  // The open PRs that close issues, for a plan run.
  openPrs?: { closes: number[]; number: number }[];
  // The build run's PR; an open draft plan PR that closes #8 by default.
  pr?: {
    closes?: { number: number; repo?: string }[];
    isDraft?: boolean;
    state?: string;
    title?: string;
  };
};

describe('run', () => {
  let gh: ReturnType<typeof vi.fn<Gh>>;
  let errors: string[];

  const fakeGh = ({ issues = {}, openPrs = [], pr = {} }: World = {}) => {
    gh = vi.fn<Gh>(args => {
      if (args[0] === 'issue' && args[1] === 'view') {
        return JSON.stringify({
          labels: (issues[Number(args[2])] ?? [AGENT]).map(name => ({ name })),
        });
      }

      if (args[0] === 'pr' && args[1] === 'list') {
        return JSON.stringify(
          openPrs.map(({ closes, number }) => ({
            closingIssuesReferences: closes.map(issue => ({ number: issue })),
            number,
          }))
        );
      }

      if (args[0] === 'pr' && args[1] === 'view') {
        return JSON.stringify({
          closingIssuesReferences: (pr.closes ?? [{ number: 8 }]).map(
            ({ number, repo = 'owner/repo' }) => ({
              number,
              repository: {
                name: repo.split('/')[1],
                owner: { login: repo.split('/')[0] },
              },
            })
          ),
          isDraft: pr.isDraft ?? true,
          state: pr.state ?? 'OPEN',
          title: pr.title ?? 'C.501: A chore (plan)',
        });
      }

      return '';
    });
  };

  const edits = () =>
    gh.mock.calls.filter(([args]) => args[1] === 'edit').map(([args]) => args);
  const handedBack = (issue: string) => [
    'issue',
    'edit',
    issue,
    '--remove-label',
    AGENT,
    '--add-label',
    DEV,
  ];

  beforeEach(() => {
    errors = [];
    vi.spyOn(console, 'error').mockImplementation((message: string) => {
      errors.push(message);
    });
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('usage', () => {
    it.each([
      [[], ENV],
      [['plan'], ENV],
      [['fix', '8'], ENV],
      [['plan', '0'], ENV],
      [['plan', '8x'], ENV],
      [['plan', '8'], { GH_REPO: 'no-slash' }],
      [['plan', '8'], {}],
    ])('rejects %j with env %j', (args, env) => {
      fakeGh();

      expect(run(args, env, gh)).toBe(1);
      expect(errors[0]).toMatch(/^Usage/);
      expect(gh).not.toHaveBeenCalled();
    });
  });

  describe('a plan run', () => {
    it('hands the issue back when no open PR closes it', () => {
      fakeGh({ openPrs: [{ closes: [9], number: 20 }] });

      expect(run(['plan', '8'], ENV, gh)).toBe(0);
      expect(edits()).toEqual([handedBack('8')]);
    });

    it('changes nothing when a PR closes it', () => {
      fakeGh({
        openPrs: [
          { closes: [9], number: 20 },
          { closes: [7, 8], number: 21 },
        ],
      });

      expect(run(['plan', '8'], ENV, gh)).toBe(0);
      expect(edits()).toEqual([]);
    });

    it.each([
      ['blocked', [BLOCKED]],
      ['on ready-for-dev already', [DEV]],
      ['without a status label', ['type: chore']],
    ])('changes nothing for an issue %s, and reads no PR', (_what, labels) => {
      fakeGh({ issues: { 8: labels } });

      expect(run(['plan', '8'], ENV, gh)).toBe(0);
      expect(edits()).toEqual([]);
      expect(gh).toHaveBeenCalledTimes(1);
    });
  });

  describe('a build run', () => {
    it('hands back the issue its draft plan PR closes', () => {
      fakeGh();

      expect(run(['build', '20'], ENV, gh)).toBe(0);
      expect(edits()).toEqual([handedBack('8')]);
    });

    it('hands back each of several issues on ready-for-agent', () => {
      fakeGh({
        issues: { 10: [AGENT], 9: [DEV] },
        pr: { closes: [{ number: 8 }, { number: 9 }, { number: 10 }] },
      });

      expect(run(['build', '20'], ENV, gh)).toBe(0);
      expect(edits()).toEqual([handedBack('8'), handedBack('10')]);
    });

    it('ignores an issue in another repository', () => {
      fakeGh({
        pr: {
          closes: [{ number: 8, repo: 'other/repo' }, { number: 9 }],
        },
      });

      expect(run(['build', '20'], ENV, gh)).toBe(0);
      expect(edits()).toEqual([handedBack('9')]);
    });

    it.each([
      ['a ready PR', { isDraft: false }],
      ['a closed PR', { state: 'CLOSED' }],
      ['a merged PR', { state: 'MERGED' }],
      ['a draft that is not a plan PR', { title: 'C.501: A chore' }],
    ])('changes nothing for %s, and reads no issue', (_what, pr) => {
      fakeGh({ pr });

      expect(run(['build', '20'], ENV, gh)).toBe(0);
      expect(edits()).toEqual([]);
      expect(gh).toHaveBeenCalledTimes(1);
    });

    it.each([
      ['blocked', [BLOCKED]],
      ['on ready-for-dev already', [DEV]],
    ])('changes nothing for an issue %s', (_what, labels) => {
      fakeGh({ issues: { 8: labels } });

      expect(run(['build', '20'], ENV, gh)).toBe(0);
      expect(edits()).toEqual([]);
    });

    it('changes nothing when the PR closes no issue', () => {
      fakeGh({ pr: { closes: [] } });

      expect(run(['build', '20'], ENV, gh)).toBe(0);
      expect(edits()).toEqual([]);
    });
  });

  describe('a gh failure', () => {
    it('is caught: the message logged, exit code 1', () => {
      fakeGh();
      gh.mockImplementation(() => {
        throw new Error('HTTP 502');
      });

      expect(run(['plan', '8'], ENV, gh)).toBe(1);
      expect(errors).toEqual(['#8: HTTP 502']);
    });

    it('is caught when the label edit fails', () => {
      fakeGh();

      const base = gh.getMockImplementation()!;

      gh.mockImplementation((args, input) => {
        if (args[1] === 'edit') {
          throw new Error('HTTP 403');
        }

        return base(args, input);
      });

      expect(run(['build', '20'], ENV, gh)).toBe(1);
      expect(errors).toEqual(['#8: HTTP 403']);
    });

    it('goes on to the next issue after one fails', () => {
      fakeGh({ pr: { closes: [{ number: 8 }, { number: 9 }] } });

      const base = gh.getMockImplementation()!;

      gh.mockImplementation((args, input) => {
        if (args[1] === 'edit' && args[2] === '8') {
          throw new Error('HTTP 403');
        }

        return base(args, input);
      });

      expect(run(['build', '20'], ENV, gh)).toBe(1);
      expect(errors).toEqual(['#8: HTTP 403']);
      expect(edits()).toEqual([handedBack('8'), handedBack('9')]);
    });
  });
});
