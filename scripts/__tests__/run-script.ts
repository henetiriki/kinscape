import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Runs a step's script with fake commands first on PATH. A fake is a shell script body, and
// it appends to "$LOG". Returns the exit status, stdout, what the fakes logged and what the
// script wrote to GITHUB_OUTPUT. `flags` are bash's options: a step with `shell: bash` runs with
// `-e -o pipefail`, one with no `shell:` with `-e`.
export const runScript = (
  run: string | undefined,
  fakes: Record<string, string>,
  env: Record<string, string>,
  flags: string[] = ['-e']
) => {
  const dir = mkdtempSync(join(tmpdir(), 'run-script-'));
  const log = join(dir, 'log');
  const output = join(dir, 'output');

  for (const [name, body] of Object.entries(fakes)) {
    writeFileSync(join(dir, name), `#!/bin/sh\n${body}\n`, { mode: 0o755 });
  }

  const result = spawnSync('bash', [...flags, '-c', run ?? ''], {
    encoding: 'utf8',
    env: {
      ...process.env,
      ...env,
      GITHUB_OUTPUT: output,
      LOG: log,
      PATH: `${dir}:${process.env.PATH}`,
    },
  });
  const contents = (file: string) =>
    existsSync(file) ? readFileSync(file, 'utf8') : '';
  const logged = contents(log);
  const outputs = contents(output);

  rmSync(dir, { force: true, recursive: true });

  return { ...result, log: logged, outputs };
};
