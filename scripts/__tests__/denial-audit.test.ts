import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Gh, Settings, Transcript } from '@ks/scripts/types.ts';

import {
  artifactReader,
  ISSUE_TITLE,
  issueBody,
  patternOf,
  run,
  settingsReader,
  summarise as summariseRuns,
} from '@ks/scripts/denial-audit.mts';

const bash = (detail: string) => ({ detail, tool: 'Bash' });

const transcript = (
  denials: { detail: string; tool: string }[],
  extra: Partial<Transcript> = {}
): Transcript => ({
  costUsd: 1,
  denials,
  durationMs: 1000,
  finalText: '',
  model: 'm',
  outcome: 'success',
  stripped: 0,
  tools: {},
  turns: 10,
  ...extra,
});

// The artifact text, a run's summary, for a run that was denied these Bash commands.
const artifact = (...commands: string[]) =>
  JSON.stringify(transcript(commands.map(bash), { costUsd: 2, turns: 20 }));

// A transcript denied `z a` this many times.
const times = (count: number) =>
  transcript(Array.from({ length: count }, () => bash('z a')));

// Runs 1 to 8, denied 1, 3, 2, 3, 1, 2, 1 and 1 times: most counts tie.
const EIGHT_RUNS = [1, 3, 2, 3, 1, 2, 1, 1].map((count, index) => ({
  id: index + 1,
  transcript: times(count),
}));

const NO_RULES: Settings = { allow: [], deny: [] };

// The runs are plan runs unless they say otherwise, and no settings file has a rule.
const summarise = (
  runs: { id: number; transcript: Transcript; workflow?: string }[],
  settings: (file: string) => Settings = () => NO_RULES
) =>
  summariseRuns(
    runs.map(item => ({
      ...item,
      workflow: item.workflow ?? 'claude-plan.yml',
    })),
    settings
  );

const REAL_SETTINGS = settingsReader('.github/agent');

describe('patternOf', () => {
  it.each([
    [bash('cat a | tail -5'), 'Bash: cat'],
    [bash('ls'), 'Bash: ls'],
    [bash('gh run list'), 'Bash: gh run'],
    [bash('npm run lint'), 'Bash: npm run'],
    [bash('git -C x push'), 'Bash: git'],
    [bash('git'), 'Bash: git'],
    [bash(''), 'Bash'],
    [bash('DESIGN_SCREENS=a,b npm run design:check'), 'Bash: npm run'],
    [bash('DESIGN_SCREENS=c https_proxy=x npm run e2e'), 'Bash: npm run'],
    [bash('https_proxy=http://127.0.0.1:9 npm run build'), 'Bash: npm run'],
    [bash('A=1'), 'Bash: A=1'],
    [{ detail: '/tmp/x', tool: 'Write' }, 'Write'],
  ])('%j is %s', (denial, pattern) => {
    expect(patternOf(denial)).toBe(pattern);
  });
});

