import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';

/** Each tracked file that exists on disk. */
export const trackedFiles = (): string[] =>
  execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' })
    .split('\0')
    .filter(path => path !== '' && existsSync(path));

/** Each tracked `.ts`, `.tsx` and `.mts` file outside `design/canvas/`. */
export const tracked = (): string[] =>
  execFileSync('git', ['ls-files', '*.ts', '*.tsx', '*.mts'], {
    encoding: 'utf8',
  })
    .split('\n')
    .filter(path => path !== '' && !path.startsWith('design/canvas/'));
