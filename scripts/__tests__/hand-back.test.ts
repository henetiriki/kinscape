import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Gh } from '@ks/scripts/types.ts';

import {
  HAND_BACK,
  isHandBack,
  run,
  tablePaths,
} from '@ks/scripts/hand-back.mts';

const ENV = { GH_REPO: 'owner/repo' };
const SHA = 'a'.repeat(40);

// One path for each HAND_BACK pattern, in the list's order.
const SAMPLES = [
  ['.github/workflows/**', '.github/workflows/a/b.yml'],
  ['.github/actions/**', '.github/actions/a/action.yml'],
  ['.github/CODEOWNERS', '.github/CODEOWNERS'],
  ['.claude/settings*.json', '.claude/settings.local.json'],
  ['AGENTS.md', 'AGENTS.md'],
  ['docs/security.md', 'docs/security.md'],
  ['docs/writing.md', 'docs/writing.md'],
  ['docs/code-rules.md', 'docs/code-rules.md'],
  ['.github/agent/spec-checks.md', '.github/agent/spec-checks.md'],
] as const;

type File = { filename: string; previous_filename?: string; status?: string };

type World = {
  failing?: 'files' | 'label' | 'view';
  files?: File[];
  // Plan path -> its text at the head commit, or an Error for a failing fetch.
  plans?: Record<string, Error | string>;
  view?: { isCrossRepository?: boolean; labels?: string[] };
};

const PLAN_WITH = (paths: string) => `# Plan

## Files that change

| File | What |
| ---- | ---- |
${paths}

## Risks
`;

describe('isHandBack', () => {
  it('has a sample path for each pattern', () => {
    expect(SAMPLES.map(([pattern]) => pattern)).toEqual(HAND_BACK);
  });

  it('lists the paths that CI cannot build or that guard CI', () => {
    expect(HAND_BACK).toEqual([
      '.github/workflows/**',
      '.github/actions/**',
      '.github/CODEOWNERS',
      '.claude/settings*.json',
      'AGENTS.md',
      'docs/security.md',
      'docs/writing.md',
      'docs/code-rules.md',
      '.github/agent/spec-checks.md',
    ]);
  });

  it.each([
    '.github/workflows/claude-hand-back.yml',
    '.github/workflows/a/b.yml',
    '.github/actions/run-claude/action.yml',
    '.github/CODEOWNERS',
    '.claude/settings.json',
    '.claude/settings.local.json',
    'AGENTS.md',
    'docs/security.md',
    'docs/writing.md',
    'docs/code-rules.md',
    '.github/agent/spec-checks.md',
  ])('is a hand-back path: %s', path => {
    expect(isHandBack(path)).toBe(true);
  });

  it.each([
    '.github/agent/build.md',
    '.claude/skills/refine/SKILL.md',
    'plans/README.md',
    'scripts/agent-approve.mts',
    'scripts/hand-back.mts',
    'scripts/github/labels.sh',
    'CLAUDE.md',
    'server/boundaries/load.mts',
    'app/page.tsx',
    '.github/workflows',
    '.github/CODEOWNERSX',
    '.claude/settings.jsonx',
    'xgithub/CODEOWNERS',
    '.claude/settings/a.json',
    'docs/security.mdx',
    'docs/other.md',
  ])('is not a hand-back path: %s', path => {
    expect(isHandBack(path)).toBe(false);
  });

  it('matches a file name with no slash at any depth, as CODEOWNERS does', () => {
    expect(isHandBack('docs/AGENTS.md')).toBe(true);
  });
});

describe('tablePaths', () => {
  it('takes the backticked paths in the first column', () => {
    expect(
      tablePaths(
        PLAN_WITH(
          '| `a/b.md` | New: touches `c/d.md` |\n| `e.mts`, `f.mts` | x |'
        )
      )
    ).toEqual(['a/b.md', 'e.mts', 'f.mts']);
  });

  it('ignores the header and separator rows, plain text and indented rows', () => {
    expect(
      tablePaths(
        PLAN_WITH('| plain | `x.md` |\n   | `y.md` | z |\nnot a row `q.md`')
      )
    ).toEqual(['y.md']);
  });

  it('stops at the next heading', () => {
    expect(
      tablePaths(`${PLAN_WITH('| `a.md` | x |')}\n| \`later.md\` | x |\n`)
    ).toEqual(['a.md']);
  });

  it('reads to the end when nothing follows the table', () => {
    expect(
      tablePaths('## Files that change\n\n| `a.md` | x |\r\n| `b.md` | x |')
    ).toEqual(['a.md', 'b.md']);
  });

  it('ignores other sections and a plan with no such section', () => {
    expect(tablePaths('## Risks\n\n| `a.md` | x |')).toEqual([]);
    expect(tablePaths('')).toEqual([]);
  });

  it('accepts any heading level and case', () => {
    expect(tablePaths('### files that change\n| `a.md` | x |')).toEqual([
      'a.md',
    ]);
  });
});

