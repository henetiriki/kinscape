import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';

import type { Gh } from '#ks/scripts/types.ts';

// Tells claude-run.yml whether the thread is the bot's own PR: opened by $BOT_LOGIN from a branch in
// $GH_REPO. Only then does the `run` job turn off the untrusted-PR deny list of claude-code-action.
// The action counts each `[bot]` author as one without write access, and denies `npm` and other
// commands that run code from the checkout.
// Usage: node scripts/agent-own-pr.mts <issue or PR number>, with GH_REPO and BOT_LOGIN set.
// It writes `own=true` or `own=false` to $GITHUB_OUTPUT. Each case that is not the bot's own PR is
// `own=false` with exit code 0: another author, a fork, a deleted head repo, a thread that is not a
// PR and a failed read. A failed read logs the exit status, not the error text.

const NUMBER = /^[1-9]\d*$/;
const REPO = /^[\w.-]+\/[\w.-]+$/;

// The REST login keeps the `[bot]` suffix that $BOT_LOGIN has. A deleted head repo is `null`.
const FILTER = '{author: .user.login, head: (.head.repo.full_name // "")}';

export const run = (
  args: string[],
  env: Record<string, string | undefined>,
  gh: Gh,
  out: (line: string) => void
): number => {
  const [raw] = args;
  const repo = env.GH_REPO ?? '';
  const bot = env.BOT_LOGIN ?? '';

  if (!NUMBER.test(raw ?? '') || !REPO.test(repo) || bot === '') {
    console.error(
      'Usage: agent-own-pr <issue or PR number>, with GH_REPO=<owner>/<repo> and BOT_LOGIN set'
    );

    return 1;
  }

  const own = (() => {
    try {
      const pr = JSON.parse(
        gh(['api', `repos/${repo}/pulls/${raw}`, '--jq', FILTER])
      );
      const result = pr.author === bot && pr.head === repo;

      console.log(
        `Own PR: #${raw} is by ${pr.author} from ${pr.head || 'no repo'}, so own=${result}.`
      );

      return result;
    } catch (error) {
      const { status } = error as { status?: number };

      console.log(
        `Own PR: the read of #${raw} failed (exit status ${status ?? 'unknown'}).`
      );

      return false;
    }
  })();

  out(`own=${own}`);

  return 0;
};

/* v8 ignore next 13 -- only true when run directly with node, not when imported */
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
