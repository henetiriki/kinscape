import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';

import type { Gh, PlanNewDeps } from '#ks/scripts/types.ts';

import { ghList } from '#ks/scripts/gh-list.mts';
import { TYPES } from '#ks/scripts/issue-status.mts';

// Prints the id, plan path, branch and plan PR title of a Spec, Bug or Chore (plans/README.md#item-types)
// and its related issues (plans/README.md#related-issues). If no branch and no plan file exist yet, it
// also makes the branch from origin/main and copies plans/TEMPLATE.md to the plan path. It commits
// nothing and edits no issue.
// Usage: npm run plan:new -- <issue number> <slug>

// A branch or a plan file of the issue that exists, and the slug in its name.
type Found = { name: string; slug: string };
type Issue = {
  body: string;
  issueType: { name: string } | null;
  title: string;
};
type Item = {
  body?: string;
  number: number;
  state: string;
  title: string;
  type?: { name: string } | null;
};

// The values of one row of the item-types table.
type Names = {
  branch: string;
  folder: string;
  id: string;
  planPath: string;
  prefix: string;
  prTitle: string;
};

type Parent = { repository_url: string } & Item;

const ROWS = {
  Bug: { folder: 'plans/bugs', letter: 'B', prefix: 'bug' },
  Chore: { folder: 'plans/chores', letter: 'C', prefix: 'chore' },
  Spec: { folder: 'plans', letter: '', prefix: 'spec' },
};

const NUMBER = /^[1-9]\d*$/;
const SLUG = /^[a-z\d]+(?:-[a-z\d]+)*$/;
const SPEC_ID = /^Spec: ([A-Z]+\d*(?:\.\d+)+) /;
const REQUIREMENT = /[A-Z]+-\d+/g;
const SECTION = /^###\s+Requirement IDs covered\s*$/m;
const HEADING = /^#{1,6}\s/m;
const REPO_URL = /^https:\/\/api\.github\.com\/(repos\/[\w.-]+\/[\w.-]+)$/;

class Stop extends Error {}

const api = (path: string) => `repos/{owner}/{repo}/issues/${path}`;

const nonEmpty = (text: string): string[] =>
  text.split('\n').filter(line => line !== '');

// The issue's own IDs: the "Requirement IDs covered" section only.
const requirementIds = (body: string): string[] => {
  const section = body.split(SECTION)[1] ?? '';

  return Array.from(
    section.split(HEADING)[0].matchAll(REQUIREMENT),
    ([id]) => id
  );
};

// gh writes "(HTTP 404)" to stderr. The message also holds the command line, and the issue number in
// it can contain 404, so only stderr counts.
const notFound = (error: unknown): boolean => {
  const stderr: unknown = Object(error).stderr;

  return typeof stderr === 'string' && stderr.includes('(HTTP 404)');
};

const names = (issue: Issue, number: string, slug: string): Names => {
  const type = issue.issueType?.name;

  if (type === undefined) {
    throw new Stop(`Issue #${number} has no Type.`);
  }

  if (!TYPES.includes(type)) {
    throw new Stop(
      `Issue #${number} has the Type ${type}, not Spec, Bug or Chore.`
    );
  }

  const specId = SPEC_ID.exec(issue.title)?.[1];

  if (type === 'Spec' && specId === undefined) {
    throw new Stop(`The Spec title of #${number} has no id: "${issue.title}".`);
  }

  const { folder, letter, prefix } = ROWS[type as keyof typeof ROWS];
  const id = type === 'Spec' ? specId! : `${letter}${number}`;
  const title = issue.title.replace(
    type === 'Spec' ? SPEC_ID : new RegExp(`^${type}: `),
    ''
  );

  return {
    branch: `${prefix}/${id}-${slug}`,
    folder,
    id,
    planPath: `${folder}/${id}-${slug}.md`,
    prefix,
    prTitle: `${type === 'Spec' ? id : `${letter}.${number}`}: ${title} (plan)`,
  };
};