describe('summarise', () => {
  it('keeps a denial that hit two runs, or three times in one', () => {
    const report = summarise([
      { id: 1, transcript: transcript([bash('gh run list'), bash('rm a')]) },
      {
        id: 2,
        transcript: transcript([
          bash('gh run view'),
          bash('cd x'),
          bash('cd y'),
          bash('cd z'),
        ]),
      },
    ]);

    expect(report.groups.map(({ pattern }) => pattern)).toEqual([
      'Bash: cd',
      'Bash: gh run',
    ]);
  });

  it('does not keep a denial seen twice in one run', () => {
    const report = summarise([
      { id: 1, transcript: transcript([bash('rm a'), bash('rm b')]) },
    ]);

    expect(report.groups).toEqual([]);
    expect(report.denials).toBe(2);
  });

  it('counts each run once per group, and orders groups by count', () => {
    const report = summarise([
      {
        id: 1,
        transcript: transcript([bash('a b c'), bash('a b d'), bash('x y')]),
      },
      { id: 2, transcript: transcript([bash('a b e'), bash('x y')]) },
    ]);

    expect(report.groups).toMatchObject([
      {
        costUsd: 0,
        count: 3,
        example: 'Bash: a b c',
        pattern: 'Bash: a',
        runs: [1, 2],
      },
      {
        costUsd: 0,
        count: 2,
        example: 'Bash: x y',
        pattern: 'Bash: x',
        runs: [2, 1],
      },
    ]);
  });

  it('sorts the runs of a group by its denials in each, then the newer run first', () => {
    expect(summarise(EIGHT_RUNS).groups[0].runs).toEqual([
      4, 2, 6, 3, 8, 7, 5, 1,
    ]);
  });

  it('adds the denials of the sessions of one run before it sorts', () => {
    const report = summarise([
      { id: 1, transcript: times(2) },
      { id: 2, transcript: times(1) },
      { id: 2, transcript: times(2) },
    ]);

    expect(report.groups[0].runs).toEqual([2, 1]);
  });

  // The settings file a workflow runs with: the review's own, else settings.json.
  describe('settings and suggestion', () => {
    const SETTINGS: Settings = {
      allow: ['Bash(git:*)', 'Bash(npm run:*)', 'Bash(exact)'],
      deny: [
        'Agent',
        // Not a rule Claude Code reads: it covers nothing.
        'mcp-x',
        'Bash(cd *)',
        'Bash(gh pr * --body *)',
        'Bash(sleep *)',
        'Read(//proc/**)',
      ],
    };

    // One group per command, each denied in two runs so it repeats.
    const groupOf = (
      detail: string,
      options: { settings?: Settings; tool?: string; workflow?: string } = {}
    ) => {
      const denial = { detail, tool: options.tool ?? 'Bash' };
      const workflow = options.workflow ?? 'claude-build.yml';
      const [group] = summarise(
        [1, 2].map(id => ({
          id,
          transcript: transcript([denial]),
          workflow,
        })),
        () => options.settings ?? SETTINGS
      ).groups;

      return group;
    };

    it('names the workflows that hit it, without the claude- prefix or .yml', () => {
      const [group] = summarise(
        [
          {
            id: 1,
            transcript: transcript([bash('rm a')]),
            workflow: 'claude-plan.yml',
          },
          {
            id: 2,
            transcript: transcript([bash('rm b')]),
            workflow: 'claude-code-review.yml',
          },
          {
            id: 3,
            transcript: transcript([bash('rm c')]),
            workflow: 'claude-plan.yml',
          },
        ],
        () => NO_RULES
      ).groups;

      expect(group.workflows).toEqual(['plan', 'code-review']);
    });

    it('shows a program the allowlist covers as allowed, with the rule', () => {
      expect(groupOf('git push origin x')).toMatchObject({
        settings: 'settings.json: allowed by `Bash(git:*)`',
        suggestion: 'A chained part was denied.',
      });
      // `prefix:*` matches the bare program, not a longer name; a rule without `*` the whole command.
      expect(groupOf('git').settings).toContain('allowed by `Bash(git:*)`');
      expect(groupOf('gitk').settings).toBe('settings.json: no rule');
      expect(groupOf('exact').settings).toContain('allowed by `Bash(exact)`');
      expect(groupOf('exact more').settings).toBe('settings.json: no rule');
    });

    it('shows a program a deny rule covers as denied, with the rule', () => {
      expect(groupOf('sleep 5')).toMatchObject({
        settings: 'settings.json: denied by `Bash(sleep *)`',
        suggestion: 'The agent is ignoring it, hook or prose.',
      });
      expect(groupOf('gh pr edit 1 --body text').settings).toContain(
        'denied by `Bash(gh pr * --body *)`'
      );
      expect(groupOf('', { tool: 'Agent' }).settings).toBe(
        'settings.json: denied by `Agent`'
      );
    });

    it('shows a program no rule covers as no rule, and suggests allowing it or hooking it', () => {
      expect(groupOf('rm a')).toMatchObject({
        settings: 'settings.json: no rule',
        suggestion: 'Allow it or hook it.',
      });
      // A path rule says nothing about a tool's other uses.
      expect(groupOf('/proc/x', { tool: 'Read' }).settings).toBe(
        'settings.json: no rule'
      );
    });

    it('judges the code review by review-settings.json', () => {
      const asked: string[] = [];
      const [group] = summarise(
        [1, 2].map(id => ({
          id,
          transcript: transcript([bash('rm a')]),
          workflow: 'claude-code-review.yml',
        })),
        file => {
          asked.push(file);

          return NO_RULES;
        }
      ).groups;

      expect(new Set(asked)).toEqual(new Set(['review-settings.json']));
      expect(group.settings).toBe('review-settings.json: no rule');
    });

    it('shows each settings file a group met, when its workflows differ', () => {
      const [group] = summarise(
        [
          {
            id: 1,
            transcript: transcript([bash('sleep 1')]),
            workflow: 'claude-build.yml',
          },
          {
            id: 2,
            transcript: transcript([bash('sleep 1')]),
            workflow: 'claude-code-review.yml',
          },
        ],
        file => (file === 'settings.json' ? SETTINGS : NO_RULES)
      ).groups;

      expect(group.settings).toBe(
        'settings.json: denied by `Bash(sleep *)`; review-settings.json: no rule'
      );
      expect(group.suggestion).toBe(
        'The agent is ignoring it, hook or prose. Allow it or hook it.'
      );
    });
  });

  // The real hook is run on the denied command: a program it denies is shown as the hook's.
  describe('the hook', () => {
    const groupOf = (detail: string) =>
      summarise(
        [1, 2].map(id => ({ id, transcript: transcript([bash(detail)]) })),
        REAL_SETTINGS
      ).groups[0];

    it('shows a program the hook denies as denied by the hook', () => {
      expect(groupOf('cat a | tail')).toMatchObject({
        settings: 'settings.json: denied by the hook',
        suggestion: 'The agent is ignoring it, hook or prose.',
      });
    });

    it('shows a program the hook leaves alone by the rules', () => {
      expect(groupOf('git push origin x').settings).toBe(
        'settings.json: allowed by `Bash(git:*)`'
      );
      expect(groupOf('rm a').settings).toBe('settings.json: no rule');
    });

    it('runs the hook in the workspace, so a cut cd is no denial of cd', () => {
      expect(groupOf(`cd ${process.cwd()}; cat x`).settings).toBe(
        'settings.json: denied by the hook'
      );
      expect(groupOf(`cd ${process.cwd()} && gh pr view 1`).settings).toBe(
        'settings.json: allowed by `Bash(gh pr:*)`'
      );
    });

    // The audit names the group for the part the hook denied, not the first word of the call.
    it.each([
      [`cd ${process.cwd()}; cat x`, 'Bash: cat'],
      [`cd ${process.cwd()} && cat x`, 'Bash: cat'],
      ['gh pr view 1; cat x', 'Bash: cat'],
      ['gh pr view 1 && cat x', 'Bash: cat'],
      ['gh pr view 1 || cat x', 'Bash: cat'],
      ['  gh pr view 1 ;  git status ;  sed x', 'Bash: sed'],
      // The first denied part names it.
      ['gh pr view 1; cat x; sed x', 'Bash: cat'],
      // Not the workspace: this cd is the denied part.
      ['cd /elsewhere; cat x', 'Bash: cd'],
      // The hook denies no part: the call, without a cut cd.
      [`cd ${process.cwd()}; rm a`, 'Bash: rm'],
      ['git push origin x', 'Bash: git push'],
    ])('names %j as %s', (detail, pattern) => {
      expect(groupOf(detail).pattern).toBe(pattern);
    });

    it('keeps the whole call as the example', () => {
      expect(groupOf('gh pr view 1; cat x').example).toBe(
        'Bash: gh pr view 1; cat x'
      );
    });

    it('names the call by its first words when the settings have no hook', () => {
      const hookless = (file: string) => ({
        ...REAL_SETTINGS(file),
        hook: undefined,
      });
      const [group] = summarise(
        [1, 2].map(id => ({
          id,
          transcript: transcript([bash('gh pr view 1; cat x')]),
        })),
        hookless
      ).groups;

      expect(group.pattern).toBe('Bash: gh pr');
    });
  });

  describe('the refresh of claude-unblock.yml', () => {
    it('names the workflow refresh, and judges it by refresh-settings.json', () => {
      const asked: string[] = [];
      const [group] = summarise(
        [1, 2].map(id => ({
          id,
          transcript: transcript([bash('rm a')]),
          workflow: 'claude-unblock.yml',
        })),
        file => {
          asked.push(file);

          return NO_RULES;
        }
      ).groups;

      expect(group.workflows).toEqual(['refresh']);
      expect(new Set(asked)).toEqual(new Set(['refresh-settings.json']));
      expect(group.settings).toBe('refresh-settings.json: no rule');
    });

    // One workflow run has an artifact per freed Spec: each is one Claude session (plan C482, D2).
    it('counts each artifact of one run as a run read, and links the run once', () => {
      const unblock = (denials: { detail: string; tool: string }[]) => ({
        id: 7,
        transcript: transcript(denials),
        workflow: 'claude-unblock.yml',
      });
      const report = summarise([
        unblock([bash('rm a')]),
        unblock([bash('rm b')]),
        unblock([bash('ls')]),
      ]);

      expect(report.runs).toBe(3);
      // `rm` hit two artifacts of one run: it repeats, with 2 denials, below the 3-times rule.
      expect(report.groups).toMatchObject([
        { count: 2, pattern: 'Bash: rm', runs: [7] },
      ]);
    });

    it('does not keep a denial seen twice in one artifact', () => {
      const report = summarise([
        {
          id: 7,
          transcript: transcript([bash('rm a'), bash('rm b')]),
          workflow: 'claude-unblock.yml',
        },
      ]);

      expect(report.groups).toEqual([]);
    });
  });

  it('counts the stripped cd commands per workflow', () => {
    const report = summarise([
      {
        id: 1,
        transcript: transcript([], { stripped: 3 }),
        workflow: 'claude-build.yml',
      },
      {
        id: 2,
        transcript: transcript([], { stripped: 2 }),
        workflow: 'claude-build.yml',
      },
      {
        id: 3,
        transcript: transcript([], { stripped: 1 }),
        workflow: 'claude-plan.yml',
      },
      { id: 4, transcript: transcript([]), workflow: 'claude-respond.yml' },
    ]);

    expect(report.stripped).toEqual({ build: 5, plan: 1 });
  });

  it('sums the cost of denied calls per group and in all, against the runs that had denials', () => {
    const costly = (detail: string, costUsd: number) => ({
      costUsd,
      detail,
      tool: 'Bash',
    });
    const report = summarise([
      {
        id: 1,
        transcript: transcript([costly('a x', 0.25), costly('a y', 0.5)], {
          costUsd: 3,
        }),
      },
      {
        id: 2,
        transcript: transcript([costly('a z', 0.25), bash('b')], {
          costUsd: 2,
        }),
      },
      { id: 3, transcript: transcript([], { costUsd: 10 }) },
      { id: 4, transcript: transcript([bash('c')], { costUsd: undefined }) },
    ]);

    expect(report).toMatchObject({
      costUsd: 15,
      deniedCostUsd: 1,
      deniedRunsCostUsd: 5,
      unlinked: 2,
    });
    expect(report.groups[0].costUsd).toBe(1);
  });

  it('names a denial with no detail by its tool', () => {
    const report = summarise([
      { id: 1, transcript: transcript([{ detail: '', tool: 'Agent' }]) },
      { id: 2, transcript: transcript([{ detail: '', tool: 'Agent' }]) },
    ]);

    expect(report.groups[0].example).toBe('Agent');
  });

  it('totals runs, denials, cost and turns, counting missing figures as 0', () => {
    const report = summarise([
      {
        id: 1,
        transcript: transcript([bash('a')], { costUsd: 1.5, turns: 10 }),
      },
      {
        id: 2,
        transcript: transcript([], { costUsd: undefined, turns: undefined }),
      },
    ]);

    expect(report).toMatchObject({
      costUsd: 1.5,
      denials: 1,
      runs: 2,
      turns: 10,
    });
  });
});

