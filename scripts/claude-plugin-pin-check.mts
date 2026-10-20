import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

export type Gh = (args: string[]) => string;

type Commit = { date: string; message: string; sha: string };

type Marketplace = {
  plugins: {
    name: string;
    source: { path: string; sha: string; url: string };
  }[];
};

type Pin = { path: string; repo: string; sha: string };

export const ISSUE_TITLE = 'Bump the pinned Claude code-review plugin';

const MARKETPLACE = '.github/claude-plugins/.claude-plugin/marketplace.json';

// Keeps the first line of each message and drops the rest of the payload.
const COMMITS_JQ =
  '[.[] | { date: .commit.committer.date, message: (.commit.message | split("\\n")[0]), sha: .sha }]';

const shortSha = (sha: string): string => sha.slice(0, 7);

export const readPin = (root: string): Pin => {
  const { plugins }: Marketplace = JSON.parse(
    readFileSync(`${root}/${MARKETPLACE}`, 'utf8')
  );
  const source = plugins.find(({ name }) => name === 'code-review')?.source;

  if (!source) {
    throw new Error(`${MARKETPLACE} has no code-review plugin`);
  }

  return { path: source.path, repo: source.url, sha: source.sha };
};

// A code span keeps upstream @mentions from notifying anyone.
const commitLine = (repo: string, { date, message, sha }: Commit): string =>
  `- [\`${shortSha(sha)}\`](https://github.com/${repo}/commit/${sha}) ${date.slice(0, 10)} \`${message.replaceAll('`', '')}\``;

export const issueBody = (pin: Pin, commits: Commit[]): string => {
  const pinned = commits.findIndex(({ sha }) => sha === pin.sha);
  const newer = pinned === -1 ? commits : commits.slice(0, pinned);

  return [
    `Commits on \`${pin.path}\` in ${pin.repo} since the pin (\`${shortSha(pin.sha)}\`):`,
    '',
    ...newer.map(commit => commitLine(pin.repo, commit)),
    ...(pinned === -1
      ? [
          '',
          `The pin is not among the newest ${commits.length} commits on this path, so this list is cut short.`,
        ]
      : []),
    '',
    `[Compare view](https://github.com/${pin.repo}/compare/${pin.sha}...${commits[0].sha})`,
    '',
    'To bump:',
    '',
    `1. Read the plugin diff in the compare view (only \`${pin.path}/\` matters).`,
    `2. Edit \`sha\` in \`${MARKETPLACE}\`.`,
    "3. Read the next `claude-review` run's log: the plugin must install and the review must run.",
  ].join('\n');
};

export const run = (root: string, gh: Gh): void => {
  const pin = readPin(root);
  const commits: Commit[] = JSON.parse(
    gh([
      'api',
      `repos/${pin.repo}/commits?path=${pin.path}&per_page=100`,
      '--jq',
      COMMITS_JQ,
    ])
  );

  if (commits.length === 0) {
    throw new Error(`No commits found on ${pin.path} in ${pin.repo}`);
  }

  if (commits[0].sha === pin.sha) {
    console.log(
      `Up to date: ${shortSha(pin.sha)} is the newest on ${pin.path}.`
    );

    return;
  }

  const open: { number: number; title: string }[] = JSON.parse(
    gh([
      'issue',
      'list',
      '--label',
      'dependencies',
      '--state',
      'open',
      '--json',
      'number,title',
    ])
  );
  const existing = open.find(({ title }) => title === ISSUE_TITLE);

  if (existing) {
    console.log(`Issue #${existing.number} is already open.`);

    return;
  }

  gh([
    'issue',
    'create',
    '--title',
    ISSUE_TITLE,
    '--label',
    'dependencies',
    '--body',
    issueBody(pin, commits),
  ]);
  console.log(
    `Opened an issue: ${pin.path} has moved past ${shortSha(pin.sha)}.`
  );
};

/* v8 ignore next 5 -- only true when run directly with node, not when imported */
if (import.meta.main) {
  run(process.cwd(), args =>
    execFileSync('gh', args, { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 })
  );
}
