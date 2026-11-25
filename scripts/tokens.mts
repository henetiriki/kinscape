import type { DesignTokens } from 'style-dictionary/types';

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { format, resolveConfig } from 'prettier';

import { dtcgProblems } from '#ks/lib/design/dtcg.mts';
import { withSteps } from '#ks/lib/design/scales.mts';
import { buildTokens } from '#ks/lib/design/style-dictionary.mts';

const SOURCE = 'design/kinscape.tokens.json';

/** The files that `npm run tokens` writes, besides the token file. */
export const OUTPUTS = {
  css: 'app/tokens.css',
  ts: 'design/tokens.generated.ts',
};

/** The token file under `root`, with the steps of each scale written from its settings. */
const read = (root: string) => {
  // A reference to a step resolves only after the steps are written.
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

/** Writes the steps into the token file, formatted with Prettier, then each output, under `root`. */
export const run = async (root: string): Promise<number> => {
  const target = join(root, SOURCE);

  writeFileSync(
    target,
    await format(JSON.stringify(read(root), null, 2), {
      ...(await resolveConfig(target, { editorconfig: true })),
      filepath: target,
    })
  );

  for (const [path, text] of Object.entries(await generate(root))) {
    writeFileSync(join(root, path), text);
  }

  return 0;
};

/* v8 ignore next 3 -- only true when run directly with node, not when imported */
if (import.meta.main) {
  process.exitCode = await run(process.cwd());
}
