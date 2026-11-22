import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';

import type { PlanNewDeps } from '#ks/scripts/types.ts';

import { TYPES } from '#ks/scripts/issue-status.mts';

// Prints the id, plan path, branch and plan PR title of a Spec, Bug or Chore (plans/README.md#item-types)
// and its related issues (plans/README.md#related-issues). If no branch and no plan file exist yet, it
// also makes the branch from origin/main and copies plans/TEMPLATE.md to the plan path. It commits
// nothing and edits no issue.
// Usage: npm run plan:new -- <issue number> <slug>

type Item = {
  body?: string;
  number: number;
  state: string;
  title: string;
  type?: { name: string } | null;
};

const NUMBER = /^[1-9]\d*$/;
const SLUG = /^[a-z\d]+(?:-[a-z\d]+)*$/;
const SPEC_ID = /^Spec: ([A-Z]+\d*(?:\.\d+)+) /;
const REQUIREMENT = /[A-Z]+-\d+/g;
const SECTION = /^###\s+Requirement IDs covered\s*$/m;
const HEADING = /^#{1,6}\s/m;

class Stop extends Error {}

// The issue's own IDs: the "Requirement IDs covered" section only.
const requirementIds = (body: string): string[] => {
  const section = body.split(SECTION)[1] ?? '';

  return Array.from(
    section.split(HEADING)[0].matchAll(REQUIREMENT),
    ([id]) => id
  );
};

const lines = (text: string): Item[] =>
  text
    .split('\n')
    .filter(line => line !== '')
    .map(line => JSON.parse(line));

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

    const { files, gh, git } = deps;
    const issue = JSON.parse(
      gh(['issue', 'view', number, '--json', 'body,issueType,number,title'])
    ) as { body: string; issueType: { name: string } | null; title: string };
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
      throw new Stop(
        `The Spec title of #${number} has no id: "${issue.title}".`
      );
    }

    const [id, folder, prefix, title] =
      type === 'Spec'
        ? [specId!, 'plans', 'spec', issue.title.replace(SPEC_ID, '')]
        : type === 'Bug'
          ? [
              `B${number}`,
              'plans/bugs',
              'bug',
              issue.title.replace(/^Bug: /, ''),
            ]
          : [
              `C${number}`,
              'plans/chores',
              'chore',
              issue.title.replace(/^Chore: /, ''),
            ];
    const planPath = `${folder}/${id}-${slug}.md`;
    const branch = `${prefix}/${id}-${slug}`;
    const prTitle = `${type === 'Spec' ? id : `${id[0]}.${number}`}: ${title} (plan)`;

    console.log(`Id: ${id}`);
    console.log(`Plan path: ${planPath}`);
    console.log(`Branch: ${branch}`);
    console.log(`Plan PR title: ${prTitle}`);

    const api = (path: string) => `repos/{owner}/{repo}/issues/${path}`;
    const related: string[] = [];

    for (const item of lines(
      gh([
        'api',
        api(`${number}/dependencies/blocking`),
        '--paginate',
        '--jq',
        '.[] | @json',
      ])
    )) {
      related.push(`#${item.number} ${item.title} (blocked by this issue)`);
    }

    let parent: Item | undefined;

    try {
      parent = JSON.parse(gh(['api', api(`${number}/parent`)]));
    } catch (error) {
      if (!/404|Not Found/.test(String(error))) {
        throw error;
      }
    }

    if (parent?.type?.name === 'Intent') {
      related.push(`#${parent.number} ${parent.title} (parent Intent)`);

      const mine = requirementIds(issue.body);

      for (const sibling of lines(
        gh([
          'api',
          api(`${parent.number}/sub_issues`),
          '--paginate',
          '--jq',
          '.[] | @json',
        ])
      )) {
        const shared = requirementIds(sibling.body ?? '').filter(x =>
          mine.includes(x)
        );

        if (
          sibling.state === 'open' &&
          sibling.number !== Number(number) &&
          shared.length > 0
        ) {
          related.push(
            `#${sibling.number} ${sibling.title} (shares ${[...new Set(shared)].join(', ')})`
          );
        }
      }
    }

    console.log(
      related.length === 0
        ? 'Related issues: none'
        : `Related issues:\n${related.map(line => `- ${line}`).join('\n')}`
    );

    const found = [
      ...git([
        'for-each-ref',
        '--format=%(refname:short)',
        `refs/heads/${prefix}/${id}-*`,
        `refs/remotes/origin/${prefix}/${id}-*`,
      ])
        .split('\n')
        .filter(line => line !== ''),
      ...files
        .list(folder)
        .filter(name => name.startsWith(`${id}-`) && name.endsWith('.md'))
        .map(name => `${folder}/${name}`),
    ];

    if (found.length > 0) {
      for (const name of found) {
        console.log(`Skipped the setup: ${name} exists.`);
      }

      return 0;
    }

    git(['fetch', 'origin', 'main']);
    git(['switch', '-c', branch, 'origin/main']);
    files.write(
      planPath,
      files
        .read('plans/TEMPLATE.md')
        .replace(/^(- \*\*Spec:\*\*).*$/m, `$1 #${number}`)
        .replace(/^(- \*\*Status:\*\*).*$/m, '$1 draft')
    );
    console.log(`Set up ${branch} and ${planPath}.`);

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

/* v8 ignore next 20 -- only true when run directly with node, not when imported */
if (import.meta.main) {
  const exec = (command: string, args: string[], input?: string) =>
    execFileSync(command, args, {
      encoding: 'utf8',
      input,
      maxBuffer: 16 * 1024 * 1024,
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
