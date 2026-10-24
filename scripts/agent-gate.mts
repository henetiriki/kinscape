import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';

// Checks that run before a plan or build job spends a model run (see claude-spec-agent.yml):
//   plan:  stop if an open PR already closes the issue, or an issue it is "blocked by" is open
//   build: stop if an issue the PR closes is blocked by an open issue
// Usage: node scripts/agent-gate.mts plan|build <issue or PR number>, with GH_REPO set.
// An https RUN_URL, if set, is linked at the end of a stop comment.
// It writes `go=true` or `go=false` to $GITHUB_OUTPUT. On a stop it comments why, and on a plan
// it hands the Spec back as `status: blocked`.

export type Gh = (args: string[], input?: string) => string;

type Closing = { closingIssuesReferences: { number: number }[] };

type Kind = 'build' | 'plan';

const NUMBER = /^[1-9]\d*$/;
const REPO = /^[\w.-]+\/[\w.-]+$/;
const RUN_URL = /^https:\/\/\S+$/;

const json = <T,>(gh: Gh, args: string[]): T => JSON.parse(gh(args));

const list = (numbers: number[]): string =>
  numbers.map(number => `#${number}`).join(', ');

// The issues this one is "blocked by" (GitHub's issue dependencies), only the ones still open.
const openBlockers = (gh: Gh, repo: string, issue: number): number[] =>
  json<{ number: number; state: string }[]>(gh, [
    'api',
    `repos/${repo}/issues/${issue}/dependencies/blocked_by`,
  ])
    .filter(({ state }) => state === 'open')
    .map(({ number }) => number);

const planReasons = (gh: Gh, repo: string, issue: number): string[] => {
  const prs = json<({ number: number } & Closing)[]>(gh, [
    'pr',
    'list',
    '--state',
    'open',
    '--limit',
    '200',
    '--json',
    'number,closingIssuesReferences',
  ])
    .filter(({ closingIssuesReferences }) =>
      closingIssuesReferences.some(({ number }) => number === issue)
    )
    .map(({ number }) => number);
  const blockers = openBlockers(gh, repo, issue);

  return [
    ...(prs.length > 0
      ? [
          `PR ${list(prs)} is already open for this issue. Close it first if you want a new plan.`,
        ]
      : []),
    ...(blockers.length > 0
      ? [`It is blocked by ${list(blockers)}, still open.`]
      : []),
  ];
};

const buildReasons = (gh: Gh, repo: string, pr: number): string[] => {
  const closes = json<Closing>(gh, [
    'pr',
    'view',
    String(pr),
    '--json',
    'closingIssuesReferences',
  ]).closingIssuesReferences.map(({ number }) => number);
  const blockers = [
    ...new Set(closes.flatMap(issue => openBlockers(gh, repo, issue))),
  ];

  return blockers.length > 0
    ? [`The Spec this PR closes is blocked by ${list(blockers)}, still open.`]
    : [];
};

const stop = (
  gh: Gh,
  kind: Kind,
  thread: number,
  reasons: string[],
  footer: string[]
): void => {
  const lines =
    kind === 'plan'
      ? [
          'Not planned yet:',
          '',
          ...reasons.map(reason => `- ${reason}`),
          '',
          'The label is now `status: blocked`. Set `status: ready-for-agent` again when this is resolved.',
        ]
      : [
          'Not built yet:',
          '',
          ...reasons.map(reason => `- ${reason}`),
          '',
          'Approve the plan again when this is resolved.',
        ];

  gh(
    ['issue', 'comment', String(thread), '--body-file', '-'],
    [...lines, ...footer].join('\n')
  );

  if (kind === 'plan') {
    gh([
      'issue',
      'edit',
      String(thread),
      '--remove-label',
      'status: ready-for-agent',
      '--add-label',
      'status: blocked',
    ]);
  }
};

export const run = (
  args: string[],
  env: Record<string, string | undefined>,
  gh: Gh,
  write: (line: string) => void
): number => {
  const [kind, raw] = args;
  const repo = env.GH_REPO ?? '';

  if (
    (kind !== 'plan' && kind !== 'build') ||
    !NUMBER.test(raw ?? '') ||
    !REPO.test(repo)
  ) {
    console.error(
      'Usage: agent-gate plan|build <issue or PR number>, with GH_REPO=<owner>/<repo> set'
    );

    return 1;
  }

  const thread = Number(raw);
  const reasons =
    kind === 'plan'
      ? planReasons(gh, repo, thread)
      : buildReasons(gh, repo, thread);

  write(`go=${reasons.length === 0}`);

  if (reasons.length > 0) {
    // The run's own URL (from the workflow), when it looks like one, so the comment can point back.
    const runUrl = env.RUN_URL ?? '';

    stop(
      gh,
      kind,
      thread,
      reasons,
      RUN_URL.test(runUrl) ? ['', `[Run](${runUrl})`] : []
    );
  }

  return 0;
};

/* v8 ignore next 15 -- only true when run directly with node, not when imported */
if (import.meta.main) {
  const output = process.env.GITHUB_OUTPUT;

  process.exitCode = run(
    process.argv.slice(2),
    process.env,
    (args, input) =>
      execFileSync('gh', args, {
        encoding: 'utf8',
        input,
        maxBuffer: 16 * 1024 * 1024,
      }),
    line => (output ? appendFileSync(output, `${line}\n`) : console.log(line))
  );
}
