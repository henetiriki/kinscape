import type { KnipConfig } from 'knip';

import { CONTROLS } from '@ks/lib/design/bundle.mts';

/** Scripts, `lib/design` and the controls bundle run outside the app, so knip counts them as production code. */
const config: KnipConfig = {
  entry: [
    'scripts/*.mts!',
    'lib/design/**/*.mts!',
    'server/db/migrate.mts!',
    ...CONTROLS.map(({ path }) => `${path}!`),
  ],
  ignore: ['design/canvas/**', '.claude/skills/**'],
  ignoreDependencies: [
    '@fontsource-variable/bricolage-grotesque',
    '@fontsource-variable/public-sans',
    '@fontsource/jetbrains-mono',
    'react-18',
    'react-dom-18',
  ],
  ignoreExportsUsedInFile: true,
  project: [
    '**/*.{js,mjs,cjs,jsx,ts,tsx,mts,cts}!',
    '!**/__tests__/**!',
    '!e2e/**!',
    '!knip.ts!',
  ],
  tags: ['-later'],
};

export default config;
