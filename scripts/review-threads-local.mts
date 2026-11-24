import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

import { localGh } from '#ks/scripts/gh-fetch.mts';
import { run } from '#ks/scripts/review-threads.mts';

// review-threads.mts with the fetch adapter, for a sandboxed local session (plans/chores/C1219).
// Usage: npm run review:threads:local -- list|resolve|reply <PR number> [<thread id>], with GH_TOKEN set.

/* v8 ignore start -- wiring of process, git and fs; gh-fetch.test.ts covers localGh */
const text = (command: string, args: string[], input?: string, env?: object) =>
  execFileSync(command, args, {
    encoding: 'utf8',
    env: env as NodeJS.ProcessEnv | undefined,
    input,
    maxBuffer: 16 * 1024 * 1024,
  });
const local = localGh(
  process.env,
  args => text('git', args),
  (command, args, input, env) => text(command, args, input, env)
);

if (typeof local === 'string') {
  console.error(local);
  process.exitCode = 1;
} else {
  process.exitCode = run(
    process.argv.slice(2),
    { ...process.env, GH_REPO: local.repo },
    local.gh,
    line => console.log(line),
    () => readFileSync(0, 'utf8')
  );
}
/* v8 ignore stop */
