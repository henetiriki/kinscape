import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';

import type { Gh } from '#ks/scripts/types.ts';

// Runs when an issue closes (claude-unblock.yml). For each issue it was blocking (GitHub's "blocked
// by" links) that has no other open blocker left:
//   - labelled `status: blocked`: say so, mention the repo owner, and swap the label for
//     `status: ready-for-dev`; the tech lead then sets `status: ready-for-agent`
//   - a Spec (its issue Type) whose closed blocker's merged PR changed a path under
//     `design/canvas/`: swap the label for `status: draft` instead. The comment tells the owner to run `/refine spec <the Spec's
//     own number>`. A design change makes the Spec's size and checks stale.
//   - with an open PR that closes it (a plan PR whose build the gate stopped): comment on the PR
// Usage: node scripts/agent-unblock.mts <closed issue number>, with GH_REPO and GH_OWNER set.
// KINSCAPE_BOT_LOGIN, the agent App's login (`kinscape-agent[bot]`), is optional. If it is unset, the
// script trusts no bot.
// An https RUN_URL, if set, is linked at the end of each comment.
// With GITHUB_OUTPUT set it writes `unblocked=[{"number":8,"blockers":[5]}]`.
// The list holds each swapped issue whose author is the owner, a member, a collaborator or the bot.
// Each entry names the issues that blocked it. claude-unblock.yml refreshes each against main
// (.github/agent/refresh.md).
// If a `gh` call for one issue fails, the script logs it and sets exit code 1. This includes a read of a
// blocker's PR. That issue keeps `status: blocked`. The script continues with the other issues.

type Linked = {
  author_association?: string;
  labels?: { name: string }[];
  number: number;
  state: string;
  type?: { name: string } | null;
  user?: { login?: string };
};

const NUMBER = /^[1-9]\d*$/;
const REPO = /^[\w.-]+\/[\w.-]+$/;
const LOGIN = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;
const BOT = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}(?:\[bot\])?$/i;
const RUN_URL = /^https:\/\/\S+$/;
const TRUSTED = ['OWNER', 'MEMBER', 'COLLABORATOR'];
const DESIGN_PATH = 'design/canvas/';

type Pr = { closingIssuesReferences: { number: number }[]; number: number };

const api = (gh: Gh, path: string): Linked[] => JSON.parse(gh(['api', path]));

const open = (issues: Linked[]): Linked[] =>
  issues.filter(({ state }) => state === 'open');

const hasLabel = ({ labels }: Linked, name: string): boolean =>
  labels?.some(label => label.name === name) ?? false;

const prs = (gh: Gh, state: 'merged' | 'open', limit: number): Pr[] =>
  JSON.parse(
    gh([
      'pr',
      'list',
      '--state',
      state,
      '--limit',
      String(limit),
      '--json',
      'number,closingIssuesReferences',
    ])
  );

// The blockers with a merged PR that changed a path under `design/canvas/`. A blocker with no
// merged PR is not one. A failed `gh` call throws.
const designBlockers = (
  gh: Gh,
  repo: string,
  merged: Pr[],
  blockers: number[]
): number[] =>
  [...blockers]
    .sort((a, b) => a - b)
    .filter(blocker =>
      merged
        .filter(({ closingIssuesReferences }) =>
          closingIssuesReferences.some(({ number }) => number === blocker)
        )
        .some(({ number }) =>
          gh([
            'api',
            `repos/${repo}/pulls/${number}/files`,
            '--paginate',
            '--jq',
            '.[].filename',
          ])
            .split('\n')
            .some(path => path.startsWith(DESIGN_PATH))
        )
    );

const readyLines = (closed: number, owner: string): string[] => [
  `#${closed} is closed, so nothing blocks this any more. The label is now \`status: ready-for-dev\`.`,
  '',
  `@${owner}: set \`status: ready-for-agent\` to start the plan.`,
];

const draftLines = (
  closed: number,
  design: number[],
  owner: string,
  issue: number
): string[] => [
  `#${closed} is closed, so nothing blocks this any more.`,
  `${design.map(number => `#${number}`).join(', ')} changed the design in \`${DESIGN_PATH}\`, so this Spec needs a new size and a new check. The label is now \`status: draft\`.`,
  '',
  `@${owner}: run \`/refine spec ${issue}\`. Then set the status.`,
];

