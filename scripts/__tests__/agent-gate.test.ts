import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { type Gh, run } from '../agent-gate.mts';

const ENV = { GH_REPO: 'owner/repo' };

type World = {
  // issue number -> its "blocked by" issues
  blockers?: Record<number, { number: number; state: string }[]>;
  // PR number -> the issues it closes
  closes?: Record<number, number[]>;
  openPrs?: { closingIssuesReferences: { number: number }[]; number: number }[];
};

describe('run', () => {
  let gh: ReturnType<typeof vi.fn<Gh>>;
  let write: ReturnType<typeof vi.fn<(line: string) => void>>;

  const fakeGh = ({ blockers = {}, closes = {}, openPrs = [] }: World) => {
    gh = vi.fn<Gh>(args => {
      if (args[0] === 'api') {
        const issue = Number(/issues\/(\d+)\//.exec(args[1])?.[1]);

        return JSON.stringify(blockers[issue] ?? []);
      }

      if (args[0] === 'pr' && args[1] === 'list') {
        return JSON.stringify(openPrs);
      }

      if (args[0] === 'pr' && args[1] === 'view') {
        return JSON.stringify({
          closingIssuesReferences: (closes[Number(args[2])] ?? []).map(
            number => ({ number })
          ),
        });
      }

      return '';
    });
  };

  const posted = () =>
    gh.mock.calls.filter(([args]) => args[0] === 'issue' && args[1] !== 'edit');
  const edited = () =>
    gh.mock.calls.filter(([args]) => args[0] === 'issue' && args[1] === 'edit');

  beforeEach(() => {
    write = vi.fn();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('usage', () => {
    it.each([
      [[], ENV],
      [['plan'], ENV],
      [['deploy', '5'], ENV],
      [['plan', '0'], ENV],
      [['plan', '5x'], ENV],
      [['plan', '5'], {}],
      [['plan', '5'], { GH_REPO: 'no-slash' }],
    ])('rejects %j with env %j', (args, env) => {
      fakeGh({});

      expect(run(args, env, gh, write)).toBe(1);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Usage')
      );
      expect(gh).not.toHaveBeenCalled();
      expect(write).not.toHaveBeenCalled();
    });
  });

  describe('plan', () => {
    it('goes ahead with no open PR and no blockers', () => {
      fakeGh({
        blockers: { 5: [{ number: 2, state: 'closed' }] },
        openPrs: [{ closingIssuesReferences: [{ number: 9 }], number: 40 }],
      });

      expect(run(['plan', '5'], ENV, gh, write)).toBe(0);
      expect(write).toHaveBeenCalledWith('go=true');
      expect(posted()).toHaveLength(0);
      expect(edited()).toHaveLength(0);
    });

    it('asks for the open PRs and the blockers of the issue', () => {
      fakeGh({});
      run(['plan', '5'], ENV, gh, write);

      expect(gh).toHaveBeenCalledWith([
        'pr',
        'list',
        '--state',
        'open',
        '--limit',
        '200',
        '--json',
        'number,closingIssuesReferences',
      ]);
      expect(gh).toHaveBeenCalledWith([
        'api',
        'repos/owner/repo/issues/5/dependencies/blocked_by',
      ]);
    });

    it('stops when an open PR already closes the issue', () => {
      fakeGh({
        openPrs: [
          { closingIssuesReferences: [{ number: 5 }], number: 41 },
          { closingIssuesReferences: [{ number: 9 }], number: 42 },
        ],
      });

      expect(run(['plan', '5'], ENV, gh, write)).toBe(0);
      expect(write).toHaveBeenCalledWith('go=false');

      const [args, input] = posted()[0];

      expect(args).toEqual(['issue', 'comment', '5', '--body-file', '-']);
      expect(input).toContain('Not planned yet:');
      expect(input).toContain('PR #41 is already open for this issue.');
      expect(input).not.toContain('#42');
      expect(input).toContain('`status: blocked`');
    });

    it('stops while an issue it is blocked by is open, and hands the Spec back', () => {
      fakeGh({
        blockers: {
          5: [
            { number: 2, state: 'open' },
            { number: 3, state: 'closed' },
            { number: 4, state: 'open' },
          ],
        },
      });
      run(['plan', '5'], ENV, gh, write);

      expect(write).toHaveBeenCalledWith('go=false');
      expect(posted()[0][1]).toContain('It is blocked by #2, #4, still open.');
      expect(edited()[0][0]).toEqual([
        'issue',
        'edit',
        '5',
        '--remove-label',
        'status: ready-for-agent',
        '--add-label',
        'status: blocked',
      ]);
    });

    it('gives both reasons when both apply', () => {
      fakeGh({
        blockers: { 5: [{ number: 2, state: 'open' }] },
        openPrs: [{ closingIssuesReferences: [{ number: 5 }], number: 41 }],
      });
      run(['plan', '5'], ENV, gh, write);

      const input = posted()[0][1] as string;

      expect(input).toContain('- PR #41');
      expect(input).toContain('- It is blocked by #2');
    });
  });

  describe('build', () => {
    it('goes ahead when the Spec it closes has no open blocker', () => {
      fakeGh({
        blockers: { 7: [{ number: 2, state: 'closed' }] },
        closes: { 50: [7] },
      });

      expect(run(['build', '50'], ENV, gh, write)).toBe(0);
      expect(write).toHaveBeenCalledWith('go=true');
      expect(posted()).toHaveLength(0);
    });

    it('goes ahead when the PR closes no issue', () => {
      fakeGh({ closes: { 50: [] } });
      run(['build', '50'], ENV, gh, write);

      expect(write).toHaveBeenCalledWith('go=true');
    });

    it('stops while a Spec the PR closes is blocked, naming each blocker once', () => {
      fakeGh({
        blockers: {
          7: [{ number: 2, state: 'open' }],
          8: [
            { number: 2, state: 'open' },
            { number: 3, state: 'open' },
          ],
        },
        closes: { 50: [7, 8] },
      });
      run(['build', '50'], ENV, gh, write);

      expect(write).toHaveBeenCalledWith('go=false');

      const [args, input] = posted()[0];

      expect(args).toEqual(['issue', 'comment', '50', '--body-file', '-']);
      expect(input).toContain('Not built yet:');
      expect(input).toContain(
        'The Spec this PR closes is blocked by #2, #3, still open.'
      );
      expect(input).toContain('Approve the plan again');
      expect(edited()).toHaveLength(0);
    });
  });
});
