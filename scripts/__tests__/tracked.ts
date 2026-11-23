import { execFileSync } from 'node:child_process';

/** Each tracked `.ts`, `.tsx` and `.mts` file outside `design/canvas/`. */
export const tracked = (): string[] =>
  execFileSync('git', ['ls-files', '*.ts', '*.tsx', '*.mts'], {
    encoding: 'utf8',
  })
    .split('\n')
    .filter(path => path !== '' && !path.startsWith('design/canvas/'));
