import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Gh } from '@ks/scripts/types.ts';

import { run } from '@ks/scripts/agent-approve.mts';

// The PR head when the script runs, which the review approved; the commit the script makes.
const HEAD = 'a'.repeat(40);
const MADE = 'b'.repeat(40);
const ENV = {
  APPROVER: 'tech-lead',
  COMMIT: HEAD,
  GH_REPO: 'owner/repo',
  RUN_URL: 'https://github.com/owner/repo/actions/runs/1',
};
const PATH = 'plans/chores/C500-approval-script.md';
const AGENT = 'status: ready-for-agent';
const DEV = 'status: ready-for-dev';
const BLOCKED = 'status: blocked';

const plan = (status = 'draft', extra = '') => `# Plan: C500: X

- **Status:** ${status}

## Decisions

**D1 · First** · Decides: Tech lead

- **A.** One.
- **B.** Two.

**D2 · Second** · Decides: Tech lead

- **A.** One.
- **Other:** your own.
${extra}
## Files that change

Nothing here.
`;

type Item = { at: string; authorAssociation: string; body: string };

type World = {
  closes?: { number: number; repo?: string }[];
  comments?: Item[];
  // How the PR head compares with the review's commit, and the messages of the commits since it,
  // read for an approved plan whose head is not it.
  compare?: string;
  // Whether the PR is still a draft: the build marks it ready.
  draft?: boolean;
  files?: string[];
  headRefOid?: string;
  // issue number -> its labels; the issue a plan PR closes is on ready-for-dev by default
  issues?: Record<number, string[]>;
  prLabels?: string[];
  reviews?: Item[];
  since?: string[];
  text?: string;
};

const owner = (body: string, at: string): Item => ({
  at,
  authorAssociation: 'OWNER',
  body,
});