// Comments on a freed issue and swaps its `status: blocked` label: `status: draft` if a blocker
// changed the design, else `status: ready-for-dev`.
const swapLabel = (
  gh: Gh,
  comment: (thread: number, lines: string[]) => void,
  {
    closed,
    design,
    issue,
    owner,
  }: { closed: number; design: number[]; issue: Linked; owner: string }
): void => {
  const draft = design.length > 0;

  comment(
    issue.number,
    draft
      ? draftLines(closed, design, owner, issue.number)
      : readyLines(closed, owner)
  );
  gh([
    'issue',
    'edit',
    String(issue.number),
    '--remove-label',
    'status: blocked',
    '--add-label',
    draft ? 'status: draft' : 'status: ready-for-dev',
  ]);
};

export const run = (
  args: string[],
  env: Record<string, string | undefined>,
  gh: Gh,
  append: (file: string, text: string) => void
): number => {
  const [raw] = args;
  const repo = env.GH_REPO ?? '';
  const owner = env.GH_OWNER ?? '';
  const bot = env.KINSCAPE_BOT_LOGIN ?? '';

  if (
    !NUMBER.test(raw ?? '') ||
    !REPO.test(repo) ||
    !LOGIN.test(owner) ||
    (bot !== '' && !BOT.test(bot))
  ) {
    console.error(
      'Usage: agent-unblock <closed issue number>, with GH_REPO=<owner>/<repo> and GH_OWNER=<login> set'
    );

    return 1;
  }

  const closed = Number(raw);
  const runUrl = env.RUN_URL ?? '';
  const footer = RUN_URL.test(runUrl) ? ['', `[Run](${runUrl})`] : [];
  const comment = (thread: number, lines: string[]): void => {
    gh(
      ['issue', 'comment', String(thread), '--body-file', '-'],
      [...lines, ...footer].join('\n')
    );
  };
  const unblocked: { blockers: number[]; number: number }[] = [];
  let failed = false;
  const output = (): void => {
    if (env.GITHUB_OUTPUT) {
      append(env.GITHUB_OUTPUT, `unblocked=${JSON.stringify(unblocked)}\n`);
    }
  };
  const blocking = open(
    api(gh, `repos/${repo}/issues/${closed}/dependencies/blocking`)
  );

  if (blocking.length === 0) {
    console.log(`#${closed} was not blocking an open issue.`);
    output();

    return 0;
  }

  const openPrs = prs(gh, 'open', 200);
  // The first freed Spec reads the list inside its `try`. A failed call leaves that Spec blocked.
  let merged: Pr[] | undefined;
  const mergedPrs = (): Pr[] => (merged ??= prs(gh, 'merged', 1000));

  for (const issue of blocking) {
    try {
      const blockedBy = api(
        gh,
        `repos/${repo}/issues/${issue.number}/dependencies/blocked_by`
      );
      const remaining = open(blockedBy);

      if (remaining.length > 0) {
        console.log(
          `#${issue.number} is still blocked by #${remaining[0].number}.`
        );
        continue;
      }

      if (hasLabel(issue, 'status: blocked')) {
        const blockers = [
          ...new Set([closed, ...blockedBy.map(({ number }) => number)]),
        ];

        const design =
          issue.type?.name === 'Spec'
            ? designBlockers(gh, repo, mergedPrs(), blockers)
            : [];

        swapLabel(gh, comment, { closed, design, issue, owner });
        console.log(`#${issue.number} is unblocked.`);

        if (
          TRUSTED.includes(issue.author_association ?? '') ||
          (bot !== '' && issue.user?.login === bot)
        ) {
          unblocked.push({ blockers, number: issue.number });
        }
      }

      for (const pr of openPrs.filter(({ closingIssuesReferences }) =>
        closingIssuesReferences.some(({ number }) => number === issue.number)
      )) {
        comment(pr.number, [
          `#${closed} is closed, so the Spec this PR closes (#${issue.number}) is no longer blocked.`,
          '',
          `@${owner}: approve the plan again if its build was stopped.`,
        ]);
        console.log(`Told PR #${pr.number}.`);
      }
    } catch (error) {
      failed = true;
      console.error(`#${issue.number}: ${(error as Error).message}`);
    }
  }

  output();

  return failed ? 1 : 0;
};

/* v8 ignore next 13 -- only true when run directly with node, not when imported */
if (import.meta.main) {
  process.exitCode = run(
    process.argv.slice(2),
    process.env,
    (args, input) =>
      execFileSync('gh', args, {
        encoding: 'utf8',
        input,
        maxBuffer: 16 * 1024 * 1024,
      }),
    appendFileSync
  );
}
