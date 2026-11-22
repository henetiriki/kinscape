import type { Linter } from 'eslint';

import { ESLint } from 'eslint';

import config from '@ks/eslint.config.mjs';

// Lints text against the real config. The tests import the config, so scripts/layers.mts loads
// once: a native copy loaded by ESLint's own config loader corrupts its coverage. A parse error
// is fatal and has no rule id, so it always comes back.
export const lintConfig = async (
  code: string,
  filePath: string,
  ruleIds: string[]
): Promise<Linter.LintMessage[]> => {
  const [result] = await new ESLint({
    overrideConfig: config,
    overrideConfigFile: true,
  }).lintText(code, { filePath });

  return result.messages.filter(
    m => m.fatal || (m.ruleId !== null && ruleIds.includes(m.ruleId))
  );
};
