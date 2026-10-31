import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

import type { Gh } from './types.ts';

import { invisible } from './vercel-ignore.mts';

// Runs on a pull request event (backlog-issue-status.yml): keeps the `status:` label of each
// Spec, Bug or Chore the PR closes in step with the PR. The row comes from the event payload as it
// was when the event fired. The table:
//   plan PR opened (draft, title ends "(plan)")            -> ready-for-dev
//   plan approved by the owner, no `hand-back` label        -> ready-for-agent
//   PR ready (marked, or opened), user-visible              -> ready-for-po
//   PR ready, otherwise                                     -> ready-for-dev
//   approved by the owner, a member or a collaborator, ready -> ready-for-dev
// User-visible: the issue is a Spec or Bug, a changed file fails `invisible()`, and the PR's
// `## For the PO` has text once HTML comments are removed.
// Does nothing for a fork, a `status: blocked` issue or one already on its target. A failed `gh`
// call is logged, the other issues go on, and the exit code is 1.
// Usage: node scripts/issue-status.mts, with GH_REPO, GITHUB_EVENT_NAME and GITHUB_EVENT_PATH set.

type Changed = { filename: string; previous_filename?: string };

type Event = {
  action: string;
  pull_request?: {
    body: null | string;
    draft: boolean;
    head: { repo: { full_name: string } | null };
    labels: { name: string }[];
    number: number;
    title: string;
  };
  review?: { author_association: string; state: string };
};

// 'ready' is rows 3 and 4: the PO if the change is user-visible, otherwise the tech lead.
type Move = 'agent' | 'dev' | 'ready';

const REPO = /^[\w.-]+\/[\w.-]+$/;
const PLAN = /\(plan\)$/;
const PO_HEADING = /^#{1,6}\s+For the PO\s*$/i;
const HEADING = /^#{1,6}\s/;
const HAND_BACK = 'hand-back';
const STATUS = 'status: ';
const TARGET = {
  agent: `${STATUS}ready-for-agent`,
  dev: `${STATUS}ready-for-dev`,
  po: `${STATUS}ready-for-po`,
};
const BLOCKED = `${STATUS}blocked`;
const TYPES = ['type: spec', 'type: bug', 'type: chore'];
const VISIBLE_TYPES = ['type: spec', 'type: bug'];
const MAY_MOVE_A_READY_PR = ['OWNER', 'MEMBER', 'COLLABORATOR'];

// Removes HTML comments until none is left (one pass can join the pieces of a new one, as in
// `<!<!-- x -->-->`), then an unterminated one with all that follows, as GitHub renders it.
const withoutComments = (text: string): string => {
  let previous: string;
  let current = text;

  do {
    previous = current;
    current = previous.replace(/<!--[\s\S]*?-->/g, '');
  } while (current !== previous);

  return current.replace(/<!--[\s\S]*$/, '');
};

// Whether the PR body has text under `## For the PO` once HTML comments are removed.
const hasForThePo = (body: null | string): boolean => {
  const lines = withoutComments(body ?? '').split(/\r?\n/);
  const start = lines.findIndex(line => PO_HEADING.test(line));
  const rest = lines.slice(start + 1);
  const end = rest.findIndex(line => HEADING.test(line));

  return (
    start >= 0 &&
    (end < 0 ? rest : rest.slice(0, end)).some(line => line.trim() !== '')
  );
};

const pick = (
  name: string,
  { action, pull_request: pull, review }: Required<Event>
): Move | undefined => {
  const plan = pull.draft && PLAN.test(pull.title.trim());

  if (name === 'pull_request') {
    if (action === 'opened' && plan) {
      return 'dev';
    }

    return action === 'ready_for_review' || (action === 'opened' && !pull.draft)
      ? 'ready'
      : undefined;
  }

  if (
    name !== 'pull_request_review' ||
    action !== 'submitted' ||
    review.state !== 'approved'
  ) {
    return undefined;
  }

  if (plan) {
    return review.author_association === 'OWNER' &&
      !pull.labels.some(({ name: label }) => label === HAND_BACK)
      ? 'agent'
      : undefined;
  }

  return !pull.draft && MAY_MOVE_A_READY_PR.includes(review.author_association)
    ? 'dev'
    : undefined;
};

