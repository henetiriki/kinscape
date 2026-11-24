import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';

import { localGh } from '#ks/scripts/gh-fetch.mts';
import { run } from '#ks/scripts/plan-new.mts';

// plan-new.mts with the fetch adapter, for a sandboxed local session (plans/chores/C1219).
// Usage: npm run plan:new:local -- <issue number> <slug>, with GH_TOKEN set.

/* v8 ignore start -- wiring of process, git and fs; gh-fetch.test.ts covers localGh */
// Piped stderr keeps a 404 off the terminal. The thrown error still holds it as `stderr`.
const exec = (command: string, args: string[], input?: string, env?: object) =>
  execFileSync(command, args, {
    encoding: 'utf8',
    env: env as NodeJS.ProcessEnv | undefined,
    input,
    maxBuffer: 16 * 1024 * 1024,
    stdio: ['pipe', 'pipe', 'pipe'],
  });
const local = localGh(
  process.env,
  args => exec('git', args),
  (command, args, input, env) => exec(command, args, input, env)
);

if (typeof local === 'string') {
  console.error(local);
  process.exitCode = 1;
} else {
  process.exitCode = run(process.argv.slice(2), {
    files: {
      list: dir => (existsSync(dir) ? readdirSync(dir) : []),
      read: path => readFileSync(path, 'utf8'),
      write: (path, text) => writeFileSync(path, text),
    },
    gh: local.gh,
    git: args => exec('git', args),
  });
}
/* v8 ignore stop */
