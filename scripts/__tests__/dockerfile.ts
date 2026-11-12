import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect } from 'vitest';

// Each CI image is the one FROM line of its Dockerfile (docs/architecture.md › Patterns).
const root = process.cwd();

/** The FROM lines of a Dockerfile, or none if it is missing. Dependabot reads only the first. */
export const fromLines = (dockerfile: string): string[] =>
  existsSync(join(root, dockerfile))
    ? readFileSync(join(root, dockerfile), 'utf8')
        .split('\n')
        .filter(line => line.startsWith('FROM '))
    : [];

/** The files that match `pattern`, except the Dockerfile, the tests and `plans/`: plans are history. */
export const filesNaming = (pattern: string, dockerfile: string): string[] => {
  const { status, stdout } = spawnSync(
    'git',
    [
      'grep',
      '-I',
      '-l',
      '-E',
      pattern,
      '--',
      '.',
      ':(exclude)plans',
      `:(exclude)${dockerfile}`,
      ':(exclude)__tests__',
      ':(exclude)*/__tests__/*',
    ],
    { cwd: root, encoding: 'utf8' }
  );

  // git grep exits 1 when nothing matches, and 128 when it fails.
  expect(status).toBeLessThan(2);

  return stdout.trim().split('\n').filter(Boolean);
};
