import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { renderCss } from '../lib/design/tokens.mts';

/** Reads `design/tokens.json` under `root` and returns the CSS that `app/tokens.css` must hold. */
export const generate = (root: string): string =>
  renderCss(JSON.parse(readFileSync(join(root, 'design/tokens.json'), 'utf8')));

/** Writes `app/tokens.css` under `root`. */
export const run = (root: string): number => {
  writeFileSync(join(root, 'app/tokens.css'), generate(root));

  return 0;
};

/* v8 ignore next 3 -- only true when run directly with node, not when imported */
if (import.meta.main) {
  process.exitCode = run(process.cwd());
}
