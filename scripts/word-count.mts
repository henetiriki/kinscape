import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { isAbsolute, relative, sep } from 'node:path';

// The single home of the word budgets. To change one, edit it here in a PR.
// A word is a whitespace-separated token with a letter or digit in it.
const BUDGETS: { limit: number; pattern: RegExp }[] = [
  { limit: 150, pattern: /^CLAUDE\.md$/ },
  { limit: 650, pattern: /^AGENTS\.md$/ },
  { limit: 200, pattern: /^docs\/security\.md$/ },
  { limit: 850, pattern: /^docs\/how-we-work\.md$/ },
  { limit: 400, pattern: /^docs\/building\.md$/ },
  { limit: 200, pattern: /^docs\/dependencies\.md$/ },
  { limit: 800, pattern: /^docs\/architecture\.md$/ },
  { limit: 650, pattern: /^docs\/architecture-target\.md$/ },
  { limit: 750, pattern: /^plans\/README\.md$/ },
  { limit: 600, pattern: /^plans\/[^/]+\.md$/ },
  { limit: 600, pattern: /^plans\/bugs\/[^/]+\.md$/ },
  { limit: 300, pattern: /^plans\/chores\/[^/]+\.md$/ },
  { limit: 400, pattern: /^\.github\/agent\/review\.md$/ },
  { limit: 300, pattern: /^\.github\/agent\/[^/]+\.md$/ },
  {
    limit: 650,
    pattern: /^\.claude\/skills\/(.+\/)?(?!NOTICE\.md$)[^/]+\.md$/,
  },
];

const listFiles = (root: string, dir: string): string[] =>
  existsSync(`${root}/${dir}`)
    ? readdirSync(`${root}/${dir}`, { recursive: true }).map(
        name => `${dir}/${String(name).split(sep).join('/')}`
      )
    : [];

// Blocks that `next dev` writes into AGENTS.md between BEGIN:nextjs-… and END:nextjs-… markers.
// Next.js owns their text and rewrites it, so they don't count towards a budget.
const MANAGED_BLOCK = /<!-- BEGIN:(nextjs-[\w-]+) -->[\s\S]*?<!-- END:\1 -->/g;

export const countWords = (text: string): number =>
  text
    .replace(MANAGED_BLOCK, '')
    .split(/\s+/)
    .filter(token => /[\p{L}\p{N}]/u.test(token)).length;

export const budgetFor = (path: string): number | undefined =>
  BUDGETS.find(({ pattern }) => pattern.test(path))?.limit;

export const checkFiles = (root: string, paths: string[]): string[] =>
  paths.flatMap(path => {
    const limit = budgetFor(path);

    if (limit === undefined || !existsSync(`${root}/${path}`)) {
      return [];
    }

    const count = countWords(readFileSync(`${root}/${path}`, 'utf8'));

    return count > limit ? [`${path}: ${count} words, budget ${limit}`] : [];
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
      : [
          'CLAUDE.md',
          'AGENTS.md',
          'docs/how-we-work.md',
          'docs/building.md',
          'docs/dependencies.md',
          'docs/architecture.md',
          'docs/architecture-target.md',
          ...listFiles(root, 'plans'),
          ...listFiles(root, '.github/agent'),
          ...listFiles(root, '.claude/skills'),
        ];
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
