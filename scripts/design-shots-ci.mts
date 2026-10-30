import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';

import type { DesignShotsCiDeps } from './types.ts';

type Env = Record<string, string | undefined>;

const PROTECTED = 'refs/heads/main';

const SNAPSHOT = /^design\/[^/]+\.jpg$/;

const HTML_SNAPSHOT = /^design\/source\/[^/]+\.html$/;

const STATUS = ['status', '--porcelain', '-z', '--untracked-files=all'];

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

/** Splits `git status --porcelain -z` output into HTML snapshots, snapshot JPGs and everything else. */
export const parseStatus = (porcelain: string) => {
  const paths = porcelain
    .split('\0')
    .filter(entry => entry !== '')
    .map(entry => entry.slice(3));

  return {
    html: paths.filter(path => HTML_SNAPSHOT.test(path)).toSorted(),
    jpgs: paths.filter(path => SNAPSHOT.test(path)).toSorted(),
    other: paths
      .filter(path => !SNAPSHOT.test(path) && !HTML_SNAPSHOT.test(path))
      .toSorted(),
  };
};

const section = (label: string, paths: string[]): string[] =>
  paths.length === 0
    ? []
    : [
        '',
        `${paths.length} ${label}${paths.length === 1 ? '' : 's'} changed:`,
        '',
        ...paths.map(path => `- \`${path}\``),
      ];

export const summary = (jpgs: string[], html: string[]): string =>
  [
    '## Design snapshots',
    ...(jpgs.length + html.length === 0 ? ['', 'No changes.'] : []),
    ...section('HTML snapshot', html),
    ...section('JPG', jpgs),
  ]
    .join('\n')
    .concat('\n');

/**
 * Fails when anything but `design/source/*.html` and `design/*.jpg` changed. Writes the summary
 * to `SUMMARY_FILE` and `changed=<count>` to `OUTPUT_FILE`, when set.
 */
export const check = (env: Env, deps: DesignShotsCiDeps): number => {
  const { html, jpgs, other } = parseStatus(deps.git(STATUS));

  if (other.length > 0) {
    console.error(
      `Changed outside design/*.jpg and design/source/*.html: ${other.join(', ')}`
    );

    return 1;
  }

  if (env.SUMMARY_FILE) {
    deps.append(env.SUMMARY_FILE, summary(jpgs, html));
  }

  if (env.OUTPUT_FILE) {
    deps.append(env.OUTPUT_FILE, `changed=${jpgs.length + html.length}\n`);
  }

  return 0;
};

/** Fails, with one error annotation per file, when anything under `design/source` changed. */
export const source = (deps: DesignShotsCiDeps): number => {
  const { html, other } = parseStatus(deps.git(STATUS));
  const changed = [
    ...html,
    ...other.filter(path => path.startsWith('design/source/')),
  ].toSorted();

  for (const path of changed) {
    console.log(
      `::error file=${path}::Hand-edited or stale: run the Design agent shots workflow on this branch.`
    );
  }

  return changed.length > 0 ? 1 : 0;
};

/** Runs `guard` (on `REF`), `check` or `source`; returns the exit code. */
export const run = (
  command: string,
  env: Env,
  deps: DesignShotsCiDeps
): number => {
  if (command === 'check') {
    return check(env, deps);
  }

  if (command === 'source') {
    return source(deps);
  }

  if (command === 'guard') {
    const problem = guard(env.REF ?? '');

    if (problem) {
      console.error(problem);
    }

    return problem ? 1 : 0;
  }

  console.error('Usage: design-shots-ci.mts guard | check | source');

  return 2;
};

/* v8 ignore next 6 -- only true when run directly with node, not when imported */
if (import.meta.main) {
  process.exitCode = run(process.argv[2] ?? '', process.env, {
    append: appendFileSync,
    git: args => execFileSync('git', args, { encoding: 'utf8' }),
  });
}
