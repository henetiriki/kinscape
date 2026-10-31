import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Gh } from '../types.ts';

import { run } from '../issue-status.mts';

const REPO = 'owner/repo';
const PO = 'status: ready-for-po';
const DEV = 'status: ready-for-dev';
const AGENT = 'status: ready-for-agent';
const TRY = '## For the PO\n\nOpen the map and drag the slider.';

type Pr = {
  body: null | string;
  draft: boolean;
  head: { repo: { full_name: string } | null };
  labels: { name: string }[];
  number: number;
  title: string;
};

type Review = { author_association: string; state: string };

type World = {
  closing?: { number: number; repo?: string }[];
  // Throws when the callback returns true for a gh call's arguments.
  fail?: (args: string[]) => boolean;
  files?: { filename: string; previous_filename?: string }[];
  // issue number -> its labels
  issues?: Record<number, string[]>;
};

const pr = (over: Partial<Pr> = {}): Pr => ({
  body: `Closes #8\n\n${TRY}\n`,
  draft: false,
  head: { repo: { full_name: REPO } },
  labels: [],
  number: 7,
  title: 'M1.1: Show the map',
  ...over,
});

const planPr = (over: Partial<Pr> = {}): Pr =>
  pr({ draft: true, title: 'M1.1: Show the map (plan)', ...over });

const event = (action: string, pull: Pr, review?: Review) => ({
  action,
  pull_request: pull,
  review,
});

const approval = (association: string, state = 'approved'): Review => ({
  author_association: association,
  state,
});

const SPEC = ['type: spec', DEV];