// Any branch or plan file of the issue, with any slug (#1143 plan D2). A CI checkout holds only main,
// so the remote branches come from origin itself.
const findExisting = (
  { files, git }: PlanNewDeps,
  { folder, id, prefix }: Names
): Found[] => {
  const start = `${prefix}/${id}-`;
  const local = nonEmpty(
    git(['for-each-ref', '--format=%(refname:short)', `refs/heads/${start}*`])
  );
  const remote = nonEmpty(
    git(['ls-remote', '--heads', 'origin', `refs/heads/${start}*`])
  ).map(line => line.replace(/^\S+\trefs\/heads\//, ''));
  const plans = files
    .list(folder)
    .filter(name => name.startsWith(`${id}-`) && name.endsWith('.md'));

  return [
    ...local.map(name => ({ name, slug: name.slice(start.length) })),
    ...remote.map(name => ({
      name: `origin/${name}`,
      slug: name.slice(start.length),
    })),
    ...plans.map(name => ({
      name: `${folder}/${name}`,
      slug: name.slice(id.length + 1, -'.md'.length),
    })),
  ];
};

const related = (
  number: string,
  body: string,
  blocking: Item[],
  intent: Item | undefined,
  siblings: Item[]
): string[] => {
  const mine = requirementIds(body);

  return [
    ...blocking.map(
      ({ number: n, title }) => `#${n} ${title} (blocked by this issue)`
    ),
    ...(intent === undefined
      ? []
      : [`#${intent.number} ${intent.title} (parent Intent)`]),
    ...siblings.flatMap(sibling => {
      const shared = [
        ...new Set(
          requirementIds(sibling.body ?? '').filter(x => mine.includes(x))
        ),
      ];

      return sibling.state === 'open' &&
        sibling.number !== Number(number) &&
        shared.length > 0
        ? [`#${sibling.number} ${sibling.title} (shares ${shared.join(', ')})`]
        : [];
    }),
  ];
};

const readRelated = (gh: Gh, number: string, body: string): string[] => {
  const blocking = ghList<Item>(gh, api(`${number}/dependencies/blocking`));
  let parent: Parent | undefined;

  try {
    parent = JSON.parse(gh(['api', api(`${number}/parent`)])) as Parent;
  } catch (error) {
    if (!notFound(error)) {
      throw error;
    }
  }

  const intent = parent?.type?.name === 'Intent' ? parent : undefined;

  if (intent === undefined) {
    return related(number, body, blocking, undefined, []);
  }

  // The parent can live in another repo, so read its sub-issues there.
  const repo = REPO_URL.exec(intent.repository_url)?.[1];

  if (repo === undefined) {
    throw new Stop(`The parent #${intent.number} has no repo URL to read.`);
  }

  const siblings = ghList<Item>(
    gh,
    `${repo}/issues/${intent.number}/sub_issues`
  );

  return related(number, body, blocking, intent, siblings);
};

const prepare = ({ files, git }: PlanNewDeps, n: Names, number: string) => {
  // A switch takes uncommitted changes onto the new branch, and the plan commit can then hold them.
  if (git(['status', '--porcelain']) !== '') {
    throw new Stop(
      'The working tree has changes. Commit or stash them, then run plan:new again.'
    );
  }

  git(['fetch', 'origin', 'main']);
  git(['switch', '-c', n.branch, 'origin/main']);
  files.write(
    n.planPath,
    files
      .read('plans/TEMPLATE.md')
      .replace(/^(- \*\*Spec:\*\*).*$/m, `$1 #${number}`)
      .replace(/^(- \*\*Status:\*\*).*$/m, '$1 draft')
  );
  console.log(`Made ${n.branch} and ${n.planPath}.`);
};

export const run = (args: string[], deps: PlanNewDeps): number => {
  const [number, slug] = args;

  try {
    if (args.length !== 2 || !NUMBER.test(number)) {
      throw new Stop('Usage: npm run plan:new -- <issue number> <slug>');
    }

    if (!SLUG.test(slug)) {
      throw new Stop(
        `The slug "${slug}" must be lower-case words joined by hyphens.`
      );
    }

    const issue = JSON.parse(
      deps.gh([
        'issue',
        'view',
        number,
        '--json',
        'body,issueType,number,title',
      ])
    ) as Issue;
    const asked = names(issue, number, slug);
    const found = findExisting(deps, asked);
    const [first] = found;
    // An existing plan keeps its own names, so a second slug makes no second plan.
    const n = first === undefined ? asked : names(issue, number, first.slug);

    console.log(`Id: ${n.id}`);
    console.log(`Plan path: ${n.planPath}`);
    console.log(`Branch: ${n.branch}`);
    console.log(`Plan PR title: ${n.prTitle}`);

    const lines = readRelated(deps.gh, number, issue.body);

    console.log(
      lines.length === 0
        ? 'Related issues: none'
        : `Related issues:\n${lines.map(line => `- ${line}`).join('\n')}`
    );

    if (first !== undefined) {
      for (const { name } of found) {
        console.log(`Skipped the setup: ${name} exists.`);
      }

      return 0;
    }

    prepare(deps, n, number);

    return 0;
  } catch (error) {
    console.error(
      error instanceof Stop
        ? error.message
        : `Plan new failed: ${String(error)}`
    );

    return 1;
  }
};

/* v8 ignore next 21 -- only true when run directly with node, not when imported */
if (import.meta.main) {
  // Piped stderr keeps a 404 off the terminal. The thrown error still holds it as `stderr`.
  const exec = (command: string, args: string[], input?: string) =>
    execFileSync(command, args, {
      encoding: 'utf8',
      input,
      maxBuffer: 16 * 1024 * 1024,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

  process.exitCode = run(process.argv.slice(2), {
    files: {
      list: dir => (existsSync(dir) ? readdirSync(dir) : []),
      read: path => readFileSync(path, 'utf8'),
      write: (path, text) => writeFileSync(path, text),
    },
    gh: (args, input) => exec('gh', args, input),
    git: args => exec('git', args),
  });
}
