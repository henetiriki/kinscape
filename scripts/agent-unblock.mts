import { execFileSync } from 'node:child_process';

// Runs when an issue closes (claude-unblock.yml). For each issue it was blocking (GitHub's "blocked
// by" links) that has no other open blocker left:
//   - labelled `status: blocked`: say so, mention the repo owner, and swap the label for
//     `status: ready-for-dev`; the tech lead then sets `status: ready-for-agent`
//   - with an open PR that closes it (a plan PR whose build the gate stopped): comment on the PR
// Usage: node scripts/agent-unblock.mts <closed issue number>, with GH_REPO and GH_OWNER set.
// An https RUN_URL, if set, is linked at the end of each comment.

export type Gh = (args: string[], input?: string) => string;

type Linked = { labels?: { name: string }[]; number: number; state: string };

const NUMBER = /^[1-9]\d*$/;
const REPO = /^[\w.-]+\/[\w.-]+$/;
const LOGIN = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;
const RUN_URL = /^https:\/\/\S+$/;

const api = (gh: Gh, path: string): Linked[] => JSON.parse(gh(['api', path]));

const open = (issues: Linked[]): Linked[] =>
  issues.filter(({ state }) => state === 'open');

export const run = (
  args: string[],
  env: Record<string, string | undefined>,
  gh: Gh
): number => {
  const [raw] = args;
  const repo = env.GH_REPO ?? '';
  const owner = env.GH_OWNER ?? '';

  if (!NUMBER.test(raw ?? '') || !REPO.test(repo) || !LOGIN.test(owner)) {
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
  const blocking = open(
    api(gh, `repos/${repo}/issues/${closed}/dependencies/blocking`)
  );

  if (blocking.length === 0) {
    console.log(`#${closed} was not blocking an open issue.`);

    return 0;
  }

  const prs: {
    closingIssuesReferences: { number: number }[];
    number: number;
  }[] = JSON.parse(
    gh([
      'pr',
      'list',
      '--state',
      'open',
      '--limit',
      '200',
      '--json',
      'number,closingIssuesReferences',
    ])
  );

  for (const issue of blocking) {
    const remaining = open(
      api(gh, `repos/${repo}/issues/${issue.number}/dependencies/blocked_by`)
    );

    if (remaining.length > 0) {
      console.log(
        `#${issue.number} is still blocked by #${remaining[0].number}.`
      );
      continue;
    }

    if (issue.labels?.some(({ name }) => name === 'status: blocked')) {
      comment(issue.number, [
        `#${closed} is closed, so nothing blocks this any more. The label is now \`status: ready-for-dev\`.`,
        '',
        `@${owner}: set \`status: ready-for-agent\` to start the plan.`,
      ]);
      gh([
        'issue',
        'edit',
        String(issue.number),
        '--remove-label',
        'status: blocked',
        '--add-label',
        'status: ready-for-dev',
      ]);
      console.log(`#${issue.number} is unblocked.`);
    }

    for (const pr of prs.filter(({ closingIssuesReferences }) =>
      closingIssuesReferences.some(({ number }) => number === issue.number)
    )) {
      comment(pr.number, [
        `#${closed} is closed, so the Spec this PR closes (#${issue.number}) is no longer blocked.`,
        '',
        `@${owner}: approve the plan again if its build was stopped.`,
      ]);
      console.log(`Told PR #${pr.number}.`);
    }
  }

  return 0;
};

/* v8 ignore next 9 -- only true when run directly with node, not when imported */
if (import.meta.main) {
  process.exitCode = run(process.argv.slice(2), process.env, (args, input) =>
    execFileSync('gh', args, {
      encoding: 'utf8',
      input,
      maxBuffer: 16 * 1024 * 1024,
    })
  );
}
