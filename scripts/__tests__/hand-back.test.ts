import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Gh } from '../types.ts';

import { EXEMPT, matcher, run, tablePaths } from '../hand-back.mts';

const ENV = { GH_REPO: 'owner/repo' };
const SHA = 'a'.repeat(40);
const CODEOWNERS = [
  '# Owners',
  '',
  'AGENTS.md @lead',
  'plans/README.md @lead',
  '.github/workflows/** @lead  # trailing comment',
  '.github/agent/** @lead',
  '.claude/skills/** @lead',
  'scripts/agent-*.mts @lead',
  'server/** @lead',
  'scripts/layers.mts @lead',
].join('\n');

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

describe('matcher', () => {
  const owned = (patterns: string, path: string) =>
    matcher(`${patterns} @lead`)(path);

  it.each([
    ['client/**', 'client/a.mts', true],
    ['client/**', 'client/a/b/c.mts', true],
    ['client/**', 'client', false],
    ['client/**', 'x/client/a.mts', false],
    ['scripts/agent-*.mts', 'scripts/agent-gate.mts', true],
    ['scripts/agent-*.mts', 'scripts/agent-.mts', true],
    ['scripts/agent-*.mts', 'scripts/agent-a/b.mts', false],
    ['scripts/agent-*.mts', 'scripts/sub/agent-a.mts', false],
    ['.claude/settings*.json', '.claude/settings.local.json', true],
    ['AGENTS.md', 'AGENTS.md', true],
    ['AGENTS.md', 'docs/AGENTS.md', true],
    ['AGENTS.md', 'AGENTS.mdx', false],
    ['/AGENTS.md', 'AGENTS.md', true],
    ['/AGENTS.md', 'docs/AGENTS.md', false],
    ['docs/', 'docs/a.md', true],
    ['docs/', 'docs/x/y.md', true],
    ['docs/', 'src/docs/a.md', true],
    ['/docs/', 'src/docs/a.md', false],
    ['docs/*', 'src/docs/a.md', false],
    ['docs', 'docs/a.md', true],
    ['a/**/b', 'a/b', true],
    ['a/**/b', 'a/x/b', true],
    ['a/**/b', 'a/x/y/b', true],
    ['a/**/b', 'a/xb', false],
    ['**/logs', 'logs', true],
    ['**/logs', 'a/b/logs/c.txt', true],
    ['**/logs', 'blogs', false],
    ['**', 'any/thing.md', true],
    ['file?.md', 'file1.md', true],
    ['file?.md', 'file.md', false],
    ['file?.md', 'file12.md', false],
    ['file?.md', 'file/.md', false],
    ['a+b(1).md', 'a+b(1).md', true],
    ['a+b(1).md', 'aab(1).md', false],
    ['.github/CODEOWNERS', '.github/CODEOWNERS', true],
    ['.github/CODEOWNERS', 'xgithub/CODEOWNERS', false],
  ])('%s matches %s: %s', (pattern, path, expected) => {
    expect(owned(pattern, path)).toBe(expected);
  });

  it.each(['!docs/', '[ab].md', 'a]b', String.raw`a\.md`])(
    'throws on the syntax it does not handle: %s',
    pattern => {
      expect(() => matcher(`${pattern} @lead`)).toThrow(
        `Unsupported CODEOWNERS pattern: ${pattern}`
      );
    }
  );

  it('skips comments, blank lines and patterns with no owner', () => {
    const match = matcher(
      ['# docs/ @lead', '', '   ', 'docs/', 'plans/ @lead # note'].join('\n')
    );

    expect(match('docs/a.md')).toBe(false);
    expect(match('plans/a.md')).toBe(true);
  });

  it('takes the first token as the pattern and ignores the owners', () => {
    expect(matcher('docs/ @a @b team@example.com')('docs/a.md')).toBe(true);
  });

  it('excludes EXEMPT paths even when another pattern matches them', () => {
    const match = matcher('scripts/* @lead\nserver/** @lead\nplans/** @lead');

    expect(EXEMPT).toEqual(['server/**', 'scripts/layers.mts']);
    expect(match('scripts/layers.mts')).toBe(false);
    expect(match('server/a.mts')).toBe(false);
    expect(match('scripts/other.mts')).toBe(true);
    expect(match('plans/README.md')).toBe(true);
  });

  describe('the real .github/CODEOWNERS', () => {
    const match = matcher(readFileSync('.github/CODEOWNERS', 'utf8'));

    it.each([
      '.github/workflows/claude-hand-back.yml',
      '.github/agent/build.md',
      '.github/CODEOWNERS',
      '.claude/skills/x/SKILL.md',
      '.claude/settings.json',
      'plans/README.md',
      'AGENTS.md',
      'scripts/setup-github.sh',
      'scripts/github/ruleset-main.json',
      'scripts/agent-gate.mts',
      'scripts/hand-back.mts',
    ])('owns %s', path => {
      expect(match(path)).toBe(true);
    });

    it.each([
      'server/boundaries/load.mts',
      'scripts/layers.mts',
      'scripts/word-count.mts',
      'plans/chores/C443-hand-back-label.md',
      'app/page.tsx',
      '.github/pull_request_template.md',
    ])('does not own %s', path => {
      expect(match(path)).toBe(false);
    });
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

  const go = (world: World = {}, codeowners = CODEOWNERS) => {
    fakeGh(world);

    return run(['7'], ENV, gh, codeowners);
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

      expect(run(args, env, gh, CODEOWNERS)).toBe(1);
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

  it('labels a PR whose diff changes a code-owner path', () => {
    expect(
      go({
        files: [
          { filename: 'app/page.tsx' },
          { filename: '.github/agent/build.md' },
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
      'Hand back: .github/agent/build.md is in the diff.'
    );
    expect(fetched()).toHaveLength(0);
  });

  it('labels on a renamed file whose old path was a code-owner path', () => {
    go({
      files: [
        {
          filename: 'docs/agent.md',
          previous_filename: '.github/agent/build.md',
          status: 'renamed',
        },
      ],
    });

    expect(labelled()).toHaveLength(1);
  });

  it('labels when only a changed plan names a code-owner path (#426)', () => {
    expect(
      go({
        files: [
          { filename: 'plans/chores/C406-x.md', status: 'added' },
          { filename: 'app/page.tsx' },
        ],
        plans: {
          'plans/chores/C406-x.md': PLAN_WITH(
            '| `app/page.tsx` | x |\n| `.claude/skills/x/SKILL.md` | x |'
          ),
        },
      })
    ).toBe(0);
    expect(labelled()).toHaveLength(1);
    expect(console.log).toHaveBeenCalledWith(
      'Hand back: .claude/skills/x/SKILL.md is in the Files that change of plans/chores/C406-x.md.'
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
    expect(console.log).toHaveBeenCalledWith('Hand back: no code-owner path.');
  });

  it('does nothing when only exempt paths change or are named', () => {
    expect(
      go({
        files: [
          { filename: 'server/boundaries/load.mts' },
          { filename: 'scripts/layers.mts' },
          { filename: 'plans/chores/C1-x.md' },
        ],
        plans: {
          'plans/chores/C1-x.md': PLAN_WITH(
            '| `server/a.mts` | x |\n| `scripts/layers.mts` | x |'
          ),
        },
      })
    ).toBe(0);
    expect(labelled()).toHaveLength(0);
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
        files: [{ filename: '.github/agent/build.md' }],
        view: { labels: ['type: chore', 'hand-back'] },
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
      files: [{ filename: '.github/agent/build.md' }],
      view: { labels: ['hand-back-not'] },
    });

    expect(labelled()).toHaveLength(1);
  });

  it('leaves a fork alone', () => {
    expect(
      go({
        files: [{ filename: '.github/agent/build.md' }],
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
        go({ failing: 'label', files: [{ filename: '.github/agent/a.md' }] })
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
            'plans/b.md': PLAN_WITH('| `.github/agent/x.md` | x |'),
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

  it('throws on a CODEOWNERS pattern it cannot read, before any gh call', () => {
    fakeGh();

    expect(() => run(['7'], ENV, gh, '[ab] @lead')).toThrow('Unsupported');
    expect(gh).not.toHaveBeenCalled();
  });
});
