import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

import type { Gh } from './types.ts';

// Runs on a pull request (claude-hand-back.yml): plans/README.md rule 13's marker. Adds the label
// `hand-back` when a path in the diff, or in the Files that change table of a plan the PR changes
// (read from the head commit as data), matches a pattern in the base commit's .github/CODEOWNERS,
// apart from EXEMPT. Does nothing for a fork or a PR that has the label.
// A failed `gh` call is logged and the exit code is 1; a failed plan fetch skips that plan only.
// Usage: node scripts/hand-back.mts <PR number>, with GH_REPO set.

type Changed = { filename: string; previous_filename?: string; status: string };

type View = {
  headRefOid: string;
  isCrossRepository: boolean;
  labels: { name: string }[];
};

// Code-owner paths that don't hand a PR back; the one place they are listed.
export const EXEMPT = ['server/**', 'scripts/layers.mts'];

const LABEL = 'hand-back';
const NUMBER = /^[1-9]\d*$/;
const REPO = /^[\w.-]+\/[\w.-]+$/;
const PLAN = /^plans\/.+\.md$/;
const SECTION = /^#{1,6}\s+Files that change\s*$/i;
const HEADING = /^#{1,6}\s/;
const UNSUPPORTED = /[![\]\\]/;
const TOKENS: Record<string, string> = {
  '?': '[^/]',
  '*': '[^/]*',
  '**': '.*',
  '**/': '(?:.*/)?',
  '/**': '/.*',
};

// A CODEOWNERS pattern as gitignore reads it: with a `/` before its end it is anchored to the
// root, otherwise it matches at any depth; it also matches everything below a directory.
const toRegExp = (pattern: string): RegExp => {
  if (UNSUPPORTED.test(pattern)) {
    throw new Error(`Unsupported CODEOWNERS pattern: ${pattern}`);
  }

  const body = pattern.replace(/\/$/, '');
  const source = body
    .replace(/^\//, '')
    .replace(/\*\*\/|\/\*\*$|\*\*|\*|\?|[.+^${}()|]/g, token =>
      Object.hasOwn(TOKENS, token) ? TOKENS[token] : `\\${token}`
    );

  return new RegExp(
    `^${body.includes('/') ? '' : '(?:.*/)?'}${source}(?:/.*)?$`
  );
};

export const matcher = (codeowners: string): ((path: string) => boolean) => {
  const exempt = EXEMPT.map(toRegExp);
  const owned = codeowners
    .split('\n')
    .map(line => line.replace(/#.*/, '').trim().split(/\s+/))
    .filter(([pattern, owner]) => pattern !== '' && owner !== undefined)
    .map(([pattern]) => toRegExp(pattern));

  return path =>
    !exempt.some(re => re.test(path)) && owned.some(re => re.test(path));
};

// The backticked paths in the first column of a plan's Files that change table.
export const tablePaths = (plan: string): string[] => {
  const lines = plan.split(/\r?\n/);
  const start = lines.findIndex(line => SECTION.test(line));

  if (start < 0) {
    return [];
  }

  const rest = lines.slice(start + 1);
  const end = rest.findIndex(line => HEADING.test(line));

  return (end < 0 ? rest : rest.slice(0, end))
    .map(line => line.trim())
    .filter(line => line.startsWith('|'))
    .flatMap(line =>
      Array.from(line.split('|')[1].matchAll(/`([^`]+)`/g), ([, path]) => path)
    );
};

export const run = (
  args: string[],
  env: Record<string, string | undefined>,
  gh: Gh,
  codeowners: string
): number => {
  const [pr] = args;
  const repo = env.GH_REPO ?? '';

  if (!NUMBER.test(pr ?? '') || !REPO.test(repo)) {
    console.error(
      'Usage: hand-back <PR number>, with GH_REPO=<owner>/<repo> set'
    );

    return 1;
  }

  const owned = matcher(codeowners);
  let failed = false;
  const attempt = <T,>(what: string, action: () => T): T | undefined => {
    try {
      return action();
    } catch (error) {
      failed = true;
      console.error(`Hand back: ${what} failed: ${(error as Error).message}`);

      return undefined;
    }
  };
  const label = (found: string): number => {
    console.log(`Hand back: ${found}.`);
    attempt('adding the label', () =>
      gh([
        'api',
        '-X',
        'POST',
        `repos/${repo}/issues/${pr}/labels`,
        '-f',
        `labels[]=${LABEL}`,
      ])
    );

    return failed ? 1 : 0;
  };
  const view = attempt('reading the PR', (): View =>
    JSON.parse(
      gh(['pr', 'view', pr, '--json', 'headRefOid,isCrossRepository,labels'])
    )
  );

  if (view === undefined) {
    return 1;
  }

  if (view.isCrossRepository) {
    console.log('Hand back: the PR is from a fork.');

    return 0;
  }

  if (view.labels.some(({ name }) => name === LABEL)) {
    console.log('Hand back: the PR already has the label.');

    return 0;
  }

  const files = attempt('listing the changed files', (): Changed[] =>
    gh([
      'api',
      '--paginate',
      `repos/${repo}/pulls/${pr}/files`,
      '--jq',
      '.[] | @json',
    ])
      .split('\n')
      .filter(line => line !== '')
      .map(line => JSON.parse(line))
  );

  if (files === undefined) {
    return 1;
  }

  const inDiff = files
    .flatMap(({ filename, previous_filename }) =>
      previous_filename === undefined
        ? [filename]
        : [filename, previous_filename]
    )
    .find(owned);

  if (inDiff !== undefined) {
    return label(`${inDiff} is in the diff`);
  }

  for (const { filename } of files.filter(
    ({ filename, status }) => PLAN.test(filename) && status !== 'removed'
  )) {
    const plan = attempt(`fetching ${filename}`, () =>
      gh([
        'api',
        '-H',
        'Accept: application/vnd.github.raw+json',
        `repos/${repo}/contents/${filename.split('/').map(encodeURIComponent).join('/')}?ref=${view.headRefOid}`,
      ])
    );
    const named = tablePaths(plan ?? '').find(owned);

    if (named !== undefined) {
      return label(`${named} is in the Files that change of ${filename}`);
    }
  }

  console.log('Hand back: no code-owner path.');

  return failed ? 1 : 0;
};

/* v8 ignore next 14 -- only true when run directly with node, not when imported */
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
    readFileSync('.github/CODEOWNERS', 'utf8')
  );
}