export const run = (
  env: Record<string, string | undefined>,
  event: Event,
  gh: Gh
): number => {
  const repo = String(env.GH_REPO);
  const pull = event.pull_request;

  if (!REPO.test(repo) || pull === undefined) {
    console.error(
      'Usage: issue-status, with GH_REPO=<owner>/<repo>, GITHUB_EVENT_NAME and a pull request event set'
    );

    return 1;
  }

  if (pull.head.repo?.full_name !== repo) {
    console.log('Issue status: the PR is from a fork.');

    return 0;
  }

  const move = pick(String(env.GITHUB_EVENT_NAME), {
    action: event.action,
    pull_request: pull,
    review: event.review ?? { author_association: '', state: '' },
  });

  if (move === undefined) {
    console.log('Issue status: this event moves nothing.');

    return 0;
  }

  let failed = false;
  const attempt = <T,>(what: string, action: () => T): T | undefined => {
    try {
      return action();
    } catch (error) {
      failed = true;
      console.error(
        `Issue status: ${what} failed: ${(error as Error).message}`
      );

      return undefined;
    }
  };
  const [owner, name] = repo.split('/');
  const closing = attempt('reading the closing issues', (): number[] =>
    JSON.parse(
      gh([
        'pr',
        'view',
        String(pull.number),
        '--json',
        'closingIssuesReferences',
      ])
    ).closingIssuesReferences.flatMap(
      (issue: {
        number: number;
        repository: { name: string; owner: { login: string } };
      }) =>
        issue.repository.name === name && issue.repository.owner.login === owner
          ? [issue.number]
          : []
    )
  );

  if (closing === undefined) {
    return 1;
  }

  const issues = closing.flatMap(number => {
    const labels = attempt(`reading #${number}`, (): string[] =>
      JSON.parse(
        gh(['issue', 'view', String(number), '--json', 'labels'])
      ).labels.map(({ name: label }: { name: string }) => label)
    );

    return labels?.some(label => TYPES.includes(label)) &&
      !labels.includes(BLOCKED)
      ? [{ labels, number }]
      : [];
  });
  const isVisibleType = (labels: string[]): boolean =>
    labels.some(label => VISIBLE_TYPES.includes(label));

  // Rows 3 and 4: the changed files matter only to a Spec or Bug whose PR says what to try.
  let visible: boolean | undefined = false;

  if (
    move === 'ready' &&
    hasForThePo(pull.body) &&
    issues.some(({ labels }) => isVisibleType(labels))
  ) {
    const files = attempt('listing the changed files', (): Changed[] =>
      gh([
        'api',
        '--paginate',
        `repos/${repo}/pulls/${pull.number}/files`,
        '--jq',
        '.[] | @json',
      ])
        .split('\n')
        .filter(line => line !== '')
        .map(line => JSON.parse(line))
    );

    visible = files?.some(({ filename, previous_filename }) =>
      [filename, previous_filename].some(
        path => path !== undefined && !invisible(path)
      )
    );
  }

  for (const { labels, number } of issues) {
    const visibleType = isVisibleType(labels);

    if (move === 'ready' && visibleType && visible === undefined) {
      continue;
    }

    const target =
      move === 'ready'
        ? visibleType && visible
          ? TARGET.po
          : TARGET.dev
        : TARGET[move];

    if (labels.includes(target)) {
      console.log(`Issue status: #${number} is already on ${target}.`);
      continue;
    }

    const edited = attempt(`moving #${number}`, () =>
      gh([
        'issue',
        'edit',
        String(number),
        ...labels
          .filter(label => label.startsWith(STATUS))
          .flatMap(label => ['--remove-label', label]),
        '--add-label',
        target,
      ])
    );

    if (edited !== undefined) {
      console.log(`Issue status: #${number} is now ${target}.`);
    }
  }

  return failed ? 1 : 0;
};

/* v8 ignore next 11 -- only true when run directly with node, not when imported */
if (import.meta.main) {
  process.exitCode = run(
    process.env,
    JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH ?? '', 'utf8')),
    (args, input) =>
      execFileSync('gh', args, {
        encoding: 'utf8',
        input,
        maxBuffer: 16 * 1024 * 1024,
      })
  );
}
