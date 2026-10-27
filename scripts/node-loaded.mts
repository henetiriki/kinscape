import { globSync } from 'node:fs';
import { dirname, join } from 'node:path';

// Node loads these files without a bundler, so an `@/` or `@ks/` value import fails there.
// ESLint applies the Node rule to them (eslint.config.mjs); the tests read `NODE_MESSAGE`.

export const NODE_MESSAGE =
  'Node loads this file and ignores path aliases: use a relative import (`import type` may use an alias).';

const IGNORED = [
  '.claude-pr/**',
  '.claude/worktrees/**',
  '.next/**',
  'coverage/**',
  'node_modules/**',
];

/** The globs of the files Node loads: every `.mts`, `scripts/`, and the `types.ts` beside an `.mts`. */
export const nodeLoadedFiles = (
  root: string = join(import.meta.dirname, '..')
): string[] => {
  const mts = globSync('**/*.mts', { cwd: root, exclude: IGNORED });
  const folders = [...new Set(mts.map(file => dirname(file)))];

  return [
    '**/*.mts',
    'scripts/**',
    ...folders.map(folder => join(folder, 'types.ts').split('\\').join('/')),
  ];
};
