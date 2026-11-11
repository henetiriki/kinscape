import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { isAbsolute, relative, sep } from 'node:path';

// The single home of the word budgets. To change one, edit it here in a PR.
// A word is a whitespace-separated token with a letter or digit in it.
// A plan entry skips the plan's `## Deviations` section, which the build adds lines to.
const BUDGETS: { limit: number; pattern: RegExp; plan?: true }[] = [
  { limit: 150, pattern: /^CLAUDE\.md$/ },
  { limit: 300, pattern: /^README\.md$/ },
  { limit: 200, pattern: /^docs\/README\.md$/ },
  { limit: 700, pattern: /^AGENTS\.md$/ },
  { limit: 350, pattern: /^docs\/security\.md$/ },
  { limit: 400, pattern: /^docs\/code-rules\.md$/ },
  { limit: 600, pattern: /^docs\/writing\.md$/ },
  { limit: 850, pattern: /^docs\/how-we-work\.md$/ },
  { limit: 400, pattern: /^docs\/building\.md$/ },
  { limit: 250, pattern: /^docs\/dependencies\.md$/ },
  { limit: 900, pattern: /^docs\/repo-settings\.md$/ },
  { limit: 1000, pattern: /^docs\/infrastructure\.md$/ },
  { limit: 850, pattern: /^docs\/architecture\.md$/ },
  { limit: 650, pattern: /^docs\/architecture-target\.md$/ },
  { limit: 3000, pattern: /^design\/DESIGN\.md$/ },
  { limit: 900, pattern: /^design\/CANVAS\.md$/ },
  { limit: 600, pattern: /^design\/COMPONENTS\.md$/ },
  { limit: 900, pattern: /^plans\/README\.md$/ },
  { limit: 600, pattern: /^plans\/[^/]+\.md$/, plan: true },
  { limit: 600, pattern: /^plans\/bugs\/[^/]+\.md$/, plan: true },
  { limit: 300, pattern: /^plans\/chores\/[^/]+\.md$/, plan: true },
  { limit: 500, pattern: /^\.github\/agent\/review\.md$/ },
  { limit: 750, pattern: /^\.github\/agent\/review-code\.md$/ },
  { limit: 350, pattern: /^\.github\/agent\/build\.md$/ },
  { limit: 350, pattern: /^\.github\/agent\/fix-review\.md$/ },
  { limit: 300, pattern: /^\.github\/agent\/[^/]+\.md$/ },
  {
    limit: 650,
    pattern: /^\.claude\/skills\/(.+\/)?(?!NOTICE\.md$)[^/]+\.md$/,
  },
];

const trackedFiles = (root: string): string[] =>
  execFileSync(
    'git',
    ['ls-files', '-z', '--cached', '--others', '--exclude-standard'],
    {
      cwd: root,
      encoding: 'utf8',
    }
  )
    .split('\0')
    .filter(path => budgetFor(path) !== undefined);

// Blocks that `next dev` writes into AGENTS.md between BEGIN:nextjs-… and END:nextjs-… markers.
// Next.js owns their text and rewrites it, so they don't count towards a budget.
const MANAGED_BLOCK = /<!-- BEGIN:(nextjs-[\w-]+) -->[\s\S]*?<!-- END:\1 -->/g;

export const countWords = (text: string): number =>
  text
    .replace(MANAGED_BLOCK, '')
    .split(/\s+/)
    .filter(token => /[\p{L}\p{N}]/u.test(token)).length;

const entryFor = (path: string) =>
  BUDGETS.find(({ pattern }) => pattern.test(path));

export const budgetFor = (path: string): number | undefined =>
  entryFor(path)?.limit;

// The section has its own room: it ends at the next `## ` heading.
const withoutDeviations = (text: string): string => {
  let skipping = false;

  return text
    .split('\n')
    .filter(line => {
      if (line.startsWith('## ')) {
        skipping = /^## Deviations\s*$/.test(line);
      }

      return !skipping;
    })
    .join('\n');
};

export const checkFiles = (root: string, paths: string[]): string[] =>
  paths.flatMap(path => {
    const entry = entryFor(path);

    if (entry === undefined || !existsSync(`${root}/${path}`)) {
      return [];
    }

    const text = readFileSync(`${root}/${path}`, 'utf8');
    const count = countWords(entry.plan ? withoutDeviations(text) : text);

    return count > entry.limit
      ? [`${path}: ${count} words, budget ${entry.limit}`]
      : [];
  });

const hookPath = (root: string, stdin: string): string | undefined => {
  let filePath: unknown;

  try {
    filePath = JSON.parse(stdin)?.tool_input?.file_path;
  } catch {
    return undefined;
  }

  if (typeof filePath !== 'string') {
    return undefined;
  }

  const path = isAbsolute(filePath) ? relative(root, filePath) : filePath;

  return path.startsWith('..') ? undefined : path.split(sep).join('/');
};

export const run = (root: string, args: string[], stdin: string): number => {
  const hook = args.includes('--hook');
  const paths = hook
    ? [hookPath(root, stdin)].filter(path => path !== undefined)
    : args.length > 0
      ? args
      : trackedFiles(root);
  const errors = checkFiles(root, paths);

  errors.forEach(error => console.error(error));

  if (errors.length === 0) {
    return 0;
  }

  return hook ? 2 : 1;
};

/* v8 ignore next 6 -- only true when run directly with node, not when imported */
if (import.meta.main) {
  const args = process.argv.slice(2);

  process.exitCode = run(
    process.cwd(),
    args,
    args.includes('--hook') ? readFileSync(0, 'utf8') : ''
  );
}
