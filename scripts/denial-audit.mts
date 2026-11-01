import { execFileSync, spawnSync } from 'node:child_process';
import {
  appendFileSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type { Denial, Gh, Settings, Transcript } from './types.ts';

import { inlineCode, readSummary } from './agent-transcript.mts';

// Reads the summaries the past week's plan, build, @claude, review, fix and refresh runs uploaded and keeps one issue up
// to date with the permission denials that repeat, so the allowlist and the rules follow what the
// agents really try. Opens no issue when no denial repeats. Run weekly by claude-denial-audit.yml,
// which shows the result on the run page ($GITHUB_STEP_SUMMARY) as well as in the log.
// Usage: node scripts/denial-audit.mts, with GH_REPO set.

type Deps = {
  gh: Gh;
  now: Date;
  // The summaries a run uploaded, one per Claude session: none, one, or several (a refresh run has one per Spec).
  readArtifact: (runId: number) => string[];
  // A settings file in .github/agent/: its rules, and the command of its Bash hook.
  settings: (file: string) => Settings;
  // Appends Markdown to the run page.
  summary: (markdown: string) => void;
};

type Group = {
  costUsd: number;
  count: number;
  example: string;
  pattern: string;
  runs: number[];
  // What the settings of each workflow that hit it say about it, and what to do.
  settings: string;
  suggestion: string;
  // The workflows that hit it: plan, build, code-review, refresh.
  workflows: string[];
};

type Report = {
  costUsd: number;
  denials: number;
  // The estimated cost of the turns that made a denied call, and the cost of the runs that had one.
  deniedCostUsd: number;
  deniedRunsCostUsd: number;
  groups: Group[];
  runs: number;
  // The Bash calls the hook cut a leading `cd` from, per workflow with any.
  stripped: Record<string, number>;
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
  'claude-unblock.yml',
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

// The code review and the unblock refresh have settings of their own; every other workflow runs
// with settings.json.
const SETTINGS_FILES: Record<string, string> = {
  'claude-code-review.yml': 'review-settings.json',
  'claude-unblock.yml': 'refresh-settings.json',
};

const settingsFileOf = (workflow: string): string =>
  SETTINGS_FILES[workflow] ?? 'settings.json';

// The name shown in the Workflow column: the file's name, but the unblock workflow's Claude is the
// refresh agent (the unblock job runs none).
const NAMES: Record<string, string> = { 'claude-unblock.yml': 'refresh' };

const shortName = (workflow: string): string =>
  NAMES[workflow] ?? workflow.replace(/^claude-|\.yml$/g, '');

// Whether a permission rule covers a call, as Claude Code reads one: `Tool` is every use of the
// tool, `Bash(prefix:*)` a command that is the prefix or starts with it and a space, and any other
// `Bash(...)` the whole command, with `*` for any text. Path rules (`Read(...)`) are not matched.
const covers = (rule: string, tool: string, command: string): boolean => {
  const [, name, spec] = rule.match(/^(\w+)(?:\((.*)\))?$/s) ?? [];

  if (name !== tool) {
    return false;
  }

  if (spec === undefined) {
    return true;
  }

  if (tool !== 'Bash') {
    return false;
  }

  if (spec.endsWith(':*')) {
    const prefix = spec.slice(0, -2);

    return command === prefix || command.startsWith(`${prefix} `);
  }

  return new RegExp(
    `^${spec.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replaceAll('*', '.*')}$`,
    's'
  ).test(command);
};

// Whether the settings' Bash hook denies the command. It runs the hook as Claude Code does, with
// no directory, so it cuts no `cd`.
const hookDenies = (hook: string, command: string): boolean => {
  const { stdout } = spawnSync('bash', ['-c', hook], {
    encoding: 'utf8',
    input: JSON.stringify({ cwd: '', tool_input: { command } }),
  });

  try {
    return JSON.parse(stdout).hookSpecificOutput.permissionDecision === 'deny';
  } catch {
    // No output, or a hook that fails, leaves the call to the rules.
    return false;
  }
};

// What a settings file says about a denied call: the hook, a deny rule, an allow rule, or nothing.
const statusOf = (
  { allow, deny, hook }: Settings,
  { detail, tool }: Denial
): string => {
  if (tool === 'Bash' && hook && hookDenies(hook, detail)) {
    return 'denied by the hook';
  }

  const denied = deny.find(rule => covers(rule, tool, detail));

  if (denied) {
    return `denied by ${inlineCode(denied)}`;
  }

  const allowed = allow.find(rule => covers(rule, tool, detail));

  return allowed ? `allowed by ${inlineCode(allowed)}` : 'no rule';
};

// What to do about a group, from its status in one settings file (issue #480).
const suggestionOf = (status: string): string => {
  if (status.startsWith('denied')) {
    return 'The agent is ignoring it, hook or prose.';
  }

  return status.startsWith('allowed')
    ? 'A chained part was denied.'
    : 'Allow it or hook it.';
};

// Reads the settings files in a folder (.github/agent) when the audit asks for one.
export const settingsReader =
  (dir: string) =>
  (file: string): Settings => {
    const { hooks, permissions } = JSON.parse(
      readFileSync(join(dir, file), 'utf8')
    ) as {
      hooks?: {
        PreToolUse?: { hooks: { command: string }[]; matcher: string }[];
      };
      permissions?: { allow?: string[]; deny?: string[] };
    };

    return {
      allow: permissions?.allow ?? [],
      deny: permissions?.deny ?? [],
      hook: hooks?.PreToolUse?.find(({ matcher }) => matcher === 'Bash')
        ?.hooks[0].command,
    };
  };

const OUTPUT_FILE = 'claude-execution-output.json';

// Reads the file of every artifact named claude-execution-output or starting with it. gh extracts
// one artifact into the folder itself and several into a folder each, so every folder is searched.
export const artifactReader =
  (gh: Gh) =>
  (runId: number): string[] => {
    const dir = mkdtempSync(join(tmpdir(), 'denial-audit-'));

    try {
      gh([
        'run',
        'download',
        String(runId),
        '-p',
        'claude-execution-output',
        '-p',
        'claude-execution-output-*',
        '-D',
        dir,
      ]);

      return readdirSync(dir, { recursive: true, withFileTypes: true })
        .filter(entry => entry.isFile() && entry.name === OUTPUT_FILE)
        .map(entry => join(entry.parentPath, entry.name))
        .sort()
        .map(path => readFileSync(path, 'utf8'));
    } catch {
      // A run with no artifact (it stopped before Claude started, or it expired) has nothing to read.
      return [];
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
  transcripts: { id: number; transcript: Transcript; workflow: string }[],
  settings: (file: string) => Settings
): Report => {
  // Each group keeps the first denial it saw under each settings file, to judge against that file,
  // and the sessions (one per transcript) it hit: a refresh run with several has the same run id
  // in each, so the run is linked once but each session counts toward a repeat (plan C482, D2).
  const groups = new Map<string, { firstBy: Map<string, Denial> } & Group>();
  const sessionsOf = new Map<string, Set<number>>();
  const stripped: Record<string, number> = {};

  for (const [session, { id, transcript, workflow }] of transcripts.entries()) {
    const file = settingsFileOf(workflow);
    const name = shortName(workflow);

    if (transcript.stripped > 0) {
      stripped[name] = (stripped[name] ?? 0) + transcript.stripped;
    }

    for (const denial of transcript.denials) {
      const pattern = patternOf(denial);
      const group = groups.get(pattern) ?? {
        costUsd: 0,
        count: 0,
        example: `${denial.tool}: ${denial.detail}`.replace(/: $/, ''),
        firstBy: new Map<string, Denial>(),
        pattern,
        runs: [],
        settings: '',
        suggestion: '',
        workflows: [],
      };

      group.count += 1;
      group.costUsd += denial.costUsd ?? 0;
      sessionsOf.set(
        pattern,
        (sessionsOf.get(pattern) ?? new Set()).add(session)
      );

      if (!group.runs.includes(id)) {
        group.runs.push(id);
      }

      if (!group.workflows.includes(name)) {
        group.workflows.push(name);
      }

      if (!group.firstBy.has(file)) {
        group.firstBy.set(file, denial);
      }

      groups.set(pattern, group);
    }
  }

  const repeating = new Set(
    [...sessionsOf]
      .filter(([, sessions]) => sessions.size >= REPEAT_RUNS)
      .map(([pattern]) => pattern)
  );

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
        ({ count, pattern }) => repeating.has(pattern) || count >= REPEAT_COUNT
      )
      .sort((a, b) => b.count - a.count)
      .map(({ firstBy, ...group }) => {
        const rows = [...firstBy].map(([file, denial]) => ({
          file,
          status: statusOf(settings(file), denial),
        }));

        return {
          ...group,
          settings: rows
            .map(({ file, status }) => `${file}: ${status}`)
            .join('; '),
          suggestion: [
            ...new Set(rows.map(({ status }) => suggestionOf(status))),
          ].join(' '),
        };
      }),
    runs: transcripts.length,
    stripped,
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

const plain = (text: string): string => text.replaceAll('|', '\\|');

// How many `cd` commands the hook cut, in all and per workflow.
const strippedLine = ({ stripped }: Report): string => {
  const entries = Object.entries(stripped).sort(([a], [b]) =>
    a.localeCompare(b)
  );
  const total = entries.reduce((sum, [, count]) => sum + count, 0);

  return `The hook cut a leading \`cd\` from ${total} commands${entries.length > 0 ? `: ${entries.map(([name, count]) => `${name} ${count}`).join(', ')}` : ''}.`;
};

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
    strippedLine(report),
    '',
    `These were denied in ${REPEAT_RUNS} or more runs, or ${REPEAT_COUNT} or more times:`,
    '',
    '| Denied | Workflows | Settings | Times | Cost | Runs | Example | Suggestion |',
    '| --- | --- | --- | ---: | ---: | --- | --- | --- |',
    ...report.groups.map(
      ({
        costUsd,
        count,
        example,
        pattern,
        runs,
        settings,
        suggestion,
        workflows,
      }) =>
        `| ${cell(pattern)} | ${workflows.join(', ')} | ${plain(settings)} | ${count} | $${costUsd.toFixed(2)} | ${runs.map(link).join(', ')} | ${cell(example)} | ${plain(suggestion)} |`
    ),
    '',
    'For each one: allow it in `.github/agent/settings.json`, change `.github/agent/rules.md` so the agent stops trying, or leave it. For the code review, edit `.github/agent/review-settings.json` or `.github/agent/review.md`. For the unblock refresh, edit `.github/agent/refresh-settings.json` or `.github/agent/refresh.md`. The weekly audit rewrites this issue while it stays open; close it when it is handled.',
  ].join('\n');
};

export const run = (
  { gh, now, readArtifact, settings, summary }: Deps,
  env: Record<string, string | undefined>
): number => {
  const repo = env.GH_REPO ?? '';

  if (!REPO.test(repo)) {
    console.error('Usage: denial-audit, with GH_REPO=<owner>/<repo> set');

    return 1;
  }

  const since = new Date(now.getTime() - DAYS * 24 * 60 * 60 * 1000);
  const transcripts = WORKFLOWS.flatMap(workflow =>
    recentRunIds(gh, workflow, since).flatMap(id =>
      readArtifact(id).flatMap(text => {
        const transcript = readSummary(text);

        return transcript ? [{ id, transcript, workflow }] : [];
      })
    )
  );
  const report = summarise(transcripts, settings);

  if (report.groups.length === 0) {
    const none = `No denial repeated in ${report.runs} runs since ${since.toISOString().slice(0, 10)}.`;

    console.log(none);
    summary(
      [
        '### Denial audit',
        '',
        `${none} ${report.denials} denials in all. Cost, estimated at API prices: $${report.costUsd.toFixed(2)} for all runs read. ${strippedLine(report)}`,
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

/* v8 ignore next 18 -- only true when run directly with node, not when imported */
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
      settings: settingsReader('.github/agent'),
      summary: markdown => page && appendFileSync(page, `${markdown}\n`),
    },
    process.env
  );
}
