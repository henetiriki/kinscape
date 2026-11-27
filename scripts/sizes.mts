import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { localValues } from '#ks/lib/design/local.mts';
import { isSizeFile, listOf, sizesIn } from '#ks/lib/design/sizes.mts';

export const LIST = 'lib/design/off-token-sizes.json';

/** Reads each size file of `files` under `root`, writes the list of the off-token sizes and prints each local value. */
export const run = (
  root: string,
  files: string[],
  print: (line: string) => void = console.log
): number => {
  const tokens = JSON.parse(
    readFileSync(join(root, 'design/kinscape.tokens.json'), 'utf8')
  );
  const sizeFiles = files.filter(isSizeFile);
  const sizes = sizeFiles.flatMap(file =>
    sizesIn(file, readFileSync(join(root, file), 'utf8'), tokens)
  );

  writeFileSync(
    join(root, LIST),
    `${JSON.stringify(listOf(sizes), null, 2)}\n`
  );

  for (const file of sizeFiles.filter(path => path.endsWith('.css'))) {
    for (const value of localValues(readFileSync(join(root, file), 'utf8'))) {
      print(`${file}:${value.line}: ${value.name} (${value.reason})`);
    }
  }

  return 0;
};

/* v8 ignore next 8 -- only true when run directly with node, not when imported */
if (import.meta.main) {
  const files = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' })
    .split('\0')
    .filter(path => path !== '' && existsSync(path));

  process.exitCode = run(process.cwd(), files);
}
