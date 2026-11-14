import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Gh } from '@ks/scripts/types.ts';

import { run } from '@ks/scripts/agent-unblock.mts';

const ENV = { GH_OWNER: 'tech-lead', GH_REPO: 'owner/repo' };
const OUTPUT = '/runner/github-output';

type World = {
  // issue number -> the issues it is "blocked by"
  blockedBy?: Record<number, { number: number; state: string }[]>;
  // the issues the closed one blocks
  blocking?: {
    author_association?: string;
    body?: string;
    labels: string[];
    login?: string;
    number: number;
    state?: string;
  }[];
  // the merged PRs and the paths of each, by PR number
  mergedPrs?: {
    closingIssuesReferences: { number: number }[];
    number: number;
  }[];
  openPrs?: { closingIssuesReferences: { number: number }[]; number: number }[];
  prFiles?: Record<number, string[]>;
};

describe('run', () => {
  let append: ReturnType<typeof vi.fn<(file: string, text: string) => void>>;
  let gh: ReturnType<typeof vi.fn<Gh>>;

  const fakeGh = ({
    blockedBy = {},
    blocking = [],
    mergedPrs = [],
    openPrs = [],
    prFiles = {},
  }: World) => {
    gh = vi.fn<Gh>(args => {
      if (args[0] === 'api') {
        const files = /pulls\/(\d+)\/files/.exec(args[1]);

        if (files) {
          return (prFiles[Number(files[1])] ?? []).join('\n');
        }

        const [, issue, kind] =
          /issues\/(\d+)\/dependencies\/(\w+)/.exec(args[1]) ?? [];

        return JSON.stringify(
          kind === 'blocking'
            ? blocking.map(
                ({
                  author_association,
                  body,
                  labels,
                  login,
                  number,
                  state,
                }) => ({
                  author_association,
                  body,
                  labels: labels.map(name => ({ name })),
                  number,
                  state: state ?? 'open',
                  user: login === undefined ? undefined : { login },
                })
              )
            : (blockedBy[Number(issue)] ?? [])
        );
      }

      if (args[0] === 'pr') {
        return JSON.stringify(args.includes('merged') ? mergedPrs : openPrs);
      }

      return '';
    });
  };

  const comments = () =>
    gh.mock.calls.filter(([args]) => args[1] === 'comment');
  const edits = () => gh.mock.calls.filter(([args]) => args[1] === 'edit');
  const prReads = () =>
    gh.mock.calls.filter(
      ([args]) => args.includes('merged') || args[1]?.includes('/pulls/')
    );

  // The list claude-unblock.yml reads, from what the run appended to GITHUB_OUTPUT.
  const unblocked = () =>
    JSON.parse(
      (append.mock.calls[0][1] as string).replace(/^unblocked=/, '').trim()
    );

  beforeEach(() => {
    append = vi.fn();
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
      [['5'], { ...ENV, KINSCAPE_BOT_LOGIN: 'not a login' }],
      [['5'], { ...ENV, KINSCAPE_BOT_LOGIN: '[bot]' }],
      [['5'], { ...ENV, KINSCAPE_BOT_LOGIN: 'bot[bot' }],
    ])('rejects %j with env %j', (args, env) => {
      fakeGh({});

      expect(run(args, env, gh, append)).toBe(1);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Usage')
      );
      expect(gh).not.toHaveBeenCalled();
    });
  });

  it('asks what the closed issue was blocking', () => {
    fakeGh({});
    run(['5'], ENV, gh, append);

    expect(gh).toHaveBeenCalledWith([
      'api',
      'repos/owner/repo/issues/5/dependencies/blocking',
    ]);
  });

  it('does nothing when it was blocking nothing open', () => {
    fakeGh({
      blocking: [{ labels: ['status: blocked'], number: 8, state: 'closed' }],
    });

    expect(run(['5'], ENV, gh, append)).toBe(0);
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

    expect(run(['5'], ENV, gh, append)).toBe(0);

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
    run(['5'], ENV, gh, append);

    expect(console.log).toHaveBeenCalledWith('#8 is still blocked by #6.');
    expect(comments()).toHaveLength(0);
    expect(edits()).toHaveLength(0);
  });

  it('treats closed blockers as gone', () => {
    fakeGh({
      blockedBy: { 8: [{ number: 5, state: 'closed' }] },
      blocking: [{ labels: ['status: blocked'], number: 8 }],
    });
    run(['5'], ENV, gh, append);

    expect(comments()).toHaveLength(1);
  });

  it('does nothing to an issue that is not blocked and has no open PR', () => {
    fakeGh({
      blocking: [{ labels: ['status: ready-for-agent'], number: 8 }],
      openPrs: [{ closingIssuesReferences: [{ number: 9 }], number: 40 }],
    });
    run(['5'], ENV, gh, append);

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
    run(['5'], ENV, gh, append);

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
    run(['5'], ENV, gh, append);

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

    expect(run(['5'], ENV, gh, append)).toBe(0);
    expect(comments()).toHaveLength(0);
  });

  it('links the run at the end of each comment when RUN_URL is an https URL', () => {
    const runUrl = 'https://github.com/owner/repo/actions/runs/7';

    fakeGh({ blocking: [{ labels: ['status: blocked'], number: 8 }] });
    run(['5'], { ...ENV, RUN_URL: runUrl }, gh, append);

    expect((comments()[0][1] as string).endsWith(`\n\n[Run](${runUrl})`)).toBe(
      true
    );
  });

  it.each(['', 'http://example.com', 'not a url'])(
    'leaves the link out for RUN_URL %j',
    runUrl => {
      fakeGh({ blocking: [{ labels: ['status: blocked'], number: 8 }] });
      run(['5'], { ...ENV, RUN_URL: runUrl }, gh, append);

      expect(comments()[0][1]).not.toContain('[Run]');
    }
  );

  // claude-unblock.yml refreshes each listed issue against main (.github/agent/refresh.md).
  describe('the list for the refresh', () => {
    const WITH_OUTPUT = { ...ENV, GITHUB_OUTPUT: OUTPUT };
    const BLOCKED = ['type: spec', 'status: blocked'];

    it('names each issue it unblocked and every issue that blocked it, as one line', () => {
      fakeGh({
        blockedBy: {
          8: [
            { number: 5, state: 'closed' },
            { number: 3, state: 'closed' },
          ],
        },
        blocking: [{ author_association: 'OWNER', labels: BLOCKED, number: 8 }],
      });

      expect(run(['5'], WITH_OUTPUT, gh, append)).toBe(0);
      expect(append).toHaveBeenCalledTimes(1);
      expect(append).toHaveBeenCalledWith(
        OUTPUT,
        'unblocked=[{"blockers":[5,3],"number":8}]\n'
      );
    });

    it('names the closed issue even when the API leaves it out of the blockers', () => {
      fakeGh({
        blocking: [
          { author_association: 'MEMBER', labels: BLOCKED, number: 8 },
        ],
      });
      run(['5'], WITH_OUTPUT, gh, append);

      expect(unblocked()).toEqual([{ blockers: [5], number: 8 }]);
    });

    it.each(['OWNER', 'MEMBER', 'COLLABORATOR'])(
      'includes an issue by a %s',
      author_association => {
        fakeGh({
          blocking: [{ author_association, labels: BLOCKED, number: 8 }],
        });
        run(['5'], WITH_OUTPUT, gh, append);

        expect(unblocked()).toHaveLength(1);
      }
    );

    // The swap and the comment still happen: only the refresh, which reads the body, is left out.
    it.each(['CONTRIBUTOR', 'FIRST_TIME_CONTRIBUTOR', 'NONE', undefined])(
      'swaps the label of an issue by %s but leaves it out',
      author_association => {
        fakeGh({
          blocking: [{ author_association, labels: BLOCKED, number: 8 }],
        });
        run(['5'], WITH_OUTPUT, gh, append);

        expect(edits()).toHaveLength(1);
        expect(unblocked()).toEqual([]);
      }
    );

    describe('an issue filed by the bot App', () => {
      const BOT = 'kinscape-agent[bot]';
      const WITH_BOT = { ...WITH_OUTPUT, KINSCAPE_BOT_LOGIN: BOT };

      it.each(['CONTRIBUTOR', 'NONE', undefined])(
        'includes an issue by the bot whose association is %s',
        author_association => {
          fakeGh({
            blocking: [
              { author_association, labels: BLOCKED, login: BOT, number: 8 },
            ],
          });

          expect(run(['5'], WITH_BOT, gh, append)).toBe(0);
          expect(unblocked()).toEqual([{ blockers: [5], number: 8 }]);
        }
      );

      it('leaves out an issue by another CONTRIBUTOR, and by a login that only starts like the bot', () => {
        fakeGh({
          blocking: [
            {
              author_association: 'CONTRIBUTOR',
              labels: BLOCKED,
              login: 'someone',
              number: 8,
            },
            {
              author_association: 'CONTRIBUTOR',
              labels: BLOCKED,
              login: `${BOT}-2`,
              number: 9,
            },
          ],
        });
        run(['5'], WITH_BOT, gh, append);

        expect(edits()).toHaveLength(2);
        expect(unblocked()).toEqual([]);
      });

      it.each([undefined, ''])(
        'trusts no bot when KINSCAPE_BOT_LOGIN is %j',
        KINSCAPE_BOT_LOGIN => {
          fakeGh({
            blocking: [
              {
                author_association: 'CONTRIBUTOR',
                labels: BLOCKED,
                login: BOT,
                number: 8,
              },
              { author_association: 'NONE', labels: BLOCKED, number: 9 },
            ],
          });

          expect(
            run(['5'], { ...WITH_OUTPUT, KINSCAPE_BOT_LOGIN }, gh, append)
          ).toBe(0);
          expect(edits()).toHaveLength(2);
          expect(unblocked()).toEqual([]);
        }
      );
    });

    it('leaves out an issue that is still blocked, or not labelled blocked', () => {
      fakeGh({
        blockedBy: { 8: [{ number: 6, state: 'open' }] },
        blocking: [
          { author_association: 'OWNER', labels: BLOCKED, number: 8 },
          {
            author_association: 'OWNER',
            labels: ['status: ready-for-agent'],
            number: 9,
          },
        ],
      });
      run(['5'], WITH_OUTPUT, gh, append);

      expect(unblocked()).toEqual([]);
    });

    it('writes an empty list when the closed issue was blocking nothing open', () => {
      fakeGh({});
      run(['5'], WITH_OUTPUT, gh, append);

      expect(append).toHaveBeenCalledWith(OUTPUT, 'unblocked=[]\n');
    });

    it('writes nothing without GITHUB_OUTPUT, and nothing for a bad usage', () => {
      fakeGh({
        blocking: [{ author_association: 'OWNER', labels: BLOCKED, number: 8 }],
      });
      run(['5'], ENV, gh, append);
      run(['x'], WITH_OUTPUT, gh, append);

      expect(append).not.toHaveBeenCalled();
    });

    it('goes on to the next issue when one fails, lists the rest and exits 1', () => {
      fakeGh({
        blocking: [
          { author_association: 'OWNER', labels: BLOCKED, number: 8 },
          { author_association: 'OWNER', labels: BLOCKED, number: 9 },
        ],
      });

      const working = gh.getMockImplementation() as Gh;

      gh.mockImplementation((args, input) => {
        if (args[1] === 'edit' && args[2] === '8') {
          throw new Error('HTTP 502');
        }

        return working(args, input);
      });

      expect(run(['5'], WITH_OUTPUT, gh, append)).toBe(1);
      expect(console.error).toHaveBeenCalledWith('#8: HTTP 502');
      expect(unblocked()).toEqual([{ blockers: [5], number: 9 }]);
      expect(comments().map(([args]) => args[2])).toEqual(['8', '9']);
    });
  });
  // A Spec that a design change frees gets `status: draft`, so the owner sizes it again.
  describe('a Spec freed by a design change', () => {
    const WITH_OUTPUT = { ...ENV, GITHUB_OUTPUT: OUTPUT };
    const BLOCKED = ['type: spec', 'status: blocked'];
    const intent = (value: string) =>
      `### Intent or milestone\n\n${value}\n\n### Requirement IDs covered\n\nMAP-01`;
    const DESIGN = {
      mergedPrs: [{ closingIssuesReferences: [{ number: 5 }], number: 60 }],
      prFiles: { 60: ['app/page.tsx', 'design/canvas/project/board.jsx'] },
    };

    it('swaps the label for draft, names the blocker and gives the refine command', () => {
      fakeGh({
        ...DESIGN,
        blocking: [
          {
            author_association: 'OWNER',
            body: intent('#12'),
            labels: BLOCKED,
            number: 8,
          },
        ],
      });

      expect(run(['5'], WITH_OUTPUT, gh, append)).toBe(0);

      const [args, body] = comments()[0];

      expect(args).toEqual(['issue', 'comment', '8', '--body-file', '-']);
      expect(body).toContain('#5 is closed');
      expect(body).toContain('#5 changed the design');
      expect(body).toContain('a new size and a new check');
      expect(body).toContain('`status: draft`');
      expect(body).not.toContain('ready-for-dev');
      expect(body).toContain('@tech-lead: run `/refine spec 12`');
      expect(edits()[0][0]).toEqual([
        'issue',
        'edit',
        '8',
        '--remove-label',
        'status: blocked',
        '--add-label',
        'status: draft',
      ]);
      expect(unblocked()).toEqual([{ blockers: [5], number: 8 }]);
    });

    it('reads the merged PRs once and each PR file list with --paginate', () => {
      fakeGh({
        ...DESIGN,
        blocking: [
          { labels: BLOCKED, number: 8 },
          { labels: BLOCKED, number: 9 },
        ],
      });
      run(['5'], ENV, gh, append);

      expect(prReads().map(([args]) => args)).toEqual([
        [
          'pr',
          'list',
          '--state',
          'merged',
          '--limit',
          '1000',
          '--json',
          'number,closingIssuesReferences',
        ],
        [
          'api',
          'repos/owner/repo/pulls/60/files',
          '--paginate',
          '--jq',
          '.[].filename',
        ],
        [
          'api',
          'repos/owner/repo/pulls/60/files',
          '--paginate',
          '--jq',
          '.[].filename',
        ],
      ]);
    });

    it('goes to draft when the design blocker closed first and another closes last', () => {
      fakeGh({
        ...DESIGN,
        blockedBy: {
          8: [
            { number: 5, state: 'closed' },
            { number: 6, state: 'closed' },
          ],
        },
        blocking: [{ author_association: 'OWNER', labels: BLOCKED, number: 8 }],
      });
      run(['6'], WITH_OUTPUT, gh, append);

      const [, body] = comments()[0];

      expect(body).toContain('#6 is closed');
      expect(body).toContain('#5 changed the design');
      expect(body).not.toContain('#6 changed');
      expect(edits()[0][0].at(-1)).toBe('status: draft');
      expect(unblocked()).toEqual([{ blockers: [6, 5], number: 8 }]);
    });

    it('names each design blocker', () => {
      fakeGh({
        blockedBy: {
          8: [
            { number: 5, state: 'closed' },
            { number: 6, state: 'closed' },
          ],
        },
        blocking: [{ labels: BLOCKED, number: 8 }],
        mergedPrs: [
          { closingIssuesReferences: [{ number: 5 }], number: 60 },
          { closingIssuesReferences: [{ number: 6 }], number: 61 },
        ],
        prFiles: { 60: ['design/canvas/a'], 61: ['design/canvas/b'] },
      });
      run(['6'], ENV, gh, append);

      expect(comments()[0][1]).toContain('#5, #6 changed the design');
    });

    it('checks every merged PR that closes a blocker', () => {
      fakeGh({
        blocking: [{ labels: BLOCKED, number: 8 }],
        mergedPrs: [
          { closingIssuesReferences: [{ number: 5 }], number: 60 },
          { closingIssuesReferences: [{ number: 5 }], number: 61 },
        ],
        prFiles: { 60: ['app/page.tsx'], 61: ['design/canvas/a'] },
      });
      run(['5'], ENV, gh, append);

      expect(edits()[0][0].at(-1)).toBe('status: draft');
    });

    it.each([
      ['#12', '/refine spec 12'],
      ['M0', '/refine spec M0'],
      ['M2', '/refine spec M2'],
    ])('reads the Intent box %j', (value, command) => {
      fakeGh({
        ...DESIGN,
        blocking: [{ body: intent(value), labels: BLOCKED, number: 8 }],
      });
      run(['5'], ENV, gh, append);

      expect(comments()[0][1]).toContain(`run \`${command}\`.`);
    });

    it.each([
      ['no body', undefined],
      ['no box', 'Some text'],
      ['an empty box', intent('')],
      ['a link', intent('https://example.com/issues/12')],
      ['text after the number', intent('#12 and more')],
      ['a number with no #', intent('12')],
      ['code in backticks', intent('`rm -rf /`')],
      ['a milestone with text', intent('M0; echo')],
    ])('names plain /refine spec for %s', (_, body) => {
      fakeGh({ ...DESIGN, blocking: [{ body, labels: BLOCKED, number: 8 }] });
      run(['5'], ENV, gh, append);

      expect(comments()[0][1]).toContain(
        'run `/refine spec` with the Intent or milestone of this Spec.'
      );
      expect(comments()[0][1]).not.toContain('/refine spec 12');
    });

    it.each([
      [
        'a merged PR that changed no path under design/canvas/',
        {
          mergedPrs: [{ closingIssuesReferences: [{ number: 5 }], number: 60 }],
          prFiles: { 60: ['design/DESIGN.md', 'design/canvas-notes/a.md'] },
        },
      ],
      [
        'a merged PR with no files',
        {
          mergedPrs: [{ closingIssuesReferences: [{ number: 5 }], number: 60 }],
        },
      ],
      [
        'no merged PR',
        {
          mergedPrs: [{ closingIssuesReferences: [{ number: 9 }], number: 61 }],
          prFiles: { 61: ['design/canvas/a'] },
        },
      ],
    ])('goes to ready-for-dev for %s', (_, world) => {
      fakeGh({ ...world, blocking: [{ labels: BLOCKED, number: 8 }] });
      run(['5'], ENV, gh, append);

      expect(comments()[0][1]).toContain('`status: ready-for-dev`');
      expect(comments()[0][1]).toContain(
        '@tech-lead: set `status: ready-for-agent`'
      );
      expect(edits()[0][0].at(-1)).toBe('status: ready-for-dev');
    });

    it.each(['type: bug', 'type: chore'])(
      'sends a freed %s to ready-for-dev and reads no PR',
      type => {
        fakeGh({
          ...DESIGN,
          blocking: [{ labels: [type, 'status: blocked'], number: 8 }],
        });
        run(['5'], ENV, gh, append);

        expect(edits()[0][0].at(-1)).toBe('status: ready-for-dev');
        expect(prReads()).toHaveLength(0);
      }
    );

    it('reads no PR for an issue that is not blocked', () => {
      fakeGh({
        ...DESIGN,
        blocking: [{ labels: ['type: spec', 'status: draft'], number: 8 }],
      });
      run(['5'], ENV, gh, append);

      expect(prReads()).toHaveLength(0);
      expect(edits()).toHaveLength(0);
    });

    it('leaves the label, sends no comment and exits 1 when the merged PR list fails', () => {
      fakeGh({
        ...DESIGN,
        blocking: [
          { author_association: 'OWNER', labels: BLOCKED, number: 8 },
          { author_association: 'OWNER', labels: BLOCKED, number: 9 },
        ],
      });

      const working = gh.getMockImplementation() as Gh;

      gh.mockImplementation((args, input) => {
        if (args.includes('merged')) {
          throw new Error('HTTP 502');
        }

        return working(args, input);
      });

      expect(run(['5'], WITH_OUTPUT, gh, append)).toBe(1);
      expect(console.error).toHaveBeenCalledWith('#8: HTTP 502');
      expect(console.error).toHaveBeenCalledWith('#9: HTTP 502');
      expect(comments()).toHaveLength(0);
      expect(edits()).toHaveLength(0);
      expect(unblocked()).toEqual([]);
    });

    it('leaves the label and exits 1 when a PR file read fails, and handles the next Spec', () => {
      fakeGh({
        blockedBy: {
          8: [
            { number: 5, state: 'closed' },
            { number: 6, state: 'closed' },
          ],
          9: [{ number: 5, state: 'closed' }],
        },
        blocking: [
          { author_association: 'OWNER', labels: BLOCKED, number: 8 },
          { author_association: 'OWNER', labels: BLOCKED, number: 9 },
        ],
        mergedPrs: [
          { closingIssuesReferences: [{ number: 5 }], number: 60 },
          { closingIssuesReferences: [{ number: 6 }], number: 61 },
        ],
        prFiles: { 60: ['design/canvas/a'] },
      });

      const working = gh.getMockImplementation() as Gh;

      gh.mockImplementation((args, input) => {
        if (args[1]?.includes('/pulls/61/')) {
          throw new Error('HTTP 404');
        }

        return working(args, input);
      });

      expect(run(['5'], WITH_OUTPUT, gh, append)).toBe(1);
      expect(console.error).toHaveBeenCalledWith('#8: HTTP 404');
      expect(comments().map(([args]) => args[2])).toEqual(['9']);
      expect(edits().map(([args]) => args[2])).toEqual(['9']);
      expect(unblocked()).toEqual([{ blockers: [5], number: 9 }]);
    });
  });
});