describe('run', () => {
  let gh: ReturnType<typeof vi.fn<Gh>>;

  const fakeGh = ({
    closing = [{ number: 8 }],
    fail = () => false,
    files = [{ filename: 'app/page.tsx' }],
    issues = { 8: SPEC },
  }: World = {}) => {
    gh = vi.fn<Gh>(args => {
      if (fail(args)) {
        throw new Error('boom');
      }

      if (args[0] === 'pr') {
        return JSON.stringify({
          closingIssuesReferences: closing.map(({ number, repo = REPO }) => ({
            number,
            repository: {
              name: repo.split('/')[1],
              owner: { login: repo.split('/')[0] },
            },
          })),
        });
      }

      if (args[0] === 'api') {
        return files.map(file => JSON.stringify(file)).join('\n') + '\n';
      }

      if (args[1] === 'view') {
        return JSON.stringify({
          labels: (issues[Number(args[2])] ?? []).map(name => ({ name })),
        });
      }

      return '';
    });
  };

  const exec = (
    name: string,
    payload: ReturnType<typeof event>,
    world: World = {}
  ): number => {
    fakeGh(world);

    return run({ GH_REPO: REPO, GITHUB_EVENT_NAME: name }, payload, gh);
  };

  const edits = () => gh.mock.calls.filter(([args]) => args[1] === 'edit');

  const edited = () => edits().map(([args]) => args);

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('usage', () => {
    it.each(['', 'no-slash', 'a/b/c'])('rejects GH_REPO %j', repo => {
      fakeGh();

      expect(
        run(
          { GH_REPO: repo, GITHUB_EVENT_NAME: 'pull_request' },
          event('opened', planPr()),
          gh
        )
      ).toBe(1);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Usage')
      );
      expect(gh).not.toHaveBeenCalled();
    });

    it('rejects an event with no pull request', () => {
      fakeGh();

      expect(
        run({ GH_REPO: REPO, GITHUB_EVENT_NAME: 'issues' }, { action: 'x' }, gh)
      ).toBe(1);
      expect(gh).not.toHaveBeenCalled();
    });
  });

  describe('the table', () => {
    it('row 1: a plan PR opening moves its issue to ready-for-dev', () => {
      expect(
        exec('pull_request', event('opened', planPr()), {
          issues: { 8: ['type: spec', AGENT] },
        })
      ).toBe(0);
      expect(edited()).toEqual([
        ['issue', 'edit', '8', '--remove-label', AGENT, '--add-label', DEV],
      ]);
    });

    it('row 1: a hand-back plan PR opening does the same', () => {
      exec(
        'pull_request',
        event('opened', planPr({ labels: [{ name: 'hand-back' }] })),
        { issues: { 8: ['type: chore', AGENT] } }
      );

      expect(edited()).toEqual([
        ['issue', 'edit', '8', '--remove-label', AGENT, '--add-label', DEV],
      ]);
    });

    it('row 2: the owner approving a draft plan PR moves it to ready-for-agent', () => {
      exec(
        'pull_request_review',
        event('submitted', planPr(), approval('OWNER'))
      );

      expect(edited()).toEqual([
        ['issue', 'edit', '8', '--remove-label', DEV, '--add-label', AGENT],
      ]);
    });

    it('row 2: a hand-back plan stays on ready-for-dev after approval', () => {
      expect(
        exec(
          'pull_request_review',
          event(
            'submitted',
            planPr({ labels: [{ name: 'hand-back' }] }),
            approval('OWNER')
          )
        )
      ).toBe(0);
      expect(edits()).toHaveLength(0);
      expect(gh).not.toHaveBeenCalled();
    });

    it.each(['MEMBER', 'COLLABORATOR', 'CONTRIBUTOR', 'NONE'])(
      'row 2: an approval from a %s does not approve a plan',
      association => {
        exec(
          'pull_request_review',
          event('submitted', planPr(), approval(association))
        );

        expect(gh).not.toHaveBeenCalled();
      }
    );

    it.each([
      ['pull_request', 'ready_for_review'],
      ['pull_request', 'opened'],
    ])(
      'row 3: a user-visible Spec PR (%s %s) moves to ready-for-po',
      (name, action) => {
        expect(exec(name, event(action, pr()))).toBe(0);
        expect(edited()).toEqual([
          ['issue', 'edit', '8', '--remove-label', DEV, '--add-label', PO],
        ]);
      }
    );

    it('row 3: a user-visible Bug PR moves to ready-for-po', () => {
      exec('pull_request', event('ready_for_review', pr()), {
        issues: { 8: ['type: bug', DEV] },
      });

      expect(edited()[0].slice(-1)).toEqual([PO]);
    });

    it('row 4: a Chore PR moves to ready-for-dev, whatever it changes', () => {
      exec('pull_request', event('ready_for_review', pr()), {
        issues: { 8: ['type: chore', AGENT] },
      });

      expect(edited()).toEqual([
        ['issue', 'edit', '8', '--remove-label', AGENT, '--add-label', DEV],
      ]);
      expect(gh.mock.calls.filter(([args]) => args[0] === 'api')).toHaveLength(
        0
      );
    });

    it('row 4: a Spec PR that changes only invisible files moves to ready-for-dev', () => {
      exec('pull_request', event('ready_for_review', pr()), {
        files: [{ filename: 'docs/a.md' }, { filename: 'scripts/x.mts' }],
        issues: { 8: ['type: spec', AGENT] },
      });

      expect(edited()[0].slice(-1)).toEqual([DEV]);
    });

    it('row 4: a Spec PR with an empty For the PO moves to ready-for-dev, without reading its files', () => {
      exec(
        'pull_request',
        event(
          'ready_for_review',
          pr({
            body: 'Closes #8\n\n## For the PO\n\n<!-- Plain-language: what to try. -->\n',
          })
        ),
        { issues: { 8: ['type: spec', AGENT] } }
      );

      expect(edited()[0].slice(-1)).toEqual([DEV]);
      expect(gh.mock.calls.filter(([args]) => args[0] === 'api')).toHaveLength(
        0
      );
    });

    it.each(['OWNER', 'MEMBER', 'COLLABORATOR'])(
      'row 5: an approval from a %s on a ready PR moves it to ready-for-dev',
      association => {
        exec(
          'pull_request_review',
          event('submitted', pr(), approval(association)),
          { issues: { 8: ['type: spec', PO] } }
        );

        expect(edited()).toEqual([
          ['issue', 'edit', '8', '--remove-label', PO, '--add-label', DEV],
        ]);
      }
    );

    it.each(['CONTRIBUTOR', 'FIRST_TIME_CONTRIBUTOR', 'NONE'])(
      'row 5: an approval from a %s does nothing',
      association => {
        exec(
          'pull_request_review',
          event('submitted', pr(), approval(association))
        );

        expect(gh).not.toHaveBeenCalled();
      }
    );
  });

  describe('events with no row', () => {
    it.each([
      [
        'a review that only comments',
        'pull_request_review',
        'submitted',
        approval('OWNER', 'commented'),
      ],
      [
        'a review that asks for changes',
        'pull_request_review',
        'submitted',
        approval('OWNER', 'changes_requested'),
      ],
      ['an edited review', 'pull_request_review', 'edited', approval('OWNER')],
      ['a synchronize', 'pull_request', 'synchronize', undefined],
      ['a labelled PR', 'pull_request', 'labeled', undefined],
      ['another event', 'issues', 'opened', undefined],
    ])('%s', (_what, name, action, review) => {
      expect(exec(name, event(action, pr(), review))).toBe(0);
      expect(gh).not.toHaveBeenCalled();
    });

    it('a draft that is not a plan opening', () => {
      exec('pull_request', event('opened', pr({ draft: true })));

      expect(gh).not.toHaveBeenCalled();
    });

    it('an approval of a draft that is not a plan', () => {
      exec(
        'pull_request_review',
        event('submitted', pr({ draft: true }), approval('OWNER'))
      );

      expect(gh).not.toHaveBeenCalled();
    });

    it('a ready PR whose title ends in (plan) is a ready PR, not a plan', () => {
      exec('pull_request', event('opened', pr({ title: 'M1.1: x (plan)' })));

      expect(edited()[0].slice(-1)).toEqual([PO]);
    });
  });

  describe('which PRs', () => {
    it.each([
      ['a fork', { repo: { full_name: 'fork/repo' } }],
      ['a deleted fork', { repo: null }],
    ])('skips %s', (_what, head) => {
      expect(exec('pull_request', event('opened', planPr({ head })))).toBe(0);
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('fork'));
      expect(gh).not.toHaveBeenCalled();
    });

    it('does nothing when no issue is closed', () => {
      expect(
        exec('pull_request', event('opened', planPr()), { closing: [] })
      ).toBe(0);
      expect(edits()).toHaveLength(0);
    });

    it('ignores an issue in another repository', () => {
      exec('pull_request', event('opened', planPr()), {
        closing: [
          { number: 8, repo: 'other/repo' },
          { number: 9, repo: 'owner/other' },
        ],
      });

      expect(edits()).toHaveLength(0);
      expect(gh.mock.calls.filter(([args]) => args[1] === 'view')).toHaveLength(
        1
      );
    });
  });

  describe('which issues', () => {
    it('leaves a blocked issue alone', () => {
      exec('pull_request', event('opened', planPr()), {
        issues: { 8: ['type: spec', 'status: blocked'] },
      });

      expect(edits()).toHaveLength(0);
    });

    it('changes nothing when the issue is on its target', () => {
      expect(
        exec('pull_request', event('opened', planPr()), {
          issues: { 8: ['type: spec', DEV] },
        })
      ).toBe(0);
      expect(edits()).toHaveLength(0);
    });

    it.each([[['type: intent']], [['bug']], [[]]])(
      'ignores an issue labelled %j',
      labels => {
        exec('pull_request', event('opened', planPr()), {
          issues: { 8: [...labels, AGENT] },
        });

        expect(edits()).toHaveLength(0);
      }
    );

    it('removes every other status label, and adds the target', () => {
      exec('pull_request', event('opened', planPr()), {
        issues: { 8: ['type: spec', 'status: draft', AGENT] },
      });

      expect(edited()).toEqual([
        [
          'issue',
          'edit',
          '8',
          '--remove-label',
          'status: draft',
          '--remove-label',
          AGENT,
          '--add-label',
          DEV,
        ],
      ]);
    });

    it('only adds the target when there is no status label', () => {
      exec('pull_request', event('opened', planPr()), {
        issues: { 8: ['type: spec'] },
      });

      expect(edited()).toEqual([['issue', 'edit', '8', '--add-label', DEV]]);
    });

    it('moves each of several issues by its own type', () => {
      exec('pull_request', event('ready_for_review', pr()), {
        closing: [{ number: 8 }, { number: 9 }],
        issues: { 8: ['type: spec', AGENT], 9: ['type: chore', AGENT] },
      });

      expect(edited().map(args => [args[2], args.at(-1)])).toEqual([
        ['8', PO],
        ['9', DEV],
      ]);
    });
  });

  describe('user-visible', () => {
    const labelOf = (
      body: string,
      files: { filename: string; previous_filename?: string }[] = [
        { filename: 'app/page.tsx' },
      ]
    ) => {
      exec('pull_request', event('ready_for_review', pr({ body })), {
        files,
        issues: { 8: ['type: spec', AGENT] },
      });

      return edited()[0].at(-1);
    };

    it.each([
      ['no body', null],
      ['no For the PO heading', 'Closes #8\n\nTry it.'],
      ['an empty section', 'Closes #8\n\n## For the PO\n'],
      [
        'only a comment',
        'Closes #8\n\n## For the PO\n\n<!--\nmany\nlines\n-->\n\n## Next\n\nText',
      ],
      [
        'text only under a later heading',
        'Closes #8\n\n## For the PO\n\n## Evidence\n\nOutput.',
      ],
      [
        'a comment nested to leave an opener after one pass',
        'Closes #8\n\n## For the PO\n\n<!<!-- x -->-->\n',
      ],
      [
        'an unterminated comment',
        'Closes #8\n\n## For the PO\n\n<!-- what to try',
      ],
      [
        'a heading hidden in a comment',
        'Closes #8\n\n<!--\n## For the PO\n\nTry\n-->',
      ],
    ])('is not, with %s', (_what, body) => {
      expect(labelOf(body as string)).toBe(DEV);
    });

    it.each([
      [
        'text under the heading',
        'Closes #8\n\n## For the PO\n\nTry the slider.',
      ],
      [
        'text after a comment',
        'Closes #8\n\n## For the PO\n\n<!-- hint -->\nTry it\n\n## Next',
      ],
      [
        'Windows line endings',
        'Closes #8\r\n\r\n## For the PO\r\n\r\nTry it.\r\n',
      ],
      ['a deeper heading', '#### for the po\nTry it.'],
    ])('is, with %s', (_what, body) => {
      expect(labelOf(body)).toBe(PO);
    });

    it('is not when every changed file is invisible', () => {
      expect(
        labelOf(TRY, [{ filename: 'docs/a.md' }, { filename: 'e2e/x.ts' }])
      ).toBe(DEV);
    });

    it('is when a rename started from a visible path', () => {
      expect(
        labelOf(TRY, [
          { filename: 'docs/b.md', previous_filename: 'app/b.tsx' },
        ])
      ).toBe(PO);
    });

    it('is when one changed file of several is visible', () => {
      expect(
        labelOf(TRY, [
          { filename: 'docs/a.md' },
          { filename: 'features/map/x.ts' },
        ])
      ).toBe(PO);
    });

    it('reads the changed files with their paging', () => {
      labelOf(TRY);

      expect(gh).toHaveBeenCalledWith([
        'api',
        '--paginate',
        'repos/owner/repo/pulls/7/files',
        '--jq',
        '.[] | @json',
      ]);
    });
  });

  describe('failures', () => {
    it('stops when it cannot read the closing issues', () => {
      expect(
        exec('pull_request', event('opened', planPr()), {
          fail: args => args[0] === 'pr',
        })
      ).toBe(1);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('boom')
      );
      expect(edits()).toHaveLength(0);
    });

    it('goes on to the next issue when reading one fails, and exits 1', () => {
      expect(
        exec('pull_request', event('opened', planPr()), {
          closing: [{ number: 8 }, { number: 9 }],
          fail: args => args[2] === '8',
          issues: { 8: SPEC, 9: ['type: chore', AGENT] },
        })
      ).toBe(1);
      expect(edited().map(args => args[2])).toEqual(['9']);
    });

    it('goes on to the next issue when editing one fails, and exits 1', () => {
      expect(
        exec('pull_request', event('opened', planPr()), {
          closing: [{ number: 8 }, { number: 9 }],
          fail: args => args[1] === 'edit' && args[2] === '8',
          issues: { 8: ['type: spec', AGENT], 9: ['type: chore', AGENT] },
        })
      ).toBe(1);
      expect(edited().map(args => args[2])).toEqual(['8', '9']);
      expect(console.log).not.toHaveBeenCalledWith(
        expect.stringContaining('#8 is now')
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('#9 is now')
      );
    });

    it('does not move a Spec or Bug when it cannot read the files, but moves a Chore', () => {
      expect(
        exec('pull_request', event('ready_for_review', pr()), {
          closing: [{ number: 8 }, { number: 9 }],
          fail: args => args[0] === 'api',
          issues: { 8: ['type: spec', AGENT], 9: ['type: chore', AGENT] },
        })
      ).toBe(1);
      expect(edited().map(args => [args[2], args.at(-1)])).toEqual([
        ['9', DEV],
      ]);
    });
  });
});
