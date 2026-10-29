import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';

import type { Gh } from './types.ts';

// Checks that run before a plan or build job spends a model run (see claude-run.yml):
//   both:  stop quietly if the issue or PR no longer qualifies (the run's event is out of date)
//   plan:  stop if an open PR already closes the issue, or an issue it is "blocked by" is open
//   build: stop if an issue the PR closes is blocked by an open issue
// Usage: node scripts/agent-gate.mts plan|build <issue or PR number>, with GH_REPO set.
// An https RUN_URL, if set, is linked at the end of a stop comment.
// It writes `go=true` or `go=false` to $GITHUB_OUTPUT. On a stop it comments why. A plan stopped by
// an open blocker also hands the Spec back as `status: blocked`; one stopped only by an open plan PR
// keeps its label, so a repeated label event doesn't mark a planned Spec blocked.

type Closing = { closingIssuesReferences: { number: number }[] };

type Kind = 'build' | 'plan';

// Why a run can't start. `handBack` is true when the Spec should be marked `status: blocked`.
type Stop = { handBack: boolean; reasons: string[] };

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

// A queued run's event may describe a label or title that has since changed (a second run waited
// for the first). Read the issue or PR as it is now; the reason it no longer qualifies, if so.
const staleReason = (
  gh: Gh,
  kind: Kind,
  thread: number
): string | undefined => {
  if (kind === 'plan') {
    const { labels, state } = json<{
      labels: { name: string }[];
      state: string;
    }>(gh, ['issue', 'view', String(thread), '--json', 'state,labels']);

    if (state !== 'OPEN') {
      return 'the issue is closed';
    }

    return labels.some(({ name }) => name === 'status: ready-for-agent')
      ? undefined
      : 'the issue no longer has `status: ready-for-agent`';
  }

  const { isDraft, state, title } = json<{
    isDraft: boolean;
    state: string;
    title: string;
  }>(gh, ['pr', 'view', String(thread), '--json', 'state,isDraft,title']);

  if (state !== 'OPEN') {
    return 'the PR is not open';
  }

  return isDraft && title.endsWith('(plan)')
    ? undefined
    : 'the PR is no longer a draft plan PR';
};

const listOrNone = (numbers: number[]): string =>
  numbers.length > 0 ? list(numbers) : 'none';

const planReasons = (
  gh: Gh,
  repo: string,
  issue: number,
  notes: string[]
): Stop => {
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

  notes.push(
    `Open PRs that close #${issue}: ${listOrNone(prs)}.`,
    `Open issues #${issue} is blocked by: ${listOrNone(blockers)}.`
  );

  return {
    handBack: blockers.length > 0,
    reasons: [
      ...(prs.length > 0
        ? [
            `PR ${list(prs)} is already open for this issue. Close it first if you want a new plan.`,
          ]
        : []),
      ...(blockers.length > 0
        ? [`It is blocked by ${list(blockers)}, still open.`]
        : []),
    ],
  };
};

const buildReasons = (
  gh: Gh,
  repo: string,
  pr: number,
  notes: string[]
): Stop => {
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

  // A PR that closes nothing can't be checked. That is a gap, not a pass, so say so.
  notes.push(
    closes.length > 0
      ? `Issues PR #${pr} closes: ${list(closes)}. Open issues they are blocked by: ${listOrNone(blockers)}.`
      : `PR #${pr} closes no issue, so there is no Spec to check for blockers (a plan PR needs "Closes #<issue>" in its body).`
  );

  return {
    handBack: false,
    reasons:
      blockers.length > 0
        ? [
            `The Spec this PR closes is blocked by ${list(blockers)}, still open.`,
          ]
        : [],
  };
};

const stop = (
  gh: Gh,
  kind: Kind,
  thread: number,
  { handBack, reasons }: Stop,
  footer: string[]
): void => {
  const lines =
    kind === 'plan'
      ? [
          'Not planned yet:',
          '',
          ...reasons.map(reason => `- ${reason}`),
          ...(handBack
            ? [
                '',
                'The label is now `status: blocked`. Set `status: ready-for-agent` again when this is resolved.',
              ]
            : []),
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

  if (handBack) {
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
  write: (line: string) => void,
  summary: (markdown: string) => void
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
  const notes: string[] = [];
  // What the gate checked and decided, in the log and on the run page: a pass otherwise looks
  // the same as a skip. The page's heading carries the verdict, so a pass adds no line for it.
  const report = (go: boolean, verdict: string): void => {
    [...notes, verdict].forEach(line => console.log(line));
    summary(
      [
        `### Gate: ${go ? 'go' : 'stopped'} (${kind} #${thread})`,
        '',
        ...[...notes, ...(go ? [] : [verdict])].map(line => `- ${line}`),
      ].join('\n')
    );
  };
  const stale = staleReason(gh, kind, thread);

  // Not an error: nothing to tell anyone, so no comment and no label change.
  if (stale) {
    write('go=false');
    report(false, `Stopped quietly: ${stale}.`);

    return 0;
  }

  notes.push(
    kind === 'plan'
      ? `#${thread} is open and has \`status: ready-for-agent\`.`
      : `PR #${thread} is an open draft whose title ends "(plan)".`
  );

  const why =
    kind === 'plan'
      ? planReasons(gh, repo, thread, notes)
      : buildReasons(gh, repo, thread, notes);

  const go = why.reasons.length === 0;

  write(`go=${go}`);
  report(go, go ? 'Go.' : `Stopped: ${why.reasons.join(' ')}`);

  if (!go) {
    // The run's own URL (from the workflow), when it looks like one, so the comment can point back.
    const runUrl = env.RUN_URL ?? '';

    stop(
      gh,
      kind,
      thread,
      why,
      RUN_URL.test(runUrl) ? ['', `[Run](${runUrl})`] : []
    );
  }

  return 0;
};

/* v8 ignore next 17 -- only true when run directly with node, not when imported */
if (import.meta.main) {
  const output = process.env.GITHUB_OUTPUT;
  const page = process.env.GITHUB_STEP_SUMMARY;

  process.exitCode = run(
    process.argv.slice(2),
    process.env,
    (args, input) =>
      execFileSync('gh', args, {
        encoding: 'utf8',
        input,
        maxBuffer: 16 * 1024 * 1024,
      }),
    line => (output ? appendFileSync(output, `${line}\n`) : console.log(line)),
    markdown => page && appendFileSync(page, `${markdown}\n`)
  );
}
