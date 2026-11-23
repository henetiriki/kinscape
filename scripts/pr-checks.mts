import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';

import type { Gh, PrChecksDeps } from '#ks/scripts/types.ts';

import { ghList } from '#ks/scripts/gh-list.mts';
import { tablePaths, tableRows } from '#ks/scripts/hand-back.mts';

// Runs on a pull request (ci-pr-checks.yml): four rules that the PR template and plans/BUILD.md
// state in prose. Each problem is one line in the job summary and in the log; the exit code is 1
// if a check fails. A failed API call fails the check that needs it and the others still run.
// The workflow runs this file from the base commit, so a PR cannot change the rules that judge it.
// Usage: node scripts/pr-checks.mts <PR number>, with GH_REPO set.

export const CAP = 660;

type Changed = {
  additions: number;
  deletions: number;
  filename: string;
  previous_filename?: string;
  status: string;
};

// A check returns its failure lines; an empty list is a pass.
type Check = (ctx: Ctx) => string[];

type Ctx = {
  files: Changed[];
  gh: Gh;
  plans: () => string[];
  repo: string;
  view: View;
};

type View = {
  baseRefOid: string;
  body: string;
  headRefName: string;
  headRefOid: string;
  labels: { name: string }[];
};

const NUMBER = /^[1-9]\d*$/;
const REPO = /^[\w.-]+\/[\w.-]+$/;
const PLAN = /^plans\/.+\.md$/;
const SKIPPED_BRANCHES = [
  /^bot\/update-action-pins$/,
  /^revert-/,
  /^dependabot\//,
];
const TEST_FILE = /(?:^|\/)__tests__\/|^e2e\//;
const EDITED = ['modified', 'removed', 'renamed', 'changed'];
const TYPES = ['Spec', 'Bug', 'Chore'];
const SECTIONS = [
  'dependencies',
  'devDependencies',
  'optionalDependencies',
  'peerDependencies',
] as const;
const UNCOUNTED = [
  /^package-lock\.json$/,
  /^data\//,
  /^plans\//,
  /^design\/canvas\//,
  /^design\/source\//,
  /^design\/[^/]*\.jpg$/,
  /^design\/cards\//,
];

const paths = ({ filename, previous_filename }: Changed): string[] =>
  previous_filename === undefined ? [filename] : [filename, previous_filename];

const encode = (path: string): string =>
  path.split('/').map(encodeURIComponent).join('/');

const raw = (gh: Gh, repo: string, path: string, ref: string): string =>
  gh([
    'api',
    '-H',
    'Accept: application/vnd.github.raw+json',
    `repos/${repo}/contents/${encode(path)}?ref=${ref}`,
  ]);

const asToken = (name: string): RegExp =>
  new RegExp(
    `(?<![\\w@/.-])${name.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}(?![\\w/.-])`
  );

// Runs a call and turns a throw into a failure line.
const attempt = <T,>(
  check: string,
  call: string,
  action: () => T
): { error: string } | { value: T } => {
  try {
    return { value: action() };
  } catch (error) {
    return { error: `${check}: ${call} failed: ${(error as Error).message}` };
  }
};

// One pass can join the text around a removed comment into a new one (`<!<!-- x -->-- y -->`).
const withoutComments = (text: string): string => {
  const stripped = text.replace(/<!--[\s\S]*?-->/g, '');

  return stripped === text ? text : withoutComments(stripped);
};