describe('issueBody', () => {
  const group = {
    costUsd: 0.756,
    count: 4,
    example: 'Bash: cat a | tail',
    pattern: 'Bash: cat a',
    runs: [11, 12],
    settings:
      'settings.json: denied by the hook; review-settings.json: no rule',
    suggestion: 'Tell the agent | stop.',
    workflows: ['build', 'code-review'],
  };

  it('gives the totals, the table and what to do', () => {
    const body = issueBody(
      {
        costUsd: 4.567,
        denials: 6,
        deniedCostUsd: 0.9,
        deniedRunsCostUsd: 3,
        groups: [group],
        runs: 3,
        stripped: { build: 5, plan: 1 },
        turns: 100,
        unlinked: 2,
      },
      'owner/repo',
      new Date('2026-10-17T07:00:00Z')
    );

    expect(body).toContain(
      'since 2026-10-17: 3 runs read, 6 denials, 33 turns on average.'
    );
    expect(body).toContain(
      'Cost, estimated at API prices: $4.57 for all runs read. The turns that made a denied call cost $0.90, 30% of the $3.00 the runs with denials cost. That is a lower bound'
    );
    expect(body).toContain(
      '2 of 6 denials could not be linked to a turn and have no cost.'
    );
    expect(body).toContain(
      '| Denied | Workflows | Settings | Times | Cost | Runs | Example | Suggestion |'
    );
    expect(body).toContain(
      '| `Bash: cat a` | build, code-review | settings.json: denied by the hook; review-settings.json: no rule | 4 | $0.76 | [11](https://github.com/owner/repo/actions/runs/11), [12](https://github.com/owner/repo/actions/runs/12) | `Bash: cat a \\| tail` | Tell the agent \\| stop. |'
    );
    expect(body).toContain(
      'The hook cut a leading `cd` from 6 commands: build 5, plan 1.'
    );
    expect(body).toContain('`.github/agent/settings.json`');
    expect(body).toContain(
      'For the code review, edit `.github/agent/review-settings.json` or `.github/agent/review.md`.'
    );
    expect(body).toContain(
      'For the unblock refresh, edit `.github/agent/refresh-settings.json` or `.github/agent/refresh.md`.'
    );
  });

  it('does not divide by zero with no runs', () => {
    expect(
      issueBody(
        {
          costUsd: 0,
          denials: 0,
          deniedCostUsd: 0,
          deniedRunsCostUsd: 0,
          groups: [],
          runs: 0,
          stripped: {},
          turns: 0,
          unlinked: 0,
        },
        'o/r',
        new Date('2026-10-17T00:00:00Z')
      )
    ).toMatch(/0 turns on average.*0% of the \$0\.00/s);
  });

  it('says when the hook cut no cd', () => {
    expect(
      issueBody(
        {
          costUsd: 0,
          denials: 0,
          deniedCostUsd: 0,
          deniedRunsCostUsd: 0,
          groups: [],
          runs: 1,
          stripped: {},
          turns: 0,
          unlinked: 0,
        },
        'o/r',
        new Date('2026-10-17T00:00:00Z')
      )
    ).toContain('The hook cut a leading `cd` from 0 commands.');
  });

  const SINCE = new Date('2026-10-17T00:00:00Z');
  const RUN_PAGE = 'https://github.com/o/r/actions/runs/7';

  const reportOf = (groups: (typeof group)[]) => ({
    costUsd: 0,
    denials: 0,
    deniedCostUsd: 0,
    deniedRunsCostUsd: 0,
    groups,
    runs: 1,
    stripped: {},
    turns: 0,
    unlinked: 0,
  });

  // The most busy week: many patterns, many runs each, a long example. Counts fall from the first.
  const busy = reportOf(
    Array.from({ length: 300 }, (_, index) => ({
      ...group,
      count: 1000 - index,
      example: 'x'.repeat(5000),
      pattern: `Bash: p${index}`,
      runs: Array.from({ length: 100 }, (_, run) => run + 1),
    }))
  );
  const rowsOf = (body: string) =>
    body.split('\n').filter(line => line.startsWith('| `Bash: p'));

  it('keeps the body to 60,000 characters or less', () => {
    expect(issueBody(busy, 'o/r', SINCE).length).toBeLessThanOrEqual(60_000);
    expect(issueBody(busy, 'o/r', SINCE, RUN_PAGE).length).toBeLessThanOrEqual(
      60_000
    );
  });

  it('drops the rows with the lowest counts, and says how many', () => {
    const body = issueBody(busy, 'o/r', SINCE, RUN_PAGE);
    const dropped = 300 - rowsOf(body).length;

    expect(dropped).toBeGreaterThan(0);
    expect(body).toContain('| `Bash: p0` |');
    expect(body).not.toContain('| `Bash: p299` |');
    expect(body).toContain(
      `${dropped} more patterns are on the [run page](${RUN_PAGE}).`
    );
  });

  it('says the dropped rows were left out when there is no run page', () => {
    const body = issueBody(busy, 'o/r', SINCE);
    const dropped = 300 - rowsOf(body).length;

    expect(body).toContain(`${dropped} more patterns were left out.`);
    expect(body).not.toContain('run page');
  });

  it('links the run page under the table when no row is dropped', () => {
    expect(issueBody(reportOf([group]), 'o/r', SINCE, RUN_PAGE)).toContain(
      `\n| \`Bash: cat a\` | build, code-review | settings.json: denied by the hook; review-settings.json: no rule | 4 | $0.76 | [11](https://github.com/o/r/actions/runs/11), [12](https://github.com/o/r/actions/runs/12) | \`Bash: cat a \\| tail\` | Tell the agent \\| stop. |\n\nThe [run page](${RUN_PAGE}) shows every run and the full examples.\n`
    );
  });

  it('writes no line under the table when no row is dropped and there is no run page', () => {
    const body = issueBody(reportOf([group]), 'o/r', SINCE);

    expect(body).not.toContain('run page');
    expect(body).not.toContain('left out');
    expect(body).not.toContain('more patterns');
  });

  it('shows 5 run links in the order summarise gives, then how many more', () => {
    const body = issueBody(summarise(EIGHT_RUNS), 'o/r', SINCE);
    const link = (id: number) =>
      `[${id}](https://github.com/o/r/actions/runs/${id})`;

    expect(body).toContain(
      `${[4, 2, 6, 3, 8].map(link).join(', ')}, +3 more |`
    );
    expect(body).not.toContain(link(7));
  });

  it('shows 5 run links with no "more" when a group has 5', () => {
    const body = issueBody(
      reportOf([{ ...group, runs: [1, 2, 3, 4, 5] }]),
      'o/r',
      SINCE
    );

    expect(body).toContain('/actions/runs/5) |');
    expect(body).not.toContain('more |');
  });

  it('cuts an example over 200 characters, and shows 200 in full', () => {
    const cut = issueBody(
      reportOf([{ ...group, example: `${'a'.repeat(100)}${'b'.repeat(200)}` }]),
      'o/r',
      SINCE
    );
    const whole = issueBody(
      reportOf([{ ...group, example: 'c'.repeat(200) }]),
      'o/r',
      SINCE
    );

    expect(cut).toContain(`\`${'a'.repeat(100)}${'b'.repeat(100)}…\``);
    expect(cut).not.toContain('b'.repeat(101));
    expect(whole).toContain(`\`${'c'.repeat(200)}\``);
    expect(whole).not.toContain('…');
  });
});

