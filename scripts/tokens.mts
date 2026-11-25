import type { DesignTokens } from 'style-dictionary/types';

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { format, resolveConfig } from 'prettier';

import {
  isStyleFile,
  queriesOf,
  withQueries,
} from '#ks/lib/design/breakpoints.mts';
import { dtcgProblems } from '#ks/lib/design/dtcg.mts';
import { withSteps } from '#ks/lib/design/scales.mts';
import { buildTokens } from '#ks/lib/design/style-dictionary.mts';

const SOURCE = 'design/kinscape.tokens.json';

/** The files that `npm run tokens` writes, besides the token file and the marked `@media` lines of the style files. */
export const OUTPUTS = {
  css: 'app/tokens.css',
  ts: 'design/tokens.generated.ts',
};

/** The token file under `root`, with the steps of each scale written from its settings. */
const read = (root: string) => {
  // A reference to a step resolves only after `withSteps` writes the steps.
  const tokens = withSteps(
    JSON.parse(readFileSync(join(root, SOURCE), 'utf8'))
  );
  const problems = dtcgProblems(tokens);

  if (problems.length > 0) {
    throw new Error(
      `${SOURCE} breaks the DTCG 2025.10 rules:\n${problems.join('\n')}`
    );
  }

  return tokens;
};

/** Reads the DTCG token file under `root` and returns the text of each output, keyed by its path. */
export const generate = async (root: string): Promise<Record<string, string>> =>
  buildTokens(read(root) as DesignTokens, OUTPUTS);

/** Writes the steps into the token file, formatted with Prettier, then each output, under `root`. Each marked `@media` in the style files of `files` gets its condition from the token file. It computes every text first, so an unknown marker writes nothing. */
export const run = async (
  root: string,
  files: string[] = []
): Promise<number> => {
  const target = join(root, SOURCE);
  const tokens = read(root);
  const writes: Record<string, string> = {
    [SOURCE]: await format(JSON.stringify(tokens, null, 2), {
      ...(await resolveConfig(target, { editorconfig: true })),
      filepath: target,
    }),
    ...(await generate(root)),
  };
  const queries = queriesOf(tokens);

  for (const file of files.filter(isStyleFile)) {
    const before = readFileSync(join(root, file), 'utf8');
    const after = withQueries(before, queries);

    if (after !== before) {
      writes[file] = after;
    }
  }

  for (const [path, text] of Object.entries(writes)) {
    writeFileSync(join(root, path), text);
  }

  return 0;
};

/* v8 ignore next 8 -- only true when run directly with node, not when imported */
if (import.meta.main) {
  const files = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' })
    .split('\0')
    .filter(path => path !== '' && existsSync(path));

  process.exitCode = await run(process.cwd(), files);
}
