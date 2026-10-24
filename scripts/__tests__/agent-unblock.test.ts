import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { type Gh, run } from '../agent-unblock.mts';

const ENV = { GH_OWNER: 'tech-lead', GH_REPO: 'owner/repo' };

type World = {
  // issue number -> the issues it is "blocked by"
  blockedBy?: Record<number, { number: number; state: string }[]>;
  // the issues the closed one blocks
  blocking?: { labels: string[]; number: number; state?: string }[];
  openPrs?: { closingIssuesReferences: { number: number }[]; number: number }[];
};

describe('run', () => {
  let gh: ReturnType<typeof vi.fn<Gh>>;

  const fakeGh = ({ blockedBy = {}, blocking = [], openPrs = [] }: World) => {
    gh = vi.fn<Gh>(args => {
      if (args[0] === 'api') {
        const [, issue, kind] =
          /issues\/(\d+)\/dependencies\/(\w+)/.exec(args[1]) ?? [];

        return JSON.stringify(
          kind === 'blocking'
            ? blocking.map(({ labels, number, state }) => ({
                labels: labels.map(name => ({ name })),
                number,
                state: state ?? 'open',
              }))
            : (blockedBy[Number(issue)] ?? [])
        );
      }

      return args[0] === 'pr' ? JSON.stringify(openPrs) : '';
    });
  };

  const comments = () =>
    gh.mock.calls.filter(([args]) => args[1] === 'comment');
  const edits = () => gh.mock.calls.filter(([args]) => args[1] === 'edit');

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('usage', () => {
    it.each([
      [[], ENV],
      [['0'], ENV],
      [['5x'], ENV],
      [['5'], { GH_OWNER: 'tech-lead' }],
      [['5'], { GH_OWNER: 'tech-lead', GH_REPO: 'no-slash' }],
      [['5'], { GH_REPO: 'owner/repo' }],
      [['5'], { GH_OWNER: '-bad', GH_REPO: 'owner/repo' }],
    ])('rejects %j with env %j', (args, env) => {
      fakeGh({});

      expect(run(args, env, gh)).toBe(1);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Usage')
      );
      expect(gh).not.toHaveBeenCalled();
    });
  });

  it('asks what the closed issue was blocking', () => {
    fakeGh({});
    run(['5'], ENV, gh);

    expect(gh).toHaveBeenCalledWith([
      'api',
      'repos/owner/repo/issues/5/dependencies/blocking',
    ]);
  });

  it('does nothing when it was blocking nothing open', () => {
    fakeGh({
      blocking: [{ labels: ['status: blocked'], number: 8, state: 'closed' }],
    });

    expect(run(['5'], ENV, gh)).toBe(0);
    expect(console.log).toHaveBeenCalledWith(
      '#5 was not blocking an open issue.'
    );
    expect(comments()).toHaveLength(0);
    expect(edits()).toHaveLength(0);
    expect(gh).toHaveBeenCalledTimes(1);
  });

  it('comments, mentions the owner and swaps the label of a blocked issue', () => {
    fakeGh({
      blocking: [{ labels: ['type: spec', 'status: blocked'], number: 8 }],
    });

    expect(run(['5'], ENV, gh)).toBe(0);

    const [args, body] = comments()[0];

    expect(args).toEqual(['issue', 'comment', '8', '--body-file', '-']);
    expect(body).toContain('#5 is closed');
    expect(body).toContain('`status: ready-for-dev`');
    expect(body).toContain('@tech-lead: set `status: ready-for-agent`');
    expect(edits()[0][0]).toEqual([
      'issue',
      'edit',
      '8',
      '--remove-label',
      'status: blocked',
      '--add-label',
      'status: ready-for-dev',
    ]);
  });

  it('leaves an issue alone while another blocker is open', () => {
    fakeGh({
      blockedBy: {
        8: [
          { number: 5, state: 'closed' },
          { number: 6, state: 'open' },
        ],
      },
      blocking: [{ labels: ['status: blocked'], number: 8 }],
      openPrs: [{ closingIssuesReferences: [{ number: 8 }], number: 40 }],
    });
    run(['5'], ENV, gh);

    expect(console.log).toHaveBeenCalledWith('#8 is still blocked by #6.');
    expect(comments()).toHaveLength(0);
    expect(edits()).toHaveLength(0);
  });

  it('treats closed blockers as gone', () => {
    fakeGh({
      blockedBy: { 8: [{ number: 5, state: 'closed' }] },
      blocking: [{ labels: ['status: blocked'], number: 8 }],
    });
    run(['5'], ENV, gh);

    expect(comments()).toHaveLength(1);
  });

  it('does nothing to an issue that is not blocked and has no open PR', () => {
    fakeGh({
      blocking: [{ labels: ['status: ready-for-agent'], number: 8 }],
      openPrs: [{ closingIssuesReferences: [{ number: 9 }], number: 40 }],
    });
    run(['5'], ENV, gh);

    expect(comments()).toHaveLength(0);
    expect(edits()).toHaveLength(0);
  });

  it('tells an open plan PR that closes the issue, and only that one', () => {
    fakeGh({
      blocking: [{ labels: ['status: ready-for-agent'], number: 8 }],
      openPrs: [
        { closingIssuesReferences: [{ number: 8 }], number: 41 },
        { closingIssuesReferences: [{ number: 9 }], number: 42 },
      ],
    });
    run(['5'], ENV, gh);

    expect(comments()).toHaveLength(1);

    const [args, body] = comments()[0];

    expect(args).toEqual(['issue', 'comment', '41', '--body-file', '-']);
    expect(body).toContain('the Spec this PR closes (#8) is no longer blocked');
    expect(body).toContain('@tech-lead: approve the plan again');
    expect(edits()).toHaveLength(0);
  });

  it('handles a blocked issue that also has a PR, and several issues', () => {
    fakeGh({
      blocking: [
        { labels: ['status: blocked'], number: 8 },
        { labels: [], number: 9 },
      ],
      openPrs: [{ closingIssuesReferences: [{ number: 8 }], number: 41 }],
    });
    run(['5'], ENV, gh);

    expect(comments().map(([args]) => args[2])).toEqual(['8', '41']);
    expect(edits()).toHaveLength(1);
  });

  it('copes with an issue the API returns without labels', () => {
    gh = vi.fn<Gh>(args =>
      args[0] === 'api'
        ? args[1].endsWith('blocking')
          ? JSON.stringify([{ number: 8, state: 'open' }])
          : '[]'
        : '[]'
    );

    expect(run(['5'], ENV, gh)).toBe(0);
    expect(comments()).toHaveLength(0);
  });

  it('links the run at the end of each comment when RUN_URL is an https URL', () => {
    const runUrl = 'https://github.com/owner/repo/actions/runs/7';

    fakeGh({ blocking: [{ labels: ['status: blocked'], number: 8 }] });
    run(['5'], { ...ENV, RUN_URL: runUrl }, gh);

    expect((comments()[0][1] as string).endsWith(`\n\n[Run](${runUrl})`)).toBe(
      true
    );
  });

  it.each(['', 'http://example.com', 'not a url'])(
    'leaves the link out for RUN_URL %j',
    runUrl => {
      fakeGh({ blocking: [{ labels: ['status: blocked'], number: 8 }] });
      run(['5'], { ...ENV, RUN_URL: runUrl }, gh);

      expect(comments()[0][1]).not.toContain('[Run]');
    }
  );
});