describe('settingsReader', () => {
  it("reads a settings file's rules and Bash hook", () => {
    const settings = settingsReader('.github/agent')('settings.json');

    expect(settings.allow).toContain('Bash(git:*)');
    expect(settings.deny).toContain('Bash(cd *)');
    expect(settings.hook).toMatch(/^jq /);
  });

  it('reads a file with no rules or hook as empty', () => {
    const dir = mkdtempSync(join(tmpdir(), 'denial-audit-settings-'));

    try {
      writeFileSync(join(dir, 'bare.json'), '{}');

      expect(settingsReader(dir)('bare.json')).toEqual({
        allow: [],
        deny: [],
        hook: undefined,
      });
    } finally {
      rmSync(dir, { force: true, recursive: true });
    }
  });
});

describe('artifactReader', () => {
  const dirOf = (args: string[]) => args[args.indexOf('-D') + 1];
  const FILE = 'claude-execution-output.json';
  // Writes a file under `folder` of the download folder, as gh extracts an artifact.
  const extract = (args: string[], folder: string, text: string) => {
    const dir = join(dirOf(args), folder);

    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, FILE), text);
  };

  it('downloads every artifact whose name starts with claude-execution-output', () => {
    const gh = vi.fn<Gh>(args => {
      extract(args, '', '[1]');

      return '';
    });

    expect(artifactReader(gh)(42)).toEqual(['[1]']);
    expect(gh.mock.calls[0][0].slice(0, 7)).toEqual([
      'run',
      'download',
      '42',
      '-p',
      'claude-execution-output',
      '-p',
      'claude-execution-output-*',
    ]);
  });

  // gh extracts several artifacts into a folder each, named for the artifact; one into the folder itself.
  it('reads the file of each artifact, and no other file', () => {
    const gh = vi.fn<Gh>(args => {
      extract(args, 'claude-execution-output-12', 'b');
      extract(args, 'claude-execution-output-3', 'c');
      extract(args, 'claude-execution-output', 'a');
      writeFileSync(join(dirOf(args), 'claude-execution-output-9.json'), 'x');

      return '';
    });

    expect(artifactReader(gh)(1).sort()).toEqual(['a', 'b', 'c']);
  });

  it('removes its temporary folder', () => {
    let dir = '';
    const gh = vi.fn<Gh>(args => {
      dir = dirOf(args);
      extract(args, '', '[]');

      return '';
    });

    artifactReader(gh)(1);

    expect(dir).not.toBe('');
    expect(existsSync(dir)).toBe(false);
  });

  it('gives nothing when the download fails', () => {
    const gh = vi.fn<Gh>(() => {
      throw new Error('no artifact');
    });

    expect(artifactReader(gh)(1)).toEqual([]);
  });

  it('gives nothing when the artifact has no output file', () => {
    expect(artifactReader(vi.fn<Gh>(() => ''))(1)).toEqual([]);
  });
});

