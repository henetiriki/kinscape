import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';

import type { DesignShotsCiDeps } from './types.ts';

type Env = Record<string, string | undefined>;

const PROTECTED = 'refs/heads/main';

const SNAPSHOT = /^design\/[^/]+\.jpg$/;

/** The reason the design-shots workflow must not run on `ref`; undefined when it may. */
export const guard = (ref: string): string | undefined => {
  if (!ref.startsWith('refs/heads/')) {
    return `${ref || 'No ref'} is not a branch: run the workflow on a branch.`;
  }

  if (ref === PROTECTED) {
    return 'Refusing to run on main: run the workflow on the branch of your pull request.';
  }

  return undefined;
};

/** Splits `git status --porcelain -z` output into snapshot JPGs and everything else. */
export const parseStatus = (porcelain: string) => {
  const paths = porcelain
    .split('\0')
    .filter(entry => entry !== '')
    .map(entry => entry.slice(3));

  return {
    jpgs: paths.filter(path => SNAPSHOT.test(path)).toSorted(),
    other: paths.filter(path => !SNAPSHOT.test(path)).toSorted(),
  };
};

export const summary = (jpgs: string[]): string =>
  [
    '## Design snapshots',
    '',
    jpgs.length === 0
      ? 'No changes.'
      : `${jpgs.length} ${jpgs.length === 1 ? 'JPG' : 'JPGs'} changed:`,
    '',
    ...jpgs.map(path => `- \`${path}\``),
  ]
    .join('\n')
    .trimEnd()
    .concat('\n');

/**
 * Fails when anything but `design/*.jpg` changed. Writes the summary to `SUMMARY_FILE` and
 * `changed=<count>` to `OUTPUT_FILE`, when set.
 */
export const check = (env: Env, deps: DesignShotsCiDeps): number => {
  const { jpgs, other } = parseStatus(
    deps.git(['status', '--porcelain', '-z', '--untracked-files=all'])
  );

  if (other.length > 0) {
    console.error(`Changed outside design/*.jpg: ${other.join(', ')}`);

    return 1;
  }

  if (env.SUMMARY_FILE) {
    deps.append(env.SUMMARY_FILE, summary(jpgs));
  }

  if (env.OUTPUT_FILE) {
    deps.append(env.OUTPUT_FILE, `changed=${jpgs.length}\n`);
  }

  return 0;
};

/** Runs `guard` (on `REF`) or `check`; returns the exit code. */
export const run = (
  command: string,
  env: Env,
  deps: DesignShotsCiDeps
): number => {
  if (command === 'check') {
    return check(env, deps);
  }

  if (command === 'guard') {
    const problem = guard(env.REF ?? '');

    if (problem) {
      console.error(problem);
    }

    return problem ? 1 : 0;
  }

  console.error('Usage: design-shots-ci.mts guard | check');

  return 2;
};

/* v8 ignore next 6 -- only true when run directly with node, not when imported */
if (import.meta.main) {
  process.exitCode = run(process.argv[2] ?? '', process.env, {
    append: appendFileSync,
    git: args => execFileSync('git', args, { encoding: 'utf8' }),
  });
}
