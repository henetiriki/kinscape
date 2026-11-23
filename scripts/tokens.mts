import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { dtcgProblems } from '#ks/lib/design/dtcg.mts';
import { buildTokens } from '#ks/lib/design/style-dictionary.mts';

const SOURCE = 'design/kinscape.tokens.json';

/** The files that `npm run tokens` writes. `design/tokens.json` stays until its readers move (#1196). */
export const OUTPUTS = { css: 'app/tokens.css', json: 'design/tokens.json' };

/** Reads the DTCG token file under `root` and returns the text of each output, keyed by its path. */
export const generate = async (
  root: string
): Promise<Record<string, string>> => {
  const tokens = JSON.parse(readFileSync(join(root, SOURCE), 'utf8'));
  const problems = dtcgProblems(tokens);

  if (problems.length > 0) {
    throw new Error(
      `${SOURCE} breaks the DTCG 2025.10 rules:\n${problems.join('\n')}`
    );
  }

  return buildTokens(tokens, OUTPUTS);
};

/** Writes each output under `root`. */
export const run = async (root: string): Promise<number> => {
  for (const [path, text] of Object.entries(await generate(root))) {
    writeFileSync(join(root, path), text);
  }

  return 0;
};

/* v8 ignore next 3 -- only true when run directly with node, not when imported */
if (import.meta.main) {
  process.exitCode = await run(process.cwd());
}
