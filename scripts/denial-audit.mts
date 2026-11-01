import { execFileSync } from 'node:child_process';
import { appendFileSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type { Denial, Gh, Transcript } from './types.ts';

import { inlineCode, readSummary } from './agent-transcript.mts';

// Reads the summaries the past week's plan, build and @claude runs uploaded and keeps one issue up
// to date with the permission denials that repeat, so the allowlist and the rules follow what the
// agents really try. Opens no issue when no denial repeats. Run weekly by claude-denial-audit.yml,
// which shows the result on the run page ($GITHUB_STEP_SUMMARY) as well as in the log.
// Usage: node scripts/denial-audit.mts, with GH_REPO set.

type Deps = {
  gh: Gh;
  now: Date;
  readArtifact: (runId: number) => string | undefined;
  // Appends Markdown to the run page.
  summary: (markdown: string) => void;
};

type Group = {
  costUsd: number;
  count: number;
  example: string;
  pattern: string;
  runs: number[];
};

type Report = {
  costUsd: number;
  denials: number;
  // The estimated cost of the turns that made a denied call, and the cost of the runs that had one.
  deniedCostUsd: number;
  deniedRunsCostUsd: number;
  groups: Group[];
  runs: number;
  turns: number;
  // Denials that couldn't be linked to a turn, so have no cost.
  unlinked: number;
};

export const ISSUE_TITLE = 'Agent permission denials';

const WORKFLOWS = [
  'claude-plan.yml',
  'claude-build.yml',
  'claude-respond.yml',
  'claude-code-review.yml',
  'claude-fix-review.yml',
];
const DAYS = 7;
// A denial repeats when it hit this many runs, or this many times in all.
const REPEAT_RUNS = 2;
const REPEAT_COUNT = 3;
const REPO = /^[\w.-]+\/[\w.-]+$/;

// Programs whose second word says what they do (`gh run`, `npm run`), so it belongs in the pattern.
const WITH_SUBCOMMAND = new Set(['docker', 'gh', 'git', 'npm', 'npx', 'pnpm']);

// What was denied, coarsely: a Bash command by its program (and subcommand), anything else by its tool.
export const patternOf = ({ detail, tool }: Denial): string => {
  // `DESIGN_SCREENS=x npm run …` is `npm run`: the variable's value must not split a group.
  const [program, next] = detail
    .replace(/^(?:[A-Za-z_]\w*=\S* )+/, '')
    .split(' ');

  if (tool !== 'Bash' || !program) {
    return tool;
  }

  return WITH_SUBCOMMAND.has(program) && next && !next.startsWith('-')
    ? `Bash: ${program} ${next}`
    : `Bash: ${program}`;
};

export const artifactReader =
  (gh: Gh) =>
  (runId: number): string | undefined => {
    const dir = mkdtempSync(join(tmpdir(), 'denial-audit-'));

    try {
      gh([
        'run',
        'download',
        String(runId),
        '-n',
        'claude-execution-output',
        '-D',
        dir,
      ]);

      return readFileSync(join(dir, 'claude-execution-output.json'), 'utf8');
    } catch {
      // A run with no artifact (it stopped before Claude started, or it expired) has nothing to read.
      return undefined;
    } finally {
      rmSync(dir, { force: true, recursive: true });
    }
  };

// Most runs of these workflows are skipped (every comment, label and review starts one), so the
// date is asked of GitHub, not left to a count of the newest runs that skipped ones would fill.
const recentRunIds = (gh: Gh, workflow: string, since: Date): number[] =>
  JSON.parse(
    gh([
      'run',
      'list',
      '--workflow',
      workflow,
      '--created',
      `>=${since.toISOString().slice(0, 10)}`,
      '--limit',
      '500',
      '--json',
      'databaseId,createdAt,conclusion',
    ])
  )
    .filter(
      (run: { conclusion: string; createdAt: string }) =>
        run.conclusion !== '' &&
        run.conclusion !== 'skipped' &&
        new Date(run.createdAt) >= since
    )
    .map((run: { databaseId: number }) => run.databaseId);

export const summarise = (
  transcripts: { id: number; transcript: Transcript }[]
): Report => {
  const groups = new Map<string, Group>();

  for (const { id, transcript } of transcripts) {
    for (const denial of transcript.denials) {
      const pattern = patternOf(denial);
      const group = groups.get(pattern) ?? {
        costUsd: 0,
        count: 0,
        example: `${denial.tool}: ${denial.detail}`.replace(/: $/, ''),
        pattern,
        runs: [],
      };

      group.count += 1;
      group.costUsd += denial.costUsd ?? 0;

      if (!group.runs.includes(id)) {
        group.runs.push(id);
      }

      groups.set(pattern, group);
    }
  }

  return {
    costUsd: transcripts.reduce(
      (sum, { transcript }) => sum + (transcript.costUsd ?? 0),
      0
    ),
    denials: transcripts.reduce(
      (sum, { transcript }) => sum + transcript.denials.length,
      0
    ),
    deniedCostUsd: transcripts.reduce(
      (sum, { transcript }) =>
        transcript.denials.reduce(
          (all, { costUsd }) => all + (costUsd ?? 0),
          sum
        ),
      0
    ),
    deniedRunsCostUsd: transcripts
      .filter(({ transcript }) => transcript.denials.length > 0)
      .reduce((sum, { transcript }) => sum + (transcript.costUsd ?? 0), 0),
    groups: [...groups.values()]
      .filter(
        ({ count, runs }) => runs.length >= REPEAT_RUNS || count >= REPEAT_COUNT
      )
      .sort((a, b) => b.count - a.count),
    runs: transcripts.length,
    turns: transcripts.reduce(
      (sum, { transcript }) => sum + (transcript.turns ?? 0),
      0
    ),
    unlinked: transcripts.reduce(
      (sum, { transcript }) =>
        sum +
        transcript.denials.filter(({ costUsd }) => costUsd === undefined)
          .length,
      0
    ),
  };
};

const cell = (text: string): string => inlineCode(text).replaceAll('|', '\\|');

export const issueBody = (
  report: Report,
  repo: string,
  since: Date
): string => {
  const average =
    report.runs === 0 ? 0 : Math.round(report.turns / report.runs);
  const share =
    report.deniedRunsCostUsd === 0
      ? 0
      : Math.round((report.deniedCostUsd / report.deniedRunsCostUsd) * 100);
  const link = (id: number): string =>
    `[${id}](https://github.com/${repo}/actions/runs/${id})`;

  return [
    `Permission denials in Claude runs since ${since.toISOString().slice(0, 10)}: ${report.runs} runs read, ${report.denials} denials, ${average} turns on average.`,
    '',
    `Cost, estimated at API prices: $${report.costUsd.toFixed(2)} for all runs read. The turns that made a denied call cost $${report.deniedCostUsd.toFixed(2)}, ${share}% of the $${report.deniedRunsCostUsd.toFixed(2)} the runs with denials cost. That is a lower bound: the turn after a denial is not counted.${report.unlinked > 0 ? ` ${report.unlinked} of ${report.denials} denials could not be linked to a turn and have no cost.` : ''}`,
    '',
    `These were denied in ${REPEAT_RUNS} or more runs, or ${REPEAT_COUNT} or more times:`,
    '',
    '| Denied | Times | Cost | Runs | Example |',
    '| --- | ---: | ---: | --- | --- |',
    ...report.groups.map(
      ({ costUsd, count, example, pattern, runs }) =>
        `| ${cell(pattern)} | ${count} | $${costUsd.toFixed(2)} | ${runs.map(link).join(', ')} | ${cell(example)} |`
    ),
    '',
    'For each one: allow it in `.github/agent/settings.json`, change `.github/agent/rules.md` so the agent stops trying, or leave it. For the code review, edit `.github/agent/review-settings.json` or `.github/agent/review.md`. The weekly audit rewrites this issue while it stays open; close it when it is handled.',
  ].join('\n');
};

export const run = (
  { gh, now, readArtifact, summary }: Deps,
  env: Record<string, string | undefined>
): number => {
  const repo = env.GH_REPO ?? '';

  if (!REPO.test(repo)) {
    console.error('Usage: denial-audit, with GH_REPO=<owner>/<repo> set');

    return 1;
  }

  const since = new Date(now.getTime() - DAYS * 24 * 60 * 60 * 1000);
  const transcripts = WORKFLOWS.flatMap(workflow =>
    recentRunIds(gh, workflow, since)
  ).flatMap(id => {
    const text = readArtifact(id);
    const transcript = text === undefined ? undefined : readSummary(text);

    return transcript ? [{ id, transcript }] : [];
  });
  const report = summarise(transcripts);

  if (report.groups.length === 0) {
    const none = `No denial repeated in ${report.runs} runs since ${since.toISOString().slice(0, 10)}.`;

    console.log(none);
    summary(
      [
        '### Denial audit',
        '',
        `${none} ${report.denials} denials in all. Cost, estimated at API prices: $${report.costUsd.toFixed(2)} for all runs read.`,
      ].join('\n')
    );

    return 0;
  }

  const body = issueBody(report, repo, since);
  const open: { number: number; title: string }[] = JSON.parse(
    gh([
      'issue',
      'list',
      '--state',
      'open',
      '--label',
      'type: chore',
      '--json',
      'number,title',
    ])
  );
  const existing = open.find(({ title }) => title === ISSUE_TITLE);
  let done: string;

  if (existing) {
    gh(['issue', 'edit', String(existing.number), '--body-file', '-'], body);
    done = `Updated issue #${existing.number}.`;
  } else {
    // `gh issue create` prints the new issue's URL.
    const url = gh(
      [
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
      ],
      body
    ).trim();

    done = url ? `Opened issue ${url}.` : 'Opened an issue.';
  }

  console.log(done);
  summary(['### Denial audit', '', body, '', done].join('\n'));

  return 0;
};

/* v8 ignore next 17 -- only true when run directly with node, not when imported */
if (import.meta.main) {
  const gh: Gh = (args, input) =>
    execFileSync('gh', args, {
      encoding: 'utf8',
      input,
      maxBuffer: 16 * 1024 * 1024,
    });

  const page = process.env.GITHUB_STEP_SUMMARY;

  process.exitCode = run(
    {
      gh,
      now: new Date(),
      readArtifact: artifactReader(gh),
      summary: markdown => page && appendFileSync(page, `${markdown}\n`),
    },
    process.env
  );
}
