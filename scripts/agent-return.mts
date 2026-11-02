import { execFileSync } from 'node:child_process';

import type { Gh } from './types.ts';

// Hands an issue back to the tech lead when a plan or build run ends on Claude's turn (see
// claude-run.yml, whose `return` job calls this once the run, or the gate that stops it, has ended).
//   plan:  the thread is the issue; hand it back if no open PR closes it
//   build: the thread is the plan PR; hand back each issue it closes if it is still an open draft
//          whose title ends "(plan)"
// Handing back swaps `status: ready-for-agent` for `status: ready-for-dev`, with no comment: the
// agent's own comment, the fallback or the gate's stop already says why. An issue on any other
// status (`blocked`, `ready-for-dev`) is left alone.
// Usage: node scripts/agent-return.mts plan|build <issue or PR number>, with GH_REPO set.
// A failed `gh` call is logged, the other issues go on, and the exit code is 1.

type Closing = {
  closingIssuesReferences: {
    number: number;
    repository: { name: string; owner: { login: string } };
  }[];
};

const NUMBER = /^[1-9]\d*$/;
const REPO = /^[\w.-]+\/[\w.-]+$/;
const AGENT = 'status: ready-for-agent';
const DEV = 'status: ready-for-dev';

const json = <T,>(gh: Gh, args: string[]): T => JSON.parse(gh(args));

export const run = (
  args: string[],
  env: Record<string, string | undefined>,
  gh: Gh
): number => {
  const [kind, raw] = args;
  const repo = env.GH_REPO ?? '';

  if (
    (kind !== 'plan' && kind !== 'build') ||
    !NUMBER.test(raw ?? '') ||
    !REPO.test(repo)
  ) {
    console.error(
      'Usage: agent-return plan|build <issue or PR number>, with GH_REPO=<owner>/<repo> set'
    );

    return 1;
  }

  const thread = Number(raw);
  const [owner, name] = repo.split('/');
  let failed = false;
  const attempt = <T,>(number: number, action: () => T): T | undefined => {
    try {
      return action();
    } catch (error) {
      failed = true;
      console.error(`#${number}: ${(error as Error).message}`);

      return undefined;
    }
  };
  // Swaps the label if the issue is still on Claude's turn and `may` agrees.
  const handBack = (issue: number, may: () => boolean): void => {
    const { labels } = json<{ labels: { name: string }[] }>(gh, [
      'issue',
      'view',
      String(issue),
      '--json',
      'labels',
    ]);

    if (labels.some(({ name: label }) => label === AGENT) && may()) {
      gh([
        'issue',
        'edit',
        String(issue),
        '--remove-label',
        AGENT,
        '--add-label',
        DEV,
      ]);
      console.log(`Return: #${issue} is now ${DEV}.`);
    }
  };

  if (kind === 'plan') {
    attempt(thread, () =>
      handBack(
        thread,
        () =>
          !json<({ number: number } & Closing)[]>(gh, [
            'pr',
            'list',
            '--state',
            'open',
            '--limit',
            '200',
            '--json',
            'number,closingIssuesReferences',
          ]).some(({ closingIssuesReferences }) =>
            closingIssuesReferences.some(({ number }) => number === thread)
          )
      )
    );

    return failed ? 1 : 0;
  }

  const issues = attempt(thread, () => {
    const pr = json<
      { isDraft: boolean; state: string; title: string } & Closing
    >(gh, [
      'pr',
      'view',
      String(thread),
      '--json',
      'state,isDraft,title,closingIssuesReferences',
    ]);

    return pr.state === 'OPEN' && pr.isDraft && pr.title.endsWith('(plan)')
      ? pr.closingIssuesReferences.flatMap(({ number, repository }) =>
          repository.name === name && repository.owner.login === owner
            ? [number]
            : []
        )
      : [];
  });

  issues?.forEach(issue => attempt(issue, () => handBack(issue, () => true)));

  return failed ? 1 : 0;
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
