import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { type Gh, run } from '../agent-gate.mts';

const ENV = { GH_REPO: 'owner/repo' };

type World = {
  // issue number -> its "blocked by" issues
  blockers?: Record<number, { number: number; state: string }[]>;
  // PR number -> the issues it closes
  closes?: Record<number, number[]>;
  // The issue or PR as it is now; a plan-ready open issue and an open draft plan PR by default.
  issue?: { labels?: string[]; state?: string };
  openPrs?: { closingIssuesReferences: { number: number }[]; number: number }[];
  pr?: { isDraft?: boolean; state?: string; title?: string };
};

describe('run', () => {
  let gh: ReturnType<typeof vi.fn<Gh>>;
  let write: ReturnType<typeof vi.fn<(line: string) => void>>;

  const fakeGh = ({
    blockers = {},
    closes = {},
    issue = {},
    openPrs = [],
    pr = {},
  }: World) => {
    gh = vi.fn<Gh>(args => {
      if (args[0] === 'api') {
        const number = Number(/issues\/(\d+)\//.exec(args[1])?.[1]);

        return JSON.stringify(blockers[number] ?? []);
      }

      if (args[0] === 'issue' && args[1] === 'view') {
        return JSON.stringify({
          labels: (issue.labels ?? ['status: ready-for-agent']).map(name => ({
            name,
          })),
          state: issue.state ?? 'OPEN',
        });
      }

      if (args[0] === 'pr' && args[1] === 'list') {
        return JSON.stringify(openPrs);
      }

      if (args[0] === 'pr' && args[1] === 'view') {
        return args.includes('state,isDraft,title')
          ? JSON.stringify({
              isDraft: pr.isDraft ?? true,
              state: pr.state ?? 'OPEN',
              title: pr.title ?? 'DM.1: A plan (plan)',
            })
          : JSON.stringify({
              closingIssuesReferences: (closes[Number(args[2])] ?? []).map(
                number => ({ number })
              ),
            });
      }

      return '';
    });
  };

  const posted = () => gh.mock.calls.filter(([args]) => args[1] === 'comment');
  const edited = () =>
    gh.mock.calls.filter(([args]) => args[0] === 'issue' && args[1] === 'edit');

  beforeEach(() => {
    write = vi.fn();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
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

  describe('a stale event', () => {
    const quiet = (args: string[], world: World, reason: string) => {
      fakeGh({
        ...world,
        blockers: { 5: [{ number: 2, state: 'open' }] },
        openPrs: [{ closingIssuesReferences: [{ number: 5 }], number: 41 }],
      });

      expect(run(args, ENV, gh, write)).toBe(0);
      expect(write).toHaveBeenCalledWith('go=false');
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining(`Stopped quietly: ${reason}`)
      );
      // Nothing to tell anyone, and no reason to look further.
      expect(posted()).toHaveLength(0);
      expect(edited()).toHaveLength(0);
      expect(gh.mock.calls.map(([call]) => call[0])).not.toContain('api');
    };

    it('stops a plan quietly when the issue is closed', () => {
      quiet(
        ['plan', '5'],
        { issue: { state: 'CLOSED' } },
        'the issue is closed'
      );
    });

    it('stops a plan quietly when the label is gone', () => {
      quiet(
        ['plan', '5'],
        { issue: { labels: ['type: spec', 'status: blocked'] } },
        'the issue no longer has `status: ready-for-agent`'
      );
    });

    it('stops a build quietly when the PR is not open', () => {
      quiet(['build', '50'], { pr: { state: 'MERGED' } }, 'the PR is not open');
    });

    it.each([
      ['no longer a draft', { isDraft: false }],
      ['no longer a plan title', { title: 'DM.1: A plan' }],
    ])('stops a build quietly when the PR is %s', (_label, pr) => {
      quiet(['build', '50'], { pr }, 'the PR is no longer a draft plan PR');
    });

    it('reads the issue and the PR as they are now', () => {
      fakeGh({});
      run(['plan', '5'], ENV, gh, write);
      run(['build', '50'], ENV, gh, write);

      expect(gh).toHaveBeenCalledWith([
        'issue',
        'view',
        '5',
        '--json',
        'state,labels',
      ]);
      expect(gh).toHaveBeenCalledWith([
        'pr',
        'view',
        '50',
        '--json',
        'state,isDraft,title',
      ]);
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

  describe('the run link', () => {
    const blocked: World = {
      blockers: { 5: [{ number: 2, state: 'open' }] },
    };
    const RUN = 'https://github.com/owner/repo/actions/runs/123';

    it('ends the stop comment with a link to the run', () => {
      fakeGh(blocked);
      run(['plan', '5'], { ...ENV, RUN_URL: RUN }, gh, write);

      expect((posted()[0][1] as string).endsWith(`\n\n[Run](${RUN})`)).toBe(
        true
      );
    });

    it.each([undefined, '', 'not a url', 'http://example.com/run', `${RUN} x`])(
      'leaves the link out for RUN_URL %j',
      runUrl => {
        fakeGh(blocked);
        run(['plan', '5'], { ...ENV, RUN_URL: runUrl }, gh, write);

        expect(posted()[0][1]).not.toContain('[Run]');
      }
    );
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