describe('run', () => {
  let gh: ReturnType<typeof vi.fn<Gh>>;
  let written: string[];
  let errors: string[];

  const write = (line: string) => written.push(line);

  const fakeGh = ({
    closes = [{ number: 8 }],
    comments = [],
    compare = 'diverged',
    draft = true,
    files = [PATH, 'src/other.ts'],
    issues = { 8: ['type: chore', DEV] },
    prLabels = [],
    reviews = [],
    since = [],
    text = plan(),
  }: World = {}) => {
    gh = vi.fn<Gh>(args => {
      if (args[0] === 'issue' && args[1] === 'view') {
        return JSON.stringify({
          labels: (issues[Number(args[2])] ?? []).map(name => ({ name })),
        });
      }

      if (args[0] === 'pr' && args[1] === 'view') {
        return JSON.stringify({
          closingIssuesReferences: closes.map(
            ({ number, repo = ENV.GH_REPO }) => ({
              number,
              repository: {
                name: repo.split('/')[1],
                owner: { login: repo.split('/')[0] },
              },
            })
          ),
          comments: comments.map(({ at, ...rest }) => ({
            ...rest,
            createdAt: at,
          })),
          files: files.map(path => ({ path })),
          headRefName: 'chore/C500-approval-script',
          headRefOid: HEAD,
          isDraft: draft,
          labels: prLabels.map(name => ({ name })),
          reviews: reviews.map(({ at, ...rest }) => ({
            ...rest,
            submittedAt: at,
          })),
        });
      }

      if (args[0] === 'api' && args.includes('GET')) {
        return JSON.stringify({
          content: Buffer.from(text).toString('base64'),
          sha: 'blob-sha',
        });
      }

      if (args[0] === 'api' && args.includes('PUT')) {
        return JSON.stringify({ commit: { sha: MADE } });
      }

      if (args[0] === 'api' && args[1].includes('/compare/')) {
        return JSON.stringify({
          first: since[0] ?? '',
          status: compare,
          total: since.length,
        });
      }

      return '';
    });
  };

  const put = () => gh.mock.calls.filter(([args]) => args.includes('PUT'));
  const comments = () =>
    gh.mock.calls.filter(([args]) => args[1] === 'comment');
  const committed = () => {
    const body = JSON.parse(put()[0][1] as string);

    return {
      ...body,
      text: Buffer.from(body.content, 'base64').toString('utf8'),
    };
  };
  const reply = () => comments()[0][1] as string;
  const edits = () =>
    gh.mock.calls.filter(([args]) => args[1] === 'edit').map(([args]) => args);
  const moved = (issue: string, from: string, to: string) => [
    'issue',
    'edit',
    issue,
    '--remove-label',
    from,
    '--add-label',
    to,
  ];

  beforeEach(() => {
    written = [];
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
      [['0'], ENV],
      [['5x'], ENV],
      [['5'], { ...ENV, APPROVER: undefined }],
      [['5'], { ...ENV, APPROVER: '-bad' }],
      [['5'], { ...ENV, COMMIT: undefined }],
      [['5'], { ...ENV, COMMIT: 'abc1234' }],
      [['5'], { ...ENV, GH_REPO: 'no-slash' }],
      [['5'], { ...ENV, GH_REPO: undefined }],
    ])('rejects %j with env %j', (args, env) => {
      fakeGh();

      expect(run(args, env, gh, write)).toBe(1);
      expect(errors[0]).toMatch(/^Usage/);
      expect(gh).not.toHaveBeenCalled();
      expect(written).toEqual([]);
    });
  });

  describe('a plan with every decision answered', () => {
    it('records the answers, commits as the owner approving, and goes', () => {
      fakeGh({
        reviews: [owner('D1: B\nD2: A', '2026-11-02T10:00:00Z')],
      });

      expect(run(['504'], ENV, gh, write)).toBe(0);

      expect(committed()).toMatchObject({
        branch: 'chore/C500-approval-script',
        message: 'plan(C500): approved by @tech-lead',
        sha: 'blob-sha',
      });
      expect(committed().text).toBe(
        plan('approved')
          .replace(
            '- **B.** Two.',
            '- **B.** Two.\n\n**Answer: B** (@tech-lead)'
          )
          .replace(
            '- **Other:** your own.\n',
            '- **Other:** your own.\n\n**Answer: A** (@tech-lead)\n'
          )
      );
      expect(put()[0][0]).toContain(`repos/owner/repo/contents/${PATH}`);
      expect(comments()).toEqual([]);
      expect(written).toEqual(['go=true', `head=${MADE}`]);
    });

    it('reads the plan at the PR head, not the branch name', () => {
      fakeGh({ reviews: [owner('D1: A\nD2: A', '2026-11-02T10:00:00Z')] });
      run(['504'], ENV, gh, write);

      const read = gh.mock.calls.find(([args]) => args.includes('GET'))![0];

      expect(read).toContain(`ref=${'a'.repeat(40)}`);
    });

    it('takes the `D1=B` form and a letter in lower case', () => {
      fakeGh({ reviews: [owner('D1=b\nD2=a', '2026-11-02T10:00:00Z')] });

      expect(run(['504'], ENV, gh, write)).toBe(0);
      expect(committed().text).toContain('**Answer: B** (@tech-lead)');
      expect(committed().text).toContain('**Answer: A** (@tech-lead)');
    });

    it('takes an `other` answer with its text', () => {
      fakeGh({
        reviews: [
          owner('D1: A\n- D2: other, my own way', '2026-11-02T10:00:00Z'),
        ],
      });

      expect(run(['504'], ENV, gh, write)).toBe(0);
      expect(committed().text).toContain(
        '**Answer: Other:** my own way (@tech-lead)'
      );
    });

    it('reads answers from a review and from comments, the later one winning', () => {
      fakeGh({
        comments: [
          owner('D1: A', '2026-11-02T09:00:00Z'),
          owner('D1: B\r\nD2: A', '2026-11-02T11:00:00Z'),
        ],
        reviews: [owner('D1: A\nD2: A', '2026-11-02T10:00:00Z')],
      });

      expect(run(['504'], ENV, gh, write)).toBe(0);
      expect(committed().text).toContain('- **B.** Two.\n\n**Answer: B**');
    });

    it('ignores a line that is not an answer', () => {
      fakeGh({
        reviews: [
          owner(
            'Looks good, D1 is fine.\nD2: other\nD1: A\nD2: A',
            '2026-11-02T10:00:00Z'
          ),
        ],
      });

      expect(run(['504'], ENV, gh, write)).toBe(0);
    });

    it('approves a plan that has no decisions', () => {
      fakeGh({
        text: '- **Status:** draft\n\n## Files that change\n',
      });

      expect(run(['504'], ENV, gh, write)).toBe(0);
      expect(committed().text).toBe(
        '- **Status:** approved\n\n## Files that change\n'
      );
    });

    it('names a Bug or a Spec plan by its id', () => {
      fakeGh({
        files: ['plans/bugs/B435-map-phone-snapshot.md'],
        text: '- **Status:** draft\n',
      });
      run(['504'], ENV, gh, write);

      expect(committed().message).toBe('plan(B435): approved by @tech-lead');

      fakeGh({
        files: ['plans/M0.8-skip-review.md'],
        text: '- **Status:** draft\n',
      });
      run(['504'], ENV, gh, write);

      expect(committed().message).toBe('plan(M0.8): approved by @tech-lead');
    });
  });

  describe('a decision left open', () => {
    it('comments which ones, commits nothing and stops', () => {
      fakeGh({ reviews: [owner('D1: B', '2026-11-02T10:00:00Z')] });

      expect(run(['504'], ENV, gh, write)).toBe(0);

      expect(put()).toEqual([]);
      expect(written).toEqual(['go=false']);
      expect(comments()).toHaveLength(1);
      expect(comments()[0][0].slice(0, 3)).toEqual(['pr', 'comment', '504']);
      expect(reply()).toContain('D2');
      expect(reply()).not.toContain('D1,');
      expect(reply()).toContain('D1: B');
      expect(reply()).toContain(`[Run](${ENV.RUN_URL})`);
    });

    it.each([undefined, 'javascript:alert(1)'])(
      'comments without a run link when RUN_URL is %s',
      url => {
        fakeGh();

        run(['504'], { ...ENV, RUN_URL: url }, gh, write);

        expect(reply()).not.toContain('[Run]');
        expect(reply()).toContain('D1, D2');
      }
    );

    it('ignores answers from anyone but the owner', () => {
      fakeGh({
        comments: [
          {
            at: '2026-11-02T10:00:00Z',
            authorAssociation: 'COLLABORATOR',
            body: 'D1: A\nD2: A',
          },
          {
            at: '2026-11-02T10:01:00Z',
            authorAssociation: 'NONE',
            body: 'D1: A\nD2: A',
          },
        ],
        reviews: [
          {
            at: '2026-11-02T10:02:00Z',
            authorAssociation: 'MEMBER',
            body: 'D1: A\nD2: A',
          },
        ],
      });

      expect(run(['504'], ENV, gh, write)).toBe(0);
      expect(put()).toEqual([]);
      expect(written).toEqual(['go=false']);
      expect(reply()).toContain('D1, D2');
    });

    it('comments on an answer that is not an option, and says to answer again', () => {
      fakeGh({
        reviews: [owner('D1: C\nD2: A', '2026-11-02T10:00:00Z')],
      });

      expect(run(['504'], ENV, gh, write)).toBe(0);
      expect(put()).toEqual([]);
      expect(written).toEqual(['go=false']);
      expect(reply()).toContain('D1: C is not an option');
      expect(reply()).toContain('Answer again in a new comment');
    });

    it('skips an answer to a decision the plan no longer has', () => {
      fakeGh({
        comments: [owner('D3: B', '2026-11-02T09:00:00Z')],
        reviews: [owner('D1: A\nD2: A', '2026-11-02T10:00:00Z')],
      });

      expect(run(['504'], ENV, gh, write)).toBe(0);
      expect(comments()).toEqual([]);
      expect(committed().text).not.toContain('D3');
      expect(written).toEqual(['go=true', `head=${MADE}`]);
    });
  });

  describe('a plan already approved', () => {
    it('changes nothing and goes', () => {
      fakeGh({
        reviews: [owner('D1: A', '2026-11-02T10:00:00Z')],
        text: plan('approved'),
      });

      expect(run(['504'], ENV, gh, write)).toBe(0);
      expect(put()).toEqual([]);
      expect(comments()).toEqual([]);
      expect(written).toEqual(['go=true', `head=${HEAD}`]);
    });
  });

  // The review approved one commit; a push since then is not what the owner read.
  describe('an approval of another commit', () => {
    const env = { ...ENV, COMMIT: 'c'.repeat(40) };

    it('comments which commits, commits nothing and stops', () => {
      fakeGh({ reviews: [owner('D1: A\nD2: A', '2026-11-02T10:00:00Z')] });

      expect(run(['504'], env, gh, write)).toBe(0);
      expect(put()).toEqual([]);
      expect(written).toEqual(['go=false']);
      expect(reply()).toContain('Not approved yet');
      expect(reply()).toContain('The approval is for `ccccccc`');
      expect(reply()).toContain('the branch is now at `aaaaaaa`');
      expect(reply()).toContain('Approve the plan again');
    });

    it('stops a plan already approved whose head is elsewhere, with the comment', () => {
      fakeGh({ compare: 'diverged', text: plan('approved') });

      expect(run(['504'], env, gh, write)).toBe(0);
      expect(written).toEqual(['go=false']);
      expect(reply()).toContain('The approval is for `ccccccc`');
    });

    // A second review of the same commit, queued behind the first run, build included: that run
    // did the work, so this one says nothing and moves no label.
    it('stops quietly for a plan whose only commit since the review’s is its approval', () => {
      fakeGh({
        compare: 'ahead',
        issues: { 8: ['type: chore', AGENT] },
        since: ['plan(C500): approved by @tech-lead'],
        text: plan('approved'),
      });

      expect(run(['504'], env, gh, write)).toBe(0);
      expect(written).toEqual(['go=false']);
      expect(comments()).toEqual([]);
      expect(edits()).toEqual([]);
      expect(put()).toEqual([]);
    });

    // The first run built the plan and marked the PR ready; the event still saw a draft.
    it('stops quietly for a plan built since the review, comparing nothing', () => {
      fakeGh({
        draft: false,
        issues: { 8: ['type: chore', AGENT] },
        since: ['plan(C500): approved by @tech-lead', 'C.500: build it'],
        text: plan('approved'),
      });

      expect(run(['504'], env, gh, write)).toBe(0);
      expect(written).toEqual(['go=false']);
      expect(comments()).toEqual([]);
      expect(edits()).toEqual([]);
      expect(
        gh.mock.calls.filter(([args]) => args[1]?.includes('/compare/'))
      ).toEqual([]);
    });

    it('asks the comparison for its status and first commit only', () => {
      fakeGh({ compare: 'ahead', text: plan('approved') });
      run(['504'], env, gh, write);

      const [compare] = gh.mock.calls
        .map(([args]) => args)
        .filter(args => args[1]?.includes('/compare/'));

      expect(compare[1]).toBe(
        `repos/owner/repo/compare/${'c'.repeat(40)}...${HEAD}`
      );
      expect(compare.slice(2)).toEqual([
        '--jq',
        '{status: .status, total: .total_commits, first: (.commits[0].commit.message // "")}',
      ]);
    });

    // A build that failed after pushing, or a revision: the PR is still a draft, and the owner
    // read an older commit, even from a page that still showed it.
    it.each([
      [['plan(C500): approved by @tech-lead', 'C.500: build it'], 'then more'],
      [['C.500: a revision'], 'another commit'],
      [['plan(C500): approved by @someone-else'], 'another approver'],
    ])('stops an approved plan ahead by %j (%s), with the comment', since => {
      fakeGh({ compare: 'ahead', since, text: plan('approved') });

      expect(run(['504'], env, gh, write)).toBe(0);
      expect(written).toEqual(['go=false']);
      expect(reply()).toContain('The approval is for `ccccccc`');
    });

    it('compares nothing for a draft plan', () => {
      fakeGh({ reviews: [owner('D1: A\nD2: A', '2026-11-02T10:00:00Z')] });
      run(['504'], env, gh, write);

      expect(
        gh.mock.calls.filter(([args]) => args[1]?.includes('/compare/'))
      ).toEqual([]);
    });
  });

  describe('a hand-back PR', () => {
    const answered = [owner('D1: A\nD2: A', '2026-11-02T10:00:00Z')];
    // Anything that would change the PR itself: ready, edit, merge, close.
    const prChanges = () =>
      gh.mock.calls.filter(
        ([args]) =>
          args[0] === 'pr' && !['comment', 'view'].includes(args[1] as string)
      );

    it('records the approval, comments that the tech lead builds it, and does not go', () => {
      fakeGh({ prLabels: ['hand-back'], reviews: answered });

      expect(run(['504'], ENV, gh, write)).toBe(0);
      expect(put()).toHaveLength(1);
      expect(comments()).toHaveLength(1);
      expect(comments()[0][0].slice(0, 3)).toEqual(['pr', 'comment', '504']);
      expect(reply()).toContain('hand-back');
      expect(reply()).toContain('tech lead builds it');
      expect(reply()).toContain('rule 4');
      expect(reply()).toContain(`[Run](${ENV.RUN_URL})`);
      expect(reply()).not.toContain('Not approved yet');
      expect(written).toEqual(['go=false']);
    });

    it('comments for a plan already approved, committing nothing', () => {
      fakeGh({ prLabels: ['hand-back'], text: plan('approved') });

      expect(run(['504'], ENV, gh, write)).toBe(0);
      expect(put()).toEqual([]);
      expect(comments()).toHaveLength(1);
      expect(reply()).toContain('tech lead builds it');
      expect(written).toEqual(['go=false']);
    });

    it('stops on an open decision as before, with no hand-back comment', () => {
      fakeGh({ prLabels: ['hand-back'] });

      expect(run(['504'], ENV, gh, write)).toBe(0);
      expect(put()).toEqual([]);
      expect(comments()).toHaveLength(1);
      expect(reply()).toContain('Not approved yet');
      expect(reply()).not.toContain('tech lead builds it');
      expect(written).toEqual(['go=false']);
    });

    it('leaves the PR a draft', () => {
      fakeGh({ prLabels: ['hand-back'], reviews: answered });
      run(['504'], ENV, gh, write);

      expect(prChanges()).toEqual([]);
    });

    it('is caught when the comment fails: no go, the message logged, exit code 1', () => {
      fakeGh({ prLabels: ['hand-back'], reviews: answered });

      const base = gh.getMockImplementation()!;

      gh.mockImplementation((args, input) => {
        if (args[1] === 'comment') {
          throw new Error('HTTP 403');
        }

        return base(args, input);
      });

      expect(run(['504'], ENV, gh, write)).toBe(1);
      expect(written).toEqual(['go=false']);
      expect(errors).toEqual(['#504: HTTP 403']);
      // The approval is committed, so there is no "Approve the plan again" comment.
      expect(put()).toHaveLength(1);
      expect(comments()).toHaveLength(1);
    });

    it('goes on to the build when the PR has other labels but not hand-back', () => {
      fakeGh({ prLabels: ['chore', 'wip'], reviews: answered });

      expect(run(['504'], ENV, gh, write)).toBe(0);
      expect(comments()).toEqual([]);
      expect(written).toEqual(['go=true', `head=${MADE}`]);
    });
  });

  describe('a PR that cannot be approved', () => {
    it.each([
      [[], 'has 0'],
      [[PATH, 'plans/chores/C501-other.md'], 'has 2'],
      [['plans/README.md', 'plans/TEMPLATE.md', 'src/a.ts'], 'has 0'],
    ])('stops for files %j', (files, count) => {
      fakeGh({ files });

      expect(run(['504'], ENV, gh, write)).toBe(0);
      expect(put()).toEqual([]);
      expect(written).toEqual(['go=false']);
      expect(reply()).toContain('exactly one plan file');
      expect(reply()).toContain(count);
    });

    it('stops when the plan has no `Status: draft` line', () => {
      fakeGh({ text: '# Plan\n\n## Files that change\n' });

      expect(run(['504'], ENV, gh, write)).toBe(0);
      expect(put()).toEqual([]);
      expect(written).toEqual(['go=false']);
      expect(reply()).toContain('has no `- **Status:** draft` line');
    });
  });

  describe('a gh failure', () => {
    it('is caught: no go, the message logged, exit code 1', () => {
      fakeGh({ reviews: [owner('D1: A\nD2: A', '2026-11-02T10:00:00Z')] });

      const base = gh.getMockImplementation()!;

      gh.mockImplementation((args, input) => {
        if (args.includes('PUT')) {
          throw new Error('409 sha does not match');
        }

        return base(args, input);
      });

      expect(run(['504'], ENV, gh, write)).toBe(1);
      expect(written).toEqual(['go=false']);
      expect(errors).toEqual(['#504: 409 sha does not match']);
      expect(reply()).toContain('Approve the plan again');
      expect(reply()).not.toContain('409');
    });

    it('is caught when reading the PR fails', () => {
      fakeGh();
      gh.mockImplementation(() => {
        throw new Error('HTTP 502');
      });

      expect(run(['504'], ENV, gh, write)).toBe(1);
      expect(written).toEqual(['go=false']);
      expect(errors).toEqual([
        '#504: HTTP 502',
        '#504: moving the label failed: HTTP 502',
        '#504: HTTP 502',
      ]);
    });

    it('moves the label to ready-for-dev when the commit fails', () => {
      fakeGh({
        issues: { 8: ['type: chore', AGENT] },
        reviews: [owner('D1: A\nD2: A', '2026-11-02T10:00:00Z')],
      });

      const base = gh.getMockImplementation()!;

      gh.mockImplementation((args, input) => {
        if (args.includes('PUT')) {
          throw new Error('409 sha does not match');
        }

        return base(args, input);
      });

      expect(run(['504'], ENV, gh, write)).toBe(1);
      expect(edits()).toEqual([moved('8', AGENT, DEV)]);
    });
  });

  describe('the issue label', () => {
    const answered = [owner('D1: A\nD2: A', '2026-11-02T10:00:00Z')];

    it('goes to ready-for-agent when the build goes', () => {
      fakeGh({ reviews: answered });

      expect(run(['504'], ENV, gh, write)).toBe(0);
      expect(written).toEqual(['go=true', `head=${MADE}`]);
      expect(edits()).toEqual([moved('8', DEV, AGENT)]);
    });

    it('goes to ready-for-agent for a plan already approved, with the head as it is', () => {
      fakeGh({ text: plan('approved') });

      expect(run(['504'], ENV, gh, write)).toBe(0);
      expect(written).toEqual(['go=true', `head=${HEAD}`]);
      expect(edits()).toEqual([moved('8', DEV, AGENT)]);
    });

    it('goes to ready-for-dev when a decision is open, even if it is on ready-for-agent', () => {
      fakeGh({ issues: { 8: ['type: chore', AGENT] } });

      expect(run(['504'], ENV, gh, write)).toBe(0);
      expect(written).toEqual(['go=false']);
      expect(edits()).toEqual([moved('8', AGENT, DEV)]);
    });

    it('stays on ready-for-dev when a decision is open', () => {
      fakeGh();

      expect(run(['504'], ENV, gh, write)).toBe(0);
      expect(edits()).toEqual([]);
    });

    it('moves each issue the PR closes, and none in another repository', () => {
      fakeGh({
        closes: [{ number: 8 }, { number: 9 }, { number: 10, repo: 'a/b' }],
        issues: { 10: [DEV], 8: [DEV], 9: [DEV, 'type: spec'] },
        reviews: answered,
      });

      expect(run(['504'], ENV, gh, write)).toBe(0);
      expect(edits()).toEqual([moved('8', DEV, AGENT), moved('9', DEV, AGENT)]);
    });

    it.each([
      ['go', answered],
      ['no go', []],
    ])('is not moved for a hand-back PR (%s)', (_what, reviews) => {
      fakeGh({ prLabels: ['hand-back'], reviews });

      expect(run(['504'], ENV, gh, write)).toBe(0);
      expect(edits()).toEqual([]);
      expect(
        gh.mock.calls.filter(
          ([args]) => args[0] === 'issue' && args[1] === 'view'
        )
      ).toEqual([]);
    });

    it('is not moved for a blocked issue', () => {
      fakeGh({ issues: { 8: ['type: chore', BLOCKED] }, reviews: answered });

      expect(run(['504'], ENV, gh, write)).toBe(0);
      expect(edits()).toEqual([]);
    });

    it('is not moved for an issue already on its target', () => {
      fakeGh({ issues: { 8: ['type: chore', AGENT] }, reviews: answered });

      expect(run(['504'], ENV, gh, write)).toBe(0);
      expect(edits()).toEqual([]);
    });

    it('removes every other status label', () => {
      fakeGh({
        issues: { 8: [DEV, 'status: ready-for-po'] },
        reviews: answered,
      });
      run(['504'], ENV, gh, write);

      expect(edits()).toEqual([
        [
          'issue',
          'edit',
          '8',
          '--remove-label',
          DEV,
          '--remove-label',
          'status: ready-for-po',
          '--add-label',
          AGENT,
        ],
      ]);
    });

    it('is logged when the move fails, leaving go and the exit code alone', () => {
      fakeGh({ reviews: answered });

      const base = gh.getMockImplementation()!;

      gh.mockImplementation((args, input) => {
        if (args[1] === 'edit') {
          throw new Error('HTTP 403');
        }

        return base(args, input);
      });

      expect(run(['504'], ENV, gh, write)).toBe(0);
      expect(written).toEqual(['go=true', `head=${MADE}`]);
      expect(errors).toEqual(['#8: moving the label failed: HTTP 403']);
    });

    it('goes on to the next issue when one move fails', () => {
      fakeGh({
        closes: [{ number: 8 }, { number: 9 }],
        issues: { 8: [DEV], 9: [DEV] },
        reviews: answered,
      });

      const base = gh.getMockImplementation()!;

      gh.mockImplementation((args, input) => {
        if (args[1] === 'edit' && args[2] === '8') {
          throw new Error('HTTP 403');
        }

        return base(args, input);
      });

      expect(run(['504'], ENV, gh, write)).toBe(0);
      expect(written).toEqual(['go=true', `head=${MADE}`]);
      expect(errors).toEqual(['#8: moving the label failed: HTTP 403']);
      expect(edits()).toEqual([moved('8', DEV, AGENT), moved('9', DEV, AGENT)]);
    });
  });
});