describe('run', () => {
  let gh: ReturnType<typeof vi.fn<Gh>>;

  const fakeGh = ({
    failing,
    files = [],
    plans = {},
    view = {},
  }: World = {}) => {
    gh = vi.fn<Gh>(args => {
      if (args[0] === 'pr') {
        if (failing === 'view') {
          throw new Error('view down');
        }

        return JSON.stringify({
          headRefOid: SHA,
          isCrossRepository: view.isCrossRepository ?? false,
          labels: (view.labels ?? []).map(name => ({ name })),
        });
      }

      if (args.includes('--paginate')) {
        if (failing === 'files') {
          throw new Error('files down');
        }

        return files.map(file => JSON.stringify(file)).join('\n');
      }

      if (args.includes('POST')) {
        if (failing === 'label') {
          throw new Error('label down');
        }

        return '';
      }

      const [, path] = /contents\/(.+)\?ref=/.exec(args.at(-1) ?? '') ?? [];
      const plan = plans[decodeURIComponent(path)];

      if (plan === undefined || plan instanceof Error) {
        throw plan ?? new Error('404');
      }

      return plan;
    });
  };

  const labelled = () =>
    gh.mock.calls.filter(([args]) => args.includes('POST'));
  const fetched = () =>
    gh.mock.calls.filter(([args]) => args.some(a => a.includes('/contents/')));

  const go = (world: World = {}) => {
    fakeGh(world);

    return run(['7'], ENV, gh);
  };

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
      [['7x'], ENV],
      [['7'], {}],
      [['7'], { GH_REPO: 'no-slash' }],
    ])('rejects %j with env %j', (args, env) => {
      fakeGh();

      expect(run(args, env, gh)).toBe(1);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Usage')
      );
      expect(gh).not.toHaveBeenCalled();
    });
  });

  it('reads the PR, then its changed files with pagination', () => {
    go();

    expect(gh.mock.calls[0][0]).toEqual([
      'pr',
      'view',
      '7',
      '--json',
      'headRefOid,isCrossRepository,labels',
    ]);
    expect(gh.mock.calls[1][0]).toEqual([
      'api',
      '--paginate',
      'repos/owner/repo/pulls/7/files',
      '--jq',
      '.[] | @json',
    ]);
  });

  it('labels a PR whose diff changes a hand-back path', () => {
    expect(
      go({
        files: [
          { filename: 'app/page.tsx' },
          { filename: '.github/workflows/a.yml' },
        ],
      })
    ).toBe(0);
    expect(labelled()).toHaveLength(1);
    expect(labelled()[0][0]).toEqual([
      'api',
      '-X',
      'POST',
      'repos/owner/repo/issues/7/labels',
      '-f',
      'labels[]=hand-back',
    ]);
    expect(console.log).toHaveBeenCalledWith(
      'Hand back: .github/workflows/a.yml is in the diff.'
    );
    expect(fetched()).toHaveLength(0);
  });

  it('labels on a renamed file whose old path was a hand-back path', () => {
    go({
      files: [
        {
          filename: 'docs/agent.md',
          previous_filename: '.github/workflows/a.yml',
          status: 'renamed',
        },
      ],
    });

    expect(labelled()).toHaveLength(1);
  });

  it('labels when only a changed plan names a hand-back path (#426)', () => {
    expect(
      go({
        files: [
          { filename: 'plans/chores/C406-x.md', status: 'added' },
          { filename: 'app/page.tsx' },
        ],
        plans: {
          'plans/chores/C406-x.md': PLAN_WITH(
            '| `app/page.tsx` | x |\n| `.github/actions/x/action.yml` | x |'
          ),
        },
      })
    ).toBe(0);
    expect(labelled()).toHaveLength(1);
    expect(console.log).toHaveBeenCalledWith(
      'Hand back: .github/actions/x/action.yml is in the Files that change of plans/chores/C406-x.md.'
    );
  });

  it('reads the plan at the head commit through the contents API', () => {
    go({
      files: [{ filename: 'plans/M1.4-a b.md' }],
      plans: { 'plans/M1.4-a b.md': PLAN_WITH('| `a.md` | x |') },
    });

    expect(fetched().map(([args]) => args)).toEqual([
      [
        'api',
        '-H',
        'Accept: application/vnd.github.raw+json',
        `repos/owner/repo/contents/plans/M1.4-a%20b.md?ref=${SHA}`,
      ],
    ]);
  });

  it('does nothing when nothing matches', () => {
    expect(
      go({
        files: [{ filename: 'app/page.tsx' }, { filename: 'plans/M1.1-x.md' }],
        plans: { 'plans/M1.1-x.md': PLAN_WITH('| `app/page.tsx` | x |') },
      })
    ).toBe(0);
    expect(labelled()).toHaveLength(0);
    expect(console.log).toHaveBeenCalledWith('Hand back: no hand-back path.');
  });

  it.each([
    '.github/agent/build.md',
    '.claude/skills/refine/SKILL.md',
    'plans/README.md',
    'scripts/agent-approve.mts',
    'server/boundaries/load.mts',
    'scripts/layers.mts',
  ])('does nothing when only %s changes or is named', path => {
    expect(
      go({
        files: [{ filename: path }, { filename: 'plans/chores/C1-x.md' }],
        plans: {
          'plans/chores/C1-x.md': PLAN_WITH(`| \`${path}\` | x |`),
          // plans/README.md is read as a plan too; it names no row.
          'plans/README.md': PLAN_WITH('| `a.md` | x |'),
        },
      })
    ).toBe(0);
    expect(labelled()).toHaveLength(0);
  });

  it.each(SAMPLES)('labels a PR that changes %s', (_pattern, path) => {
    go({ files: [{ filename: path }] });

    expect(labelled()).toHaveLength(1);
  });

  it.each(SAMPLES)('labels a PR whose plan names %s', (_pattern, path) => {
    go({
      files: [{ filename: 'plans/chores/C1-x.md' }],
      plans: { 'plans/chores/C1-x.md': PLAN_WITH(`| \`${path}\` | x |`) },
    });

    expect(labelled()).toHaveLength(1);
  });

  it('fetches only added or changed markdown files under plans/', () => {
    go({
      files: [
        { filename: 'plans/old.md', status: 'removed' },
        { filename: 'plans/notes.txt' },
        { filename: 'docs/plans/x.md' },
        { filename: 'plans' },
        { filename: 'plans/ok.md', status: 'modified' },
      ],
      plans: { 'plans/ok.md': PLAN_WITH('| `a.md` | x |') },
    });

    expect(fetched()).toHaveLength(1);
  });

  it('changes nothing on a rerun: the label is already there', () => {
    expect(
      go({
        files: [{ filename: '.github/workflows/a.yml' }],
        view: { labels: ['hand-back'] },
      })
    ).toBe(0);
    expect(labelled()).toHaveLength(0);
    expect(gh).toHaveBeenCalledTimes(1);
    expect(console.log).toHaveBeenCalledWith(
      'Hand back: the PR already has the label.'
    );
  });

  it('does not treat another label as the marker', () => {
    go({
      files: [{ filename: '.github/workflows/a.yml' }],
      view: { labels: ['hand-back-not'] },
    });

    expect(labelled()).toHaveLength(1);
  });

  it('leaves a fork alone', () => {
    expect(
      go({
        files: [{ filename: '.github/workflows/a.yml' }],
        view: { isCrossRepository: true },
      })
    ).toBe(0);
    expect(labelled()).toHaveLength(0);
    expect(gh).toHaveBeenCalledTimes(1);
    expect(console.log).toHaveBeenCalledWith(
      'Hand back: the PR is from a fork.'
    );
  });

  describe('a failing gh call is logged and the run is red', () => {
    it('reading the PR', () => {
      expect(go({ failing: 'view' })).toBe(1);
      expect(console.error).toHaveBeenCalledWith(
        'Hand back: reading the PR failed: view down'
      );
      expect(gh).toHaveBeenCalledTimes(1);
    });

    it('listing the changed files', () => {
      expect(go({ failing: 'files' })).toBe(1);
      expect(console.error).toHaveBeenCalledWith(
        'Hand back: listing the changed files failed: files down'
      );
      expect(labelled()).toHaveLength(0);
    });

    it('adding the label', () => {
      expect(
        go({
          failing: 'label',
          files: [{ filename: '.github/workflows/b.yml' }],
        })
      ).toBe(1);
      expect(console.error).toHaveBeenCalledWith(
        'Hand back: adding the label failed: label down'
      );
    });

    it('fetching the only plan, when nothing else matches', () => {
      expect(
        go({
          files: [{ filename: 'plans/a.md' }],
          plans: { 'plans/a.md': new Error('404') },
        })
      ).toBe(1);
      expect(labelled()).toHaveLength(0);
    });

    it('fetching one plan: the others and the diff still count', () => {
      expect(
        go({
          files: [
            { filename: 'plans/a.md' },
            { filename: 'plans/b.md' },
            { filename: 'plans/c.md' },
          ],
          plans: {
            'plans/a.md': new Error('404'),
            'plans/b.md': PLAN_WITH('| `.github/workflows/x.yml` | x |'),
            'plans/c.md': PLAN_WITH('| `AGENTS.md` | x |'),
          },
        })
      ).toBe(1);
      expect(console.error).toHaveBeenCalledWith(
        'Hand back: fetching plans/a.md failed: 404'
      );
      expect(labelled()).toHaveLength(1);
    });
  });
});
