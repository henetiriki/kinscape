import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Gh, Transcript } from '../types.ts';

import {
  artifactReader,
  ISSUE_TITLE,
  issueBody,
  patternOf,
  run,
  summarise,
} from '../denial-audit.mts';

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
  tools: {},
  turns: 10,
  ...extra,
});

// The artifact text for a run that was denied these Bash commands.
const artifact = (...commands: string[]) =>
  JSON.stringify([
    {
      num_turns: 20,
      permission_denials: commands.map(command => ({
        tool_input: { command },
        tool_name: 'Bash',
      })),
      subtype: 'success',
      total_cost_usd: 2,
      type: 'result',
    },
  ]);

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

    expect(report.groups).toEqual([
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
        runs: [1, 2],
      },
    ]);
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
        turns: 100,
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
      '| `Bash: cat a` | 4 | $0.76 | [11](https://github.com/owner/repo/actions/runs/11), [12](https://github.com/owner/repo/actions/runs/12) | `Bash: cat a \\| tail` |'
    );
    expect(body).toContain('`.github/agent/settings.json`');
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
          turns: 0,
        },
        'o/r',
        new Date('2026-10-17T00:00:00Z')
      )
    ).toMatch(/0 turns on average.*0% of the \$0\.00/s);
  });
});

describe('artifactReader', () => {
  const dirOf = (args: string[]) => args[args.indexOf('-D') + 1];

  it('downloads the run artifact and reads its file', () => {
    const gh = vi.fn<Gh>(args => {
      writeFileSync(join(dirOf(args), 'claude-execution-output.json'), '[1]');

      return '';
    });

    expect(artifactReader(gh)(42)).toBe('[1]');
    expect(gh.mock.calls[0][0].slice(0, 5)).toEqual([
      'run',
      'download',
      '42',
      '-n',
      'claude-execution-output',
    ]);
  });

  it('removes its temporary folder', () => {
    let dir = '';
    const gh = vi.fn<Gh>(args => {
      dir = dirOf(args);
      writeFileSync(join(dir, 'claude-execution-output.json'), '[]');

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

    expect(artifactReader(gh)(1)).toBeUndefined();
  });

  it('gives nothing when the artifact has no output file', () => {
    expect(artifactReader(vi.fn<Gh>(() => ''))(1)).toBeUndefined();
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
  let artifacts: Record<number, string | undefined>;
  let open: { number: number; title: string }[];
  let gh: ReturnType<typeof vi.fn<Gh>>;

  const make = (
    id: number,
    createdAt = '2026-10-22T10:00:00Z',
    conclusion = 'success'
  ) => ({
    conclusion,
    createdAt,
    databaseId: id,
  });

  const audit = () =>
    run({ gh, now: NOW, readArtifact: id => artifacts[id] }, ENV);

  const calls = (verb: string) =>
    gh.mock.calls.filter(([args]) => args[0] === 'issue' && args[1] === verb);

  beforeEach(() => {
    runs = { 'claude-build.yml': [], 'claude-plan.yml': [], 'claude.yml': [] };
    artifacts = {};
    open = [];
    gh = vi.fn<Gh>(args => {
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
    expect(run({ gh, now: NOW, readArtifact: () => undefined }, {})).toBe(1);
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
      'claude.yml',
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
      '--label',
      'type: chore',
      '--label',
      'status: draft',
      '--body-file',
      '-',
    ]);
    expect(body).toContain('| `Bash: cat` | 2 | $0.00 |');
    expect(calls('edit')).toHaveLength(0);
  });

  it('rewrites the open issue instead of opening another', () => {
    runs['claude.yml'] = [make(1), make(2)];
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
    expect(calls('edit')[0][1]).toContain('| `Bash: cat` | 2 | $0.00 |');
  });

  it('ignores skipped, unfinished and older runs', () => {
    runs['claude.yml'] = [
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

  it('skips a run with no artifact or an unreadable one', () => {
    runs['claude.yml'] = [make(1), make(2), make(3)];
    artifacts = { 1: artifact('cat a'), 2: undefined, 3: 'half a fi' };
    audit();

    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('No denial repeated in 1 runs')
    );
  });
});