describe('run', () => {
  const NOW = new Date('2026-10-24T07:00:00Z');
  const ENV = { GH_REPO: 'owner/repo' };

  // workflow file -> its runs; run id -> the artifact text (undefined: none)
  let runs: Record<
    string,
    { conclusion: string; createdAt: string; databaseId: number }[]
  >;
  let artifacts: Record<number, string | string[] | undefined>;
  let open: { number: number; title: string }[];
  let gh: ReturnType<typeof vi.fn<Gh>>;
  let summary: ReturnType<typeof vi.fn<(markdown: string) => void>>;
  // What `gh issue create` prints.
  let created: string;

  const make = (
    id: number,
    createdAt = '2026-10-22T10:00:00Z',
    conclusion = 'success'
  ) => ({
    conclusion,
    createdAt,
    databaseId: id,
  });

  // A run's artifacts: none, one text, or several.
  const read = (id: number) => [artifacts[id] ?? []].flat();

  const audit = (env: Record<string, string> = ENV) =>
    run(
      {
        gh,
        now: NOW,
        readArtifact: read,
        settings: () => NO_RULES,
        summary,
      },
      env
    );

  const calls = (verb: string) =>
    gh.mock.calls.filter(([args]) => args[0] === 'issue' && args[1] === verb);

  beforeEach(() => {
    runs = {
      'claude-build.yml': [],
      'claude-code-review.yml': [],
      'claude-fix-review.yml': [],
      'claude-plan.yml': [],
      'claude-resolve-conflict.yml': [],
      'claude-respond.yml': [],
      'claude-unblock.yml': [],
    };
    artifacts = {};
    open = [];
    created = '';
    summary = vi.fn();
    gh = vi.fn<Gh>(args => {
      if (args[1] === 'create') {
        return created;
      }

      // The artifact listing: the runs that have one, a line each.
      if (args[0] === 'api') {
        return Object.entries(artifacts)
          .filter(([, text]) => text !== undefined)
          .map(([id]) => id)
          .join('\n');
      }

      if (args[0] === 'run') {
        return JSON.stringify(runs[args[args.indexOf('--workflow') + 1]]);
      }

      return args[1] === 'list' ? JSON.stringify(open) : '';
    });
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('needs GH_REPO', () => {
    expect(
      run(
        {
          gh,
          now: NOW,
          readArtifact: () => [],
          settings: () => NO_RULES,
          summary,
        },
        {}
      )
    ).toBe(1);
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('Usage')
    );
    expect(gh).not.toHaveBeenCalled();
  });

  it('asks GitHub for the runs since the date, so skipped runs cannot crowd them out', () => {
    audit();

    for (const workflow of [
      'claude-plan.yml',
      'claude-build.yml',
      'claude-respond.yml',
      'claude-code-review.yml',
      'claude-fix-review.yml',
      'claude-resolve-conflict.yml',
      'claude-unblock.yml',
    ]) {
      expect(gh).toHaveBeenCalledWith([
        'run',
        'list',
        '--workflow',
        workflow,
        '--created',
        '>=2026-10-17',
        '--limit',
        '500',
        '--json',
        'databaseId,createdAt,conclusion',
      ]);
    }
  });

  it('does nothing when no denial repeats', () => {
    runs['claude-plan.yml'] = [make(1)];
    artifacts[1] = artifact('rm a');

    expect(audit()).toBe(0);
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('No denial repeated in 1 runs since 2026-10-17')
    );
    expect(calls('list')).toHaveLength(0);
    expect(calls('create')).toHaveLength(0);
  });

  it('shows the run page what it found, with cost, when no denial repeats', () => {
    runs['claude-plan.yml'] = [make(1)];
    artifacts[1] = artifact('rm a');
    audit();

    expect(summary).toHaveBeenCalledTimes(1);
    expect(summary.mock.calls[0][0]).toBe(
      [
        '### Denial audit',
        '',
        'No denial repeated in 1 runs since 2026-10-17. 1 denials in all. Cost, estimated at API prices: $2.00 for all runs read. The hook cut a leading `cd` from 0 commands.',
      ].join('\n')
    );
  });

  // Each run's workflow is the one whose run list it came from, and its count is the summary's.
  it('reports the cd commands the hook cut, per workflow, in the issue and when no denial repeats', () => {
    const stripped = (count: number) =>
      JSON.stringify(transcript([], { stripped: count }));

    runs['claude-plan.yml'] = [make(1)];
    runs['claude-build.yml'] = [make(2), make(3)];
    artifacts = { 1: stripped(1), 2: stripped(4), 3: stripped(2) };
    audit();

    expect(summary.mock.calls[0][0]).toContain(
      'The hook cut a leading `cd` from 7 commands: build 6, plan 1.'
    );

    runs['claude-respond.yml'] = [make(4), make(5)];
    artifacts[4] = artifact('cat a');
    artifacts[5] = artifact('cat b');
    audit();

    expect(calls('create')[0][1]).toContain(
      'The hook cut a leading `cd` from 7 commands: build 6, plan 1.'
    );
  });

  it('judges each denial against the settings of the workflow that hit it', () => {
    const settings = vi.fn<(file: string) => Settings>(() => NO_RULES);

    runs['claude-build.yml'] = [make(1)];
    runs['claude-code-review.yml'] = [make(2)];
    artifacts = { 1: artifact('rm a'), 2: artifact('rm b') };
    run({ gh, now: NOW, readArtifact: read, settings, summary }, ENV);

    expect(settings.mock.calls.map(([file]) => file).sort()).toEqual([
      'review-settings.json',
      'settings.json',
    ]);
    expect(calls('create')[0][1]).toContain(
      'settings.json: no rule; review-settings.json: no rule'
    );
  });

  it('shows the run page the issue body and the new issue', () => {
    runs['claude-respond.yml'] = [make(1), make(2)];
    artifacts[1] = artifact('cat a');
    artifacts[2] = artifact('cat b');
    created = 'https://github.com/o/r/issues/9\n';
    audit();

    const [page] = summary.mock.calls[0];

    expect(page).toMatch(
      /^### Denial audit\n\nPermission denials in Claude runs/
    );
    expect(page).toContain(
      '| `Bash: cat` | respond | settings.json: no rule | 2 | $0.00 |'
    );
    expect(summary.mock.calls[1][0]).toMatch(
      /^\nOpened issue https:\/\/github\.com\/o\/r\/issues\/9\.$/
    );
  });

  it('shows the run page the issue it updated', () => {
    runs['claude-respond.yml'] = [make(1), make(2)];
    artifacts[1] = artifact('cat a');
    artifacts[2] = artifact('cat b');
    open = [{ number: 9, title: ISSUE_TITLE }];
    audit();

    expect(summary.mock.calls[1][0]).toMatch(/^\nUpdated issue #9\.$/);
  });

  it('still says it opened an issue when gh prints no URL', () => {
    runs['claude-respond.yml'] = [make(1), make(2)];
    artifacts[1] = artifact('cat a');
    artifacts[2] = artifact('cat b');
    audit();

    expect(summary.mock.calls[1][0]).toMatch(/^\nOpened an issue\.$/);
  });

  // 200 patterns that two runs hit: more rows than the issue body can hold.
  const flood = () => {
    runs['claude-respond.yml'] = [make(1), make(2)];

    const commands = Array.from(
      { length: 200 },
      (_, index) => `p${index} ${'x'.repeat(300)}`
    );

    artifacts[1] = artifact(...commands);
    artifacts[2] = artifact(...commands);
  };

  it('shows the run page every row and the full example, and the issue the capped table', () => {
    flood();
    audit({ ...ENV, GITHUB_RUN_ID: '777' });

    const [page] = summary.mock.calls[0];
    const body = calls('create')[0][1] ?? '';

    expect(page.match(/^\| `Bash: p\d+` /gm)).toHaveLength(200);
    expect(page).toContain('x'.repeat(300));
    expect(page).not.toContain('more patterns');
    expect(body.length).toBeLessThanOrEqual(60_000);
    expect(body.match(/^\| `Bash: p\d+` /gm)?.length).toBeLessThan(200);
    expect(body).not.toContain('x'.repeat(201));
  });

  it('links the run page in the issue when GITHUB_RUN_ID is set', () => {
    flood();
    audit({ ...ENV, GITHUB_RUN_ID: '777' });

    expect(calls('create')[0][1]).toMatch(
      /\d+ more patterns are on the \[run page\]\(https:\/\/github\.com\/owner\/repo\/actions\/runs\/777\)\./
    );
  });

  it('omits the link when GITHUB_RUN_ID is not set, or is not digits', () => {
    flood();
    audit();
    audit({ ...ENV, GITHUB_RUN_ID: '7/../x' });

    for (const [, body] of calls('create')) {
      expect(body).toMatch(/\d+ more patterns were left out\./);
      expect(body).not.toContain('run page');
      expect(body).not.toContain('runs/7');
    }

    expect(calls('create')).toHaveLength(2);
  });

  it('shows the run page before it calls GitHub for the issue', () => {
    runs['claude-respond.yml'] = [make(1), make(2)];
    artifacts[1] = artifact('cat a');
    artifacts[2] = artifact('cat b');
    audit();

    expect(summary.mock.invocationCallOrder[0]).toBeLessThan(
      gh.mock.invocationCallOrder[
        gh.mock.calls.findIndex(
          ([args]) => args[1] === 'list' && args[0] === 'issue'
        )
      ]
    );
  });

  it('keeps the run page and returns 1 when the issue call fails', () => {
    flood();

    const base = gh.getMockImplementation() as Gh;

    gh.mockImplementation((args, input) => {
      if (args[1] === 'create') {
        throw new Error('Body is too long (maximum is 65536 characters)');
      }

      return base(args, input);
    });

    expect(audit({ ...ENV, GITHUB_RUN_ID: '777' })).toBe(1);
    expect(summary).toHaveBeenCalledTimes(2);
    expect(summary.mock.calls[0][0]).toContain('| `Bash: p199` ');
    expect(summary.mock.calls[1][0]).toBe(
      '\nThe issue call failed: Error: Body is too long (maximum is 65536 characters)'
    );
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('Body is too long')
    );
  });

  it('opens one issue for denials that repeat', () => {
    runs['claude-plan.yml'] = [make(1)];
    runs['claude-build.yml'] = [make(2)];
    artifacts[1] = artifact('cat a | tail');
    artifacts[2] = artifact('cat b | head');

    expect(audit()).toBe(0);

    const [args, body] = calls('create')[0];

    expect(args).toEqual([
      'issue',
      'create',
      '--title',
      ISSUE_TITLE,
      '--type',
      'Chore',
      '--label',
      'status: draft',
      '--body-file',
      '-',
    ]);
    expect(calls('list')[0][0]).toEqual([
      'issue',
      'list',
      '--state',
      'open',
      '--type',
      'Chore',
      '--json',
      'number,title',
    ]);
    expect(body).toContain(
      '| `Bash: cat` | plan, build | settings.json: no rule | 2 | $0.00 |'
    );
    expect(calls('edit')).toHaveLength(0);
  });

  it('reads the code review runs too', () => {
    runs['claude-code-review.yml'] = [make(1), make(2)];
    artifacts[1] = artifact('cat a | tail');
    artifacts[2] = artifact('cat b | head');

    expect(audit()).toBe(0);
    expect(calls('create')[0][1]).toContain(
      '| `Bash: cat` | code-review | review-settings.json: no rule | 2 | $0.00 |'
    );
  });

  // Most runs have no artifact (every issue close starts an unblock run): one listing says which, so
  // none is downloaded to find out.
  it('lists the artifacts once and downloads only the runs that have one', () => {
    runs['claude-unblock.yml'] = [make(1), make(2), make(3)];
    runs['claude-plan.yml'] = [make(4)];
    artifacts = { 2: artifact('cat a'), 4: artifact('cat b') };

    const read = vi.fn((id: number) => [artifacts[id] ?? []].flat());

    run(
      { gh, now: NOW, readArtifact: read, settings: () => NO_RULES, summary },
      ENV
    );

    expect(read.mock.calls.map(([id]) => id)).toEqual([4, 2]);
    expect(gh.mock.calls.filter(([args]) => args[0] === 'api')).toEqual([
      [
        [
          'api',
          '--paginate',
          'repos/owner/repo/actions/artifacts?per_page=100',
          '--jq',
          expect.stringContaining('.workflow_run.id'),
        ],
      ],
    ]);
  });

  // A failed listing is no reason to lose the audit: every run is downloaded, as before the listing.
  it('downloads every run when the artifact listing fails', () => {
    const listing = gh.getMockImplementation();

    gh.mockImplementation(args => {
      if (args[0] === 'api') {
        throw new Error('HTTP 403');
      }

      return listing?.(args) ?? '';
    });
    runs['claude-unblock.yml'] = [make(1), make(2)];
    artifacts = { 2: artifact('cat a') };

    const read = vi.fn((id: number) => [artifacts[id] ?? []].flat());

    expect(
      run(
        { gh, now: NOW, readArtifact: read, settings: () => NO_RULES, summary },
        ENV
      )
    ).toBe(0);
    expect(read.mock.calls.map(([id]) => id)).toEqual([1, 2]);
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('artifact listing failed')
    );
  });

  // One refresh run has an artifact per freed Spec (plan C482, D2).
  it('reads the refresh runs, every artifact of one, and shows a refresh row', () => {
    runs['claude-unblock.yml'] = [make(1)];
    artifacts[1] = [artifact('cat a'), artifact('cat b')];

    expect(audit()).toBe(0);

    const [, body] = calls('create')[0];

    expect(body).toContain('2 runs read, 2 denials');
    expect(body).toContain(
      '| `Bash: cat` | refresh | refresh-settings.json: no rule | 2 | $0.00 | [1](https://github.com/owner/repo/actions/runs/1) |'
    );
  });

  it('rewrites the open issue instead of opening another', () => {
    runs['claude-respond.yml'] = [make(1), make(2)];
    artifacts[1] = artifact('cat a');
    artifacts[2] = artifact('cat b');
    open = [
      { number: 5, title: 'Something else' },
      { number: 9, title: ISSUE_TITLE },
    ];
    audit();

    expect(calls('create')).toHaveLength(0);
    expect(calls('edit')[0][0]).toEqual([
      'issue',
      'edit',
      '9',
      '--body-file',
      '-',
    ]);
    expect(calls('edit')[0][1]).toContain(
      '| `Bash: cat` | respond | settings.json: no rule | 2 | $0.00 |'
    );
  });

  it('ignores skipped, unfinished and older runs', () => {
    runs['claude-respond.yml'] = [
      make(1),
      make(2, '2026-10-22T10:00:00Z', 'skipped'),
      make(3, '2026-10-22T10:00:00Z', ''),
      make(4, '2026-10-10T10:00:00Z'),
    ];
    artifacts = {
      1: artifact('cat a'),
      2: artifact('cat b'),
      3: artifact('cat c'),
      4: artifact('cat d'),
    };
    audit();

    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('No denial repeated in 1 runs')
    );
  });

  // A transcript array is what runs before the change uploaded (plan C415, D1).
  it('skips a run with no artifact, an unreadable one, or a transcript', () => {
    runs['claude-respond.yml'] = [make(1), make(2), make(3), make(4)];
    artifacts = {
      1: artifact('cat a'),
      2: undefined,
      3: 'half a fi',
      4: JSON.stringify([
        {
          permission_denials: [
            { tool_input: { command: 'cat b' }, tool_name: 'Bash' },
          ],
          type: 'result',
        },
      ]),
    };
    audit();

    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('No denial repeated in 1 runs')
    );
  });
});