const closes = ({ gh, view }: Ctx): string[] => {
  const numbers = new Set(
    Array.from(
      withoutComments(view.body).matchAll(/\bCloses\s+#(\d+)\b/gi),
      ([, number]) => number
    )
  );

  if (numbers.size !== 1) {
    return [
      `Closes: the PR body holds ${numbers.size} \`Closes #n\` lines; it needs exactly one.`,
    ];
  }

  const [number] = numbers;
  const issue = attempt(
    'Closes',
    `reading issue #${number}`,
    (): { issueType: { name: string } | null; state: string } =>
      JSON.parse(gh(['issue', 'view', number, '--json', 'state,issueType']))
  );

  if ('error' in issue) {
    return [issue.error];
  }

  const { issueType, state } = issue.value;
  const type = issueType?.name ?? '';

  return [
    ...(state === 'OPEN' ? [] : [`Closes: issue #${number} is not open.`]),
    ...(TYPES.includes(type)
      ? []
      : [
          `Closes: issue #${number} has the Type "${type}", not Spec, Bug or Chore.`,
        ]),
  ];
};

const editedTests = ({ files, plans }: Ctx): string[] => {
  const edited = files.filter(
    ({ filename, previous_filename, status }) =>
      EDITED.includes(status) &&
      [filename, previous_filename].some(path => TEST_FILE.test(path ?? ''))
  );

  if (edited.length === 0) {
    return [];
  }

  const listed = attempt(
    'Edited tests',
    'reading the plans',
    () => new Set(plans().flatMap(tablePaths))
  );

  if ('error' in listed) {
    return [listed.error];
  }

  return edited
    .filter(file => !paths(file).some(path => listed.value.has(path)))
    .map(
      ({ filename }) =>
        `Edited tests: \`${filename}\` is edited, but the plan's Files that change table does not list it.`
    );
};

const names = (json: string): Set<string> => {
  const parsed = JSON.parse(json) as Record<string, Record<string, string>>;

  return new Set(SECTIONS.flatMap(key => Object.keys(parsed[key] ?? {})));
};

// The lines under `## Deviations` that start with "Big:".
const bigLines = (plan: string): string[] => {
  const lines = plan.split(/\r?\n/);
  const start = lines.findIndex(line => /^##\s+Deviations\s*$/.test(line));

  if (start < 0) {
    return [];
  }

  const rest = lines.slice(start + 1);
  const end = rest.findIndex(line => /^#{1,2}\s/.test(line));

  return (end < 0 ? rest : rest.slice(0, end))
    .map(line => line.trim().replace(/^[-*]\s+/, ''))
    .filter(line => line.startsWith('Big:'));
};

const newDependencies = ({ files, gh, plans, repo, view }: Ctx): string[] => {
  if (!files.some(file => paths(file).includes('package.json'))) {
    return [];
  }

  const found = attempt('New dependencies', 'reading package.json', () => ({
    base: names(raw(gh, repo, 'package.json', view.baseRefOid)),
    head: names(raw(gh, repo, 'package.json', view.headRefOid)),
  }));

  if ('error' in found) {
    return [found.error];
  }

  const added = [...found.value.head].filter(
    name => !found.value.base.has(name)
  );

  if (added.length === 0) {
    return [];
  }

  const text = attempt('New dependencies', 'reading the plans', () => {
    const all = plans();

    return {
      big: all.flatMap(bigLines),
      cells: all.flatMap(plan =>
        tableRows(plan)
          .filter(([first]) => first.includes('`package.json`'))
          .map(cells => cells.join('|'))
      ),
    };
  });

  if ('error' in text) {
    return [text.error];
  }

  return added
    .filter(
      name =>
        ![...text.value.cells, ...text.value.big].some(line =>
          asToken(name).test(line)
        )
    )
    .map(
      name =>
        `New dependencies: \`${name}\` is a new dependency, but the plan names it in no \`package.json\` row and no Big: line.`
    );
};

const size = ({ files, view }: Ctx): string[] => {
  const counted = files
    .filter(({ filename }) => !UNCOUNTED.some(re => re.test(filename)))
    .reduce((sum, { additions, deletions }) => sum + additions + deletions, 0);

  return counted <= CAP ||
    view.labels.some(({ name }) => name === 'size: accepted')
    ? []
    : [
        `Size: ${counted} changed lines, over the cap of ${CAP}. A collaborator can accept the size with the \`size: accepted\` label.`,
      ];
};

const CHECKS: [string, Check][] = [
  ['Closes', closes],
  ['Edited tests', editedTests],
  ['New dependencies', newDependencies],
  ['Size', size],
];

// `from` is the index in CHECKS of the first skipped check.
const skip = (
  view: View,
  files: Changed[]
): { from: number; reason: string } | undefined => {
  if (SKIPPED_BRANCHES.some(re => re.test(view.headRefName))) {
    return { from: 0, reason: `the head branch is \`${view.headRefName}\`` };
  }

  return files.every(file =>
    paths(file).every(path => path.startsWith('plans/'))
  )
    ? { from: 1, reason: 'each changed path is under `plans/`' }
    : undefined;
};

const context = (pr: string, repo: string, gh: Gh): Ctx | string => {
  const loaded = attempt('PR checks', 'reading the PR', () => {
    const view: View = JSON.parse(
      gh([
        'pr',
        'view',
        pr,
        '--json',
        'body,labels,headRefName,baseRefOid,headRefOid',
      ])
    );

    return {
      files: ghList<Changed>(gh, `repos/${repo}/pulls/${pr}/files`),
      view,
    };
  });

  if ('error' in loaded) {
    return loaded.error;
  }

  const { files, view } = loaded.value;
  let cached: string[] | undefined;

  return {
    files,
    gh,
    plans: () => {
      cached ??= files
        .filter(
          ({ filename, status }) => PLAN.test(filename) && status !== 'removed'
        )
        .map(({ filename }) => raw(gh, repo, filename, view.headRefOid));

      return cached;
    },
    repo,
    view,
  };
};

// The summary lines: "- " starts a failure.
const report = (pr: string, repo: string, gh: Gh): string[] => {
  const ctx = context(pr, repo, gh);

  if (typeof ctx === 'string') {
    return [`- ${ctx}`];
  }

  const skipped = skip(ctx.view, ctx.files);

  return CHECKS.flatMap(([name, check], index) => {
    if (skipped !== undefined && index >= skipped.from) {
      return [`${name}: skipped, because ${skipped.reason}.`];
    }

    const found = check(ctx);

    return found.length === 0
      ? [`${name}: pass.`]
      : found.map(line => `- ${line}`);
  });
};

export const run = (
  args: string[],
  env: Record<string, string | undefined>,
  deps: PrChecksDeps
): number => {
  const [pr] = args;
  const repo = env.GH_REPO ?? '';

  if (!NUMBER.test(pr ?? '') || !REPO.test(repo)) {
    console.error(
      'Usage: pr-checks <PR number>, with GH_REPO=<owner>/<repo> set'
    );

    return 1;
  }

  const lines = report(pr, repo, deps.gh);
  const text = lines.join('\n');

  console.log(text);

  if (env.GITHUB_STEP_SUMMARY) {
    deps.append(env.GITHUB_STEP_SUMMARY, `${text}\n`);
  }

  return lines.some(line => line.startsWith('- ')) ? 1 : 0;
};

/* v8 ignore next 14 -- only true when run directly with node, not when imported */
if (import.meta.main) {
  process.exitCode = run(process.argv.slice(2), process.env, {
    append: appendFileSync,
    gh: (args, input) =>
      execFileSync('gh', args, {
        encoding: 'utf8',
        input,
        maxBuffer: 16 * 1024 * 1024,
      }),
  });
}
